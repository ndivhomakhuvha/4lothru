import { GuideSchema, type AuthorGuide, type Guide } from "./guide.js";
import type { GuideStep } from "./steps.js";

export interface GuideResolutionIssue {
  path: string;
  message: string;
}

export type GuideResolutionResult =
  | { success: true; guide: Guide }
  | { success: false; issues: GuideResolutionIssue[] };

function withoutPlacement(step: AuthorGuide["steps"][number]): GuideStep {
  const { before: _before, after: _after, ...runtimeStep } = step;
  return runtimeStep as GuideStep;
}

function duplicateStepIssue(steps: GuideStep[]): GuideResolutionIssue | undefined {
  const ids = new Set<string>();
  for (const step of steps) {
    if (ids.has(step.id)) {
      return { path: "steps", message: `Duplicate step id: ${step.id}.` };
    }
    ids.add(step.id);
  }
  return undefined;
}

function runtimeGuideData(guide: AuthorGuide, steps: GuideStep[]): Omit<AuthorGuide, "extends" | "steps"> & { steps: GuideStep[] } {
  const { extends: _extends, steps: _steps, ...runtimeGuide } = guide;
  return { ...runtimeGuide, steps };
}

/** Resolves an authoring guide and all of its same-release bases into a runtime guide. */
export function resolveGuide(
  guide: AuthorGuide,
  guidesById: ReadonlyMap<string, AuthorGuide>,
  resolving = new Set<string>(),
): GuideResolutionResult {
  if (resolving.has(guide.id)) {
    return { success: false, issues: [{ path: "extends", message: "Guide inheritance cycle detected." }] };
  }

  if (!guide.extends) {
    const steps = guide.steps.map(withoutPlacement);
    const duplicateIssue = duplicateStepIssue(steps);
    if (duplicateIssue) return { success: false, issues: [duplicateIssue] };
    const parsed = GuideSchema.safeParse(runtimeGuideData(guide, steps));
    return parsed.success
      ? { success: true, guide: parsed.data }
      : { success: false, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
  }

  const base = guidesById.get(guide.extends);
  if (!base) {
    return { success: false, issues: [{ path: "extends", message: `Base guide not found: ${guide.extends}.` }] };
  }
  if (guide.release !== base.release || guide.application !== base.application) {
    return {
      success: false,
      issues: [{ path: "extends", message: "An extension must match its base guide's release and application." }],
    };
  }

  const nextResolving = new Set(resolving);
  nextResolving.add(guide.id);
  const baseResult = resolveGuide(base, guidesById, nextResolving);
  if (!baseResult.success) return baseResult;

  const steps = [...baseResult.guide.steps];
  for (const extensionStep of guide.steps) {
    const anchorId = extensionStep.before ?? extensionStep.after;
    const anchorIndex = steps.findIndex((step) => step.id === anchorId);
    if (anchorIndex === -1) {
      return { success: false, issues: [{ path: "steps", message: `Anchor step not found: ${anchorId}.` }] };
    }
    steps.splice(extensionStep.before ? anchorIndex : anchorIndex + 1, 0, withoutPlacement(extensionStep));
  }

  const duplicateIssue = duplicateStepIssue(steps);
  if (duplicateIssue) return { success: false, issues: [duplicateIssue] };
  const parsed = GuideSchema.safeParse(runtimeGuideData(guide, steps));
  return parsed.success
    ? { success: true, guide: parsed.data }
    : { success: false, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
}