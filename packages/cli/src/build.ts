import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT, resolveDiscoveredGuides } from "./validate.js";

const OUTPUT_ROOT = path.join(REPO_ROOT, "dist", "releases");

export function getGuideOutputFileName(guideId: string): string {
  return `${guideId}.json`;
}

export function runBuild(): void {
  const guides = resolveDiscoveredGuides();

  if (guides.length === 0) {
    console.log("No guides found under guides/releases/.");
    return;
  }

  let hasErrors = false;

  for (const result of guides) {
    if (!result.success) {
      hasErrors = true;
      console.error(`✗ ${result.source.release}/${result.source.file}`);
      for (const issue of result.issues) {
        console.error(`  ${issue.path}: ${issue.message}`);
      }
      continue;
    }

    const outDir = path.join(OUTPUT_ROOT, result.source.release);
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, getGuideOutputFileName(result.guide.id));
    writeFileSync(outFile, JSON.stringify(result.guide, null, 2));
    console.log(`✓ built ${result.source.release}/${path.basename(outFile)}`);
  }

  if (hasErrors) {
    console.log("");
    console.error("Build failed: one or more guides are invalid.");
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log(`Built ${guides.length} guide(s) to dist/releases/.`);
}
