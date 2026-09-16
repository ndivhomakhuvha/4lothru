import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runBuild } from "./build.js";

const RELEASE = "2099.01.01";
const tempDirectories: string[] = [];

function createFixture(): { guidesRoot: string; outputRoot: string; releaseRoot: string } {
  const root = mkdtempSync(path.join(tmpdir(), "trail-build-"));
  tempDirectories.push(root);
  const guidesRoot = path.join(root, "guides", "releases");
  const releaseRoot = path.join(guidesRoot, RELEASE);
  mkdirSync(releaseRoot, { recursive: true });
  return { guidesRoot, outputRoot: path.join(root, "dist", "releases"), releaseRoot };
}

function guideYaml(id: string): string {
  return [
    `id: ${id}`,
    `title: ${id} title`,
    "application: demo-app",
    `release: ${RELEASE}`,
    "",
    "start:",
    "  url: http://localhost:3001/",
    "",
    "steps:",
    "  - id: go",
    "    target:",
    "      text: Go",
    "    action: click",
    "    instruction: Click go.",
    "",
  ].join("\n");
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  process.exitCode = undefined;
});

describe("runBuild", () => {
  it("removes output for a guide renamed in the source tree", () => {
    const { guidesRoot, outputRoot, releaseRoot } = createFixture();
    const oldSource = path.join(releaseRoot, "old-name.yaml");
    const newSource = path.join(releaseRoot, "new-name.yaml");
    writeFileSync(oldSource, guideYaml("RENAMED"));

    runBuild({ guidesRoot, outputRoot });
    expect(existsSync(path.join(outputRoot, RELEASE, "old-name.json"))).toBe(true);

    renameSync(oldSource, newSource);
    runBuild({ guidesRoot, outputRoot });

    expect(existsSync(path.join(outputRoot, RELEASE, "old-name.json"))).toBe(false);
    expect(JSON.parse(readFileSync(path.join(outputRoot, RELEASE, "new-name.json"), "utf8")).id).toBe("RENAMED");
  });
});