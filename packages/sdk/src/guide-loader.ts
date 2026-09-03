import { parseGuideJson, type Guide, type GuideValidationIssue } from "@trail/guide-schema";

export type LoadGuideResult =
  | { success: true; guide: Guide }
  | { success: false; kind: "not-found" | "invalid"; issues?: GuideValidationIssue[] };

/**
 * Fetches a built guide JSON asset and validates it. The SDK only ever consumes the
 * static JSON produced by `trail build`, so the (larger) YAML parser stays out
 * of the runtime bundle — keeping the SDK lightweight per spec #34.
 */
export async function loadGuide(url: string): Promise<LoadGuideResult> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: "same-origin" });
  } catch {
    return { success: false, kind: "not-found" };
  }

  if (!response.ok) {
    return { success: false, kind: "not-found" };
  }

  const text = await response.text();
  const result = parseGuideJson(text);

  if (!result.success) {
    return { success: false, kind: "invalid", issues: result.issues };
  }

  return { success: true, guide: result.guide };
}
