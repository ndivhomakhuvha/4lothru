import { afterEach, describe, expect, it } from "vitest";
import { Overlay } from "./overlay.js";

const callbacks = {
  onNext: () => {},
  onBack: () => {},
  onExit: () => {},
  onRetry: () => {},
};

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

describe("Overlay", () => {
  it("restores focus to the element focused before it opened", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const overlay = new Overlay(callbacks);
    overlay.destroy();

    expect(document.activeElement).toBe(trigger);
  });
});
