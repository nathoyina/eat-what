"use client";

import { FILTER_CUISINES, FILTER_VENUES } from "@/lib/cuisine-types";
import {
  filtersComplete,
  type Filters,
  type Reach,
} from "@/lib/types";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  candidateCount: number;
  loading?: boolean;
  canSearch: boolean;
  onSearch: () => void;
  hasSearched: boolean;
};

const REACH_OPTIONS: { id: Reach; label: string; hint: string }[] = [
  { id: "walk", label: "Walk", hint: "~1.5 km" },
  { id: "short", label: "Short ride", hint: "~5 km" },
  { id: "anywhere", label: "Anywhere", hint: "area / all" },
];

export function FilterBar({
  filters,
  onChange,
  candidateCount,
  loading,
  canSearch,
  onSearch,
  hasSearched,
}: Props) {
  const ready = filtersComplete(filters);

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Filters</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Pick reach, spot type & cuisine, then find spots.
          </p>
        </div>
        {hasSearched && (
          <p className="shrink-0 text-sm font-bold text-mint">
            {loading ? "…" : candidateCount} spot{candidateCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Reach <span className="text-coral">*</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {REACH_OPTIONS.map((opt) => {
            const on = filters.reach === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...filters, reach: opt.id })}
                className={`rounded-xl px-2 py-2.5 text-center transition ${
                  on
                    ? "bg-coral text-white"
                    : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
                }`}
              >
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className="block text-[11px] opacity-80">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Spot type <span className="text-coral">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FILTER_VENUES.map((opt) => {
            const on = filters.venueType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...filters, venueType: opt.id })}
                className={`rounded-xl px-2 py-2.5 text-center transition ${
                  on
                    ? "bg-lime text-white"
                    : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
                }`}
              >
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className="block text-[11px] opacity-80">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Cuisine <span className="text-coral">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, cuisine: "any" })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              filters.cuisine === "any"
                ? "bg-mint text-white"
                : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
            }`}
          >
            Any
          </button>
          {FILTER_CUISINES.map((cuisine) => {
            const on = filters.cuisine === cuisine;
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() => onChange({ ...filters, cuisine })}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  on
                    ? "bg-mint text-white"
                    : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
        {filters.venueType === "hawker" && filters.cuisine !== "any" && (
          <p className="mt-2 text-xs text-ink-muted">
            Hawker search finds food centres nearby — cuisine filter is ignored
            for hawkers.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onSearch}
        disabled={!canSearch || !ready || loading}
        className="w-full rounded-2xl bg-lime px-6 py-3.5 font-display text-lg font-bold text-white shadow-sm transition enabled:hover:bg-lime-deep enabled:hover:scale-[1.01] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Finding spots…" : hasSearched ? "Find spots again" : "Find spots"}
      </button>

      {!ready && (
        <p className="text-center text-sm text-ink-muted">
          Choose reach, spot type, and cuisine to continue.
        </p>
      )}
    </section>
  );
}
