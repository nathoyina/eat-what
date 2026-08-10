import type { BadgeId, BadgeProgress, Restaurant } from "./types";

export type BadgeDef = {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
};

export const BADGES: BadgeDef[] = [
  {
    id: "first-spin",
    name: "First Spin",
    description: "Complete your first spin",
    icon: "🎡",
  },
  {
    id: "indecisive",
    name: "Indecisive",
    description: "Spin 5 times in one session",
    icon: "🌀",
  },
  {
    id: "globe-trotter",
    name: "Globe Trotter",
    description: "Land on 3 different cuisines",
    icon: "🌏",
  },
  {
    id: "budget-hero",
    name: "Budget Hero",
    description: "Win a $ spot",
    icon: "💸",
  },
  {
    id: "area-hopper",
    name: "Area Hopper",
    description: "Spin from 3 different areas",
    icon: "🗺️",
  },
  {
    id: "list-keeper",
    name: "List Keeper",
    description: "Save 3 spots",
    icon: "⭐",
  },
];

export function emptyProgress(): BadgeProgress {
  return {
    unlocked: [],
    totalSpins: 0,
    sessionSpins: 0,
    cuisinesLanded: [],
    areasSpun: [],
    savedCount: 0,
  };
}

export function evaluateSpinBadges(
  progress: BadgeProgress,
  winner: Restaurant,
  areaId: string | null,
): { progress: BadgeProgress; newlyUnlocked: BadgeId[] } {
  const next: BadgeProgress = {
    ...progress,
    unlocked: [...progress.unlocked],
    totalSpins: progress.totalSpins + 1,
    sessionSpins: progress.sessionSpins + 1,
    cuisinesLanded: uniquePush(progress.cuisinesLanded, winner.cuisine),
    areasSpun: areaId
      ? uniquePush(progress.areasSpun, areaId)
      : [...progress.areasSpun],
  };

  const newlyUnlocked: BadgeId[] = [];

  const tryUnlock = (id: BadgeId, condition: boolean) => {
    if (condition && !next.unlocked.includes(id)) {
      next.unlocked.push(id);
      newlyUnlocked.push(id);
    }
  };

  tryUnlock("first-spin", next.totalSpins >= 1);
  tryUnlock("indecisive", next.sessionSpins >= 5);
  tryUnlock("globe-trotter", next.cuisinesLanded.length >= 3);
  tryUnlock("budget-hero", winner.priceLevel === 1);
  tryUnlock("area-hopper", next.areasSpun.length >= 3);

  return { progress: next, newlyUnlocked };
}

export function evaluateSaveBadges(
  progress: BadgeProgress,
  savedCount: number,
): { progress: BadgeProgress; newlyUnlocked: BadgeId[] } {
  const next: BadgeProgress = {
    ...progress,
    unlocked: [...progress.unlocked],
    savedCount,
  };
  const newlyUnlocked: BadgeId[] = [];
  if (savedCount >= 3 && !next.unlocked.includes("list-keeper")) {
    next.unlocked.push("list-keeper");
    newlyUnlocked.push("list-keeper");
  }
  return { progress: next, newlyUnlocked };
}

function uniquePush(list: string[], value: string): string[] {
  if (list.includes(value)) return [...list];
  return [...list, value];
}

export function getBadge(id: BadgeId): BadgeDef {
  return BADGES.find((b) => b.id === id)!;
}
