import { describe, expect, it } from "vitest";
import {
  ACTIVATION_DEFAULT_FILTERS,
  distanceInReach,
  filtersComplete,
  formatPriceLabel,
  matchesPriceFilter,
  reelPriceSymbols,
  toCompleteFilters,
  withActivationDefaults,
  type Filters,
} from "./types";

describe("reelPriceSymbols / formatPriceLabel", () => {
  it("uses the same $–$$$$ symbols on the reel and ResultCard", () => {
    expect(reelPriceSymbols(1)).toBe("$");
    expect(reelPriceSymbols(3)).toBe("$$$");
    expect(formatPriceLabel(1)).toMatch(/^\$ /);
    expect(formatPriceLabel(3, "S$40–80")).toBe("$$$ · S$40–80");
  });

  it("hides missing prices instead of showing Price n/a", () => {
    expect(reelPriceSymbols(null)).toBeNull();
    expect(formatPriceLabel(null)).toBeNull();
    expect(formatPriceLabel(undefined)).toBeNull();
    expect(formatPriceLabel(null)?.includes("n/a") ?? false).toBe(false);
  });
});

describe("matchesPriceFilter", () => {
  it("lets any price through, including unpriced", () => {
    expect(matchesPriceFilter(null, "any")).toBe(true);
    expect(matchesPriceFilter(2, "any")).toBe(true);
  });

  it("counts unpriced hawker-style stalls as $", () => {
    expect(matchesPriceFilter(null, "1")).toBe(true);
    expect(matchesPriceFilter(1, "1")).toBe(true);
    expect(matchesPriceFilter(2, "1")).toBe(false);
  });

  it("does not put unpriced stalls in $$ or $$$", () => {
    expect(matchesPriceFilter(null, "2")).toBe(false);
    expect(matchesPriceFilter(null, "3")).toBe(false);
    expect(matchesPriceFilter(2, "2")).toBe(true);
    expect(matchesPriceFilter(3, "3")).toBe(true);
    expect(matchesPriceFilter(4, "3")).toBe(true);
  });
});

describe("distanceInReach", () => {
  it("treats walk options as max caps with no lower bound", () => {
    expect(distanceInReach(0.2, { reach: "walk", walkRadius: "500" })).toBe(
      true,
    );
    expect(distanceInReach(0.51, { reach: "walk", walkRadius: "500" })).toBe(
      false,
    );
    expect(distanceInReach(0.51, { reach: "walk", walkRadius: "1000" })).toBe(
      true,
    );
    expect(distanceInReach(1.4, { reach: "walk", walkRadius: "1500" })).toBe(
      true,
    );
    expect(distanceInReach(1.6, { reach: "walk", walkRadius: "1500" })).toBe(
      false,
    );
  });

  it("keeps short ride at 5 km and anywhere unbounded", () => {
    expect(distanceInReach(4.9, { reach: "short", walkRadius: null })).toBe(
      true,
    );
    expect(distanceInReach(5.1, { reach: "short", walkRadius: null })).toBe(
      false,
    );
    expect(distanceInReach(80, { reach: "anywhere", walkRadius: null })).toBe(
      true,
    );
  });
});

describe("filtersComplete", () => {
  const base: Filters = {
    kind: "meal",
    cuisines: ["any"],
    price: "any",
    reach: "short",
    walkRadius: null,
  };

  it("requires walk radius only for walk reach", () => {
    expect(filtersComplete({ ...base, reach: "walk", walkRadius: null })).toBe(
      false,
    );
    expect(
      filtersComplete({ ...base, reach: "walk", walkRadius: "500" }),
    ).toBe(true);
    expect(filtersComplete(base)).toBe(true);
  });

  it("does not require cuisine for snacks or drinks", () => {
    expect(
      filtersComplete({ ...base, kind: "drinks", cuisines: null }),
    ).toBe(true);
    expect(filtersComplete({ ...base, kind: "snack", cuisines: null })).toBe(
      true,
    );
    expect(filtersComplete({ ...base, kind: "meal", cuisines: null })).toBe(
      false,
    );
  });

  it("builds complete filters with any cuisine for drinks", () => {
    const complete = toCompleteFilters({
      ...base,
      kind: "drinks",
      cuisines: null,
    });
    expect(complete?.cuisines).toEqual(["any"]);
    expect(complete?.kind).toBe("drinks");
  });
});

describe("activation defaults (experiment A)", () => {
  const empty: Filters = {
    kind: null,
    cuisines: null,
    price: null,
    reach: null,
    walkRadius: null,
  };

  it("pre-fills Meal · Short ride · Any price · Any cuisine after a location pick", () => {
    expect(ACTIVATION_DEFAULT_FILTERS).toEqual({
      kind: "meal",
      cuisines: ["any"],
      price: "any",
      reach: "short",
      walkRadius: null,
    });
    const filled = withActivationDefaults(empty);
    expect(filled).toEqual(ACTIVATION_DEFAULT_FILTERS);
    expect(filtersComplete(filled)).toBe(true);
    expect(toCompleteFilters(filled)).toEqual({
      kind: "meal",
      cuisines: ["any"],
      price: "any",
      reach: "short",
      walkRadius: null,
    });
  });

  it("keeps Short ride as reach=short with walkRadius null, not walk", () => {
    expect(withActivationDefaults(empty).walkRadius).toBeNull();
    expect(
      withActivationDefaults({ ...empty, reach: "short", walkRadius: "500" }),
    ).toEqual({
      ...ACTIVATION_DEFAULT_FILTERS,
      walkRadius: null,
    });
  });

  it("does not overwrite filters the user already chose", () => {
    const custom: Filters = {
      kind: "drinks",
      cuisines: null,
      price: "2",
      reach: "walk",
      walkRadius: "1000",
    };
    expect(withActivationDefaults(custom)).toEqual(custom);
    expect(
      withActivationDefaults({
        ...empty,
        kind: "meal",
        cuisines: ["Japanese"],
      }),
    ).toEqual({
      kind: "meal",
      cuisines: ["Japanese"],
      price: "any",
      reach: "short",
      walkRadius: null,
    });
  });

  it("leaves walk incomplete until a radius is picked", () => {
    expect(
      filtersComplete(
        withActivationDefaults({ ...empty, reach: "walk" }),
      ),
    ).toBe(false);
  });
});
