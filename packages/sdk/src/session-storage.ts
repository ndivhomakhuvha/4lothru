export interface GuideCheckpoint {
  release: string;
  guideId: string;
  stepIndex: number;
  stepId: string;
}

const STORAGE_KEY = "trail:checkpoint";

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveCheckpoint(checkpoint: GuideCheckpoint): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(checkpoint));
  } catch {
    // Storage can throw when full/disabled; progress simply won't survive a reload.
  }
}

export function loadCheckpoint(release: string, guideId: string): GuideCheckpoint | null {
  const storage = safeSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuideCheckpoint>;
    if (
      parsed.release === release &&
      parsed.guideId === guideId &&
      typeof parsed.stepIndex === "number" &&
      Number.isInteger(parsed.stepIndex) &&
      typeof parsed.stepId === "string"
    ) {
      return { release, guideId, stepIndex: parsed.stepIndex, stepId: parsed.stepId };
    }
    storage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function clearCheckpoint(): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
