/** Vertical reel math — keep the framed row and ResultCard on the same place. */

export const REEL_ITEM_H = 88;
export const REEL_VISIBLE = 3;
export const REEL_LOOPS = 6;

/** Offset so item at `index` sits in the middle (highlighted) row. */
export function reelCenterOffset(index: number, itemH = REEL_ITEM_H): number {
  return -(index * itemH) + itemH;
}

/** Strip index of the copy we animate to, same restaurant as `targetIndex`. */
export function reelLandIndex(
  count: number,
  targetIndex: number,
  loops = REEL_LOOPS,
): number {
  return loops * count + targetIndex;
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
}): number {
  const { candidates, targetIndex, spinning, winnerId } = opts;
  const n = candidates.length;
  if (n === 0) return 0;

  if (winnerId) {
    const winnerSlot = framedCandidateIndex(candidates, winnerId);
    if (
      targetIndex != null &&
      candidates[targetIndex]?.id === winnerId
    ) {
      return reelLandIndex(n, targetIndex);
    }
    return winnerSlot;
  }

  if (spinning && targetIndex != null) {
    return reelLandIndex(n, targetIndex);
  }

  return 0;
}
