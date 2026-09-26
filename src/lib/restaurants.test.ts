import { describe, expect, it } from "vitest";
import { mulberry32 } from "./random";
import { filterRestaurants, locationChipLabel, pickWheelCandidates } from "./restaurants";
import { MIN_WHEEL_CANDIDATES } from "./shortlist";
import { pickSpinWinner } from "./spin-reel";
import type { CompleteFilters, Restaurant } from "./types";

const orchard = { lat: 1.3048, lng: 103.8318 };

function spot(
  id: string,
  lat: number,
  lng: number,
  extra: Partial<Restaurant> = {},
): Restaurant {
  return {
    id,
    name: id,
    area: "orchard",
    cuisine: "Chinese",
    priceLevel: 1,
    lat,
    lng,
    address: "Orchard",
    googleMapsQuery: id,
    ...extra,
  };
}

const walk500: CompleteFilters = {
  kind: "meal",
  cuisines: ["any"],
  price: "any",
  reach: "walk",
  walkRadius: "500",
};

describe("filterRestaurants walk caps", () => {
  it("drops places beyond the chosen walk cap even if Nearby returned them", () => {
    const catalog = [
      spot("near", orchard.lat + 0.001, orchard.lng),
      spot("far", orchard.lat + 0.02, orchard.lng),
    ];
    const pool = filterRestaurants(
      { type: "geo", lat: orchard.lat, lng: orchard.lng },
      walk500,
      catalog,
    );
    expect(pool.map((p) => p.id)).toEqual(["near"]);
  });

  it("keeps neighbourhood anywhere results without a distance cap", () => {
    const catalog = [spot("far", 1.4, 103.9)];
    const pool = filterRestaurants(
      { type: "area", areaId: "orchard" },
      { ...walk500, reach: "anywhere", walkRadius: null },
      catalog,
    );
    expect(pool).toHaveLength(1);
  });
});

describe("pickWheelCandidates", () => {
  it("returns the whole pool when it is already a shortlist", () => {
    const pool = [spot("a", 1.3, 103.8), spot("b", 1.3, 103.8)];
    expect(pickWheelCandidates(pool, 10)).toHaveLength(2);
    expect(pickWheelCandidates(pool, 10).length).toBeGreaterThanOrEqual(
      MIN_WHEEL_CANDIDATES,
    );
  });

  it("does not invent extra names when the pool is a single place", () => {
    expect(pickWheelCandidates([spot("only", 1.3, 103.8)], 10)).toHaveLength(1);
  });

  it("is not stuck on the distance-ranked prefix, and first picks spread across the pool", () => {
    const pool = Array.from({ length: 20 }, (_, i) => spot(`p${i}`, 1.3, 103.8));
    const prefix = pool
      .slice(0, 10)
      .map((place) => place.id)
      .join("|");
    const rng = mulberry32(42);
    const wins = new Array<number>(pool.length).fill(0);
    const trials = 4000;
    let sawDifferentOrder = false;
    for (let trial = 0; trial < trials; trial++) {
      const shortlist = pickWheelCandidates(pool, 10, rng);
      if (shortlist.map((place) => place.id).join("|") !== prefix) {
        sawDifferentOrder = true;
      }
      const pick = pickSpinWinner(shortlist, { random: rng });
      const index = pool.findIndex((place) => place.id === pick?.winner.id);
      expect(index).toBeGreaterThanOrEqual(0);
      const tally = wins[index];
      if (tally === undefined) throw new Error("missing tally");
      wins[index] = tally + 1;
    }
    expect(sawDifferentOrder).toBe(true);
    const expected = trials / pool.length;
    for (const count of wins) {
      expect(count).toBeGreaterThan(expected * 0.65);
      expect(count).toBeLessThan(expected * 1.45);
    }
  });
});

describe("locationChipLabel", () => {
  it("keeps a neighbourhood or Near you chip, and none before a pick", () => {
    expect(locationChipLabel({ type: "none" })).toBeNull();
    expect(locationChipLabel({ type: "area", areaId: "tiong-bahru" })).toBe(
      "Tiong Bahru",
    );
    expect(locationChipLabel({ type: "geo", lat: 1.3, lng: 103.8 })).toBe(
      "Near you",
    );
  });
});
