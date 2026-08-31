import { describe, expect, it } from "vitest";
import { GuideStepSchema } from "./steps.js";

describe("GuideStepSchema", () => {
  it("accepts a select action with a value", () => {
    const result = GuideStepSchema.safeParse({
      id: "s1",
      action: "select",
      target: { selector: "#country" },
      value: "US",
      instruction: "Select United States.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a navigate action with a url and no target", () => {
    const result = GuideStepSchema.safeParse({
      id: "s2",
      action: "navigate",
      url: "http://localhost:3001/transactions",
      instruction: "Go to Transaction History.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a wait action with an optional target and timeout", () => {
    const result = GuideStepSchema.safeParse({
      id: "s3",
      action: "wait",
      target: { text: "Processing complete" },
      timeoutMs: 5000,
      instruction: "Wait for processing to finish.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a wait action with no target at all", () => {
    const result = GuideStepSchema.safeParse({
      id: "s4",
      action: "wait",
      instruction: "Take a moment before continuing.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a select action without a value", () => {
    const result = GuideStepSchema.safeParse({
      id: "s5",
      action: "select",
      target: { selector: "#country" },
      instruction: "Select United States.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown action discriminant", () => {
    const result = GuideStepSchema.safeParse({
      id: "s6",
      action: "hover",
      target: { selector: "#thing" },
      instruction: "Hover over the thing.",
    });
    expect(result.success).toBe(false);
  });
});
