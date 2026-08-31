import { describe, expect, it } from "vitest";
import { GuideSchema } from "./guide.js";
import { parseGuideYaml } from "./parse.js";

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
