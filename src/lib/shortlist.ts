import type {
  Filters,
  FoodKind,
  PriceFilter,
  Reach,
  WalkRadius,
} from "./types";
import { WALK_RADIUS_OPTIONS } from "./types";

/** Wheel needs two names to feel like a spin rather than a coin flip. */
export const MIN_WHEEL_CANDIDATES = 2;

export function needsThinFallback(pricedCount: number): boolean {
  return pricedCount < MIN_WHEEL_CANDIDATES;
}

/**
 * Text Search `priceLevels` drops unpriced hawker stalls. Use it for $$ / $$$
 * so the fallback can skip the cheap 20-hit Nearby set. For $ we omit it and
 * search hawker/cheap language instead.
 */
export function shouldSendPriceLevels(price: PriceFilter): boolean {
  return price === "2" || price === "3";
}

export function googlePriceLevels(price: PriceFilter): string[] | null {
  if (price === "1") {
    return ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE"];
  }
  if (price === "2") return ["PRICE_LEVEL_MODERATE"];
  if (price === "3") {
    return ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"];
  }
  return null;
}

export function fallbackTextQuery(opts: {
  kind: FoodKind;
  cuisines: string[];
  price: PriceFilter;
  areaName?: string;
}): string {
  const area = opts.areaName?.trim() || "Singapore";
  const where = /singapore/i.test(area) ? area : `${area} Singapore`;
  const cuisine = opts.cuisines
    .filter((c) => c && c !== "any")
    .join(" ");

  if (opts.kind === "drinks") {
    return opts.price === "3"
      ? `cocktail bar wine bar near ${where}`
      : `bubble tea cafe juice bar near ${where}`;
  }
  if (opts.kind === "snack") {
    return `dessert bakery ice cream snack near ${where}`;
  }
  if (opts.price === "1") {
    return cuisine
      ? `${cuisine} hawker food court cheap eats near ${where}`
      : `hawker food court cheap eats near ${where}`;
  }
  return cuisine
    ? `${cuisine} restaurant near ${where}`
    : `restaurant near ${where}`;
}

export function emptyPlacesMessage(
  price: PriceFilter,
  kind: FoodKind,
  cuisines: string[],
): string {
  const priceHint =
    price === "any"
      ? ""
      : price === "1"
        ? "$ "
        : price === "2"
          ? "$$ "
          : "$$$ ";
  const kindLabel =
    kind === "snack" ? "snack" : kind === "drinks" ? "drink" : "food";
  return cuisines.length
    ? `No ${priceHint}${cuisines.join(" / ")} spots found nearby. Try another price or wider reach.`
    : `No ${priceHint || ""}${kindLabel} places found nearby. Try a wider reach or another price.`;
}

export function walkRadiusLabel(walkRadius: WalkRadius | null): string {
  return (
    WALK_RADIUS_OPTIONS.find((o) => o.id === walkRadius)?.label ??
    "walking distance"
  );
}

/**
 * When Nearby returned enough spots for the 1.5 km walk fetch, but the chosen
 * cap (500 m / 1 km) left a thin list — tell the user without another API call.
 */
export function walkThinMessage(opts: {
  inRange: number;
  fetched: number;
  walkLabel: string;
}): string | null {
  if (opts.inRange >= MIN_WHEEL_CANDIDATES) return null;
  if (opts.fetched <= opts.inRange) return null;
  if (opts.fetched < MIN_WHEEL_CANDIDATES) return null;

  if (opts.inRange === 0) {
    return `No spots within ${opts.walkLabel}. ${opts.fetched} found a bit further — try a longer walk.`;
  }
  return `Only ${opts.inRange} spot within ${opts.walkLabel}. ${opts.fetched} found a bit further — try a longer walk.`;
}

/** Design Partner locked copy for 0/1 in-range spots (no reel). */
export const EMPTY_SPOTS_COPY =
  "Not enough spots nearby. Widen reach or loosen cuisine.";
export const TWO_SPOTS_COPY = "Only 2 spots nearby. Widen reach for more.";
export const SINGLE_SPOT_HEADING = "Only one spot in range";
export const SINGLE_SPOT_BODY = "No spin needed — this is your makan.";
export const TAKE_THIS_SPOT_LABEL = "Take this spot";
export const WIDEN_REACH_LABEL = "Widen reach";
export const ANY_CUISINE_LABEL = "Any cuisine";

const WALK_RADIUS_WIDEN_ORDER: WalkRadius[] = WALK_RADIUS_OPTIONS.map(
  (opt) => opt.id,
);

export type WiderReach = {
  reach: Reach;
  walkRadius: WalkRadius | null;
};

/** Next looser reach step: 500 m → 1 km → 1.5 km → short ride → anywhere. */
export function nextWiderReach(filters: {
  reach: Reach | null;
  walkRadius: WalkRadius | null;
}): WiderReach | null {
  if (filters.reach === "walk") {
    const current =
      filters.walkRadius ??
      WALK_RADIUS_WIDEN_ORDER[WALK_RADIUS_WIDEN_ORDER.length - 1];
    const idx = current ? WALK_RADIUS_WIDEN_ORDER.indexOf(current) : -1;
    const nextWalk = idx >= 0 ? WALK_RADIUS_WIDEN_ORDER[idx + 1] : undefined;
    if (nextWalk) return { reach: "walk", walkRadius: nextWalk };
    return { reach: "short", walkRadius: null };
  }
  if (filters.reach === "short") {
    return { reach: "anywhere", walkRadius: null };
  }
  return null;
}

export function cuisineIsAny(cuisines: string[] | null | undefined): boolean {
  if (!cuisines || cuisines.length === 0) return true;
  return cuisines.includes("any");
}

/** Secondary empty-state chip — meals with a specific cuisine only. */
export function shouldShowAnyCuisineChip(filters: {
  kind: FoodKind | null;
  cuisines: string[] | null;
}): boolean {
  if (filters.kind !== "meal") return false;
  return !cuisineIsAny(filters.cuisines);
}

export type RecoveryAction = "widen-reach" | "any-cuisine";

export function applyRecoveryAction(
  filters: Filters,
  action: RecoveryAction,
): Filters {
  if (action === "any-cuisine") {
    if (cuisineIsAny(filters.cuisines) && filters.cuisines?.includes("any")) {
      return filters;
    }
    return { ...filters, cuisines: ["any"] };
  }
  const next = nextWiderReach(filters);
  if (!next) return filters;
  return { ...filters, reach: next.reach, walkRadius: next.walkRadius };
}

export type RecoveryUi =
  | {
      variant: "empty";
      copy: typeof EMPTY_SPOTS_COPY;
      widenLabel: typeof WIDEN_REACH_LABEL;
      anyCuisineLabel: typeof ANY_CUISINE_LABEL;
      showWidenReach: true;
      canWidenReach: boolean;
      showAnyCuisine: boolean;
    }
  | {
      variant: "single";
      heading: typeof SINGLE_SPOT_HEADING;
      body: typeof SINGLE_SPOT_BODY;
      takeLabel: typeof TAKE_THIS_SPOT_LABEL;
      widenLabel: typeof WIDEN_REACH_LABEL;
      canWidenReach: boolean;
    }
  | { variant: "wheel" };

/** UI contract for 0 / 1 / 2+ in-range spots after a search. */
export function recoveryUi(opts: {
  count: number;
  filters: {
    kind: FoodKind | null;
    cuisines: string[] | null;
    reach: Reach | null;
    walkRadius: WalkRadius | null;
  };
}): RecoveryUi {
  const canWidenReach = nextWiderReach(opts.filters) !== null;
  if (opts.count <= 0) {
    return {
      variant: "empty",
      copy: EMPTY_SPOTS_COPY,
      widenLabel: WIDEN_REACH_LABEL,
      anyCuisineLabel: ANY_CUISINE_LABEL,
      showWidenReach: true,
      canWidenReach,
      showAnyCuisine: shouldShowAnyCuisineChip(opts.filters),
    };
  }
  if (opts.count === 1) {
    return {
      variant: "single",
      heading: SINGLE_SPOT_HEADING,
      body: SINGLE_SPOT_BODY,
      takeLabel: TAKE_THIS_SPOT_LABEL,
      widenLabel: WIDEN_REACH_LABEL,
      canWidenReach,
    };
  }
  return { variant: "wheel" };
}
