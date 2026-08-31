import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveTarget } from "./target-resolver.js";

describe("resolveTarget", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("finds an element by testId", () => {
    document.body.innerHTML = `<button data-testid="submit-payment">Submit</button>`;
    const { element, attempts } = resolveTarget({ testId: "submit-payment" });
    expect(element).not.toBeNull();
    expect(element?.tagName).toBe("BUTTON");
    expect(attempts[0]?.strategy).toBe("testId");
  });

  it("finds a button by role and accessible name", () => {
    document.body.innerHTML = `<button>Submit Payment</button>`;
    const { element } = resolveTarget({ role: "button", name: "Submit Payment" });
    expect(element?.textContent).toBe("Submit Payment");
  });

  it("finds an input via its associated label", () => {
    document.body.innerHTML = `
      <label for="amount">Amount</label>
      <input id="amount" type="text" />
    `;
    const { element } = resolveTarget({ label: "Amount" });
    expect(element?.tagName).toBe("INPUT");
  });

  it("finds an input nested inside its label", () => {
    document.body.innerHTML = `<label>Amount <input type="text" /></label>`;
    const { element } = resolveTarget({ label: "Amount" });
    expect(element?.tagName).toBe("INPUT");
  });

  it("finds an element by visible text", () => {
    document.body.innerHTML = `<div><span>Beneficiary</span></div>`;
    const { element } = resolveTarget({ text: "Beneficiary" });
    expect(element?.textContent).toBe("Beneficiary");
  });

  it("finds an element by CSS selector", () => {
    document.body.innerHTML = `<div id="submit-payment"></div>`;
    const { element } = resolveTarget({ selector: "#submit-payment" });
    expect(element?.id).toBe("submit-payment");
  });

  it("falls back to the next strategy when the first one fails", () => {
    document.body.innerHTML = `<div id="submit-payment">Submit</div>`;
    const { element, attempts } = resolveTarget({ testId: "does-not-exist", selector: "#submit-payment" });
    expect(element?.id).toBe("submit-payment");
    expect(attempts.map((a) => a.strategy)).toEqual(["testId", "selector"]);
  });

  it("returns diagnostics with no element when nothing matches", () => {
    const { element, attempts } = resolveTarget({ testId: "missing" });
    expect(element).toBeNull();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.found).toBe(false);
  });
});
