import type { FoodKind, PriceFilter, WalkRadius } from "./types";
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
