let started = false;

/** Guards against React StrictMode's double-invoked effects re-triggering init(). */
export function guardOnce(fn: () => void): void {
  if (started) return;
  started = true;
  fn();
}
