import { Spotlight } from "./highlight.js";

const STYLE_ID = "trail-sdk-styles";

const STYLES = `
.tg-root { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; }
.tg-spotlight {
  position: fixed;
  display: none;
  border: 2px solid #4f7cff;
  border-radius: 6px;
  box-shadow: 0 0 0 9999px rgba(15, 17, 26, 0.55);
  pointer-events: none;
  transition: top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease;
}
.tg-blocker { position: fixed; z-index: 0; pointer-events: auto; }
.tg-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2;
  width: 320px;
  max-width: calc(100vw - 40px);
  background: #12131a;
  color: #f4f5f7;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  padding: 16px 18px;
  font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  pointer-events: auto;
}
.tg-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tg-progress-text { font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #9aa1b5; }
.tg-exit-btn {
  background: transparent; border: none; color: #9aa1b5; font-size: 18px; line-height: 1; cursor: pointer;
  padding: 4px; border-radius: 6px;
}
.tg-exit-btn:hover, .tg-exit-btn:focus-visible { color: #f4f5f7; background: rgba(255,255,255,0.08); }
.tg-progress-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.12); overflow: hidden; margin-bottom: 12px; }
.tg-progress-fill { height: 100%; background: #4f7cff; transition: width 160ms ease; }
.tg-title { margin: 0 0 6px; font-size: 15px; font-weight: 700; }
.tg-instruction { margin: 0 0 16px; color: #d4d7e2; white-space: pre-line; }
.tg-panel-footer { display: flex; justify-content: space-between; gap: 8px; }
.tg-btn {
  appearance: none; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06);
  color: #f4f5f7; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.tg-btn:hover { background: rgba(255,255,255,0.14); }
.tg-btn:focus-visible { outline: 2px solid #4f7cff; outline-offset: 2px; }
.tg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tg-btn-primary { background: #4f7cff; border-color: #4f7cff; }
.tg-btn-primary:hover { background: #3f6ce0; }
.tg-error .tg-title { color: #ff6b6b; }
.tg-error-detail { font-size: 12px; color: #9aa1b5; margin: -8px 0 16px; }
`;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export interface StepViewModel {
  stepNumber: number;
  totalSteps: number;
  title: string;
  instruction: string;
  canGoBack: boolean;
  canGoNext: boolean;
  nextLabel: string;
}

export interface ErrorViewModel {
  title: string;
  message: string;
  detail?: string;
  showRetry: boolean;
}

export interface OverlayCallbacks {
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  onRetry: () => void;
}

/** Owns the SDK's self-contained DOM overlay: spotlight highlight + instruction panel. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class Overlay {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  readonly spotlight: Spotlight;
  private readonly callbacks: OverlayCallbacks;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private readonly previousBodyOverflow: string;
  private readonly previouslyFocusedElement: HTMLElement | null;
  private focusTarget: HTMLElement | null = null;

  constructor(callbacks: OverlayCallbacks) {
    injectStyles();
    this.callbacks = callbacks;
    this.previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.root = document.createElement("div");
    this.root.className = "tg-root";

    this.panel = document.createElement("div");
    this.panel.className = "tg-panel";
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-label", "Trail guide");
    this.panel.setAttribute("aria-live", "polite");
    this.panel.tabIndex = -1;
    this.root.appendChild(this.panel);

    this.spotlight = new Spotlight(this.root);
    document.body.appendChild(this.root);

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.callbacks.onExit();
        return;
      }
      if (event.key === "Tab") {
        this.trapTabFocus(event);
      }
    };
    document.addEventListener("keydown", this.keydownHandler, true);
  }

  /** Keeps focus cycling between the guided target and the panel controls. */
  private trapTabFocus(event: KeyboardEvent): void {
    const panelFocusable = Array.from(this.panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    const focusTarget =
      this.focusTarget &&
      this.focusTarget.isConnected &&
      this.focusTarget.matches(FOCUSABLE_SELECTOR) &&
      (this.focusTarget.offsetParent !== null || this.focusTarget === document.activeElement)
        ? this.focusTarget
        : null;
    const focusable = focusTarget ? [focusTarget, ...panelFocusable] : panelFocusable;

    if (focusable.length === 0) {
      event.preventDefault();
      this.focusPanel();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;

    if (active === this.panel || !focusable.includes(active as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (active === focusTarget) {
      event.preventDefault();
      (event.shiftKey ? last : panelFocusable[0] ?? focusTarget).focus();
      return;
    }

    if (event.shiftKey && focusTarget && active === panelFocusable[0]) {
      event.preventDefault();
      focusTarget.focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  renderStep(model: StepViewModel): void {
    const progressPct = Math.round((model.stepNumber / model.totalSteps) * 100);
    this.panel.className = "tg-panel";
    this.panel.innerHTML = `
      <div class="tg-panel-header">
        <span class="tg-progress-text">Step ${model.stepNumber} of ${model.totalSteps}</span>
        <button type="button" class="tg-exit-btn" aria-label="Exit Trail guide">&times;</button>
      </div>
      <div class="tg-progress-bar"><div class="tg-progress-fill" style="width:${progressPct}%"></div></div>
      <h2 class="tg-title"></h2>
      <p class="tg-instruction"></p>
      <div class="tg-panel-footer">
        <button type="button" class="tg-btn tg-back-btn">Back</button>
        <button type="button" class="tg-btn tg-btn-primary tg-next-btn"></button>
      </div>
    `;

    this.panel.querySelector(".tg-title")!.textContent = model.title;
    this.panel.querySelector(".tg-instruction")!.textContent = model.instruction;

    const backBtn = this.panel.querySelector<HTMLButtonElement>(".tg-back-btn")!;
    backBtn.disabled = !model.canGoBack;
    backBtn.addEventListener("click", () => this.callbacks.onBack());

    const nextBtn = this.panel.querySelector<HTMLButtonElement>(".tg-next-btn")!;
    nextBtn.disabled = !model.canGoNext;
    nextBtn.textContent = model.nextLabel;
    nextBtn.addEventListener("click", () => this.callbacks.onNext());

    this.panel.querySelector<HTMLButtonElement>(".tg-exit-btn")!.addEventListener("click", () => this.callbacks.onExit());

    this.focusPanel();
  }

  setFocusTarget(element: HTMLElement | null): void {
    this.focusTarget = element;
  }

  scrollToTarget(element: HTMLElement): void {
    document.body.style.overflow = this.previousBodyOverflow;
    element.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    document.body.style.overflow = "hidden";
  }

  setNextEnabled(enabled: boolean): void {
    const nextBtn = this.panel.querySelector<HTMLButtonElement>(".tg-next-btn");
    if (nextBtn) nextBtn.disabled = !enabled;
  }

  renderLocating(model: Pick<StepViewModel, "stepNumber" | "totalSteps" | "title" | "instruction">): void {
    this.spotlight.hide();
    this.panel.className = "tg-panel";
    this.panel.innerHTML = `
      <div class="tg-panel-header">
        <span class="tg-progress-text">Step ${model.stepNumber} of ${model.totalSteps}</span>
        <button type="button" class="tg-exit-btn" aria-label="Exit Trail guide">&times;</button>
      </div>
      <h2 class="tg-title"></h2>
      <p class="tg-instruction"></p>
      <p class="tg-error-detail">Locating element on the page&hellip;</p>
    `;
    this.panel.querySelector(".tg-title")!.textContent = model.title;
    this.panel.querySelector(".tg-instruction")!.textContent = model.instruction;
    this.panel.querySelector<HTMLButtonElement>(".tg-exit-btn")!.addEventListener("click", () => this.callbacks.onExit());
    this.focusPanel();
  }

  renderError(model: ErrorViewModel): void {
    this.spotlight.hide();
    this.panel.className = "tg-panel tg-error";
    this.panel.innerHTML = `
      <div class="tg-panel-header">
        <span class="tg-progress-text">Trail</span>
        <button type="button" class="tg-exit-btn" aria-label="Exit Trail guide">&times;</button>
      </div>
      <h2 class="tg-title"></h2>
      <p class="tg-instruction"></p>
      ${model.detail ? `<p class="tg-error-detail"></p>` : ""}
      <div class="tg-panel-footer">
        ${model.showRetry ? '<button type="button" class="tg-btn tg-retry-btn">Retry</button>' : "<span></span>"}
        <button type="button" class="tg-btn tg-btn-primary tg-exit-btn2">Exit</button>
      </div>
    `;
    this.panel.querySelector(".tg-title")!.textContent = model.title;
    this.panel.querySelector(".tg-instruction")!.textContent = model.message;
    if (model.detail) {
      this.panel.querySelector(".tg-error-detail")!.textContent = model.detail;
    }
    this.panel.querySelector<HTMLButtonElement>(".tg-exit-btn")!.addEventListener("click", () => this.callbacks.onExit());
    this.panel.querySelector<HTMLButtonElement>(".tg-exit-btn2")!.addEventListener("click", () => this.callbacks.onExit());
    this.panel.querySelector<HTMLButtonElement>(".tg-retry-btn")?.addEventListener("click", () => this.callbacks.onRetry());
    this.focusPanel();
  }

  renderComplete(title: string, totalSteps: number, onRestart: () => void): void {
    this.spotlight.hide();
    this.panel.className = "tg-panel";
    this.panel.innerHTML = `
      <h2 class="tg-title">Trail Guide Complete</h2>
      <p class="tg-instruction"></p>
      <div class="tg-panel-footer">
        <button type="button" class="tg-btn tg-restart-btn">Restart</button>
        <button type="button" class="tg-btn tg-btn-primary tg-exit-btn">Exit</button>
      </div>
    `;
    this.panel.querySelector(".tg-instruction")!.textContent =
      `${title} — ${totalSteps} of ${totalSteps} steps completed.`;
    this.panel.querySelector<HTMLButtonElement>(".tg-restart-btn")!.addEventListener("click", onRestart);
    this.panel.querySelector<HTMLButtonElement>(".tg-exit-btn")!.addEventListener("click", () => this.callbacks.onExit());
    this.focusPanel();
  }

  private focusPanel(): void {
    this.panel.focus({ preventScroll: true });
  }

  destroy(): void {
    this.spotlight.destroy();
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler, true);
    }
    document.body.style.overflow = this.previousBodyOverflow;
    this.root.remove();
    if (this.previouslyFocusedElement?.isConnected) {
      this.previouslyFocusedElement.focus({ preventScroll: true });
    }
  }
}
