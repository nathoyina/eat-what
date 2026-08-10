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
  Cafe: ["cafe", "coffee_shop", "bakery", "tea_house"],
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
  Peranakan: ["restaurant"], // no dedicated type — fall back handled below
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
  "Cafe",
  "Salad",
  "Seafood",
  "Fast Food",
] as const;

/** Cuisines that need Text Search — Google types miss common spots (e.g. salad bowls tagged as restaurant). */
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

export const DEFAULT_INCLUDED_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "meal_takeaway",
] as const;
