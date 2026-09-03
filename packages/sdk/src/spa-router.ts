const LOCATION_CHANGE_EVENT = "trail:locationchange";

let patched = false;

/**
 * Patches `history.pushState`/`replaceState` once per page so SPA route changes made
 * by any router (React Router, Vue Router, Angular Router, ...) surface as a single
 * DOM event alongside native `popstate`. Framework-agnostic by design (see spec #12).
 */
function ensurePatched(): void {
  if (patched) return;
  patched = true;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function patchedPushState(...args: Parameters<History["pushState"]>) {
    const result = originalPushState(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
    return result;
  };

  history.replaceState = function patchedReplaceState(...args: Parameters<History["replaceState"]>) {
    const result = originalReplaceState(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
    return result;
  };

  window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  });
}

/** Subscribes to same-page URL changes (pushState/replaceState/popstate). */
export function onLocationChange(listener: () => void): () => void {
  ensurePatched();
  window.addEventListener(LOCATION_CHANGE_EVENT, listener);
  return () => window.removeEventListener(LOCATION_CHANGE_EVENT, listener);
}
