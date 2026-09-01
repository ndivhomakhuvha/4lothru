import { parse as parseYamlText } from "yaml";
import type { ZodError } from "zod";
import { AuthorGuideSchema, GuideSchema, type AuthorGuide, type Guide } from "./guide.js";

export interface GuideValidationIssue {
  path: string;
  message: string;
}

export type GuideParseResult =
  | { success: true; guide: Guide }
  | { success: false; issues: GuideValidationIssue[] };

export type AuthorGuideParseResult =
  | { success: true; guide: AuthorGuide }
  | { success: false; issues: GuideValidationIssue[] };

function formatPath(path: (string | number)[]): string {
  if (path.length === 0) return "(root)";
  let out = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      out += `[${segment}]`;
    } else {
      out += out ? `.${segment}` : segment;
    }
  }
  return out;
}

export function issuesFromZodError(error: ZodError): GuideValidationIssue[] {
  return error.issues.map((issue) => {
    const path = formatPath(issue.path);
    const lastSegment = issue.path[issue.path.length - 1];
    // Give the common "missing target" case from the spec a friendlier message.
    if (lastSegment === "target" && issue.code === "invalid_type") {
      return { path, message: "Target is required." };
    }
    return { path, message: issue.message };
  });
}

function parseData(raw: unknown): GuideParseResult {
  const result = GuideSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, issues: issuesFromZodError(result.error) };
  }
  return { success: true, guide: result.data };
}

function parseAuthorData(raw: unknown): AuthorGuideParseResult {
  const result = AuthorGuideSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, issues: issuesFromZodError(result.error) };
  }
  return { success: true, guide: result.data };
}

export function parseGuideYaml(yamlText: string): GuideParseResult {
  let raw: unknown;
  try {
    raw = parseYamlText(yamlText);
  } catch (error) {
    return {
      success: false,
      issues: [
        { path: "(yaml)", message: error instanceof Error ? error.message : "Invalid YAML." },
      ],
    };
  }
  return parseData(raw);
}

export function parseAuthorGuideYaml(yamlText: string): AuthorGuideParseResult {
  let raw: unknown;
  try {
    raw = parseYamlText(yamlText);
  } catch (error) {
    return {
      success: false,
      issues: [
        { path: "(yaml)", message: error instanceof Error ? error.message : "Invalid YAML." },
      ],
    };
  }
  return parseAuthorData(raw);
}

export function parseGuideJson(jsonText: string): GuideParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (error) {
    return {
      success: false,
      issues: [
        { path: "(json)", message: error instanceof Error ? error.message : "Invalid JSON." },
      ],
    };
  }
  return parseData(raw);
}
