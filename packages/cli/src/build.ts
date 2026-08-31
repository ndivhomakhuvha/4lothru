import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseGuideYaml } from "@test-guide/guide-schema";
import { discoverGuides, REPO_ROOT } from "./validate.js";

const OUTPUT_ROOT = path.join(REPO_ROOT, "dist", "releases");

export function runBuild(): void {
  const guides = discoverGuides();

  if (guides.length === 0) {
    console.log("No guides found under guides/releases/.");
    return;
  }

  let hasErrors = false;

  for (const guide of guides) {
    const yamlText = readFileSync(guide.filePath, "utf-8");
    const result = parseGuideYaml(yamlText);

    if (!result.success) {
      hasErrors = true;
      console.error(`✗ ${guide.release}/${guide.file}`);
      for (const issue of result.issues) {
        console.error(`  ${issue.path}: ${issue.message}`);
      }
      continue;
    }

    const outDir = path.join(OUTPUT_ROOT, guide.release);
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, guide.file.replace(/\.ya?ml$/, ".json"));
    writeFileSync(outFile, JSON.stringify(result.guide, null, 2));
    console.log(`✓ built ${guide.release}/${path.basename(outFile)}`);
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
