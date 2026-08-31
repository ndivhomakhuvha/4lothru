import { describe, expect, it } from "vitest";
import type { Guide } from "@test-guide/guide-schema";
import { GuideState } from "./state.js";

function makeGuide(stepCount: number): Guide {
  return {
    id: "TEST-1",
    title: "Test",
    application: "demo",
    release: "2026.08.26",
    start: { url: "http://localhost:3001" },
    steps: Array.from({ length: stepCount }, (_, i) => ({
      id: `step-${i}`,
      action: "verify" as const,
      target: { text: `Step ${i}` },
      instruction: `Instruction ${i}`,
    })),
  };
}

describe("GuideState", () => {
  it("starts at the first step", () => {
    const state = new GuideState(makeGuide(3));
    expect(state.currentIndex).toBe(0);
    expect(state.isFirst).toBe(true);
    expect(state.isLast).toBe(false);
  });

  it("advances with next() and stops at the last step", () => {
    const state = new GuideState(makeGuide(2));
    expect(state.next()).toBe(true);
    expect(state.isLast).toBe(true);
    expect(state.next()).toBe(false);
    expect(state.currentIndex).toBe(1);
  });

  it("goes back with back() and stops at the first step", () => {
    const state = new GuideState(makeGuide(3), 2);
    expect(state.back()).toBe(true);
    expect(state.currentIndex).toBe(1);
    expect(state.back()).toBe(true);
    expect(state.back()).toBe(false);
    expect(state.currentIndex).toBe(0);
  });

  it("clamps an out-of-range start index", () => {
    const state = new GuideState(makeGuide(2), 99);
    expect(state.currentIndex).toBe(1);
  });

  it("reset() returns to the first step", () => {
    const state = new GuideState(makeGuide(3), 2);
    state.reset();
    expect(state.currentIndex).toBe(0);
  });
});
