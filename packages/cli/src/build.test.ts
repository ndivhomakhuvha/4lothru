import { describe, expect, it } from "vitest";
import { getGuideOutputFileName } from "./build.js";

describe("guide build output naming", () => {
  it("uses the guide ID instead of the source filename", () => {
    const sourceFile = "different-source-name.yaml";
    const guideId = "PAY-1245";

    expect(getGuideOutputFileName(guideId)).toBe("PAY-1245.json");
    expect(getGuideOutputFileName(guideId)).not.toBe(sourceFile.replace(".yaml", ".json"));
  });
});