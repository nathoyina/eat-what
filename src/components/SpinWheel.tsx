"use client";

import type { Restaurant } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_H = 88;
const VISIBLE = 3;
const LOOPS = 6;
const SPIN_MS = 4200;

type Props = {
  candidates: Restaurant[];
  spinning: boolean;
  targetIndex: number | null;
  onSpinEnd: (winner: Restaurant) => void;
  onSpinRequest: () => void;
  disabled?: boolean;
};

export function SpinWheel({
  candidates,
  spinning,
  targetIndex,
  onSpinEnd,
  onSpinRequest,
  disabled,
}: Props) {
  const [offsetY, setOffsetY] = useState(() => centerOffset(0));
  const [animate, setAnimate] = useState(false);
  const spinningRef = useRef(false);
  const candidatesKey = candidates.map((c) => c.id).join("|");

  const strip = useMemo(() => {
    if (candidates.length === 0) return [];
    return Array.from({ length: LOOPS + 2 }, () => candidates).flat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatesKey]);

  // Reset when the candidate list changes (new search / reshuffle)
  useEffect(() => {
    spinningRef.current = false;
    setAnimate(false);
    setOffsetY(centerOffset(0));
  }, [candidatesKey]);

  useEffect(() => {
    if (!spinning || targetIndex == null || candidates.length === 0) return;
    if (spinningRef.current) return;
    spinningRef.current = true;

    const n = candidates.length;
    const prepIndex = targetIndex;
    const landIndex = LOOPS * n + targetIndex;

    setAnimate(false);
    setOffsetY(centerOffset(prepIndex));

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimate(true);
        setOffsetY(centerOffset(landIndex));
      });
    });

    const timeout = window.setTimeout(() => {
      spinningRef.current = false;
      onSpinEnd(candidates[targetIndex]);
    }, SPIN_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [spinning, targetIndex, candidates, onSpinEnd]);

  const viewportH = ITEM_H * VISIBLE;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-md">
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl border-2 border-lime bg-lime/5"
          style={{ top: ITEM_H, height: ITEM_H }}
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
          </span>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              transition: animate
                ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.08, 1)`
                : "none",
            }}
          >
            {strip.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                className="flex flex-col justify-center border-b border-border/60 px-5"
                style={{ height: ITEM_H }}
              >
                <p className="line-clamp-2 font-display text-base font-bold leading-snug text-ink sm:text-lg">
                  {r.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {r.cuisine}
                  {r.priceLevel != null
                    ? ` · ${"$".repeat(r.priceLevel)}`
                    : ""}
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

/** Offset so item at `index` sits in the middle row of the viewport. */
function centerOffset(index: number): number {
  return -(index * ITEM_H) + ITEM_H;
}
