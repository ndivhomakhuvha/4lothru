import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseAuthorGuideYaml,
  resolveGuide,
  type AuthorGuide,
  type Guide,
  type GuideValidationIssue,
} from "@trail/guide-schema";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "../../../");
export const GUIDES_ROOT = path.join(REPO_ROOT, "guides", "releases");

export interface DiscoveredGuide {
  release: string;
  file: string;
  filePath: string;
}

/** Walks `guides/releases/<release>/*.yaml`. Returns an empty list if the directory doesn't exist. */
export function discoverGuides(guidesRoot = GUIDES_ROOT): DiscoveredGuide[] {
  if (!existsSync(guidesRoot)) return [];

  const guides: DiscoveredGuide[] = [];
  const releases = readdirSync(guidesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  for (const release of releases) {
    const releaseDir = path.join(guidesRoot, release.name);
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

export type ResolvedGuideResult =
  | { source: DiscoveredGuide; success: true; guide: Guide }
  | { source: DiscoveredGuide; success: false; issues: GuideValidationIssue[] };

/** Parses and resolves all guides per release, so extensions can only reference local bases. */
export function resolveDiscoveredGuides(guidesRoot = GUIDES_ROOT): ResolvedGuideResult[] {
  const parsed = discoverGuides(guidesRoot).map((source) => ({
    source,
    result: parseAuthorGuideYaml(readFileSync(source.filePath, "utf-8")),
  }));
  const releases = new Map<string, typeof parsed>();
  for (const entry of parsed) {
    const release = releases.get(entry.source.release) ?? [];
    release.push(entry);
    releases.set(entry.source.release, release);
  }

  const results: ResolvedGuideResult[] = [];
  for (const [release, entries] of releases) {
    const guidesById = new Map<string, AuthorGuide>();
    const duplicateIds = new Set<string>();
    for (const { result } of entries) {
      if (!result.success) continue;
      if (guidesById.has(result.guide.id)) duplicateIds.add(result.guide.id);
      else guidesById.set(result.guide.id, result.guide);
    }

    for (const { source, result } of entries) {
      if (!result.success) {
        results.push({ source, success: false, issues: result.issues });
      } else if (duplicateIds.has(result.guide.id)) {
        results.push({
          source,
          success: false,
          issues: [{ path: "id", message: `Duplicate guide id in release ${release}: ${result.guide.id}.` }],
        });
      } else {
        const resolved = resolveGuide(result.guide, guidesById);
        results.push(
          resolved.success
            ? { source, success: true, guide: resolved.guide }
            : { source, success: false, issues: resolved.issues },
        );
      }
    }
  }
  return results;
}

export function validateGuides(): { results: ValidationResult[] } {
  const results = resolveDiscoveredGuides().map((result): ValidationResult => {
    const file = `${result.source.release}/${result.source.file}`;
    return result.success ? { file, success: true } : { file, success: false, issues: result.issues };
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
