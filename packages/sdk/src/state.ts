import type { Guide } from "@test-guide/guide-schema";

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
