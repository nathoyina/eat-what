"use client";

import {
  quietChipIdle,
  quietChipSelected,
  quietPrimaryCta,
} from "@/lib/quiet-ui";
import {
  TWO_SPOTS_COPY,
  WIDEN_REACH_LABEL,
  type RecoveryUi,
} from "@/lib/shortlist";

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
    <section className="bg-white py-2" aria-live="polite">
      <p className="text-sm font-medium text-ink sm:text-base">{ui.copy}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onWidenReach}
          disabled={!ui.canWidenReach}
          className={`${quietChipSelected} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {ui.widenLabel}
        </button>
        {ui.showAnyCuisine ? (
          <button
            type="button"
            onClick={onAnyCuisine}
            className={quietChipIdle}
          >
            {ui.anyCuisineLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function TwoSpotHint({
  canWidenReach,
  onWidenReach,
}: {
  canWidenReach: boolean;
  onWidenReach: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 pt-1 text-center">
      <p className="text-sm text-ink-muted">{TWO_SPOTS_COPY}</p>
      <button
        type="button"
        onClick={onWidenReach}
        disabled={!canWidenReach}
        className={`${quietChipIdle} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {WIDEN_REACH_LABEL}
      </button>
    </div>
  );
}

export function SingleSpotPanel({ ui, onTakeSpot, onWidenReach }: SingleProps) {
  return (
    <section className="bg-white py-2">
      <h2 className="text-lg font-semibold text-ink">{ui.heading}</h2>
      <p className="mt-1 text-sm text-ink-muted">{ui.body}</p>
      <button type="button" onClick={onTakeSpot} className={`${quietPrimaryCta} mt-5`}>
        {ui.takeLabel}
      </button>
      <div className="mt-4">
        <button
          type="button"
          onClick={onWidenReach}
          disabled={!ui.canWidenReach}
          className={`${quietChipIdle} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {ui.widenLabel}
        </button>
      </div>
    </section>
  );
}
