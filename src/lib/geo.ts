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
