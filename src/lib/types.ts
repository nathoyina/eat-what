export type Area = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type VenueType = "any" | "hawker" | "cafe" | "restaurant";

export type Restaurant = {
  id: string;
  placeId?: string;
  name: string;
  area: string;
  cuisine: string;
  /** Venue category inferred from Google types / name */
  venueType: Exclude<VenueType, "any">;
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
  /** null = not chosen yet; "any" | hawker | cafe | restaurant */
  venueType: VenueType | null;
  /** null = not chosen yet */
  reach: Reach | null;
};

export function filtersComplete(filters: Filters): filters is CompleteFilters {
  return (
    filters.cuisine !== null &&
    filters.venueType !== null &&
    filters.reach !== null
  );
}

export type CompleteFilters = {
  cuisine: string;
  venueType: VenueType;
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
  venueType?: Exclude<VenueType, "any">;
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

export const VENUE_LABELS: Record<Exclude<VenueType, "any">, string> = {
  hawker: "Hawker / food court",
  cafe: "Cafe",
  restaurant: "Restaurant",
};
