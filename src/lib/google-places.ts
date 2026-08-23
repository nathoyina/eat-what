import {
  DEFAULT_INCLUDED_TYPES,
  cuisineUsesTextSearch,
  googleTypesForFilters,
} from "./cuisine-types";
import {
  matchesPriceFilter,
  type PriceFilter,
  type PriceLevel,
  type Restaurant,
} from "./types";

type Money = {
  currencyCode?: string;
  units?: string;
  nanos?: number;
};

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
    priceLevel?: string;
    priceRange?: { startPrice?: Money; endPrice?: Money };
  }>;
  error?: { message?: string; status?: string };
};

type PlaceResult = NonNullable<PlacesNearbyResponse["places"]>[number];

/** Non-eateries that slip into Nearby/Text (malls with food courts, etc.). */
const EXCLUDED_PRIMARY_TYPES = new Set([
  "bus_stop",
  "transit_stop",
  "transit_station",
  "subway_station",
  "train_station",
  "light_rail_station",
  "grocery_store",
  "manufacturer",
  "supermarket",
  "convenience_store",
  "shopping_mall",
  "department_store",
  "market",
  "store",
  "clothing_store",
  "electronics_store",
  "home_goods_store",
  "furniture_store",
  "hardware_store",
  "book_store",
  "pet_store",
  "pharmacy",
  "hotel",
  "lodging",
]);

/**
 * Drink / snack / dessert primaries — not a meal for “eat what”.
 * Juice / açaí kept only when cuisine filter is Salad.
 */
const SNACK_OR_DRINK_PRIMARY_TYPES = new Set([
  "juice_shop",
  "acai_shop",
  "ice_cream_shop",
  "dessert_shop",
  "dessert_restaurant",
  "candy_store",
  "chocolate_shop",
  "chocolate_factory",
  "confectionery",
  "donut_shop",
  "pastry_shop",
  "cake_shop",
  "bagel_shop",
  "bakery",
  "snack_bar",
  "tea_house",
  "tea_store",
  "coffee_roastery",
  "coffee_stand",
  "liquor_store",
  "wine_bar",
  "cocktail_bar",
  "bar",
  "pub",
  "brewery",
  "sports_bar",
  "hookah_bar",
  "lounge_bar",
]);

/** Always strip these from Nearby requests so malls/snacks don't come back as “food”. */
const EXCLUDED_NEARBY_TYPES = [
  "shopping_mall",
  "department_store",
  "supermarket",
  "grocery_store",
  "convenience_store",
  "market",
  "hotel",
  "lodging",
  "ice_cream_shop",
  "dessert_shop",
  "candy_store",
  "chocolate_shop",
  "confectionery",
  "donut_shop",
  "pastry_shop",
  "cake_shop",
  "bakery",
  "snack_bar",
  "tea_house",
  "tea_store",
  "liquor_store",
  "wine_bar",
  "bar",
  "pub",
  "brewery",
] as const;

/** Extra snack/drink exclusions for non-Salad searches. */
const EXCLUDED_SNACK_DRINK_NEARBY = [
  "juice_shop",
  "acai_shop",
  "coffee_roastery",
  "coffee_stand",
  "bagel_shop",
  "dessert_restaurant",
  "cocktail_bar",
  "sports_bar",
  "hookah_bar",
] as const;

const FOOD_PRIMARY_TYPES = new Set([
  "restaurant",
  "cafe",
  "coffee_shop",
  "food_court",
  "meal_takeaway",
  "meal_delivery",
  "fast_food_restaurant",
  "hamburger_restaurant",
  "pizza_restaurant",
  "sandwich_shop",
  "salad_shop",
  "deli",
]);

/** Mall / plaza names that aren't food venues even if Google is fuzzy. */
const MALL_NAME_PATTERN =
  /\b(mall|shopping\s*(centre|center|plaza)|town\s*square)\b/i;

/** Drink / snack shop names Google often mistags as restaurant/cafe. */
const SNACK_OR_DRINK_NAME_PATTERN =
  /\b(bubble\s*tea|boba|milk\s*tea|ice\s*cream|gelato|yogurt|yoghurt|dessert|smoothie|juice\s*bar|tea\s*(shop|house|bar)|coffee\s*(bean|roaster)|wine\s*bar|cocktail\s*bar|liquor|snack\s*bar|donut|doughnut|pastry|cake\s*shop|candy|chocolat)\b/i;

function isSnackOrDrinkPlace(p: PlaceResult): boolean {
  const primary = p.primaryType ?? "";
  const name = p.displayName?.text ?? "";

  if (primary && SNACK_OR_DRINK_PRIMARY_TYPES.has(primary)) {
    return true;
  }

  if (SNACK_OR_DRINK_NAME_PATTERN.test(name)) {
    // Sit-down dessert restaurants can stay; pure shops go.
    if (
      primary &&
      primary.endsWith("_restaurant") &&
      primary !== "dessert_restaurant"
    ) {
      return false;
    }
    return true;
  }

  return false;
}

function isNonEateryPlace(p: PlaceResult): boolean {
  const primary = p.primaryType ?? "";
  const types = p.types ?? [];
  const name = p.displayName?.text ?? "";

  if (primary && EXCLUDED_PRIMARY_TYPES.has(primary)) return true;
  if (isSnackOrDrinkPlace(p)) return true;

  // Mall tagged with food_court as a secondary type — still a mall.
  if (
    types.includes("shopping_mall") &&
    (!primary || primary === "shopping_mall" || !FOOD_PRIMARY_TYPES.has(primary))
  ) {
    return true;
  }

  // e.g. "Hillion Mall" returned under a loose/missing type
  if (MALL_NAME_PATTERN.test(name)) {
    if (/\bfood\s*(court|centre|center)\b/i.test(name)) return false;
    if (primary && FOOD_PRIMARY_TYPES.has(primary)) return false;
    return true;
  }

  return false;
}
const SALAD_PRIMARY_TYPES = new Set([
  "salad_shop",
  "vegetarian_restaurant",
  "vegan_restaurant",
  "sandwich_shop",
  "deli",
]);

/** Always salad — Google tagged correctly. */
const CORE_SALAD_TYPES = new Set(["salad_shop"]);

/** Salad-adjacent — require a name match so vegan cafes don't slip in. */
const SECONDARY_SALAD_TYPES = new Set([
  "vegetarian_restaurant",
  "vegan_restaurant",
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
  /\b(salad|salads|grain|grains|poke|super\s*green|stuff'?d|stuffed|green\s+(box|elephant)|autobus|harvest|tossed|saladthyme|salad\s*crunch|salad\s*stop|salad\s*box|just\s*salad|healthy\s*(kitchen|eats|bowl)|grain\s*bowl|salad\s*bowl)\b/i;

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
    return SALAD_NAME_PATTERN.test(name);
  }

  if (SALAD_NAME_PATTERN.test(name)) return true;

  return false;
}

/**
 * Enterprise SKU fields — priceLevel / priceRange need Enterprise
 * (free cap ~1,000/month vs Pro ~5,000).
 */
const ENTERPRISE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.googleMapsUri",
  "places.priceLevel",
  "places.priceRange",
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
  food_court: "Hawker",
  salad_shop: "Salad",
  vegetarian_restaurant: "Salad",
  vegan_restaurant: "Salad",
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

function priceLevelFromPlace(p: PlaceResult): PriceLevel | null {
  switch (p.priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return null;
  }
}

function formatMoney(m: Money | undefined): string | null {
  if (!m) return null;
  if (m.units == null && m.nanos == null) return null;
  const code = (m.currencyCode ?? "SGD").toUpperCase();
  const units = Number(m.units ?? 0);
  const nanos = m.nanos ?? 0;
  const amount = units + nanos / 1e9;
  if (!Number.isFinite(amount)) return null;
  const prefix = code === "SGD" ? "S$" : code === "USD" ? "US$" : `${code} `;
  const rounded = Number.isInteger(amount) ? String(amount) : amount.toFixed(0);
  return `${prefix}${rounded}`;
}

function priceRangeTextFromPlace(p: PlaceResult): string | undefined {
  const range = p.priceRange;
  if (!range) return undefined;
  const start = formatMoney(range.startPrice);
  const end = formatMoney(range.endPrice);
  if (start && end) return `${start}–${end}`;
  if (start && !end) return `${start}+`;
  if (!start && end) return `up to ${end}`;
  return undefined;
}

function placesToRestaurants(
  places: PlaceResult[],
  opts: {
    areaId: string;
    selected: string[];
    forceCuisine?: string;
    textSearch?: boolean;
    priceFilter?: PriceFilter;
  },
): Restaurant[] {
  const byId = new Map<string, Restaurant>();
  const priceFilter = opts.priceFilter ?? "any";

  for (const p of places) {
    if (!p.id || !p.displayName?.text) continue;
    if (isNonEateryPlace(p)) {
      continue;
    }
    if (opts.textSearch && opts.forceCuisine === "Salad" && !isSaladPlace(p)) {
      continue;
    }

    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (lat == null || lng == null) continue;

    const priceLevel = priceLevelFromPlace(p);
    if (!matchesPriceFilter(priceLevel, priceFilter)) continue;

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
      priceLevel,
      lat,
      lng,
      address,
      googleMapsQuery: `${name} ${address}`,
      googleMapsUri: p.googleMapsUri,
      priceRangeText: priceRangeTextFromPlace(p),
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
        "X-Goog-FieldMask": ENTERPRISE_FIELD_MASK,
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
  priceFilter?: PriceFilter;
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
      excludedTypes: [...EXCLUDED_NEARBY_TYPES],
      excludedPrimaryTypes: [...EXCLUDED_NEARBY_TYPES],
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
      includedType: "restaurant",
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
    priceFilter: opts.priceFilter ?? "any",
  });
}

/** Salad lookups use 2 Places API calls. */
export const SALAD_SEARCH_API_COST = 2;

/**
 * Nearby / Text Search with priceLevel → Enterprise SKU
 * (free tier ~1,000/month). Salad uses 2 calls.
 */
export async function fetchNearbyFoodPlaces(opts: {
  apiKey: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  areaId: string;
  areaName?: string;
  cuisines?: string[];
  priceFilter?: PriceFilter;
}): Promise<Restaurant[]> {
  const selected = opts.cuisines ?? [];
  const priceFilter = opts.priceFilter ?? "any";

  if (cuisineUsesTextSearch(selected)) {
    return fetchSaladViaTextSearch({ ...opts, priceFilter });
  }

  const primaryTypes = googleTypesForFilters(selected);
  const rankPreference =
    primaryTypes.length > 0 && selected.length === 0
      ? ("POPULARITY" as const)
      : selected.length > 0
        ? ("DISTANCE" as const)
        : ("POPULARITY" as const);

  const usePrimary = selected.length > 0;
  const excludedTypes = [
    ...EXCLUDED_NEARBY_TYPES,
    ...EXCLUDED_SNACK_DRINK_NEARBY,
  ];

  const body = usePrimary
    ? {
        includedPrimaryTypes: (primaryTypes.length
          ? primaryTypes
          : [...DEFAULT_INCLUDED_TYPES]
        ).slice(0, 50),
        excludedTypes,
        excludedPrimaryTypes: excludedTypes,
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
        excludedTypes,
        excludedPrimaryTypes: excludedTypes,
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
    priceFilter,
  });
}
