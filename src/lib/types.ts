export type Area = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

/** Google priceLevel mapped to $ / $$ / $$$ (+ $$$$ for very expensive). */
export type PriceLevel = 1 | 2 | 3 | 4;

/** Filter: any or a dollar-sign band. $$$ includes Google “very expensive”. */
export type PriceFilter = "any" | "1" | "2" | "3";

export type Restaurant = {
  id: string;
  placeId?: string;
  name: string;
  area: string;
  cuisine: string;
  /** Google priceLevel 1–4; null if Google has no data. */
  priceLevel: PriceLevel | null;
  lat: number;
  lng: number;
  address: string;
  googleMapsQuery: string;
  googleMapsUri?: string;
  /** Google priceRange when present, e.g. "S$15–30". */
  priceRangeText?: string;
};

/** What to look for — meals exclude snack/drink shops. */
export type FoodKind = "meal" | "snack" | "drinks";

export type Reach = "walk" | "short" | "anywhere";

/** Walk distance cap — within this many metres, no lower bound. */
export type WalkRadius = "500" | "1000" | "1500";

export type Filters = {
  /** null = not chosen yet */
  kind: FoodKind | null;
  /** null = not chosen yet; ["any"] or one+ cuisine labels. Required for meals. */
  cuisines: string[] | null;
  /** null = not chosen yet */
  price: PriceFilter | null;
  /** null = not chosen yet */
  reach: Reach | null;
  /** Required when reach is walk */
  walkRadius: WalkRadius | null;
};

export const FILTER_FOOD_KINDS: {
  id: FoodKind;
  label: string;
  hint: string;
}[] = [
  { id: "meal", label: "Meal", hint: "lunch & dinner" },
  { id: "snack", label: "Snack", hint: "dessert & bites" },
  { id: "drinks", label: "Drinks", hint: "tea, coffee & bars" },
];

export function filtersComplete(filters: Filters): boolean {
  if (
    filters.kind == null ||
    filters.price == null ||
    filters.reach == null ||
    (filters.reach === "walk" && filters.walkRadius == null)
  ) {
    return false;
  }
  if (filters.kind === "meal") {
    return filters.cuisines !== null && filters.cuisines.length > 0;
  }
  return true;
}

export function toCompleteFilters(filters: Filters): CompleteFilters | null {
  if (!filtersComplete(filters)) return null;
  const { kind, price, reach, walkRadius } = filters;
  if (kind == null || price == null || reach == null) return null;
  return {
    kind,
    cuisines:
      kind === "meal" ? (filters.cuisines ?? ["any"]) : ["any"],
    price,
    reach,
    walkRadius,
  };
}

export type CompleteFilters = {
  kind: FoodKind;
  cuisines: string[];
  price: PriceFilter;
  reach: Reach;
  walkRadius: WalkRadius | null;
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
  priceLevel?: PriceLevel | null;
  priceRangeText?: string;
  address: string;
  googleMapsQuery: string;
  googleMapsUri?: string;
  savedAt: string;
};

export const REACH_KM: Record<Reach, number | null> = {
  walk: 1.5,
  short: 5,
  anywhere: null,
};

export const WALK_RADIUS_OPTIONS: {
  id: WalkRadius;
  label: string;
  maxKm: number;
}[] = [
  { id: "500", label: "500 m", maxKm: 0.5 },
  { id: "1000", label: "1 km", maxKm: 1 },
  { id: "1500", label: "1.5 km", maxKm: 1.5 },
];

/** Places fetch always uses the walk max (1.5 km); this is the client filter cap. */
export function reachMaxKm(filters: {
  reach: Reach;
  walkRadius: WalkRadius | null;
}): number | null {
  if (filters.reach === "walk") {
    return (
      WALK_RADIUS_OPTIONS.find((o) => o.id === filters.walkRadius)?.maxKm ??
      REACH_KM.walk
    );
  }
  return REACH_KM[filters.reach];
}

/** True if distanceKm is within the selected reach / walk max. */
export function distanceInReach(
  distanceKm: number,
  filters: { reach: Reach; walkRadius: WalkRadius | null },
): boolean {
  const maxKm = reachMaxKm(filters);
  if (maxKm == null) return true;
  return distanceKm <= maxKm;
}

/** Display symbols for Google price levels. */
export const PRICE_SYMBOLS: Record<PriceLevel, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

/**
 * Rough SG meal-for-one estimates (not Google-verified).
 * Used when Google only returns a categorical priceLevel.
 */
export const PRICE_ESTIMATES: Record<PriceLevel, string> = {
  1: "~under S$15",
  2: "~S$15–40",
  3: "~S$40–80",
  4: "~S$80+",
};

export function formatPriceLabel(
  level: PriceLevel | null | undefined,
  rangeText?: string,
): string {
  if (level == null) return "Price n/a";
  const symbol = PRICE_SYMBOLS[level];
  if (rangeText) return `${symbol} · ${rangeText}`;
  return `${symbol} · ${PRICE_ESTIMATES[level]}`;
}

export function matchesPriceFilter(
  level: PriceLevel | null | undefined,
  filter: PriceFilter,
): boolean {
  if (filter === "any") return true;
  // Google leaves most hawker stalls / small shops unpriced. In SG those are
  // almost always the $ band — dropping them made "$" spins look empty.
  if (level == null) return filter === "1";
  if (filter === "1") return level === 1;
  if (filter === "2") return level === 2;
  // $$$ band includes very expensive
  return level >= 3;
}
