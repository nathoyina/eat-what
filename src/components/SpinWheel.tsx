"use client";

import type { Restaurant } from "@/lib/types";
import { reelPriceSymbols } from "@/lib/types";
import { quietPrimaryCtaCompact, quietReelFrame, quietReelViewport } from "@/lib/quiet-ui";
import {
  REEL_ITEM_H,
  REEL_LOOPS,
  REEL_VISIBLE,
  reelCenterOffset,
  reelDisplayIndex,
  reelLandIndex,
} from "@/lib/spin-reel";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const SPIN_MS = 4200;

type Props = {
  candidates: Restaurant[];
  /** Settled ResultCard place — idle frame must show this row. */
  winner?: Restaurant | null;
  spinning: boolean;
  targetIndex: number | null;
  /** Increments on every spin request so a repeat index still travels forward. */
  spinId: number;
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
  spinId,
  onSpinEnd,
  onSpinRequest,
  disabled,
}: Props) {
  const candidatesKey = candidates.map((c) => c.id).join("|");
  const winnerId = winner?.id ?? null;
  const n = candidates.length;

  const [shown, setShown] = useState(0);
  const [animate, setAnimate] = useState(false);
  const shownRef = useRef(0);
  const handledSpinRef = useRef<number | null>(null);
  const listKeyRef = useRef(candidatesKey);

  useLayoutEffect(() => {
    if (listKeyRef.current !== candidatesKey) {
      listKeyRef.current = candidatesKey;
      handledSpinRef.current = null;
      shownRef.current = 0;
      setShown(0);
      setAnimate(false);
    }

    if (n > 0 && spinning && targetIndex != null) {
      if (handledSpinRef.current === spinId) return;
      handledSpinRef.current = spinId;
      const land = reelLandIndex(n, targetIndex, REEL_LOOPS, shownRef.current);
      shownRef.current = land;
      setShown(land);
      setAnimate(true);
      return;
    }

    setAnimate(false);
    if (n === 0) {
      shownRef.current = 0;
      setShown(0);
      return;
    }
    const idle = reelDisplayIndex({
      candidates,
      targetIndex,
      spinning: false,
      winnerId,
      fromIndex: shownRef.current,
    });
    shownRef.current = idle;
    setShown(idle);
  }, [candidates, candidatesKey, n, spinId, spinning, targetIndex, winnerId]);

  const displayIndex = shown;
  const copies =
    n === 0
      ? 0
      : Math.max(REEL_LOOPS + 2, Math.ceil((displayIndex + 2) / n) + 1);

  const strip = useMemo(() => {
    if (n === 0) return [];
    return Array.from({ length: copies }, () => candidates).flat();
    // Strip contents follow the candidate ids; `copies` grows only to fit the land index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatesKey, copies]);

  const offsetY = reelCenterOffset(displayIndex);

  useEffect(() => {
    if (!spinning || targetIndex == null || n === 0) return;
    const chosen = candidates[targetIndex];
    if (!chosen) return;
    const timeout = window.setTimeout(() => {
      onSpinEnd(chosen);
    }, SPIN_MS);
    return () => window.clearTimeout(timeout);
  }, [spinning, targetIndex, spinId, n, candidates, onSpinEnd]);

  const viewportH = REEL_ITEM_H * REEL_VISIBLE;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-md">
        <div
          className={quietReelFrame}
          style={{ top: REEL_ITEM_H, height: REEL_ITEM_H }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 z-20 -translate-y-1/2"
          aria-hidden
        >
          <div className="h-0 w-0 border-y-[10px] border-l-[14px] border-y-transparent border-l-ink" />
        </div>
        <div
          className="pointer-events-none absolute right-0 top-1/2 z-20 -translate-y-1/2"
          aria-hidden
        >
          <div className="h-0 w-0 border-y-[10px] border-r-[14px] border-y-transparent border-r-ink" />
        </div>

        <div className={quietReelViewport} style={{ height: viewportH }}>
          <span className="sr-only">
            Vertical spin reel with {candidates.length} restaurants
            {winner ? `, landed on ${winner.name}` : ""}
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
                className="flex flex-col justify-center border-b border-border/60 bg-white px-5"
                style={{ height: REEL_ITEM_H }}
              >
                <p className="line-clamp-2 text-base font-bold leading-snug text-ink sm:text-lg">
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
          className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-3xl bg-gradient-to-b from-white to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-3xl bg-gradient-to-t from-white to-transparent"
          aria-hidden
        />
      </div>

      <button
        type="button"
        onClick={onSpinRequest}
        disabled={disabled || spinning || candidates.length < 2}
        className={quietPrimaryCtaCompact}
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>
    </div>
  );
}
