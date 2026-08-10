"use client";

import type { Restaurant } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const COLORS = [
  "var(--wheel-1)",
  "var(--wheel-2)",
  "var(--wheel-3)",
  "var(--wheel-4)",
  "var(--wheel-5)",
  "var(--wheel-6)",
];

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
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const spinningRef = useRef(false);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!spinning || targetIndex == null || candidates.length === 0) return;
    if (spinningRef.current) return;
    spinningRef.current = true;

    const n = candidates.length;
    const slice = 360 / n;
    // Pointer at top; segment centers are at slice/2 + i*slice from 0 (east in SVG, but we rotate)
    // Wheel drawn with first segment starting at -90deg visually via rotation offset.
    // Segment i occupies [i*slice, (i+1)*slice) measured clockwise from top after our drawing.
    const segmentCenter = targetIndex * slice + slice / 2;
    const extraTurns = 4 + Math.floor(Math.random() * 2);
    const current = rotationRef.current % 360;
    // We want the wheel to stop so segmentCenter is under the top pointer.
    // Pointer is fixed at top. Wheel rotation R means point at angle θ on wheel moves to θ+R.
    // Top pointer reads angle (360 - R) % 360 on the wheel (if 0 is top).
    // So we need (360 - finalR) % 360 === segmentCenter  => finalR % 360 === (360 - segmentCenter) % 360
    const desiredMod = (360 - segmentCenter + 360) % 360;
    let delta = desiredMod - current;
    if (delta < 0) delta += 360;
    const finalRotation = rotationRef.current + extraTurns * 360 + delta;

    setRotation(finalRotation);

    const timeout = window.setTimeout(() => {
      spinningRef.current = false;
      onSpinEnd(candidates[targetIndex]);
    }, 4200);

    return () => clearTimeout(timeout);
  }, [spinning, targetIndex, candidates, onSpinEnd]);

  const n = Math.max(candidates.length, 1);
  const slice = 360 / n;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[320px] aspect-square">
        {/* Pointer */}
        <div
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-coral drop-shadow-md" />
        </div>
        <span className="sr-only">
          Prize wheel with {candidates.length} restaurants
        </span>

        <div
          className="absolute inset-2 rounded-full border border-border shadow-md"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4.2s cubic-bezier(0.12, 0.75, 0.08, 1)"
              : "none",
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full rounded-full">
            {candidates.length === 0 ? (
              <circle cx="50" cy="50" r="50" fill="var(--bg-soft)" />
            ) : (
              candidates.map((r, i) => {
                const start = -90 + i * slice;
                const end = start + slice;
                const path = describeSlice(50, 50, 50, start, end);
                const mid = start + slice / 2;
                const rad = (mid * Math.PI) / 180;
                const tx = 50 + Math.cos(rad) * 32;
                const ty = 50 + Math.sin(rad) * 32;
                const label =
                  r.name.length > 14 ? `${r.name.slice(0, 12)}…` : r.name;
                return (
                  <g key={r.id}>
                    <path d={path} fill={COLORS[i % COLORS.length]} />
                    <text
                      x={tx}
                      y={ty}
                      fill="#ffffff"
                      fontSize="3.2"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid + 90}, ${tx}, ${ty})`}
                    >
                      {label}
                    </text>
                  </g>
                );
              })
            )}
            <circle cx="50" cy="50" r="8" fill="var(--bg)" />
            <circle cx="50" cy="50" r="5" fill="var(--lime)" />
          </svg>
        </div>
      </div>

      <button
        type="button"
        onClick={onSpinRequest}
        disabled={disabled || spinning || candidates.length < 2}
        className="min-w-[200px] rounded-2xl bg-lime px-8 py-3.5 font-display text-lg font-bold text-white shadow-sm transition enabled:hover:bg-lime-deep enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {spinning ? "Spinning…" : "Spin the wheel"}
      </button>
    </div>
  );
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
