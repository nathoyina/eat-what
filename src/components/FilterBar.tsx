"use client";

import { FILTER_CUISINES } from "@/lib/cuisine-types";
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

const PRICE_OPTIONS: { level: number; label: string }[] = [
  { level: 0, label: "Any" },
  { level: 1, label: "$" },
  { level: 2, label: "$$" },
  { level: 3, label: "$$$" },
  { level: 4, label: "$$$$" },
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
            Pick reach, price & cuisine, then find spots (uses 1 Google API call).
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
          Price <span className="text-coral">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {PRICE_OPTIONS.map(({ level, label }) => {
            const on = filters.priceLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ ...filters, priceLevel: level })}
                className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
                  on
                    ? "bg-lime text-white"
                    : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
                }`}
              >
                {label}
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
          Choose reach, price, and cuisine to continue.
        </p>
      )}
    </section>
  );
}
