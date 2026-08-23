"use client";

import { BadgeToast } from "@/components/BadgeToast";
import { FilterBar } from "@/components/FilterBar";
import { LocationPicker } from "@/components/LocationPicker";
import { ResultCard } from "@/components/ResultCard";
import { SpinWheel } from "@/components/SpinWheel";
import {
  evaluateSaveBadges,
  evaluateSpinBadges,
} from "@/lib/badges";
import { nearestArea } from "@/lib/geo";
import { useSavedIdSet } from "@/lib/hooks";
import { pickPun } from "@/lib/puns";
import {
  areaName,
  areas,
  filterRestaurants,
  pickWheelCandidates,
} from "@/lib/restaurants";
import {
  loadBadgeProgress,
  saveBadgeProgress,
  saveSpot,
} from "@/lib/storage";
import type {
  BadgeId,
  Filters,
  LocationMode,
  Restaurant,
} from "@/lib/types";
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
  const [toastBadges, setToastBadges] = useState<BadgeId[]>([]);
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

  const activeAreaId = useMemo(() => {
    const loc = searchRequest?.location;
    if (!loc || loc.type === "none") return null;
    if (loc.type === "area") return loc.areaId;
    return nearestArea(loc.lat, loc.lng, areas).id;
  }, [searchRequest]);

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

      const progress = loadBadgeProgress();
      const { progress: next, newlyUnlocked } = evaluateSpinBadges(
        progress,
        rest,
        activeAreaId,
      );
      saveBadgeProgress(next);
      if (newlyUnlocked.length) setToastBadges(newlyUnlocked);
    },
    [activeAreaId],
  );

  const handleSave = () => {
    if (!winner) return;
    const list = saveSpot({
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

    const progress = loadBadgeProgress();
    const { progress: next, newlyUnlocked } = evaluateSaveBadges(
      progress,
      list.length,
    );
    saveBadgeProgress(next);
    if (newlyUnlocked.length) setToastBadges(newlyUnlocked);
  };

  const handleSpinAgain = () => {
    setWinner(null);
    setTargetIndex(null);
    setReshuffle((n) => n + 1);
  };

  if (!started) {
    return (
      <div className="relative mx-auto flex min-h-[calc(100dvh-57px)] max-w-3xl flex-col justify-center px-4 py-10">
        <p className="font-display text-5xl font-bold tracking-tight text-ink sm:text-7xl">
          Eat What
        </p>
        <h1 className="mt-4 max-w-md font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
          Spin your next makan
        </h1>
        <p className="mt-3 max-w-sm text-base text-ink-muted">
          Real Google Maps places — pick area, cuisine & $ band, then spin.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-8 w-fit rounded-2xl bg-lime px-8 py-3.5 font-display text-lg font-bold text-white shadow-sm transition hover:bg-lime-deep hover:scale-[1.02] active:scale-[0.98]"
        >
          Let&apos;s spin
        </button>
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

      <BadgeToast
        badgeIds={toastBadges}
        onDismiss={() => setToastBadges([])}
      />
    </div>
  );
}
