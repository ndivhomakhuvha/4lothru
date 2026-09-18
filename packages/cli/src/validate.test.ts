import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverGuides, resolveDiscoveredGuides } from "./validate.js";

const RELEASE = "2099.01.01";
const tempDirectories: string[] = [];

function createFixture(): { guidesRoot: string; releaseRoot: string } {
  const root = mkdtempSync(path.join(tmpdir(), "trail-validate-"));
  tempDirectories.push(root);
  const guidesRoot = path.join(root, "guides", "releases");
  const releaseRoot = path.join(guidesRoot, RELEASE);
  mkdirSync(releaseRoot, { recursive: true });
  return { guidesRoot, releaseRoot };
}

function guideYaml(id: string, steps = `
steps:
  - id: verify
    action: verify
    target:
      text: Ready
    instruction: Verify readiness.
`): string {
  return `
id: ${id}
title: ${id} title
application: demo-app
release: ${RELEASE}
start:
  url: http://localhost:3001/
${steps}`;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("guide discovery and resolution", () => {
  it("discovers sorted .yaml and .yml files in release directories only", () => {
    const { guidesRoot, releaseRoot } = createFixture();
    writeFileSync(path.join(releaseRoot, "z-guide.yaml"), guideYaml("Z"));
    writeFileSync(path.join(releaseRoot, "a-guide.yml"), guideYaml("A"));
    writeFileSync(path.join(releaseRoot, "ignored.json"), "{}");
    mkdirSync(path.join(releaseRoot, "nested"));
    writeFileSync(path.join(releaseRoot, "nested", "ignored.yaml"), guideYaml("NESTED"));

    expect(discoverGuides(guidesRoot).map(({ release, file }) => `${release}/${file}`)).toEqual([
      `${RELEASE}/a-guide.yml`,
      `${RELEASE}/z-guide.yaml`,
    ]);
  });

  it("reports every duplicate guide ID in a release", () => {
    const { guidesRoot, releaseRoot } = createFixture();
    writeFileSync(path.join(releaseRoot, "first.yaml"), guideYaml("DUPLICATE"));
    writeFileSync(path.join(releaseRoot, "second.yml"), guideYaml("DUPLICATE"));

    const results = resolveDiscoveredGuides(guidesRoot);

    expect(results).toHaveLength(2);
    expect(results.every((result) => !result.success)).toBe(true);
    for (const result of results) {
      if (!result.success) {
        expect(result.issues).toContainEqual({
          path: "id",
          message: `Duplicate guide id in release ${RELEASE}: DUPLICATE.`,
        });
      }
    }
  });

  it("resolves inherited steps from a guide in the same release", () => {
    const { guidesRoot, releaseRoot } = createFixture();
    writeFileSync(
      path.join(releaseRoot, "base.yaml"),
      guideYaml(
        "BASE",
        `
steps:
  - id: first
    action: verify
    target:
      text: First
    instruction: Verify first.
  - id: last
    action: verify
    target:
      text: Last
    instruction: Verify last.
`,
      ),
    );
    writeFileSync(
      path.join(releaseRoot, "extension.yaml"),
      guideYaml(
        "EXTENSION",
        `
extends: BASE
steps:
  - id: inserted
    action: verify
    target:
      text: Inserted
    before: last
    instruction: Verify inserted.
`,
      ),
    );

    const result = resolveDiscoveredGuides(guidesRoot).find(
      (entry) => entry.success && entry.guide.id === "EXTENSION",
    );

    expect(result?.success).toBe(true);
    if (result?.success) {
      expect(result.guide.steps.map((step) => step.id)).toEqual(["first", "inserted", "last"]);
      expect(result.guide).not.toHaveProperty("extends");
      expect(result.guide.steps[1]).not.toHaveProperty("before");
    }
  });
});
