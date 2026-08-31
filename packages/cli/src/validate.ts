import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGuideYaml, type GuideValidationIssue } from "@test-guide/guide-schema";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "../../../");
export const GUIDES_ROOT = path.join(REPO_ROOT, "guides", "releases");

export interface DiscoveredGuide {
  release: string;
  file: string;
  filePath: string;
}

/** Walks `guides/releases/<release>/*.yaml`. Returns an empty list if the directory doesn't exist. */
export function discoverGuides(): DiscoveredGuide[] {
  if (!existsSync(GUIDES_ROOT)) return [];

  const guides: DiscoveredGuide[] = [];
  const releases = readdirSync(GUIDES_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  for (const release of releases) {
    const releaseDir = path.join(GUIDES_ROOT, release.name);
    const files = readdirSync(releaseDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    for (const file of files.sort()) {
      guides.push({ release: release.name, file, filePath: path.join(releaseDir, file) });
    }
  }

  return guides;
}

export interface ValidationResult {
  file: string;
  success: boolean;
  issues?: GuideValidationIssue[];
}

export function validateGuides(): { results: ValidationResult[] } {
  const guides = discoverGuides();
  const results = guides.map((guide): ValidationResult => {
    const yamlText = readFileSync(guide.filePath, "utf-8");
    const result = parseGuideYaml(yamlText);
    const label = `${guide.release}/${guide.file}`;
    return result.success ? { file: label, success: true } : { file: label, success: false, issues: result.issues };
  });
  return { results };
}

export function runValidate(): void {
  const { results } = validateGuides();

  if (results.length === 0) {
    console.log("No guides found under guides/releases/.");
    return;
  }

  const failures = results.filter((r) => !r.success);

  for (const result of results) {
    if (result.success) {
      console.log(`✓ ${result.file}`);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.log("");
      console.log(`✗ ${failure.file}`);
      console.log("");
      for (const issue of failure.issues ?? []) {
        console.log(`${issue.path}:`);
        console.log(issue.message);
      }
    }
    console.log("");
    console.error(`${failures.length} of ${results.length} guide(s) invalid.`);
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log(`${results.length} guides valid.`);
}
