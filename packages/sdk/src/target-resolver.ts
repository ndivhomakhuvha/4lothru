import type { Target } from "../../guide-schema/src/index.js";
import { TARGET_STRATEGY_ORDER } from "../../guide-schema/src/index.js";

export interface ResolveAttempt {
  strategy: string;
  detail: string;
  found: boolean;
}

export interface ResolveResult {
  element: HTMLElement | null;
  attempts: ResolveAttempt[];
}

/** Minimal implicit ARIA role mapping for the handful of controls guides commonly target. */
const IMPLICIT_ROLE_SELECTORS: Record<string, string> = {
  button: 'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
  link: 'a[href], [role="link"]',
  textbox:
    'input:not([type]), input[type="text"], input[type="email"], input[type="search"], input[type="tel"], input[type="url"], input[type="password"], textarea, [role="textbox"]',
  checkbox: 'input[type="checkbox"], [role="checkbox"]',
  radio: 'input[type="radio"], [role="radio"]',
  combobox: 'select, [role="combobox"]',
  option: 'option, [role="option"]',
  heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
  tab: '[role="tab"]',
};

function normalize(text: string | null | undefined): string {
  return (text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hidden) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/([^\w-])/g, "\\$1");
}

/** A pragmatic subset of the accessible-name computation algorithm. */
function accessibleName(el: Element): string {
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return normalize(ariaLabel);

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (text.trim()) return normalize(text);
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.value) return normalize(el.value);
    if (el.placeholder) return normalize(el.placeholder);
  }

  return normalize(el.textContent);
}

function findByTestId(testId: string): ResolveAttempt & { element: HTMLElement | null } {
  const element = document.querySelector<HTMLElement>(
    `[data-testid="${cssEscape(testId)}"]`,
  );
  return { strategy: "testId", detail: `[data-testid="${testId}"]`, found: !!element, element };
}

function findByRole(role: string, name: string): ResolveAttempt & { element: HTMLElement | null } {
  const selector = IMPLICIT_ROLE_SELECTORS[role] ?? `[role="${role}"]`;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isVisible);
  const target = normalize(name);
  const element = candidates.find((el) => accessibleName(el) === target) ?? null;
  return { strategy: "role", detail: `role="${role}" name="${name}"`, found: !!element, element };
}

function findByLabel(label: string): ResolveAttempt & { element: HTMLElement | null } {
  const target = normalize(label);
  const labels = Array.from(document.querySelectorAll("label"));
  for (const labelEl of labels) {
    if (normalize(labelEl.textContent) !== target) continue;
    const forId = labelEl.getAttribute("for");
    if (forId) {
      const control = document.getElementById(forId);
      if (control instanceof HTMLElement && isVisible(control)) {
        return { strategy: "label", detail: `label="${label}"`, found: true, element: control };
      }
    }
    const nested = labelEl.querySelector<HTMLElement>("input, select, textarea");
    if (nested && isVisible(nested)) {
      return { strategy: "label", detail: `label="${label}"`, found: true, element: nested };
    }
  }
  return { strategy: "label", detail: `label="${label}"`, found: false, element: null };
}

const TEXT_CANDIDATE_SELECTOR =
  'button, a, [role="button"], [role="link"], input[type="submit"], input[type="button"], *';

function findByText(text: string): ResolveAttempt & { element: HTMLElement | null } {
  const target = normalize(text);
  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of document.querySelectorAll<HTMLElement>(TEXT_CANDIDATE_SELECTOR)) {
    if (!isVisible(el)) continue;
    const ownText = normalize(el.textContent);
    if (!ownText || !ownText.includes(target)) continue;
    // Prefer the smallest element that still contains the text (innermost match).
    const score = el.children.length + ownText.length;
    if (score < bestScore) {
      best = el;
      bestScore = score;
    }
  }

  return { strategy: "text", detail: `text="${text}"`, found: !!best, element: best };
}

function findBySelector(selector: string): ResolveAttempt & { element: HTMLElement | null } {
  let element: HTMLElement | null = null;
  try {
    element = document.querySelector<HTMLElement>(selector);
  } catch {
    // Invalid selector strings are surfaced as a failed attempt rather than throwing.
  }
  return { strategy: "selector", detail: selector, found: !!element, element };
}

/**
 * Resolves a guide {@link Target} to a DOM element, trying each strategy present on
 * the target in priority order: testId -> role/name -> label -> text -> selector.
 */
export function resolveTarget(target: Target): ResolveResult {
  const attempts: ResolveAttempt[] = [];

  for (const strategy of TARGET_STRATEGY_ORDER) {
    let result: ResolveAttempt & { element: HTMLElement | null };

    if (strategy === "testId" && target.testId) {
      result = findByTestId(target.testId);
    } else if (strategy === "role" && target.role && target.name) {
      result = findByRole(target.role, target.name);
    } else if (strategy === "label" && target.label) {
      result = findByLabel(target.label);
    } else if (strategy === "text" && target.text) {
      result = findByText(target.text);
    } else if (strategy === "selector" && target.selector) {
      result = findBySelector(target.selector);
    } else {
      continue;
    }

    attempts.push({ strategy: result.strategy, detail: result.detail, found: result.found });
    if (result.element) {
      return { element: result.element, attempts };
    }
  }

  return { element: null, attempts };
}
