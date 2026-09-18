import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT, resolveDiscoveredGuides } from "./validate.js";

const OUTPUT_ROOT = path.join(REPO_ROOT, "dist", "releases");

export interface BuildOptions {
  guidesRoot?: string;
  outputRoot?: string;
}

export function runBuild(options: BuildOptions = {}): void {
  const outputRoot = options.outputRoot ?? OUTPUT_ROOT;
  const guidesRoot = options.guidesRoot;
  const guides = resolveDiscoveredGuides(guidesRoot);

  if (guides.length === 0) {
    rmSync(outputRoot, { recursive: true, force: true });
    console.log(`No guides found under ${guidesRoot ?? "guides/releases/"}.`);
    return;
  }

  const failures = guides.filter((result) => !result.success);

  if (failures.length > 0) {
    for (const result of failures) {
      console.error(`✗ ${result.source.release}/${result.source.file}`);
      for (const issue of result.issues) {
        console.error(`  ${issue.path}: ${issue.message}`);
      }
    }

    console.log("");
    console.error("Build failed: one or more guides are invalid.");
    process.exitCode = 1;
    return;
  }

  mkdirSync(path.dirname(outputRoot), { recursive: true });
  const stagingRoot = mkdtempSync(`${outputRoot}.tmp-`);

  for (const result of guides) {
    if (!result.success) continue;

    const outDir = path.join(stagingRoot, result.source.release);
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${result.guide.id}.json`);
    writeFileSync(outFile, JSON.stringify(result.guide, null, 2));
    console.log(`✓ built ${result.source.release}/${path.basename(outFile)}`);
  }

  rmSync(outputRoot, { recursive: true, force: true });
  renameSync(stagingRoot, outputRoot);

  console.log("");
  console.log(`Built ${guides.length} guide(s) to ${outputRoot}.`);
}
