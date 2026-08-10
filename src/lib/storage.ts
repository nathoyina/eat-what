import { emptyProgress } from "./badges";
import type { BadgeProgress, SavedSpot } from "./types";

const SAVED_KEY = "eat-what:saved";
const BADGES_KEY = "eat-what:badges";
const SESSION_SPINS_KEY = "eat-what:session-spins";
export const SAVED_EVENT = "eat-what:saved-change";
export const BADGES_EVENT = "eat-what:badges-change";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function emit(event: string) {
  if (canUseStorage()) {
    window.dispatchEvent(new Event(event));
  }
}

export function loadSaved(): SavedSpot[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedSpot[]) : [];
  } catch {
    return [];
  }
}

export function saveSpot(spot: SavedSpot): SavedSpot[] {
  const current = loadSaved();
  if (current.some((s) => s.id === spot.id)) return current;
  const next = [spot, ...current];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  emit(SAVED_EVENT);
  return next;
}

export function removeSaved(id: string): SavedSpot[] {
  const next = loadSaved().filter((s) => s.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  emit(SAVED_EVENT);
  return next;
}

export function isSaved(id: string): boolean {
  return loadSaved().some((s) => s.id === id);
}

export function loadBadgeProgress(): BadgeProgress {
  if (!canUseStorage()) return emptyProgress();
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    const base = raw
      ? ({
          ...emptyProgress(),
          ...(JSON.parse(raw) as BadgeProgress),
        } as BadgeProgress)
      : emptyProgress();
    const sessionSpins = Number(
      sessionStorage.getItem(SESSION_SPINS_KEY) || "0",
    );
    return { ...base, sessionSpins };
  } catch {
    return emptyProgress();
  }
}

export function saveBadgeProgress(progress: BadgeProgress): void {
  if (!canUseStorage()) return;
  const { sessionSpins, ...persisted } = progress;
  sessionStorage.setItem(SESSION_SPINS_KEY, String(sessionSpins));
  localStorage.setItem(
    BADGES_KEY,
    JSON.stringify({ ...persisted, sessionSpins: 0 }),
  );
  emit(BADGES_EVENT);
}

export function subscribeSaved(onChange: () => void) {
  window.addEventListener(SAVED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SAVED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function subscribeBadges(onChange: () => void) {
  window.addEventListener(BADGES_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(BADGES_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
