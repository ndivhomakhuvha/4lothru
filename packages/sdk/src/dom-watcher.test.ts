import { describe, expect, it } from "vitest";
import { waitForElement } from "./dom-watcher.js";

describe("waitForElement", () => {
  it("resolves immediately if the element already exists", async () => {
    document.body.innerHTML = `<button id="target"></button>`;
    const { promise } = waitForElement(() => document.getElementById("target") as HTMLElement | null);
    const result = await promise;
    expect(result.timedOut).toBe(false);
    expect(result.element?.id).toBe("target");
  });

  it("resolves once the element is added to the DOM", async () => {
    document.body.innerHTML = "";
    const { promise } = waitForElement(() => document.getElementById("target") as HTMLElement | null);

    setTimeout(() => {
      const el = document.createElement("button");
      el.id = "target";
      document.body.appendChild(el);
    }, 10);

    const result = await promise;
    expect(result.timedOut).toBe(false);
    expect(result.element?.id).toBe("target");
  });

  it("times out when the element never appears", async () => {
    document.body.innerHTML = "";
    const { promise } = waitForElement(() => document.getElementById("nope") as HTMLElement | null, {
      timeoutMs: 20,
    });
    const result = await promise;
    expect(result.timedOut).toBe(true);
    expect(result.element).toBeNull();
  });

  it("can be cancelled without timing out", async () => {
    document.body.innerHTML = "";
    const { promise, cancel } = waitForElement(() => document.getElementById("nope") as HTMLElement | null, {
      timeoutMs: 1000,
    });
    cancel();
    const result = await promise;
    expect(result.timedOut).toBe(false);
    expect(result.element).toBeNull();
  });
});
