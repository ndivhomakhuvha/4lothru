const PADDING = 6;

/**
 * Draws a highlight rectangle around a target element using a "spotlight" box-shadow
 * (dims everything outside the box) and keeps it aligned via ResizeObserver/scroll/
 * resize listeners instead of polling, per spec #10.
 */
export class Spotlight {
  private readonly box: HTMLDivElement;
  private readonly blockers: HTMLDivElement[];
  private target: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafHandle: number | null = null;

  constructor(container: HTMLElement) {
    this.box = document.createElement("div");
    this.box.className = "tg-spotlight";
    this.blockers = Array.from({ length: 4 }, () => {
      const blocker = document.createElement("div");
      blocker.className = "tg-blocker";
      container.appendChild(blocker);
      return blocker;
    });
    container.appendChild(this.box);

    window.addEventListener("resize", this.scheduleReposition);
    window.addEventListener("scroll", this.scheduleReposition, true);
  }

  attachTo(element: HTMLElement): void {
    this.detachObserver();
    this.target = element;
    this.resizeObserver = new ResizeObserver(this.scheduleReposition);
    this.resizeObserver.observe(element);
    this.box.style.display = "block";
    this.blockers.forEach((blocker) => (blocker.style.display = "block"));
    this.reposition();
  }

  hide(): void {
    this.target = null;
    this.detachObserver();
    this.box.style.display = "none";
    this.blockers.forEach((blocker) => (blocker.style.display = "none"));
  }

  destroy(): void {
    this.hide();
    window.removeEventListener("resize", this.scheduleReposition);
    window.removeEventListener("scroll", this.scheduleReposition, true);
    this.blockers.forEach((blocker) => blocker.remove());
    this.box.remove();
  }

  private detachObserver(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private scheduleReposition = (): void => {
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.reposition();
    });
  };

  private reposition(): void {
    if (!this.target) return;
    const rect = this.target.getBoundingClientRect();
    this.box.style.top = `${rect.top - PADDING}px`;
    this.box.style.left = `${rect.left - PADDING}px`;
    this.box.style.width = `${rect.width + PADDING * 2}px`;
    this.box.style.height = `${rect.height + PADDING * 2}px`;

    const top = Math.max(0, rect.top - PADDING);
    const left = Math.max(0, rect.left - PADDING);
    const right = Math.min(window.innerWidth, rect.right + PADDING);
    const bottom = Math.min(window.innerHeight, rect.bottom + PADDING);
    const dimensions: [number, number, number, number][] = [
      [0, 0, window.innerWidth, top],
      [0, top, left, bottom - top],
      [right, top, window.innerWidth - right, bottom - top],
      [0, bottom, window.innerWidth, window.innerHeight - bottom],
    ];
    this.blockers.forEach((blocker, index) => {
      const [blockerLeft, blockerTop, width, height] = dimensions[index]!;
      Object.assign(blocker.style, {
        left: `${blockerLeft}px`,
        top: `${blockerTop}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
    });
  }
}
