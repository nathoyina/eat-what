"use client";

import { areas } from "@/lib/restaurants";
import { nearestArea } from "@/lib/geo";
import type { CompleteFilters, LocationMode, Restaurant } from "@/lib/types";
import type { QuotaInfo } from "@/lib/quota-label";
import { useEffect, useMemo, useState } from "react";

export type SearchRequest = {
  location: LocationMode;
  filters: CompleteFilters;
  token: number;
};

type Status = "idle" | "loading" | "ready" | "error";

type State = {
  status: Status;
  places: Restaurant[];
  message: string | null;
  source: string | null;
  quota: QuotaInfo | null;
};

const memoryCache = new Map<string, Restaurant[]>();

function cacheKey(request: SearchRequest): string | null {
  const { location, filters } = request;
  const cuisineKey = filters.cuisine === "any" ? "any" : filters.cuisine ?? "none";
  const priceKey = filters.priceLevel ?? "none";
  if (location.type === "area") {
    return `area:${location.areaId}:${filters.reach}:${cuisineKey}:${priceKey}`;
  }
  if (location.type === "geo") {
    const area = nearestArea(location.lat, location.lng, areas);
    return `geo:${area.id}:${location.lat.toFixed(3)}:${location.lng.toFixed(3)}:${filters.reach}:${cuisineKey}:${priceKey}`;
  }
  return null;
}

function buildUrl(request: SearchRequest): string | null {
  const { location, filters } = request;
  const params = new URLSearchParams();
  params.set("reach", filters.reach);
  if (filters.cuisine && filters.cuisine !== "any") {
    params.set("cuisines", filters.cuisine);
  }
  if (location.type === "area") {
    params.set("areaId", location.areaId);
  } else if (location.type === "geo") {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    params.set("areaId", nearestArea(location.lat, location.lng, areas).id);
  } else {
    return null;
  }
  return `/api/places?${params}`;
}

const idle: State = {
  status: "idle",
  places: [],
  message: null,
  source: null,
  quota: null,
};

export function usePlaces(request: SearchRequest | null): State & {
  catalog: Restaurant[];
} {
  const [state, setState] = useState<State>(idle);

  useEffect(() => {
    if (!request) {
      queueMicrotask(() => setState(idle));
      return;
    }

    const key = cacheKey(request);
    if (!key) {
      queueMicrotask(() => setState(idle));
      return;
    }

    const cached = memoryCache.get(key);
    if (cached) {
      queueMicrotask(() =>
        setState({
          status: "ready",
          places: cached,
          message: null,
          source: "cache",
          quota: null,
        }),
      );
      return;
    }

    const url = buildUrl(request);
    if (!url) return;

    const controller = new AbortController();
    queueMicrotask(() =>
      setState({ status: "loading", places: [], message: null, source: null, quota: null }),
    );

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as {
          places?: Restaurant[];
          message?: string;
          source?: string;
          quota?: QuotaInfo;
        };
        const places = data.places ?? [];
        if (places.length) memoryCache.set(key, places);
        setState({
          status: places.length || !data.message ? "ready" : "error",
          places,
          message: data.message ?? null,
          source: data.source ?? null,
          quota: data.quota ?? null,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          places: [],
          message: err instanceof Error ? err.message : "Failed to load places",
          source: "error",
          quota: null,
        });
      });

    return () => controller.abort();
  }, [request?.token]);

  const catalog = useMemo(() => state.places, [state.places]);

  return { ...state, catalog };
}
