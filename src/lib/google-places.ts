import {
  DEFAULT_INCLUDED_TYPES,
  cuisineUsesTextSearch,
  googleTypesForCuisines,
} from "./cuisine-types";
import type { Restaurant } from "./types";

type PlacesNearbyResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    primaryType?: string;
    primaryTypeDisplayName?: { text?: string };
    types?: string[];
    googleMapsUri?: string;
  }>;
  error?: { message?: string; status?: string };
};

type PlaceResult = NonNullable<PlacesNearbyResponse["places"]>[number];

/** Non-food hits that sometimes appear in text search. */
const EXCLUDED_PRIMARY_TYPES = new Set([
  "bus_stop",
  "transit_stop",
  "transit_station",
  "grocery_store",
  "manufacturer",
  "supermarket",
  "convenience_store",
]);

const SALAD_PRIMARY_TYPES = new Set([
  "salad_shop",
  "acai_shop",
  "vegetarian_restaurant",
  "vegan_restaurant",
  "juice_shop",
  "sandwich_shop",
  "deli",
]);

/** Always salad — Google tagged correctly. */
const CORE_SALAD_TYPES = new Set(["salad_shop", "acai_shop"]);

/** Salad-adjacent — require a name match so vegan cafes don't slip in. */
const SECONDARY_SALAD_TYPES = new Set([
  "vegetarian_restaurant",
  "vegan_restaurant",
  "juice_shop",
  "sandwich_shop",
  "deli",
]);

/** Cafes, hawkers, bars — unless the name screams salad. */
const NON_SALAD_PRIMARY_TYPES = new Set([
  "cafe",
  "coffee_shop",
  "bakery",
  "tea_house",
  "bar",
  "pub",
  "wine_bar",
  "food_court",
  "night_club",
  "thai_restaurant",
  "chinese_restaurant",
  "japanese_restaurant",
  "korean_restaurant",
  "indian_restaurant",
  "vietnamese_restaurant",
  "italian_restaurant",
  "fast_food_restaurant",
  "hamburger_restaurant",
  "meal_takeaway",
]);

const SALAD_NAME_PATTERN =
  /\b(salad|salads|grain|grains|acai|poke|super\s*green|stuff'?d|stuffed|green\s+(box|elephant)|autobus|harvest|tossed|saladthyme|salad\s*crunch|salad\s*stop|salad\s*box|just\s*salad|healthy\s*(kitchen|eats|bowl)|grain\s*bowl|salad\s*bowl)\b/i;

function isSaladPlace(p: PlaceResult): boolean {
  const name = p.displayName?.text ?? "";
  const primary = p.primaryType ?? "";

  if (primary && EXCLUDED_PRIMARY_TYPES.has(primary)) return false;

  if (
    primary &&
    NON_SALAD_PRIMARY_TYPES.has(primary) &&
    !SALAD_NAME_PATTERN.test(name)
  ) {
    return false;
  }

  const types = p.types ?? [];
  const hasCoreType =
    (primary && CORE_SALAD_TYPES.has(primary)) ||
    types.some((t) => CORE_SALAD_TYPES.has(t));
  if (hasCoreType) return true;

  const hasSecondaryType =
    (primary && SECONDARY_SALAD_TYPES.has(primary)) ||
    types.some((t) => SECONDARY_SALAD_TYPES.has(t));
  if (hasSecondaryType) {
    return SALAD_NAME_PATTERN.test(name) || /\bacai\b/i.test(name);
  }

  if (SALAD_NAME_PATTERN.test(name)) return true;

  return false;
}

/** Pro-tier fields only — avoids Enterprise SKU (priceLevel, rating, etc.). */
const PRO_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.googleMapsUri",
].join(",");

const TYPE_CUISINE: Record<string, string> = {
  chinese_restaurant: "Chinese",
  dim_sum_restaurant: "Chinese",
  hot_pot_restaurant: "Chinese",
  japanese_restaurant: "Japanese",
  korean_restaurant: "Korean",
  thai_restaurant: "Thai",
  indian_restaurant: "Indian",
  vietnamese_restaurant: "Vietnamese",
  italian_restaurant: "Italian",
  french_restaurant: "French",
  mexican_restaurant: "Mexican",
  mediterranean_restaurant: "Mediterranean",
  greek_restaurant: "Mediterranean",
  seafood_restaurant: "Seafood",
  steak_house: "Western",
  hamburger_restaurant: "Western",
  american_restaurant: "Western",
  brunch_restaurant: "Western",
  pizza_restaurant: "Italian",
  sushi_restaurant: "Japanese",
  ramen_restaurant: "Japanese",
  asian_restaurant: "Asian",
  indonesian_restaurant: "Malay",
  malaysian_restaurant: "Malay",
  middle_eastern_restaurant: "Middle Eastern",
  cafe: "Cafe",
  coffee_shop: "Cafe",
  bakery: "Cafe",
  tea_house: "Cafe",
  salad_shop: "Salad",
  acai_shop: "Salad",
  vegetarian_restaurant: "Salad",
  vegan_restaurant: "Salad",
  juice_shop: "Salad",
  sandwich_shop: "Salad",
  deli: "Salad",
  meal_takeaway: "Fast Food",
  meal_delivery: "Delivery",
  fast_food_restaurant: "Fast Food",
  restaurant: "Restaurant",
};

function cuisineFromPlace(
  p: PlaceResult,
  selectedCuisines: string[],
): string {
  if (p.primaryType && TYPE_CUISINE[p.primaryType]) {
    return TYPE_CUISINE[p.primaryType];
  }
  for (const t of p.types ?? []) {
    if (TYPE_CUISINE[t]) return TYPE_CUISINE[t];
  }
  if (p.primaryTypeDisplayName?.text) {
    const label = p.primaryTypeDisplayName.text.replace(/_/g, " ");
    if (selectedCuisines.includes(label)) return label;
    return label;
  }
  return selectedCuisines[0] ?? "Restaurant";
}

function placesToRestaurants(
  places: PlaceResult[],
  opts: {
    areaId: string;
    selected: string[];
    forceCuisine?: string;
    textSearch?: boolean;
  },
): Restaurant[] {
  const byId = new Map<string, Restaurant>();

  for (const p of places) {
    if (!p.id || !p.displayName?.text) continue;
    if (
      opts.textSearch &&
      p.primaryType &&
      EXCLUDED_PRIMARY_TYPES.has(p.primaryType)
    ) {
      continue;
    }
    if (opts.textSearch && opts.forceCuisine === "Salad" && !isSaladPlace(p)) {
      continue;
    }

    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (lat == null || lng == null) continue;

    const name = p.displayName.text;
    const address = p.formattedAddress ?? name;
    const placeId = p.id;
    const cuisine =
      opts.forceCuisine ?? cuisineFromPlace(p, opts.selected);

    if (
      opts.selected.length > 0 &&
      !opts.forceCuisine &&
      !opts.selected.some(
        (c) => c.toLowerCase() === cuisine.toLowerCase(),
      )
    ) {
      continue;
    }

    byId.set(placeId, {
      id: placeId,
      placeId,
      name,
      area: opts.areaId,
      cuisine,
      priceLevel: 2,
      lat,
      lng,
      address,
      googleMapsQuery: `${name} ${address}`,
      googleMapsUri: p.googleMapsUri,
    });
  }

  return [...byId.values()];
}

async function callPlacesApi(
  apiKey: string,
  endpoint: "searchNearby" | "searchText",
  body: Record<string, unknown>,
): Promise<PlacesNearbyResponse> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places:${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PRO_FIELD_MASK,
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await res.json()) as PlacesNearbyResponse;
  if (!res.ok) {
    throw new Error(
      data.error?.message ?? `Places API error (${res.status})`,
    );
  }
  return data;
}

async function fetchSaladViaTextSearch(opts: {
  apiKey: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  areaId: string;
  areaName?: string;
}): Promise<Restaurant[]> {
  const locationLabel = opts.areaName?.trim() || "near me";
  const circle = {
    center: {
      latitude: opts.lat,
      longitude: opts.lng,
    },
    radius: opts.radiusMeters,
  };

  const [nearbyData, textData] = await Promise.all([
    callPlacesApi(opts.apiKey, "searchNearby", {
      includedPrimaryTypes: [...SALAD_PRIMARY_TYPES],
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      languageCode: "en",
      regionCode: "SG",
      locationRestriction: { circle },
    }),
    callPlacesApi(opts.apiKey, "searchText", {
      textQuery: `salad ${locationLabel} Singapore`,
      maxResultCount: 20,
      languageCode: "en",
      regionCode: "SG",
      locationBias: { circle },
    }),
  ]);

  const merged = new Map<string, PlaceResult>();
  for (const p of [...(nearbyData.places ?? []), ...(textData.places ?? [])]) {
    if (p.id) merged.set(p.id, p);
  }

  return placesToRestaurants([...merged.values()], {
    areaId: opts.areaId,
    selected: ["Salad"],
    forceCuisine: "Salad",
    textSearch: true,
  });
}

/** Salad lookup uses 2 Places API calls (nearby types + text search). */
export const SALAD_SEARCH_API_COST = 2;

/**
 * One Places Search Pro call per fetch (free tier: 5,000/month).
 * When cuisines are selected, uses includedPrimaryTypes so results match.
 * Salad uses Text Search because many salad spots are tagged as generic restaurant.
 */
export async function fetchNearbyFoodPlaces(opts: {
  apiKey: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  areaId: string;
  areaName?: string;
  cuisines?: string[];
}): Promise<Restaurant[]> {
  const selected = opts.cuisines ?? [];

  if (cuisineUsesTextSearch(selected)) {
    return fetchSaladViaTextSearch(opts);
  }

  const primaryTypes = googleTypesForCuisines(selected);
  const rankPreference =
    primaryTypes.length > 0 ? ("DISTANCE" as const) : ("POPULARITY" as const);

  const body =
    primaryTypes.length > 0
      ? {
          includedPrimaryTypes: primaryTypes.slice(0, 50),
          maxResultCount: 20,
          rankPreference,
          languageCode: "en",
          regionCode: "SG",
          locationRestriction: {
            circle: {
              center: {
                latitude: opts.lat,
                longitude: opts.lng,
              },
              radius: opts.radiusMeters,
            },
          },
        }
      : {
          includedTypes: [...DEFAULT_INCLUDED_TYPES],
          maxResultCount: 20,
          rankPreference,
          languageCode: "en",
          regionCode: "SG",
          locationRestriction: {
            circle: {
              center: {
                latitude: opts.lat,
                longitude: opts.lng,
              },
              radius: opts.radiusMeters,
            },
          },
        };

  const data = await callPlacesApi(opts.apiKey, "searchNearby", body);

  return placesToRestaurants(data.places ?? [], {
    areaId: opts.areaId,
    selected,
  });
}
