import { haversineKm } from "./geo";
import type { Area, LocationMode } from "./types";

/** Average walking speed used for the ResultCard walk label. 500 m → 6 min. */
export const WALK_KM_PER_HOUR = 5;

export function formatRatingLabel(
  rating: number | null | undefined,
): string | null {
  if (typeof rating !== "number" || !Number.isFinite(rating) || rating <= 0) {
    return null;
  }
  return rating.toFixed(1);
}

export function formatOpenLabel(
  openNow: boolean | null | undefined,
): string | null {
  if (openNow === true) return "Open";
  if (openNow === false) return "Closed";
  return null;
}

export function formatWalkLabel(
  distanceKm: number | null | undefined,
): string | null {
  if (
    typeof distanceKm !== "number" ||
    !Number.isFinite(distanceKm) ||
    distanceKm < 0
  ) {
    return null;
  }
  const minutes = Math.max(1, Math.round((distanceKm / WALK_KM_PER_HOUR) * 60));
  return `${minutes} min walk`;
}

export function formatConfidenceLine(parts: {
  rating?: number | null;
  walkLabel?: string | null;
  openNow?: boolean | null;
}): string | null {
  const bits = [
    formatRatingLabel(parts.rating),
    parts.walkLabel?.trim() || null,
    formatOpenLabel(parts.openNow),
  ].filter((bit): bit is string => Boolean(bit));
  return bits.length ? bits.join(" · ") : null;
}

export function originFromLocation(
  location: LocationMode,
  areaList: Area[],
): { lat: number; lng: number } | null {
  if (location.type === "geo") {
    return { lat: location.lat, lng: location.lng };
  }
  if (location.type === "area") {
    const area = areaList.find((a) => a.id === location.areaId);
    return area ? { lat: area.lat, lng: area.lng } : null;
  }
  return null;
}

export function walkLabelFromOrigin(
  origin: { lat: number; lng: number } | null,
  spot: { lat: number; lng: number } | null | undefined,
): string | null {
  if (!origin || !spot) return null;
  return formatWalkLabel(
    haversineKm(origin.lat, origin.lng, spot.lat, spot.lng),
  );
}

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export function buildSharePayload(opts: {
  name: string;
  line?: string | null;
  url: string;
}): SharePayload {
  const line = opts.line?.trim();
  return {
    title: opts.name,
    text: line ? `${opts.name} · ${line}` : opts.name,
    url: opts.url,
  };
}

export function formatShareClipboard(payload: SharePayload): string {
  return `${payload.text}\n${payload.url}`;
}

export type ShareOutcome = "shared" | "copied" | "aborted" | "failed";

export async function shareResult(
  payload: SharePayload,
): Promise<ShareOutcome> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "aborted";
      }
    }
  }

  try {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.clipboard?.writeText !== "function"
    ) {
      return "failed";
    }
    await navigator.clipboard.writeText(formatShareClipboard(payload));
    return "copied";
  } catch {
    return "failed";
  }
}
