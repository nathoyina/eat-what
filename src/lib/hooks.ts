"use client";

import { emptyProgress } from "@/lib/badges";
import {
  loadBadgeProgress,
  loadSaved,
  subscribeBadges,
  subscribeSaved,
} from "@/lib/storage";
import type { BadgeProgress, SavedSpot } from "@/lib/types";
import { useMemo, useSyncExternalStore } from "react";

const EMPTY_SAVED: SavedSpot[] = [];
const EMPTY_BADGES: BadgeProgress = emptyProgress();

function getServerSaved(): SavedSpot[] {
  return EMPTY_SAVED;
}

function getServerBadges(): BadgeProgress {
  return EMPTY_BADGES;
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

let badgesCache: BadgeProgress | null = null;
let badgesCacheKey: string | null = null;

function getBadgesSnapshot(): BadgeProgress {
  if (typeof window === "undefined") return EMPTY_BADGES;
  const raw = localStorage.getItem("eat-what:badges");
  const session = sessionStorage.getItem("eat-what:session-spins") || "0";
  const key = `${raw ?? ""}|${session}`;
  if (key === badgesCacheKey && badgesCache) return badgesCache;
  badgesCacheKey = key;
  badgesCache = loadBadgeProgress();
  return badgesCache;
}

export function useSavedSpots() {
  return useSyncExternalStore(
    subscribeSaved,
    getSavedSnapshot,
    getServerSaved,
  );
}

export function useBadgeProgress() {
  return useSyncExternalStore(
    subscribeBadges,
    getBadgesSnapshot,
    getServerBadges,
  );
}

export function useSavedIdSet() {
  const spots = useSavedSpots();
  return useMemo(() => new Set(spots.map((s) => s.id)), [spots]);
}
