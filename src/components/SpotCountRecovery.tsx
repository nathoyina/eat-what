"use client";

import type { RecoveryUi } from "@/lib/shortlist";

type EmptyProps = {
  ui: Extract<RecoveryUi, { variant: "empty" }>;
  onWidenReach: () => void;
  onAnyCuisine: () => void;
};

type SingleProps = {
  ui: Extract<RecoveryUi, { variant: "single" }>;
  onTakeSpot: () => void;
  onWidenReach: () => void;
};

export function EmptySpotsPanel({ ui, onWidenReach, onAnyCuisine }: EmptyProps) {
  return (
    <section
      className="rounded-2xl border border-border bg-bg-soft px-4 py-6 text-center"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-ink sm:text-base">{ui.copy}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onWidenReach}
          disabled={!ui.canWidenReach}
          className="rounded-full bg-lime px-4 py-2 text-sm font-bold text-white transition enabled:hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ui.widenLabel}
        </button>
        {ui.showAnyCuisine ? (
          <button
            type="button"
            onClick={onAnyCuisine}
            className="rounded-full border border-border bg-bg-elevated px-4 py-2 text-sm font-bold text-ink transition hover:border-mint/40 hover:bg-mint/5"
          >
            {ui.anyCuisineLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function SingleSpotPanel({ ui, onTakeSpot, onWidenReach }: SingleProps) {
  return (
    <section className="rounded-2xl border border-border bg-bg-soft px-4 py-6 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">{ui.heading}</h2>
      <p className="mt-1 text-sm text-ink-muted">{ui.body}</p>
      <button
        type="button"
        onClick={onTakeSpot}
        className="mt-5 rounded-2xl bg-lime px-8 py-3 font-display text-lg font-bold text-white shadow-sm transition hover:bg-lime-deep"
      >
        {ui.takeLabel}
      </button>
      <div className="mt-3">
        <button
          type="button"
          onClick={onWidenReach}
          disabled={!ui.canWidenReach}
          className="text-sm font-semibold text-ink-muted underline-offset-2 transition enabled:hover:text-ink enabled:hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ui.widenLabel}
        </button>
      </div>
    </section>
  );
}
