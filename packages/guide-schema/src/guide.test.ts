import { describe, expect, it } from "vitest";
import { AuthorGuideSchema, GuideSchema, type AuthorGuide } from "./guide.js";
import { parseAuthorGuideYaml, parseGuideYaml } from "./parse.js";
import { resolveGuide } from "./resolve.js";

const validYaml = `
id: PAY-1245
title: Create a Payment
application: demo-bank
release: 2026.08.26

start:
  url: http://localhost:3001/payments/new

steps:
  - id: amount
    target:
      label: Amount
    action: input
    value: "1000"
    instruction: "Enter 1000 into the amount field."

  - id: beneficiary
    target:
      text: "Beneficiary"
    action: click
    instruction: "Select the beneficiary."

  - id: submit
    target:
      role: button
      name: "Submit Payment"
    action: click
    instruction: "Submit the payment."

  - id: success
    target:
      text: "Payment successful"
    action: verify
    instruction: "Verify that the payment was successful."
`;

describe("GuideSchema", () => {
  it("accepts a well-formed guide", () => {
    const result = parseGuideYaml(validYaml);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.guide.id).toBe("PAY-1245");
      expect(result.guide.steps).toHaveLength(4);
    }
  });

  it("rejects a guide with no steps", () => {
    const result = GuideSchema.safeParse({
      id: "X",
      title: "X",
      application: "demo",
      release: "2026.08.26",
      start: { url: "http://localhost:3001" },
      steps: [],
    });
    expect(result.success).toBe(false);
  });

  it("reports a useful error when a step is missing its target", () => {
    const result = parseGuideYaml(`
id: PAY-9999
title: Broken guide
application: demo-bank
release: 2026.08.26
start:
  url: http://localhost:3001/payments/new
steps:
  - id: amount
    action: input
    value: "1000"
    instruction: "Missing target."
`);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.issues.find((i) => i.path === "steps[0].target");
      expect(issue?.message).toBe("Target is required.");
    }
  });

  it("rejects an unknown action", () => {
    const result = parseGuideYaml(`
id: PAY-9998
title: Broken guide
application: demo-bank
release: 2026.08.26
start:
  url: http://localhost:3001/payments/new
steps:
  - id: amount
    action: doSomethingUnsupported
    target:
      label: Amount
    instruction: "Invalid action."
`);
    expect(result.success).toBe(false);
  });

  it("rejects invalid YAML syntax", () => {
    const result = parseGuideYaml("id: [unterminated");
    expect(result.success).toBe(false);
  });

  it("keeps unknown top-level keys for forward compatibility", () => {
    const result = GuideSchema.safeParse({
      id: "X",
      title: "X",
      application: "demo",
      release: "2026.08.26",
      start: { url: "http://localhost:3001" },
      steps: [
        {
          id: "s1",
          action: "click",
          target: { testId: "submit" },
          instruction: "Click submit.",
        },
      ],
      meta: { recordedFrom: "browser-recorder" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).meta).toEqual({
        recordedFrom: "browser-recorder",
      });
    }
  });
});

describe("guide composition", () => {
  const base = AuthorGuideSchema.parse({
    id: "PAY-BASE",
    title: "Submit a payment",
    application: "demo-bank",
    release: "2026.08.26",
    start: { url: "http://localhost:3001/payments/new" },
    steps: [
      {
        id: "submit",
        action: "click",
        target: { role: "button", name: "Submit Payment" },
        instruction: "Submit the payment.",
      },
      {
        id: "success",
        action: "verify",
        target: { text: "Payment successful" },
        instruction: "Verify payment success.",
      },
    ],
  });

  it("inserts extension steps at named anchors and emits a runtime guide", () => {
    const extension = AuthorGuideSchema.parse({
      id: "PAY-1245",
      title: "Create a payment",
      application: "demo-bank",
      release: "2026.08.26",
      start: { url: "http://localhost:3001/payments/new" },
      extends: "PAY-BASE",
      steps: [
        {
          id: "amount",
          action: "input",
          target: { label: "Amount" },
          value: "1000",
          instruction: "Enter an amount.",
          before: "submit",
        },
        {
          id: "beneficiary",
          action: "click",
          target: { text: "Beneficiary" },
          instruction: "Select a beneficiary.",
          after: "amount",
        },
      ],
    });

    const result = resolveGuide(extension, new Map<string, AuthorGuide>([[base.id, base]]));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.guide.steps.map((step) => step.id)).toEqual([
        "amount",
        "beneficiary",
        "submit",
        "success",
      ]);
      expect(result.guide).not.toHaveProperty("extends");
      expect(result.guide.steps[0]).not.toHaveProperty("before");
    }
  });

  it("rejects missing base guides and unknown anchors", () => {
    const missingBase = AuthorGuideSchema.parse({
      id: "PAY-1245",
      title: "Create a payment",
      application: "demo-bank",
      release: "2026.08.26",
      start: { url: "http://localhost:3001/payments/new" },
      extends: "MISSING",
      steps: [
        {
          id: "amount",
          action: "input",
          target: { label: "Amount" },
          value: "1000",
          instruction: "Enter an amount.",
          before: "submit",
        },
      ],
    });
    const unknownAnchor = AuthorGuideSchema.parse({
      id: "PAY-1246",
      title: "Create a payment",
      application: "demo-bank",
      release: "2026.08.26",
      start: { url: "http://localhost:3001/payments/new" },
      extends: "PAY-BASE",
      steps: [
        {
          id: "amount",
          action: "input",
          target: { label: "Amount" },
          value: "1000",
          instruction: "Enter an amount.",
          before: "missing",
        },
      ],
    });

    expect(resolveGuide(missingBase, new Map()).success).toBe(false);
    expect(resolveGuide(unknownAnchor, new Map([[base.id, base]])).success).toBe(false);
  });

  it("rejects inheritance cycles and metadata mismatches", () => {
    const first = AuthorGuideSchema.parse({
      id: "PAY-FIRST",
      title: "First",
      application: "demo-bank",
      release: "2026.08.26",
      start: { url: "http://localhost:3001/payments/new" },
      extends: "PAY-SECOND",
      steps: [
        {
          id: "first-step",
          action: "click",
          target: { text: "First" },
          instruction: "First step.",
          before: "second-step",
        },
      ],
    });
    const second = AuthorGuideSchema.parse({
      id: "PAY-SECOND",
      title: "Second",
      application: "demo-bank",
      release: "2026.08.26",
      start: { url: "http://localhost:3001/payments/new" },
      extends: "PAY-FIRST",
      steps: [
        {
          id: "second-step",
          action: "click",
          target: { text: "Second" },
          instruction: "Second step.",
          before: "first-step",
        },
      ],
    });
    const wrongApplication = AuthorGuideSchema.parse({
      id: "PAY-OTHER-APP",
      title: "Other application",
      application: "other-app",
      release: "2026.08.26",
      start: { url: "http://localhost:3001/payments/new" },
      extends: "PAY-BASE",
      steps: [
        {
          id: "amount",
          action: "input",
          target: { label: "Amount" },
          value: "1000",
          instruction: "Enter an amount.",
          before: "submit",
        },
      ],
    });

    expect(resolveGuide(first, new Map([[first.id, first], [second.id, second]])).success).toBe(false);
    expect(resolveGuide(wrongApplication, new Map([[base.id, base]])).success).toBe(false);
  });

  it("rejects placement directives without an extension", () => {
    const result = parseAuthorGuideYaml(validYaml.replace('id: amount', 'before: submit\n  - id: amount'));
    expect(result.success).toBe(false);
  });
});
