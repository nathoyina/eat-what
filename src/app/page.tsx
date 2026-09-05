"use client";

import { FilterBar } from "@/components/FilterBar";
import { LocationPicker } from "@/components/LocationPicker";
import { ResultCard } from "@/components/ResultCard";
import { SpinWheel } from "@/components/SpinWheel";
import { useSavedIdSet } from "@/lib/hooks";
import { pickPun } from "@/lib/puns";
import {
  areaName,
  filterRestaurants,
  pickWheelCandidates,
} from "@/lib/restaurants";
import { saveSpot } from "@/lib/storage";
import type { Filters, LocationMode, Restaurant } from "@/lib/types";
import { filtersComplete } from "@/lib/types";
import { formatQuotaLabel } from "@/lib/quota-label";
import { usePlaces, type SearchRequest } from "@/lib/usePlaces";
import { useCallback, useMemo, useState } from "react";

const defaultFilters: Filters = {
  cuisines: null,
  price: null,
  reach: null,
  walkRadius: null,
};

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [location, setLocation] = useState<LocationMode>({ type: "none" });
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(
    null,
  );
  const [reshuffle, setReshuffle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [pun, setPun] = useState("");
  const savedIds = useSavedIdSet();

  const placesState = usePlaces(searchRequest);

  const pool = useMemo(
    () =>
      !searchRequest
        ? []
        : filterRestaurants(
            searchRequest.location,
            searchRequest.filters,
            placesState.catalog,
          ),
    [searchRequest, placesState.catalog],
  );

  const poolKey = useMemo(() => pool.map((r) => r.id).join("|"), [pool]);

  const candidates = useMemo(() => {
    if (pool.length < 2) return [];
    return pickWheelCandidates(pool, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey, reshuffle]);

  const clearResults = () => {
    setSearchRequest(null);
    setWinner(null);
    setTargetIndex(null);
    setSpinning(false);
    setReshuffle((n) => n + 1);
  };

  const handleLocationChange = (loc: LocationMode) => {
    setLocation(loc);
    clearResults();
  };

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
    clearResults();
  };

  const handleFindSpots = () => {
    if (location.type === "none" || !filtersComplete(filters)) return;
    setSearchRequest({
      location,
      filters: {
        cuisines: filters.cuisines,
        price: filters.price,
        reach: filters.reach,
        walkRadius: filters.walkRadius,
      },
      token: Date.now(),
    });
    setWinner(null);
    setTargetIndex(null);
    setSpinning(false);
    setReshuffle((n) => n + 1);
  };

  const handleSpinRequest = () => {
    if (candidates.length < 2 || spinning) return;
    const idx = Math.floor(Math.random() * candidates.length);
    setWinner(null);
    setTargetIndex(idx);
    setSpinning(true);
  };

  const handleSpinEnd = useCallback(
    (rest: Restaurant) => {
      setSpinning(false);
      setWinner(rest);
      setPun(pickPun(rest.cuisine));
    },
    [],
  );

  const handleSave = () => {
    if (!winner) return;
    saveSpot({
      id: winner.id,
      placeId: winner.placeId,
      name: winner.name,
      cuisine: winner.cuisine,
      priceLevel: winner.priceLevel,
      priceRangeText: winner.priceRangeText,
      address: winner.address,
      googleMapsQuery: winner.googleMapsQuery,
      googleMapsUri: winner.googleMapsUri,
      savedAt: new Date().toISOString(),
    });
  };

  const handleSpinAgain = () => {
    setWinner(null);
    setTargetIndex(null);
    setReshuffle((n) => n + 1);
  };

  if (!started) {
    return (
      <div className="relative isolate min-h-[calc(100dvh-57px)] overflow-hidden">
        <div
          className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-lime/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-0 -z-10 h-80 w-80 rounded-full bg-coral/10 blur-3xl"
          aria-hidden
        />

        <div className="mx-auto grid min-h-[calc(100dvh-57px)] max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-[1fr_0.9fr] md:px-8 lg:gap-20">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">
              <span className="h-2 w-2 rounded-full bg-lime" aria-hidden />
              Dinner, decided
            </div>
            <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-[-0.04em] text-ink sm:text-7xl lg:text-8xl">
              Eat What<span className="text-coral">?</span>
            </h1>
            <p className="mt-6 max-w-lg font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
              Stop debating. Start{" "}
              <span className="text-lime">spinning.</span>
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
              Pick a neighbourhood, cuisine and budget. We&apos;ll find real
              nearby spots and let the reel settle dinner.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="group inline-flex items-center gap-3 rounded-2xl bg-lime px-7 py-3.5 font-display text-lg font-bold text-white shadow-[0_10px_30px_-12px_rgba(22,163,74,0.8)] transition hover:-translate-y-0.5 hover:bg-lime-deep active:translate-y-0"
              >
                Find my makan
                <span
                  className="text-xl transition-transform group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </button>
              <span className="text-sm font-semibold text-ink-muted">
                No signup needed
              </span>
            </div>

            <div className="mt-10 flex gap-8 border-t border-border pt-5">
              <div>
                <p className="font-display text-2xl font-bold text-ink">74</p>
                <p className="text-xs font-semibold text-ink-muted">
                  SG areas
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-ink">Live</p>
                <p className="text-xs font-semibold text-ink-muted">
                  Google places
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-ink">1</p>
                <p className="text-xs font-semibold text-ink-muted">
                  final answer
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div
              className="absolute -inset-5 -z-10 rotate-3 rounded-[2.5rem] bg-coral/10"
              aria-hidden
            />
            <div
              className="absolute -inset-3 -z-10 -rotate-2 rounded-[2.25rem] bg-lime/10"
              aria-hidden
            />
            <div className="rounded-[2rem] border border-border bg-bg-elevated p-5 shadow-[0_24px_70px_-30px_rgba(28,25,23,0.35)] sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                    Tonight&apos;s picks
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">
                    Spin reel preview
                  </p>
                </div>
                <span className="rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral">
                  Preview
                </span>
              </div>

              <div
                className="relative"
                aria-label="Preview of the restaurant spin reel"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-[88px] z-10 h-[88px] rounded-2xl border-2 border-lime bg-lime/5"
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

                <div className="overflow-hidden rounded-3xl border border-border bg-bg-soft shadow-inner">
                  {[
                    ["The Ramen Stall", "Japanese · $$"],
                    ["Maxwell Food Centre", "Hawker · $"],
                    ["The Coconut Club", "Malay · $$"],
                  ].map(([name, detail]) => (
                    <div
                      key={name}
                      className="flex h-[88px] flex-col justify-center border-b border-border/60 px-6 last:border-b-0"
                    >
                      <p className="font-display text-lg font-bold leading-snug text-ink">
                        {name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>
                    </div>
                  ))}
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

              <div className="mt-6 flex items-center justify-center">
                <div className="rounded-2xl bg-lime px-10 py-3 font-display text-lg font-bold text-white shadow-sm">
                  Spin
                </div>
              </div>
            </div>
            <div
              className="absolute -bottom-5 -right-2 rotate-6 rounded-2xl bg-coral px-4 py-2 font-display text-sm font-bold text-white shadow-lg sm:-right-6"
              aria-hidden
            >
              Confirm can eat! ✦
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasSearched = searchRequest !== null;
  const canSearch = location.type !== "none";

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 pb-24">
      <LocationPicker location={location} onChange={handleLocationChange} />

      {location.type !== "none" && (
        <>
          {hasSearched && (
            <p className="text-sm text-ink-muted">
              {placesState.status === "loading" && (
                <span className="text-mint">
                  Loading real places from Google Maps…
                </span>
              )}
              {placesState.status === "ready" && placesState.places.length > 0 && (
                <span className="text-mint">
                  {placesState.places.length} Google Maps places
                  {placesState.source === "cache" ? " (cached)" : ""}
                  {placesState.quota
                    ? ` · ${formatQuotaLabel(placesState.quota)}`
                    : ""}
                </span>
              )}
              {placesState.message && placesState.places.length === 0 && (
                <span className="text-coral-soft">{placesState.message}</span>
              )}
            </p>
          )}

          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            candidateCount={pool.length}
            loading={placesState.status === "loading"}
            canSearch={canSearch}
            onSearch={handleFindSpots}
            hasSearched={hasSearched}
          />

          {hasSearched && (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold">Spin it</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Full names on a vertical reel — open any winner in Google Maps.
                </p>
              </div>

              {placesState.status === "loading" ? (
                <div className="rounded-2xl border border-border bg-bg-soft px-4 py-6 text-center">
                  <p className="font-semibold text-mint">Fetching places…</p>
                </div>
              ) : pool.length < 2 ? (
                <div className="rounded-2xl border border-coral/30 bg-coral/5 px-4 py-6 text-center">
                  <p className="font-semibold text-coral">
                    Not enough spots for a proper spin.
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Try wider reach or a different spot type / cuisine.
                  </p>
                </div>
              ) : (
                <SpinWheel
                  candidates={candidates}
                  spinning={spinning}
                  targetIndex={targetIndex}
                  onSpinRequest={handleSpinRequest}
                  onSpinEnd={handleSpinEnd}
                />
              )}
            </section>
          )}

          {winner && (
            <ResultCard
              restaurant={winner}
              pun={pun}
              areaLabel={areaName(winner.area)}
              saved={savedIds.has(winner.id)}
              onSave={handleSave}
              onSpinAgain={handleSpinAgain}
            />
          )}
        </>
      )}

    </div>
  );
}
