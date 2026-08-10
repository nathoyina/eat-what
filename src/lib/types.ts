export type Area = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type Restaurant = {
  id: string;
  placeId?: string;
  name: string;
  area: string;
  cuisine: string;
  priceLevel: 1 | 2 | 3 | 4;
  lat: number;
  lng: number;
  address: string;
  googleMapsQuery: string;
  googleMapsUri?: string;
};

export type Reach = "walk" | "short" | "anywhere";

export type Filters = {
  /** null = not chosen yet; "any" or a cuisine label */
  cuisine: string | null;
  /** null = not chosen; 0 = any price; 1–4 = $–$$$$ */
  priceLevel: number | null;
  /** null = not chosen yet */
  reach: Reach | null;
};

export function filtersComplete(filters: Filters): filters is CompleteFilters {
  return (
    filters.cuisine !== null &&
    filters.priceLevel !== null &&
    filters.reach !== null
  );
}

export type CompleteFilters = {
  cuisine: string;
  priceLevel: number;
  reach: Reach;
};

export type LocationMode =
  | { type: "none" }
  | { type: "area"; areaId: string }
  | { type: "geo"; lat: number; lng: number };

export type SavedSpot = {
  id: string;
  placeId?: string;
  name: string;
  cuisine: string;
  priceLevel: number;
  address: string;
  googleMapsQuery: string;
  googleMapsUri?: string;
  savedAt: string;
};

export type BadgeId =
  | "first-spin"
  | "indecisive"
  | "globe-trotter"
  | "budget-hero"
  | "area-hopper"
  | "list-keeper";

export type BadgeProgress = {
  unlocked: BadgeId[];
  totalSpins: number;
  sessionSpins: number;
  cuisinesLanded: string[];
  areasSpun: string[];
  savedCount: number;
};

export const REACH_KM: Record<Reach, number | null> = {
  walk: 1.5,
  short: 5,
  anywhere: null,
};

export const PRICE_LABELS = ["", "$", "$$", "$$$", "$$$$"] as const;
