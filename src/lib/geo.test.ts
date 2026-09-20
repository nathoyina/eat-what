import { describe, expect, it } from "vitest";
import { circleToViewport, haversineKm, isWithinRadiusKm } from "./geo";

describe("geo helpers", () => {
  it("measures a known Singapore-scale distance", () => {
    const km = haversineKm(1.3048, 103.8318, 1.3006, 103.8385);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(1.2);
  });

  it("clips fallback results to the requested radius", () => {
    expect(isWithinRadiusKm(1.3, 103.8, 1.3, 103.8, 0.5)).toBe(true);
    expect(isWithinRadiusKm(1.3, 103.8, 1.32, 103.8, 0.5)).toBe(false);
  });

  it("builds a viewport that contains the search circle", () => {
    const lat = 1.3521;
    const lng = 103.8198;
    const radius = 1500;
    const box = circleToViewport(lat, lng, radius);
    expect(box.low.latitude).toBeLessThan(lat);
    expect(box.high.latitude).toBeGreaterThan(lat);
    expect(box.low.longitude).toBeLessThan(lng);
    expect(box.high.longitude).toBeGreaterThan(lng);
    const cornerKm = haversineKm(
      lat,
      lng,
      box.high.latitude,
      box.high.longitude,
    );
    expect(cornerKm).toBeGreaterThan(1.5);
  });
});
