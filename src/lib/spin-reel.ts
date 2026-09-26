import { unitRandom } from "./random";

/** Vertical reel math — keep the framed row and ResultCard on the same place. */

export const REEL_ITEM_H = 88;
export const REEL_VISIBLE = 3;
export const REEL_LOOPS = 6;

/** Offset so item at `index` sits in the middle (highlighted) row. */
export function reelCenterOffset(index: number, itemH = REEL_ITEM_H): number {
  return -(index * itemH) + itemH;
}

/**
 * Strip index to animate to so the framed row is `targetIndex`.
 *
 * Measured from `fromIndex` (the row currently in the frame), not from the
 * top of the strip. The reel always travels at least `loops` full cycles
 * before it settles, then lines up on `targetIndex`.
 *
 * Anchoring every spin at `loops * count + targetIndex` parks the second
 * spin in the same window as the first, so the reel only nudges by
 * `nextIndex - previousIndex` rows.
 */
export function reelLandIndex(
  count: number,
  targetIndex: number,
  loops = REEL_LOOPS,
  fromIndex = 0,
): number {
  if (count <= 0) return 0;
  const safeLoops = Math.max(1, loops);
  const safeTarget = ((targetIndex % count) + count) % count;
  const start = Number.isFinite(fromIndex) ? fromIndex : 0;
  const minIndex = start + safeLoops * count;
  const mod = ((minIndex % count) + count) % count;
  const delta = (safeTarget - mod + count) % count;
  return minIndex + delta;
}

export type SpinCandidate = { id: string };

/**
 * Choose the winner before any animation. Travel distance must not decide it.
 * Pool of 2 alternates. Pool of 3+ never repeats `excludeId`.
 */
export function pickSpinWinner<T extends SpinCandidate>(
  candidates: readonly T[],
  opts?: { excludeId?: string | null; random?: () => number },
): { winner: T; index: number } | null {
  const n = candidates.length;
  if (n === 0) return null;

  const excludeId = opts?.excludeId ?? null;
  let indexes = candidates.map((_, index) => index);
  if (excludeId && n >= 2) {
    const without = indexes.filter((index) => candidates[index]?.id !== excludeId);
    if (without.length > 0 && without.length < n) indexes = without;
  }

  const random = opts?.random ?? Math.random;
  const choice =
    indexes[Math.floor(unitRandom(random) * indexes.length)] ?? indexes[0] ?? 0;
  const winner = candidates[choice];
  if (!winner) return null;
  return { winner, index: choice };
}

export function reelItemAt<T>(candidates: T[], stripIndex: number): T | null {
  const n = candidates.length;
  if (n === 0) return null;
  return candidates[((stripIndex % n) + n) % n] ?? null;
}

/**
 * Which candidate sits in the highlight frame when the reel is idle.
 * Winner id wins so a remount / snap-back cannot show a different name
 * than ResultCard.
 */
export function framedCandidateIndex(
  candidates: { id: string }[],
  winnerId: string | null | undefined,
): number {
  if (winnerId) {
    const i = candidates.findIndex((c) => c.id === winnerId);
    if (i >= 0) return i;
  }
  return 0;
}

/**
 * Strip index shown in the highlight frame.
 * After settle, prefer the looped copy of the ResultCard winner so we don't
 * rewind; if targetIndex drifted, snap to the winner's slot instead.
 */
export function reelDisplayIndex(opts: {
  candidates: { id: string }[];
  targetIndex: number | null;
  spinning: boolean;
  winnerId: string | null | undefined;
  /** Strip index already framed. Respins travel forward from here. */
  fromIndex?: number;
}): number {
  const { candidates, targetIndex, spinning, winnerId } = opts;
  const n = candidates.length;
  if (n === 0) return 0;
  const fromIndex = opts.fromIndex ?? 0;

  if (spinning && targetIndex != null) {
    return reelLandIndex(n, targetIndex, REEL_LOOPS, fromIndex);
  }

  if (winnerId) {
    if (reelItemAt(candidates, fromIndex)?.id === winnerId) return fromIndex;
    if (targetIndex != null && candidates[targetIndex]?.id === winnerId) {
      return reelLandIndex(n, targetIndex, REEL_LOOPS, fromIndex);
    }
    return framedCandidateIndex(candidates, winnerId);
  }

  if (fromIndex === 0) return 0;
  return ((fromIndex % n) + n) % n;
}
