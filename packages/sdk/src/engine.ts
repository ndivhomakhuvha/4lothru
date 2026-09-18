import type { Guide, GuideStep, Target } from "@trail/guide-schema";
import { GuideState } from "./state.js";
import { Overlay } from "./overlay.js";
import { resolveTarget } from "./target-resolver.js";
import { waitForElement } from "./dom-watcher.js";
import { onLocationChange } from "./spa-router.js";
import { saveCheckpoint, clearCheckpoint } from "./session-storage.js";

const DEFAULT_TARGET_TIMEOUT_MS = 10_000;

export interface EngineOptions {
  guide: Guide;
  release: string;
  startIndex: number;
  onExit?: () => void;
}

export interface TrailHandle {
  next: () => void;
  back: () => void;
  exit: () => void;
}

/** Orchestrates step state, target resolution, the overlay, and SPA route changes. */
export class TrailEngine implements TrailHandle {
  private readonly guide: Guide;
  private readonly release: string;
  private readonly state: GuideState;
  private readonly overlay: Overlay;
  private readonly unsubscribeLocation: () => void;
  private readonly onExitCallback?: () => void;
  private cancelWait: (() => void) | null = null;
  private cancelStepCompletion: (() => void) | null = null;
  private currentStepComplete = false;
  private destroyed = false;

  constructor(options: EngineOptions) {
    this.guide = options.guide;
    this.release = options.release;
    this.state = new GuideState(options.guide, options.startIndex);
    this.onExitCallback = options.onExit;

    this.overlay = new Overlay({
      onNext: () => this.next(),
      onBack: () => this.back(),
      onExit: () => this.exit(),
      onRetry: () => this.activateCurrentStep(),
    });

    // A completed action may trigger navigation before the tester presses Next.
    this.unsubscribeLocation = onLocationChange(() => {
      if (!this.currentStepComplete) this.activateCurrentStep();
    });

    this.activateCurrentStep();
  }

  next(): void {
    if (this.destroyed || !this.currentStepComplete) return;
    this.cancelWait?.();
    if (this.state.isLast) {
      this.complete();
      return;
    }
    this.state.next();
    this.activateCurrentStep();
  }

  back(): void {
    if (this.destroyed) return;
    this.cancelWait?.();
    this.state.back();
    this.activateCurrentStep();
  }

  exit(): void {
    if (this.destroyed) return;
    clearCheckpoint();
    this.destroy();
    this.onExitCallback?.();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelWait?.();
    this.cancelStepCompletion?.();
    this.unsubscribeLocation();
    this.overlay.destroy();
  }

  private persist(): void {
    saveCheckpoint({
      release: this.release,
      guideId: this.guide.id,
      stepIndex: this.state.currentIndex,
      stepId: this.state.currentStep.id,
    });
  }

  private activateCurrentStep(): void {
    if (this.destroyed) return;
    this.cancelWait?.();
    this.cancelStepCompletion?.();
    this.cancelStepCompletion = null;
    this.currentStepComplete = false;
    this.overlay.setFocusTarget(null);
    this.persist();

    const step = this.state.currentStep;

    if (step.action === "navigate") {
      this.handleNavigateStep(step);
      return;
    }

    const target: Target | undefined = "target" in step ? step.target : undefined;

    if (!target) {
      this.renderReady(null, step);
      return;
    }

    this.overlay.renderLocating({
      stepNumber: this.state.currentIndex + 1,
      totalSteps: this.state.total,
      title: this.guide.title,
      instruction: step.instruction,
    });

    const timeoutMs = step.action === "wait" ? step.timeoutMs ?? DEFAULT_TARGET_TIMEOUT_MS : DEFAULT_TARGET_TIMEOUT_MS;
    const { promise, cancel } = waitForElement(() => resolveTarget(target).element, { timeoutMs });
    this.cancelWait = cancel;

    promise.then((result) => {
      if (this.destroyed) return;
      if (result.timedOut || !result.element) {
        this.renderMissingTarget(step, target);
        return;
      }
      this.overlay.scrollToTarget(result.element);
      this.renderReady(result.element, step);
    });
  }

  private handleNavigateStep(step: Extract<GuideStep, { action: "navigate" }>): void {
    const destination = new URL(step.url, window.location.origin);
    if (window.location.pathname === destination.pathname) {
      this.renderReady(null, step);
      return;
    }

    // Persist the *next* step so a full page navigation resumes past this one.
    saveCheckpoint({
      release: this.release,
      guideId: this.guide.id,
      stepIndex: Math.min(this.state.currentIndex + 1, this.state.total - 1),
      stepId: this.guide.steps[Math.min(this.state.currentIndex + 1, this.state.total - 1)]!.id,
    });
    destination.searchParams.set("trail", this.guide.id);
    destination.searchParams.set("release", this.release);
    window.location.assign(destination.toString());
  }

  private renderReady(element: HTMLElement | null, step: GuideStep): void {
    this.overlay.setFocusTarget(element);
    if (element) {
      this.overlay.spotlight.attachTo(element);
    } else {
      this.overlay.spotlight.hide();
    }
    this.overlay.renderStep({
      stepNumber: this.state.currentIndex + 1,
      totalSteps: this.state.total,
      title: this.guide.title,
      instruction: step.instruction,
      canGoBack: !this.state.isFirst,
      canGoNext: this.watchStepCompletion(element, step),
      nextLabel: this.state.isLast ? "Finish" : "Next",
    });
  }

  private watchStepCompletion(element: HTMLElement | null, step: GuideStep): boolean {
    if (!element || step.action === "verify" || step.action === "wait" || step.action === "navigate") {
      this.currentStepComplete = true;
      return true;
    }

    const controller = new AbortController();
    this.cancelStepCompletion = () => controller.abort();
    const complete = () => {
      this.currentStepComplete = true;
      this.overlay.setNextEnabled(true);
      if (step.autoAdvance) this.next();
    };

    if (step.action === "input" || step.action === "select") {
      const isExpectedValue = () =>
        (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) &&
        element.value === step.value;
      const updateCompletion = () => {
        if (isExpectedValue()) {
          complete();
          return;
        }
        this.currentStepComplete = false;
        this.overlay.setNextEnabled(false);
      };
      element.addEventListener("input", updateCompletion, { signal: controller.signal });
      element.addEventListener("change", updateCompletion, { signal: controller.signal });
      const initiallyComplete = isExpectedValue();
      this.currentStepComplete = initiallyComplete;
      return initiallyComplete;
    }

    element.addEventListener("click", complete, { once: true, signal: controller.signal });
    return false;
  }

  private renderMissingTarget(step: GuideStep, target: Target): void {
    const { attempts } = resolveTarget(target);
    const detail = attempts
      .map((attempt) => `${attempt.strategy}: ${attempt.detail} — ${attempt.found ? "found" : "not found"}`)
      .join(" | ");
    this.overlay.renderError({
      title: "Target Not Found",
      message:
        `${step.instruction}\n\nThe application element could not be located. Possible causes: ` +
        "wrong page, application still loading, UI changed, or the guide is outdated.",
      detail,
      showRetry: true,
    });
  }

  private complete(): void {
    this.cancelWait?.();
    this.overlay.setFocusTarget(null);
    clearCheckpoint();
    this.overlay.renderComplete(this.guide.title, this.state.total, () => this.restart());
  }

  private restart(): void {
    const destination = new URL(this.guide.start.url, window.location.origin);
    destination.searchParams.set("trail", this.guide.id);
    destination.searchParams.set("release", this.release);

    if (window.location.href === destination.toString()) {
      this.state.reset();
      this.activateCurrentStep();
      return;
    }

    window.location.assign(destination.toString());
  }
}
