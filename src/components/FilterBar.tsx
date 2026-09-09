"use client";

import { FILTER_CUISINES, FILTER_PRICES } from "@/lib/cuisine-types";
import {
  FILTER_FOOD_KINDS,
  filtersComplete,
  WALK_RADIUS_OPTIONS,
  type Filters,
  type Reach,
  type WalkRadius,
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
  { id: "walk", label: "Walk", hint: "you pick" },
  { id: "short", label: "Short ride", hint: "~5 km" },
  { id: "anywhere", label: "Anywhere", hint: "area / all" },
];

function setReach(filters: Filters, reach: Reach): Filters {
  if (reach === "walk") {
    return {
      ...filters,
      reach,
      walkRadius: filters.walkRadius ?? "500",
    };
  }
  return { ...filters, reach, walkRadius: null };
}

function setWalkRadius(filters: Filters, walkRadius: WalkRadius): Filters {
  return { ...filters, reach: "walk", walkRadius };
}

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
  const walkHint =
    WALK_RADIUS_OPTIONS.find((o) => o.id === filters.walkRadius)?.label ??
    "you pick";

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Filters</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Pick meal, snack or drinks, then reach, price &amp; cuisine.
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
          Kind <span className="text-coral">*</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {FILTER_FOOD_KINDS.map((opt) => {
            const on = filters.kind === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...filters, kind: opt.id })}
                className={`rounded-xl px-2 py-2.5 text-center transition ${
                  on
                    ? "bg-mint text-white"
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
          Reach <span className="text-coral">*</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {REACH_OPTIONS.map((opt) => {
            const on = filters.reach === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(setReach(filters, opt.id))}
                className={`rounded-xl px-2 py-2.5 text-center transition ${
                  on
                    ? "bg-coral text-white"
                    : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
                }`}
              >
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className="block text-[11px] opacity-80">
                  {opt.id === "walk" ? walkHint : opt.hint}
                </span>
              </button>
            );
          })}
        </div>
        {filters.reach === "walk" && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {WALK_RADIUS_OPTIONS.map((opt) => {
              const on = filters.walkRadius === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange(setWalkRadius(filters, opt.id))}
                  className={`rounded-xl px-2 py-2 text-center text-sm font-bold transition ${
                    on
                      ? "bg-coral/90 text-white"
                      : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Price <span className="text-coral">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FILTER_PRICES.map((opt) => {
            const on = filters.price === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...filters, price: opt.id })}
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
        <p className="mt-2 text-xs text-ink-muted">
          $ bands from Google Maps. Stalls with no price listed count as $.
          SGD hints are rough meal-for-one estimates — not a verified menu price.
        </p>
      </div>

      {(filters.kind === "meal" || filters.kind == null) && (
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Cuisine <span className="text-coral">*</span>
          <span className="ml-1 font-medium normal-case tracking-normal">
            (pick one or more)
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, cuisines: ["any"] })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              filters.cuisines?.includes("any")
                ? "bg-mint text-white"
                : "border border-border bg-bg-soft text-ink-muted hover:text-ink"
            }`}
          >
            Any
          </button>
          {FILTER_CUISINES.map((cuisine) => {
            const selected = filters.cuisines ?? [];
            const on =
              !selected.includes("any") && selected.includes(cuisine);
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() => {
                  const current = filters.cuisines ?? [];
                  const withoutAny = current.filter((c) => c !== "any");
                  const next = withoutAny.includes(cuisine)
                    ? withoutAny.filter((c) => c !== cuisine)
                    : [...withoutAny, cuisine];
                  onChange({
                    ...filters,
                    cuisines: next.length > 0 ? next : null,
                  });
                }}
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
      )}

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
          {filters.kind === "snack" || filters.kind === "drinks"
            ? "Choose kind, reach, and price to continue."
            : "Choose kind, reach, price, and cuisine(s) to continue."}
        </p>
      )}
    </section>
  );
}
