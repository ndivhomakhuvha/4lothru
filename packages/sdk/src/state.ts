import type { Guide } from "../../guide-schema/src/index.js";
import type { GuideCheckpoint } from "./session-storage.js";

export function resolveCheckpointIndex(guide: Guide, checkpoint: GuideCheckpoint | null): number | null {
  if (!checkpoint) return 0;
  const index = guide.steps.findIndex((step) => step.id === checkpoint.stepId);
  return index >= 0 ? index : null;
}

export class GuideState {
  readonly guide: Guide;
  private index: number;

  constructor(guide: Guide, startIndex = 0) {
    this.guide = guide;
    this.index = Math.min(Math.max(startIndex, 0), guide.steps.length - 1);
  }

  get currentIndex(): number {
    return this.index;
  }

  get currentStep() {
    return this.guide.steps[this.index]!;
  }

  get total(): number {
    return this.guide.steps.length;
  }

  get isFirst(): boolean {
    return this.index === 0;
  }

  get isLast(): boolean {
    return this.index === this.guide.steps.length - 1;
  }

  next(): boolean {
    if (this.isLast) return false;
    this.index += 1;
    return true;
  }

  back(): boolean {
    if (this.isFirst) return false;
    this.index -= 1;
    return true;
  }

  reset(): void {
    this.index = 0;
  }
}
