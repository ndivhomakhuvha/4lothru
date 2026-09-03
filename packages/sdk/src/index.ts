import { loadGuide } from "./guide-loader.js";
import { loadCheckpoint } from "./session-storage.js";
import { TrailEngine, type TrailHandle } from "./engine.js";
import { Overlay } from "./overlay.js";

export type { TrailHandle } from "./engine.js";
export type { Guide, GuideStep, Target } from "@trail/guide-schema";

export interface TrailInitOptions {
  /** Explicit URL to a guide document (JSON or YAML). Overrides URL-based auto-detection. */
  guideUrl?: string;
  /** Base path used to resolve `?trail=&release=` query params. Defaults to "/guides". */
  guideBaseUrl?: string;
}

interface ResolvedGuideRequest {
  url: string;
  guideId: string;
  release: string;
}

export function resolveGuideRequest(options: TrailInitOptions): ResolvedGuideRequest | null {
  if (options.guideUrl) {
    const params = new URLSearchParams(new URL(options.guideUrl, window.location.href).search);
    return {
      url: options.guideUrl,
      guideId: params.get("trail") ?? "unknown",
      release: params.get("release") ?? "unknown",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const guideId = params.get("trail");
  const release = params.get("release");
  if (!guideId || !release) return null;

  const base = (options.guideBaseUrl ?? "/guides").replace(/\/$/, "");
  return { url: `${base}/releases/${release}/${guideId}.json`, guideId, release };
}

function showStandaloneError(title: string, message: string, detail?: string): void {
  const overlay = new Overlay({
    onNext: () => {},
    onBack: () => {},
    onRetry: () => overlay.destroy(),
    onExit: () => overlay.destroy(),
  });
  overlay.renderError({ title, message, detail, showRetry: false });
}

/**
 * Entry point installed inside the application under test. No-ops (negligible
 * overhead, per spec #34) unless a guide has actually been requested via
 * `options.guideUrl` or the `?trail=&release=` query params.
 */
async function init(options: TrailInitOptions = {}): Promise<TrailHandle | null> {
  const request = resolveGuideRequest(options);
  if (!request) return null;

  const result = await loadGuide(request.url);

  if (!result.success && result.kind === "not-found") {
    showStandaloneError("Trail Guide Not Found", `${request.guideId}\nRelease ${request.release}`);
    return null;
  }

  if (!result.success) {
    const detail = result.issues?.map((issue) => `${issue.path}: ${issue.message}`).join(" | ");
    showStandaloneError("Invalid Trail Guide", `${request.guideId} failed validation.`, detail);
    return null;
  }

  const checkpoint = loadCheckpoint(request.release, result.guide.id);
  const startIndex = checkpoint?.stepIndex ?? 0;

  return new TrailEngine({
    guide: result.guide,
    release: request.release,
    startIndex,
  });
}

export const Trail = { init };
