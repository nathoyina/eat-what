"use client";

import { FILTER_CUISINES, FILTER_PRICES } from "@/lib/cuisine-types";
import {
  quietChipArea,
  quietChipIdle,
  quietChipSelected,
  quietChipWalkSelected,
  quietPrimaryCta,
} from "@/lib/quiet-ui";
import {
  FILTER_FOOD_KINDS,
  filtersComplete,
  WALK_RADIUS_OPTIONS,
  type Filters,
  type Reach,
  type WalkRadius,
} from "@/lib/types";
import type { ReactNode } from "react";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  loading?: boolean;
  canSearch: boolean;
  onSearch: () => void;
  areaLabel?: string | null;
  onChangeArea?: () => void;
};

const REACH_OPTIONS: { id: Reach; label: string }[] = [
  { id: "walk", label: "Walk" },
  { id: "short", label: "Short ride" },
  { id: "anywhere", label: "Anywhere" },
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

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <p className="w-20 shrink-0 pt-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
  loading,
  canSearch,
  onSearch,
  areaLabel,
  onChangeArea,
}: Props) {
  const ready = filtersComplete(filters);

  return (
    <section className="space-y-6 bg-white">
      {areaLabel ? (
        <button
          type="button"
          onClick={onChangeArea}
          className={quietChipArea}
        >
          {areaLabel}
        </button>
      ) : null}

      <h2 className="text-lg font-semibold text-ink">Filters</h2>

      <div className="space-y-5">
        <FilterRow label="Kind">
          <div className="flex flex-wrap gap-2">
            {FILTER_FOOD_KINDS.map((opt) => {
              const on = filters.kind === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...filters, kind: opt.id })}
                  className={on ? quietChipSelected : quietChipIdle}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterRow>

        <FilterRow label="Reach">
          <div className="flex flex-wrap gap-2">
            {REACH_OPTIONS.map((opt) => {
              const on = filters.reach === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange(setReach(filters, opt.id))}
                  className={on ? quietChipSelected : quietChipIdle}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {filters.reach === "walk" && (
            <div className="flex flex-wrap gap-2">
              {WALK_RADIUS_OPTIONS.map((opt) => {
                const on = filters.walkRadius === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(setWalkRadius(filters, opt.id))}
                    className={on ? quietChipWalkSelected : quietChipIdle}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </FilterRow>

        <FilterRow label="Price">
          <div className="flex flex-wrap gap-2">
            {FILTER_PRICES.map((opt) => {
              const on = filters.price === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...filters, price: opt.id })}
                  className={on ? quietChipSelected : quietChipIdle}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterRow>

        {(filters.kind === "meal" || filters.kind == null) && (
          <FilterRow label="Cuisine">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...filters, cuisines: ["any"] })}
                className={
                  filters.cuisines?.includes("any")
                    ? quietChipSelected
                    : quietChipIdle
                }
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
                    className={on ? quietChipSelected : quietChipIdle}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </FilterRow>
        )}
      </div>

      <button
        type="button"
        onClick={onSearch}
        disabled={!canSearch || !ready || loading}
        className={quietPrimaryCta}
      >
        {loading ? "Finding spots…" : "Find spots"}
      </button>

      {!ready && (
        <p className="text-center text-sm text-ink-muted">
          {filters.kind === "snack" || filters.kind === "drinks"
            ? "Choose kind, reach, and price."
            : "Choose kind, reach, price, and cuisine."}
        </p>
      )}
    </section>
  );
}
