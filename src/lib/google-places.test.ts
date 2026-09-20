import { describe, expect, it } from "vitest";
import {
  classifyFoodKind,
  isMallPlace,
  isNonEateryPlace,
  placesToRestaurants,
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
