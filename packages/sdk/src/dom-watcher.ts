export interface WaitForElementOptions {
  /** How long to wait before giving up, in ms. Defaults to 10000 (10s) per spec. */
  timeoutMs?: number;
  /** Root to observe for DOM mutations. Defaults to document.body. */
  root?: Node;
}

export interface WaitForElementResult {
  element: HTMLElement | null;
  timedOut: boolean;
}

/**
 * Repeatedly calls `resolve()` until it returns an element, watching the DOM via a
 * single MutationObserver instead of polling. Resolves with `timedOut: true` if the
 * default 10s budget elapses first.
 */
export function waitForElement(
  resolve: () => HTMLElement | null,
  options: WaitForElementOptions = {},
): { promise: Promise<WaitForElementResult>; cancel: () => void } {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const root = options.root ?? document.body;

  let settled = false;
  let observer: MutationObserver | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let rafHandle: number | null = null;

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
    if (timer !== null) clearTimeout(timer);
    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
  };

  let resolvePromise!: (value: WaitForElementResult) => void;
  const promise = new Promise<WaitForElementResult>((res) => {
    resolvePromise = res;
  });

  const settle = (result: WaitForElementResult) => {
    if (settled) return;
    settled = true;
    cleanup();
    resolvePromise(result);
  };

  const attempt = () => {
    if (settled) return;
    const element = resolve();
    if (element) {
      settle({ element, timedOut: false });
    }
  };

  // Debounce rapid bursts of mutations onto a single animation frame.
  const scheduleAttempt = () => {
    if (rafHandle !== null) return;
    rafHandle = requestAnimationFrame(() => {
      rafHandle = null;
      attempt();
    });
  };

  attempt();
  if (!settled) {
    observer = new MutationObserver(scheduleAttempt);
    observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
    timer = setTimeout(() => settle({ element: null, timedOut: true }), timeoutMs);
  }

  return {
    promise,
    cancel: () => settle({ element: null, timedOut: false }),
  };
}
