import type { Area } from "./types";

/** Haversine distance in kilometres */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** True if the point is within `radiusKm` of the origin (inclusive). */
export function isWithinRadiusKm(
  originLat: number,
  originLng: number,
  lat: number,
  lng: number,
  radiusKm: number,
): boolean {
  return haversineKm(originLat, originLng, lat, lng) <= radiusKm;
}

/**
 * Bounding box that contains a circle. Text Search (New) `locationRestriction`
 * only accepts a viewport rectangle — not a circle.
 */
export function circleToViewport(
  lat: number,
  lng: number,
  radiusMeters: number,
): {
  low: { latitude: number; longitude: number };
  high: { latitude: number; longitude: number };
} {
  const metersPerLat = 111_320;
  const cos = Math.cos(toRad(lat));
  const metersPerLng = metersPerLat * Math.max(0.2, Math.abs(cos));
  const dLat = radiusMeters / metersPerLat;
  const dLng = radiusMeters / metersPerLng;
  return {
    low: { latitude: lat - dLat, longitude: lng - dLng },
    high: { latitude: lat + dLat, longitude: lng + dLng },
  };
}

export function nearestArea(
  lat: number,
  lng: number,
  areas: Area[],
): Area {
  let best = areas[0];
  let bestDist = Infinity;
  for (const area of areas) {
    const d = haversineKm(lat, lng, area.lat, area.lng);
    if (d < bestDist) {
      bestDist = d;
      best = area;
    }
  }
  return best;
}
