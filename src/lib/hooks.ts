"use client";

import { loadSaved, subscribeSaved } from "@/lib/storage";
import type { SavedSpot } from "@/lib/types";
import { useMemo, useSyncExternalStore } from "react";

const EMPTY_SAVED: SavedSpot[] = [];

function getServerSaved(): SavedSpot[] {
  return EMPTY_SAVED;
}

let savedCache: SavedSpot[] | null = null;
let savedCacheRaw: string | null = null;

function getSavedSnapshot(): SavedSpot[] {
  const raw =
    typeof window !== "undefined"
      ? localStorage.getItem("eat-what:saved")
      : null;
  if (raw === savedCacheRaw && savedCache) return savedCache;
  savedCacheRaw = raw;
  savedCache = loadSaved();
  return savedCache;
}

export function useSavedSpots() {
  return useSyncExternalStore(
    subscribeSaved,
    getSavedSnapshot,
    getServerSaved,
  );
}

export function useSavedIdSet() {
  const spots = useSavedSpots();
  return useMemo(() => new Set(spots.map((s) => s.id)), [spots]);
}
