import { describe, expect, it } from "vitest";
import {
  ANY_CUISINE_LABEL,
  applyRecoveryAction,
  EMPTY_SPOTS_COPY,
  emptyPlacesMessage,
  fallbackTextQuery,
  googlePriceLevels,
  MIN_WHEEL_CANDIDATES,
  needsThinFallback,
  nextWiderReach,
  recoveryUi,
  shouldSendPriceLevels,
  shouldShowAnyCuisineChip,
  SINGLE_SPOT_BODY,
  SINGLE_SPOT_HEADING,
  TAKE_THIS_SPOT_LABEL,
  walkRadiusLabel,
  walkThinMessage,
  WIDEN_REACH_LABEL,
} from "./shortlist";
import type { Filters } from "./types";

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

const mealFilters: Filters = {
  kind: "meal",
  cuisines: ["Chinese"],
  price: "1",
  reach: "walk",
  walkRadius: "500",
};

describe("empty / single-spot recovery UX", () => {
  it("locks Design Partner copy for 0 and 1 in-range spots", () => {
    expect(EMPTY_SPOTS_COPY).toBe(
      "Not enough spots nearby. Widen reach or loosen cuisine.",
    );
    expect(SINGLE_SPOT_HEADING).toBe("Only one spot in range");
    expect(SINGLE_SPOT_BODY).toBe("No spin needed — this is your makan.");
    expect(TAKE_THIS_SPOT_LABEL).toBe("Take this spot");
    expect(WIDEN_REACH_LABEL).toBe("Widen reach");
    expect(ANY_CUISINE_LABEL).toBe("Any cuisine");
  });

  it("uses one shared empty line and chips when count is 0", () => {
    const ui = recoveryUi({ count: 0, filters: mealFilters });
    expect(ui.variant).toBe("empty");
    if (ui.variant !== "empty") return;
    expect(ui.copy).toBe(EMPTY_SPOTS_COPY);
    expect(ui.showWidenReach).toBe(true);
    expect(ui.canWidenReach).toBe(true);
    expect(ui.showAnyCuisine).toBe(true);
    expect(ui.widenLabel).toBe("Widen reach");
    expect(ui.anyCuisineLabel).toBe("Any cuisine");
  });

  it("hides Any cuisine when cuisine is already Any, including snacks/drinks", () => {
    expect(
      shouldShowAnyCuisineChip({ kind: "meal", cuisines: ["any"] }),
    ).toBe(false);
    expect(shouldShowAnyCuisineChip({ kind: "meal", cuisines: null })).toBe(
      false,
    );
    expect(
      shouldShowAnyCuisineChip({ kind: "drinks", cuisines: null }),
    ).toBe(false);
    expect(
      shouldShowAnyCuisineChip({ kind: "snack", cuisines: ["Dessert"] }),
    ).toBe(false);

    const ui = recoveryUi({
      count: 0,
      filters: { ...mealFilters, cuisines: ["any"] },
    });
    expect(ui.variant === "empty" && ui.showAnyCuisine).toBe(false);
  });

  it("upgrades the single leftover spot to locked heading, body, and CTAs", () => {
    const ui = recoveryUi({ count: 1, filters: mealFilters });
    expect(ui).toEqual({
      variant: "single",
      heading: "Only one spot in range",
      body: "No spin needed — this is your makan.",
      takeLabel: "Take this spot",
      widenLabel: "Widen reach",
      canWidenReach: true,
    });
  });

  it("keeps a normal wheel once there are two spots", () => {
    expect(recoveryUi({ count: 2, filters: mealFilters }).variant).toBe(
      "wheel",
    );
  });

  it("widens reach 500 m → 1 km → 1.5 km → short ride → anywhere", () => {
    expect(nextWiderReach({ reach: "walk", walkRadius: "500" })).toEqual({
      reach: "walk",
      walkRadius: "1000",
    });
    expect(nextWiderReach({ reach: "walk", walkRadius: "1000" })).toEqual({
      reach: "walk",
      walkRadius: "1500",
    });
    expect(nextWiderReach({ reach: "walk", walkRadius: "1500" })).toEqual({
      reach: "short",
      walkRadius: null,
    });
    expect(nextWiderReach({ reach: "short", walkRadius: null })).toEqual({
      reach: "anywhere",
      walkRadius: null,
    });
    expect(nextWiderReach({ reach: "anywhere", walkRadius: null })).toBeNull();
  });

  it("applies Widen reach and Any cuisine without touching other filters", () => {
    const widened = applyRecoveryAction(mealFilters, "widen-reach");
    expect(widened).toEqual({
      ...mealFilters,
      reach: "walk",
      walkRadius: "1000",
    });

    const anyCuisine = applyRecoveryAction(mealFilters, "any-cuisine");
    expect(anyCuisine).toEqual({ ...mealFilters, cuisines: ["any"] });

    const maxed: Filters = {
      ...mealFilters,
      reach: "anywhere",
      walkRadius: null,
      cuisines: ["any"],
    };
    expect(applyRecoveryAction(maxed, "widen-reach")).toBe(maxed);
    expect(applyRecoveryAction(maxed, "any-cuisine")).toBe(maxed);
    const emptyMax = recoveryUi({ count: 0, filters: maxed });
    expect(emptyMax.variant).toBe("empty");
    if (emptyMax.variant === "empty") {
      expect(emptyMax.canWidenReach).toBe(false);
      expect(emptyMax.showAnyCuisine).toBe(false);
    }
  });
});
