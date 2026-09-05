import type { SavedSpot } from "./types";

const SAVED_KEY = "eat-what:saved";
const RECENT_AREAS_KEY = "eat-what:recent-areas";
const RECENT_AREAS_LIMIT = 5;
export const SAVED_EVENT = "eat-what:saved-change";

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

export function loadRecentAreas(): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(RECENT_AREAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string").slice(0, RECENT_AREAS_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function rememberArea(areaId: string): string[] {
  const next = [
    areaId,
    ...loadRecentAreas().filter((id) => id !== areaId),
  ].slice(0, RECENT_AREAS_LIMIT);
  if (canUseStorage()) {
    localStorage.setItem(RECENT_AREAS_KEY, JSON.stringify(next));
  }
  return next;
}

export function subscribeSaved(onChange: () => void) {
  window.addEventListener(SAVED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SAVED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
