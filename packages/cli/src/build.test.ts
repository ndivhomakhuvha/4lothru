import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  it("builds .yml guides into JSON named after their guide IDs", () => {
    const { guidesRoot, outputRoot, releaseRoot } = createFixture();
    const source = path.join(releaseRoot, "descriptive-name.yml");
    const output = path.join(outputRoot, RELEASE, "RENAMED.json");
    writeFileSync(source, guideYaml("RENAMED"));

    runBuild({ guidesRoot, outputRoot });

    expect(existsSync(output)).toBe(true);
    expect(existsSync(path.join(outputRoot, RELEASE, "descriptive-name.json"))).toBe(false);
    expect(JSON.parse(readFileSync(output, "utf8")).id).toBe("RENAMED");
  });

  it("sets a failing exit code and preserves previous output when a guide is invalid", () => {
    const { guidesRoot, outputRoot, releaseRoot } = createFixture();
    const source = path.join(releaseRoot, "guide.yaml");
    const output = path.join(outputRoot, RELEASE, "VALID.json");
    writeFileSync(source, guideYaml("VALID"));

    runBuild({ guidesRoot, outputRoot });
    const previousOutput = readFileSync(output, "utf8");

    writeFileSync(source, "id: INVALID\n");
    runBuild({ guidesRoot, outputRoot });

    expect(process.exitCode).toBe(1);
    expect(readFileSync(output, "utf8")).toBe(previousOutput);
  });

  it("replaces prior output so stale release assets are removed", () => {
    const { guidesRoot, outputRoot, releaseRoot } = createFixture();
    writeFileSync(path.join(releaseRoot, "guide.yaml"), guideYaml("CURRENT"));
    const staleOutput = path.join(outputRoot, "old-release", "STALE.json");
    mkdirSync(path.dirname(staleOutput), { recursive: true });
    writeFileSync(staleOutput, "{}");

    runBuild({ guidesRoot, outputRoot });

    expect(existsSync(path.join(outputRoot, RELEASE, "CURRENT.json"))).toBe(true);
    expect(existsSync(staleOutput)).toBe(false);
  });

  it("removes stale output when no guides are discovered", () => {
    const { guidesRoot, outputRoot } = createFixture();
    const staleOutput = path.join(outputRoot, RELEASE, "STALE.json");
    mkdirSync(path.dirname(staleOutput), { recursive: true });
    writeFileSync(staleOutput, "{}");

    rmSync(guidesRoot, { recursive: true });
    runBuild({ guidesRoot, outputRoot });

    expect(existsSync(outputRoot)).toBe(false);
    expect(process.exitCode).toBeUndefined();
  });
});