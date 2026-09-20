"use client";

import type { Restaurant } from "@/lib/types";
import { reelPriceSymbols } from "@/lib/types";
import {
  REEL_ITEM_H,
  REEL_LOOPS,
  REEL_VISIBLE,
  reelCenterOffset,
  reelDisplayIndex,
} from "@/lib/spin-reel";
import { useEffect, useMemo } from "react";

const SPIN_MS = 4200;

type Props = {
  candidates: Restaurant[];
  /** Settled ResultCard place — idle frame must show this row. */
  winner?: Restaurant | null;
  spinning: boolean;
  targetIndex: number | null;
  onSpinEnd: (winner: Restaurant) => void;
  onSpinRequest: () => void;
  disabled?: boolean;
};

function reelSubtitle(r: Restaurant): string {
  const price = reelPriceSymbols(r.priceLevel);
  return price ? `${r.cuisine} · ${price}` : r.cuisine;
}

export function SpinWheel({
  candidates,
  winner = null,
  spinning,
  targetIndex,
  onSpinEnd,
  onSpinRequest,
  disabled,
}: Props) {
  const candidatesKey = candidates.map((c) => c.id).join("|");
  const winnerId = winner?.id ?? null;
  const n = candidates.length;

  const strip = useMemo(() => {
    if (n === 0) return [];
    return Array.from({ length: REEL_LOOPS + 2 }, () => candidates).flat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatesKey]);

  const displayIndex = reelDisplayIndex({
    candidates,
    targetIndex,
    spinning,
    winnerId,
  });
  const offsetY = reelCenterOffset(displayIndex);

  useEffect(() => {
    if (!spinning || targetIndex == null || n === 0) return;
    const chosen = candidates[targetIndex];
    if (!chosen) return;
    const timeout = window.setTimeout(() => {
      onSpinEnd(chosen);
    }, SPIN_MS);
    return () => window.clearTimeout(timeout);
  }, [spinning, targetIndex, n, candidates, onSpinEnd]);

  const viewportH = REEL_ITEM_H * REEL_VISIBLE;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-md">
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl border-2 border-lime bg-lime/5"
          style={{ top: REEL_ITEM_H, height: REEL_ITEM_H }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 z-20 -translate-y-1/2"
          aria-hidden
        >
          <div className="h-0 w-0 border-y-[10px] border-l-[14px] border-y-transparent border-l-coral" />
        </div>
        <div
          className="pointer-events-none absolute right-0 top-1/2 z-20 -translate-y-1/2"
          aria-hidden
        >
          <div className="h-0 w-0 border-y-[10px] border-r-[14px] border-y-transparent border-r-coral" />
        </div>

        <div
          className="overflow-hidden rounded-3xl border border-border bg-bg-soft shadow-sm"
          style={{ height: viewportH }}
        >
          <span className="sr-only">
            Vertical spin reel with {candidates.length} restaurants
            {winner ? `, landed on ${winner.name}` : ""}
          </span>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              transition: spinning
                ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.08, 1)`
                : "none",
            }}
          >
            {strip.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                className="flex flex-col justify-center border-b border-border/60 px-5"
                style={{ height: REEL_ITEM_H }}
              >
                <p className="line-clamp-2 font-display text-base font-bold leading-snug text-ink sm:text-lg">
                  {r.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {reelSubtitle(r)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-3xl bg-gradient-to-b from-bg-soft to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-3xl bg-gradient-to-t from-bg-soft to-transparent"
          aria-hidden
        />
      </div>

      <button
        type="button"
        onClick={onSpinRequest}
        disabled={disabled || spinning || candidates.length < 2}
        className="min-w-[200px] rounded-2xl bg-lime px-8 py-3.5 font-display text-lg font-bold text-white shadow-sm transition enabled:hover:bg-lime-deep enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>
    </div>
  );
}
