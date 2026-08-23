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
    "vegetarian_restaurant",
    "vegan_restaurant",
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

import type { PriceFilter } from "./types";

export const FILTER_PRICES: {
  id: PriceFilter;
  label: string;
  hint: string;
}[] = [
  { id: "any", label: "Any", hint: "all prices" },
  { id: "1", label: "$", hint: "~under S$15" },
  { id: "2", label: "$$", hint: "~S$15–40" },
  { id: "3", label: "$$$", hint: "~S$40+" },
];

/** Cuisines that need Text Search — Google types miss common spots. */
export function cuisineUsesTextSearch(cuisines: string[]): boolean {
  return cuisines.length === 1 && cuisines[0] === "Salad";
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

/** Resolve Google Nearby types from cuisine(s). */
export function googleTypesForFilters(cuisines: string[] | undefined): string[] {
  const selected = (cuisines ?? []).filter((c) => c && c !== "any");
  const cuisineTypes =
    selected.length > 0 ? googleTypesForCuisines(selected) : [];
  if (cuisineTypes.length > 0) return cuisineTypes;
  return [...DEFAULT_INCLUDED_TYPES];
}

export const DEFAULT_INCLUDED_TYPES = [
  "restaurant",
  "cafe",
  "meal_takeaway",
  "food_court",
] as const;
