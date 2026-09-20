import { describe, expect, it } from "vitest";
import {
  emptyPlacesMessage,
  fallbackTextQuery,
  googlePriceLevels,
  MIN_WHEEL_CANDIDATES,
  needsThinFallback,
  shouldSendPriceLevels,
  walkRadiusLabel,
  walkThinMessage,
} from "./shortlist";

describe("needsThinFallback", () => {
  it("triggers below the wheel minimum, including a single leftover spot", () => {
    expect(MIN_WHEEL_CANDIDATES).toBe(2);
    expect(needsThinFallback(0)).toBe(true);
    expect(needsThinFallback(1)).toBe(true);
    expect(needsThinFallback(2)).toBe(false);
    expect(needsThinFallback(20)).toBe(false);
  });
});

describe("fallbackTextQuery", () => {
  it("biases $ meals toward hawker / food court language", () => {
    expect(
      fallbackTextQuery({
        kind: "meal",
        cuisines: ["Chinese"],
        price: "1",
        areaName: "Tampines",
      }),
    ).toMatch(/Chinese hawker food court cheap eats near Tampines Singapore/i);
  });

  it("uses cuisine + restaurant for $$ / $$$ meals", () => {
    expect(
      fallbackTextQuery({
        kind: "meal",
        cuisines: ["Japanese"],
        price: "2",
        areaName: "Orchard",
      }),
    ).toMatch(/Japanese restaurant near Orchard Singapore/i);
  });

  it("searches tea / cafe for drinks without going island-wide", () => {
    const q = fallbackTextQuery({
      kind: "drinks",
      cuisines: [],
      price: "1",
      areaName: "near me",
    });
    expect(q).toMatch(/bubble tea cafe juice bar/i);
    expect(q).toMatch(/Singapore/i);
  });

  it("searches dessert language for snacks", () => {
    expect(
      fallbackTextQuery({
        kind: "snack",
        cuisines: [],
        price: "any",
        areaName: "Bugis",
      }),
    ).toMatch(/dessert bakery ice cream/i);
  });
});

describe("price level fallback flags", () => {
  it("sends Google priceLevels only for $$ and $$$ so $ can keep unpriced stalls", () => {
    expect(shouldSendPriceLevels("1")).toBe(false);
    expect(shouldSendPriceLevels("any")).toBe(false);
    expect(shouldSendPriceLevels("2")).toBe(true);
    expect(shouldSendPriceLevels("3")).toBe(true);
    expect(googlePriceLevels("2")).toEqual(["PRICE_LEVEL_MODERATE"]);
    expect(googlePriceLevels("3")).toEqual([
      "PRICE_LEVEL_EXPENSIVE",
      "PRICE_LEVEL_VERY_EXPENSIVE",
    ]);
  });
});

describe("empty and walk-thin copy", () => {
  it("names the price band and cuisine when nothing comes back", () => {
    expect(emptyPlacesMessage("2", "meal", ["Seafood"])).toMatch(
      /No \$\$ Seafood spots found nearby/i,
    );
    expect(emptyPlacesMessage("1", "drinks", [])).toMatch(
      /No \$ drink places found nearby/i,
    );
  });

  it("explains a tight walk cap when the 1.5 km fetch had enough spots", () => {
    expect(walkRadiusLabel("500")).toBe("500 m");
    expect(
      walkThinMessage({
        inRange: 0,
        fetched: 12,
        walkLabel: "500 m",
      }),
    ).toMatch(/No spots within 500 m.*12 found a bit further/i);
    expect(
      walkThinMessage({
        inRange: 1,
        fetched: 8,
        walkLabel: "1 km",
      }),
    ).toMatch(/Only 1 spot within 1 km/i);
  });

  it("stays quiet when the fetch itself was thin", () => {
    expect(
      walkThinMessage({ inRange: 0, fetched: 0, walkLabel: "500 m" }),
    ).toBeNull();
    expect(
      walkThinMessage({ inRange: 1, fetched: 1, walkLabel: "500 m" }),
    ).toBeNull();
    expect(
      walkThinMessage({ inRange: 5, fetched: 12, walkLabel: "500 m" }),
    ).toBeNull();
  });
});
