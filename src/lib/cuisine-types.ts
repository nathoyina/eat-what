/** User-facing cuisine labels → Google Places primary types */
export const CUISINE_TO_GOOGLE_TYPES: Record<string, string[]> = {
  Chinese: ["chinese_restaurant", "dim_sum_restaurant", "hot_pot_restaurant"],
  Japanese: ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant"],
  Korean: ["korean_restaurant"],
  Thai: ["thai_restaurant"],
  Indian: ["indian_restaurant"],
  Vietnamese: ["vietnamese_restaurant"],
  Italian: ["italian_restaurant", "pizza_restaurant"],
  Western: [
    "american_restaurant",
    "steak_house",
    "hamburger_restaurant",
    "brunch_restaurant",
  ],
  Malay: ["malaysian_restaurant", "indonesian_restaurant"],
  Salad: [
    "salad_shop",
    "acai_shop",
    "vegetarian_restaurant",
    "vegan_restaurant",
    "juice_shop",
    "sandwich_shop",
    "deli",
  ],
  Seafood: ["seafood_restaurant"],
  "Fast Food": ["fast_food_restaurant", "meal_takeaway"],
  Mediterranean: ["mediterranean_restaurant", "greek_restaurant"],
  Mexican: ["mexican_restaurant"],
  French: ["french_restaurant"],
};

export const FILTER_CUISINES = [
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Indian",
  "Vietnamese",
  "Italian",
  "Western",
  "Malay",
  "Salad",
  "Seafood",
  "Fast Food",
] as const;

import type { VenueType } from "./types";

export type { VenueType };

export const FILTER_VENUES: {
  id: VenueType;
  label: string;
  hint: string;
}[] = [
  { id: "any", label: "Any", hint: "all spots" },
  { id: "hawker", label: "Hawker", hint: "food court" },
  { id: "cafe", label: "Cafe", hint: "coffee & bites" },
  { id: "restaurant", label: "Restaurant", hint: "sit-down" },
];

export const VENUE_TO_GOOGLE_TYPES: Record<
  Exclude<VenueType, "any">,
  string[]
> = {
  hawker: ["food_court"],
  cafe: ["cafe", "coffee_shop", "bakery", "tea_house"],
  restaurant: ["restaurant"],
};

/** Cuisines that need Text Search — Google types miss common spots. */
export function cuisineUsesTextSearch(cuisines: string[]): boolean {
  return cuisines.length === 1 && cuisines[0] === "Salad";
}

/** Hawker centres often aren't tagged as food_court alone — text search helps. */
export function venueUsesTextSearch(venue: VenueType): boolean {
  return venue === "hawker";
}

export function googleTypesForCuisines(cuisines: string[]): string[] {
  const types = new Set<string>();
  for (const c of cuisines) {
    for (const t of CUISINE_TO_GOOGLE_TYPES[c] ?? []) {
      types.add(t);
    }
  }
  return [...types];
}

/**
 * Resolve Google Nearby types from venue + cuisine.
 * Cuisine specialty types win when venue is restaurant/any.
 * Cafe/hawker stick to their venue types (cuisine ignored for Nearby types).
 */
export function googleTypesForFilters(
  cuisine: string | undefined,
  venue: VenueType,
): string[] {
  const cuisineSelected = cuisine && cuisine !== "any";
  const cuisineTypes = cuisineSelected
    ? googleTypesForCuisines([cuisine])
    : [];

  if (venue === "cafe") return [...VENUE_TO_GOOGLE_TYPES.cafe];
  if (venue === "hawker") return [...VENUE_TO_GOOGLE_TYPES.hawker];
  if (venue === "restaurant") {
    return cuisineTypes.length > 0
      ? cuisineTypes
      : [...VENUE_TO_GOOGLE_TYPES.restaurant];
  }
  // any
  if (cuisineTypes.length > 0) return cuisineTypes;
  return [...DEFAULT_INCLUDED_TYPES];
}

export const DEFAULT_INCLUDED_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "meal_takeaway",
  "food_court",
] as const;

export function venueFromPlace(opts: {
  primaryType?: string;
  types?: string[];
  name?: string;
}): Exclude<VenueType, "any"> {
  const primary = opts.primaryType ?? "";
  const types = opts.types ?? [];
  const name = opts.name ?? "";
  const all = new Set([primary, ...types]);

  if (
    all.has("food_court") ||
    /\b(hawker|food\s*centre|food\s*court|kopitiam)\b/i.test(name)
  ) {
    return "hawker";
  }
  if (
    all.has("cafe") ||
    all.has("coffee_shop") ||
    all.has("bakery") ||
    all.has("tea_house")
  ) {
    return "cafe";
  }
  return "restaurant";
}
