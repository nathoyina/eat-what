import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyFoodKind,
  fetchNearbyFoodPlaces,
  fetchThinShortlistFallback,
  isMallPlace,
  isNonEateryPlace,
  placesToRestaurants,
  PLACES_SEARCH_FIELD_MASK,
  type PlaceResult,
} from "./google-places";

function place(partial: PlaceResult): PlaceResult {
  return {
    formattedAddress: "Singapore",
    location: { latitude: 1.3, longitude: 103.8 },
    ...partial,
  };
}

describe("classifyFoodKind", () => {
  it("keeps SG drink chains even when Google tags them as cafe/restaurant", () => {
    expect(
      classifyFoodKind(
        place({
          id: "1",
          displayName: { text: "CHAGEE" },
          primaryType: "cafe",
        }),
      ),
    ).toBe("drinks");
    expect(
      classifyFoodKind(
        place({
          id: "2",
          displayName: { text: "Gong Cha Hillion" },
          primaryType: "restaurant",
        }),
      ),
    ).toBe("drinks");
  });

  it("treats mall kiosks typed as service + tea_store as drinks", () => {
    expect(
      classifyFoodKind(
        place({
          id: "3",
          displayName: { text: "Beutea" },
          primaryType: "service",
          types: ["tea_store", "shopping_mall"],
        }),
      ),
    ).toBe("drinks");
  });

  it("keeps kopitiams as meals, not drink bars", () => {
    expect(
      classifyFoodKind(
        place({
          id: "4",
          displayName: { text: "ABC Eating House Kopitiam" },
          primaryType: "coffee_shop",
        }),
      ),
    ).toBe("meal");
  });
});

describe("mall tenant filtering", () => {
  it("does not drop tea shops that inherit shopping_mall on types[]", () => {
    const kiosk = place({
      id: "beutea",
      displayName: { text: "Beutea" },
      primaryType: "service",
      types: ["tea_store", "shopping_mall", "food"],
    });
    expect(isMallPlace(kiosk)).toBe(false);
    expect(isNonEateryPlace(kiosk)).toBe(false);
  });

  it("still drops the mall building itself", () => {
    expect(
      isMallPlace(
        place({
          id: "mall",
          displayName: { text: "Hillion" },
          primaryType: "food_court",
        }),
      ),
    ).toBe(true);
    expect(
      isNonEateryPlace(
        place({
          id: "ion",
          displayName: { text: "ION Orchard" },
          primaryType: "shopping_mall",
        }),
      ),
    ).toBe(true);
  });
});

describe("placesToRestaurants", () => {
  it("keeps cuisine-query hits even when the mapped label does not match", () => {
    const rows = placesToRestaurants(
      [
        place({
          id: "dumpling",
          displayName: { text: "The Dumpling Place" },
          primaryType: "dumpling_restaurant",
          primaryTypeDisplayName: { text: "Dumpling restaurant" },
        }),
      ],
      {
        areaId: "bugis",
        selected: ["Chinese"],
        foodKind: "meal",
        priceFilter: "any",
      },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("The Dumpling Place");
  });

  it("keeps unpriced hawkers on $ and drops them on $$", () => {
    const stall = place({
      id: "hawker",
      displayName: { text: "Chicken Rice Stall" },
      primaryType: "food_court",
    });
    const cheap = placesToRestaurants([stall], {
      areaId: "maxwell",
      selected: [],
      foodKind: "meal",
      priceFilter: "1",
    });
    const mid = placesToRestaurants([stall], {
      areaId: "maxwell",
      selected: [],
      foodKind: "meal",
      priceFilter: "2",
    });
    expect(cheap).toHaveLength(1);
    expect(mid).toHaveLength(0);
  });

  it("maps mall tea kiosks into a drinks shortlist", () => {
    const rows = placesToRestaurants(
      [
        place({
          id: "beutea",
          displayName: { text: "Beutea" },
          primaryType: "service",
          types: ["tea_store", "shopping_mall"],
        }),
      ],
      {
        areaId: "harbourfront",
        selected: [],
        foodKind: "drinks",
        priceFilter: "any",
      },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Beutea");
  });
});

describe("non-eatery Places filtering", () => {
  it("drops Lakeside park side by name and by park primary type", () => {
    const byName = place({
      id: "lakeside-name",
      displayName: { text: "Lakeside park side" },
      types: ["point_of_interest", "establishment"],
    });
    const byType = place({
      id: "lakeside-type",
      displayName: { text: "Lakeside park side" },
      primaryType: "park",
      primaryTypeDisplayName: { text: "Park" },
      types: ["park", "point_of_interest"],
    });
    expect(isNonEateryPlace(byName)).toBe(true);
    expect(isNonEateryPlace(byType)).toBe(true);
    expect(
      placesToRestaurants([byName, byType], {
        areaId: "jurong",
        selected: [],
        foodKind: "meal",
        priceFilter: "any",
      }),
    ).toEqual([]);
  });

  it("drops viewpoints, parking, transit, and lodging", () => {
    const spots = [
      place({
        id: "view",
        displayName: { text: "Marina Barrage viewpoint" },
        primaryType: "observation_deck",
      }),
      place({
        id: "parking",
        displayName: { text: "Jurong Lake carpark" },
        primaryType: "parking",
      }),
      place({
        id: "mrt",
        displayName: { text: "Lakeside MRT" },
        primaryType: "subway_station",
      }),
      place({
        id: "hotel",
        displayName: { text: "Park Hotel Clarke Quay" },
        primaryType: "lodging",
      }),
    ];
    for (const spot of spots) {
      expect(isNonEateryPlace(spot)).toBe(true);
    }
    expect(
      placesToRestaurants(spots, {
        areaId: "singapore",
        selected: [],
        foodKind: "meal",
        priceFilter: "any",
      }),
    ).toEqual([]);
  });

  it("drops closed businesses and never-open hours, but keeps lunch-break OPERATIONAL spots", () => {
    expect(
      isNonEateryPlace(
        place({
          id: "perm",
          displayName: { text: "Old Noodle House" },
          primaryType: "chinese_restaurant",
          businessStatus: "CLOSED_PERMANENTLY",
        }),
      ),
    ).toBe(true);
    expect(
      isNonEateryPlace(
        place({
          id: "temp",
          displayName: { text: "Renovation Cafe" },
          primaryType: "cafe",
          businessStatus: "CLOSED_TEMPORARILY",
        }),
      ),
    ).toBe(true);
    expect(
      isNonEateryPlace(
        place({
          id: "unknown-closed",
          displayName: { text: "Mystery Shop" },
          primaryType: "restaurant",
          businessStatus: "BUSINESS_STATUS_UNSPECIFIED",
        }),
      ),
    ).toBe(true);
    expect(
      isNonEateryPlace(
        place({
          id: "never-open",
          displayName: { text: "Boarded Up Stall" },
          primaryType: "restaurant",
          regularOpeningHours: { periods: [] },
        }),
      ),
    ).toBe(true);

    const lunchBreak = place({
      id: "open-later",
      displayName: { text: "Lunch Only Noodles" },
      primaryType: "chinese_restaurant",
      businessStatus: "OPERATIONAL",
      regularOpeningHours: {
        openNow: false,
        periods: [{ open: { day: 1, hour: 11 }, close: { day: 1, hour: 15 } }],
        weekdayDescriptions: ["Monday: 11:00 AM – 3:00 PM"],
      },
    });
    expect(isNonEateryPlace(lunchBreak)).toBe(false);
    expect(
      placesToRestaurants([lunchBreak], {
        areaId: "maxwell",
        selected: [],
        foodKind: "meal",
        priceFilter: "any",
      }),
    ).toHaveLength(1);
  });

  it("keeps real cafes, restaurants, hawkers, park food centres, and drink chains", () => {
    const keepers = [
      place({
        id: "cafe",
        displayName: { text: "Parkside Cafe" },
        primaryType: "cafe",
        businessStatus: "OPERATIONAL",
      }),
      place({
        id: "resto",
        displayName: { text: "Joo Chiat Restaurant" },
        primaryType: "chinese_restaurant",
        businessStatus: "OPERATIONAL",
      }),
      place({
        id: "hawker",
        displayName: { text: "Maxwell Food Centre" },
        primaryType: "food_court",
      }),
      place({
        id: "park-hawker",
        displayName: { text: "East Coast Park Food Centre" },
        primaryType: "park",
        types: ["park", "food_court"],
      }),
      place({
        id: "chagee",
        displayName: { text: "CHAGEE" },
        primaryType: "cafe",
      }),
      place({
        id: "gongcha",
        displayName: { text: "Gong Cha Hillion" },
        primaryType: "restaurant",
        types: ["restaurant", "shopping_mall"],
      }),
    ];
    for (const spot of keepers) {
      expect(isNonEateryPlace(spot)).toBe(false);
    }

    const meal = placesToRestaurants(keepers, {
      areaId: "singapore",
      selected: [],
      foodKind: "meal",
      priceFilter: "any",
    });
    const drinks = placesToRestaurants(keepers, {
      areaId: "singapore",
      selected: [],
      foodKind: "drinks",
      priceFilter: "any",
    });
    expect(meal.map((r) => r.name)).toEqual([
      "Joo Chiat Restaurant",
      "Maxwell Food Centre",
      "East Coast Park Food Centre",
    ]);
    expect(drinks.map((r) => r.name)).toEqual([
      "Parkside Cafe",
      "CHAGEE",
      "Gong Cha Hillion",
    ]);
  });
});

describe("Places field mask for Nearby + Text Search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests status, types, and hours on both Nearby and Text Search without extra fan-out", async () => {
    expect(PLACES_SEARCH_FIELD_MASK).toContain("places.businessStatus");
    expect(PLACES_SEARCH_FIELD_MASK).toContain("places.primaryType");
    expect(PLACES_SEARCH_FIELD_MASK).toContain("places.types");
    expect(PLACES_SEARCH_FIELD_MASK).toContain("places.regularOpeningHours");

    const here = { latitude: 1.33, longitude: 103.73 };
    const lakeside = place({
      id: "lakeside-park-side",
      displayName: { text: "Lakeside park side" },
      primaryType: "park",
      types: ["park"],
      businessStatus: "OPERATIONAL",
      location: here,
    });
    const hawker = place({
      id: "hawker",
      displayName: { text: "Chicken Rice Stall" },
      primaryType: "food_court",
      businessStatus: "OPERATIONAL",
      location: here,
    });

    const masks: string[] = [];
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL, init?: RequestInit) => {
        urls.push(String(url));
        const headers = new Headers(init?.headers);
        masks.push(headers.get("X-Goog-FieldMask") ?? "");
        return {
          ok: true,
          json: async () => ({ places: [lakeside, hawker] }),
        };
      }),
    );

    const nearby = await fetchNearbyFoodPlaces({
      apiKey: "test",
      lat: 1.33,
      lng: 103.73,
      radiusMeters: 1500,
      areaId: "jurong",
      foodKind: "meal",
    });
    const text = await fetchThinShortlistFallback({
      apiKey: "test",
      lat: 1.33,
      lng: 103.73,
      radiusMeters: 1500,
      areaId: "jurong",
      areaName: "Jurong East",
      priceFilter: "any",
      foodKind: "meal",
    });

    expect(urls.some((u) => u.includes("searchNearby"))).toBe(true);
    expect(urls.some((u) => u.includes("searchText"))).toBe(true);
    expect(urls).toHaveLength(2);
    expect(masks.length).toBe(2);
    for (const mask of masks) {
      expect(mask).toBe(PLACES_SEARCH_FIELD_MASK);
    }
    expect(nearby.map((r) => r.name)).toEqual(["Chicken Rice Stall"]);
    expect(text.map((r) => r.name)).toEqual(["Chicken Rice Stall"]);
  });
});
