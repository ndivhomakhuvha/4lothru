import { describe, expect, it } from "vitest";
import { TargetSchema } from "./target.js";

describe("TargetSchema", () => {
  it("accepts each supported target strategy", () => {
    expect(TargetSchema.safeParse({ testId: "submit-payment" }).success).toBe(true);
    expect(TargetSchema.safeParse({ role: "button", name: "Submit Payment" }).success).toBe(true);
    expect(TargetSchema.safeParse({ label: "Amount" }).success).toBe(true);
    expect(TargetSchema.safeParse({ text: "Submit Payment" }).success).toBe(true);
    expect(TargetSchema.safeParse({ selector: "#submit-payment" }).success).toBe(true);
  });

  it("rejects an empty target", () => {
    expect(TargetSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a role target missing its accessible name", () => {
    expect(TargetSchema.safeParse({ role: "button" }).success).toBe(false);
  });

  it("rejects mixed/unknown keys on a single target", () => {
    expect(TargetSchema.safeParse({ label: "Amount", bogus: "x" }).success).toBe(false);
  });

  it("allows combining strategies as fallbacks", () => {
    const result = TargetSchema.safeParse({ testId: "submit-payment", selector: "#submit-payment" });
    expect(result.success).toBe(true);
  });
});
