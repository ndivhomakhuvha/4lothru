import { afterEach, describe, expect, it } from "vitest";
import { clearCheckpoint, loadCheckpoint, saveCheckpoint } from "./session-storage.js";

const checkpoint = {
  release: "2026.08.26",
  guideId: "PAY-1245",
  stepIndex: 1,
  stepId: "beneficiary",
};

describe("session checkpoint storage", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("round-trips a step ID for reload resume", () => {
    saveCheckpoint(checkpoint);

    expect(loadCheckpoint(checkpoint.release, checkpoint.guideId)).toEqual(checkpoint);
  });

  it("clears legacy index-only checkpoints", () => {
    sessionStorage.setItem("trail:checkpoint", JSON.stringify({ ...checkpoint, stepId: undefined }));

    expect(loadCheckpoint(checkpoint.release, checkpoint.guideId)).toBeNull();
    expect(sessionStorage.getItem("trail:checkpoint")).toBeNull();
  });

  it("clears malformed checkpoints", () => {
    sessionStorage.setItem("trail:checkpoint", "{");

    expect(loadCheckpoint(checkpoint.release, checkpoint.guideId)).toBeNull();
    expect(sessionStorage.getItem("trail:checkpoint")).toBeNull();
  });

  it("clearCheckpoint removes a saved resume point", () => {
    saveCheckpoint(checkpoint);
    clearCheckpoint();

    expect(loadCheckpoint(checkpoint.release, checkpoint.guideId)).toBeNull();
  });
});