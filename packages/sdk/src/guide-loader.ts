import { parseGuideJson, type Guide, type GuideValidationIssue } from "@4lothru/guide-schema";

export type LoadGuideResult =
  | { success: true; guide: Guide }
  | {
      success: false;
      kind: "not-found" | "network-error" | "server-error" | "invalid";
      issues?: GuideValidationIssue[];
    };

/**
 * Fetches a built guide JSON asset and validates it. The SDK only ever consumes the
 * static JSON produced by `4lothru build`, so the (larger) YAML parser stays out
 * of the runtime bundle — keeping the SDK lightweight per spec #34.
 */
export async function loadGuide(url: string): Promise<LoadGuideResult> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: "same-origin" });
  } catch {
    return { success: false, kind: "network-error" };
  }

  if (!response.ok) {
    return { success: false, kind: response.status === 404 ? "not-found" : "server-error" };
  }

  const text = await response.text();
  const result = parseGuideJson(text);

  if (!result.success) {
    return { success: false, kind: "invalid", issues: result.issues };
  }

  return { success: true, guide: result.guide };
}
