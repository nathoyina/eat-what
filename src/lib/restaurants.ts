import areasData from "@/data/areas.json";
import { haversineKm } from "./geo";
import {
  REACH_KM,
  type Area,
  type CompleteFilters,
  type LocationMode,
  type Restaurant,
} from "./types";

export const areas = areasData as Area[];

/** No fake seed data — catalog comes from Google Places only. */
export const restaurants: Restaurant[] = [];

export function areaName(areaId: string): string {
  return areas.find((a) => a.id === areaId)?.name ?? areaId;
}

export function allCuisines(catalog: Restaurant[] = restaurants): string[] {
  return [...new Set(catalog.map((r) => r.cuisine))].sort();
}

export function filterRestaurants(
  location: LocationMode,
  filters: CompleteFilters,
  catalog: Restaurant[] = restaurants,
): Restaurant[] {
  let results = [...catalog];

  if (filters.priceLevel != null && filters.priceLevel !== 0) {
    results = results.filter((r) => r.priceLevel === filters.priceLevel);
  }

  // Cuisine resolved server-side via Google includedPrimaryTypes

  const radiusKm = REACH_KM[filters.reach];

  if (location.type === "area") {
    // Places fetch is already scoped to the area; only apply radius filter
    // when reach is walk/short. "anywhere" keeps the fetched neighbourhood set.
    if (radiusKm != null) {
      const area = areas.find((a) => a.id === location.areaId);
      if (area) {
        results = results.filter(
          (r) => haversineKm(area.lat, area.lng, r.lat, r.lng) <= radiusKm,
        );
      }
    }
  } else if (location.type === "geo") {
    if (radiusKm != null) {
      results = results
        .map((r) => ({
          r,
          d: haversineKm(location.lat, location.lng, r.lat, r.lng),
        }))
        .filter(({ d }) => d <= radiusKm)
        .sort((a, b) => a.d - b.d)
        .map(({ r }) => r);
    } else {
      results = results
        .map((r) => ({
          r,
          d: haversineKm(location.lat, location.lng, r.lat, r.lng),
        }))
        .sort((a, b) => a.d - b.d)
        .map(({ r }) => r);
    }
  }

  return results;
}

/** Pick up to `count` random restaurants for the wheel */
export function pickWheelCandidates(
  pool: Restaurant[],
  count = 10,
): Restaurant[] {
  if (pool.length <= count) {
    return shuffle([...pool]);
  }
  return shuffle([...pool]).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function googleMapsUrl(restaurant: {
  placeId?: string;
  googleMapsUri?: string;
  googleMapsQuery: string;
  name?: string;
}): string {
  if (restaurant.googleMapsUri) return restaurant.googleMapsUri;
  if (restaurant.placeId) {
    const q = encodeURIComponent(
      restaurant.name ?? restaurant.googleMapsQuery,
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${restaurant.placeId}`;
  }
  const q = encodeURIComponent(restaurant.googleMapsQuery);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
