import { areaName, areas } from "@/lib/restaurants";
import {
  fetchNearbyFoodPlaces,
  HAWKER_SEARCH_API_COST,
  SALAD_SEARCH_API_COST,
} from "@/lib/google-places";
import {
  cuisineUsesTextSearch,
  venueUsesTextSearch,
} from "@/lib/cuisine-types";
import {
  getQuotaStatus,
  tryConsumeQuota,
} from "@/lib/places-quota";
import { REACH_KM, type Restaurant, type VenueType } from "@/lib/types";

export const runtime = "nodejs";

type CacheEntry = { places: Restaurant[]; expires: number };
const cache = new Map<string, CacheEntry>();
/** Long cache so repeat spins / reach tweaks hit disk/memory, not Google. */
const TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function quotaPayload(quota: Awaited<ReturnType<typeof getQuotaStatus>>) {
  return {
    used: quota.used,
    cap: quota.cap,
    remaining: quota.remaining,
    month: quota.month,
  };
}

function parseVenue(raw: string | null): VenueType {
  if (raw === "hawker" || raw === "cafe" || raw === "restaurant") return raw;
  return "any";
}

function apiCost(cuisines: string[], venue: VenueType): number {
  if (venueUsesTextSearch(venue)) return HAWKER_SEARCH_API_COST;
  if (cuisines.some((c) => cuisineUsesTextSearch([c]))) {
    return SALAD_SEARCH_API_COST;
  }
  return 1;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const areaId = url.searchParams.get("areaId");
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const reach = url.searchParams.get("reach") ?? "short";
  const venue = parseVenue(url.searchParams.get("venue"));
  const cuisinesParam = url.searchParams.get("cuisines") ?? "";
  const cuisines = cuisinesParam
    ? cuisinesParam.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  let areaKey = "singapore";
  let center = { lat: 1.3521, lng: 103.8198 };
  let resolvedAreaId = "singapore";
  let resolvedAreaName: string | undefined;

  if (areaId) {
    const area = areas.find((a) => a.id === areaId);
    if (!area) {
      return Response.json({ error: "Unknown area" }, { status: 400 });
    }
    areaKey = area.id;
    resolvedAreaId = area.id;
    resolvedAreaName = area.name;
    center = { lat: area.lat, lng: area.lng };
  } else if (latParam && lngParam) {
    center = { lat: Number(latParam), lng: Number(lngParam) };
    areaKey = `geo-${center.lat.toFixed(3)}-${center.lng.toFixed(3)}`;
    resolvedAreaId = areaId ?? areaKey;
  } else {
    return Response.json(
      { error: "Provide areaId or lat & lng" },
      { status: 400 },
    );
  }

  const radiusKm = REACH_KM[reach as keyof typeof REACH_KM];
  const radiusMeters = Math.min(
    50000,
    Math.round((radiusKm ?? 8) * 1000),
  );

  const cacheKey = `${areaKey}:${radiusMeters}:${venue}:${cuisines.sort().join("|") || "all"}`;
  const cached = cache.get(cacheKey);
  const quota = await getQuotaStatus();

  if (cached && cached.expires > Date.now()) {
    return Response.json({
      places: cached.places,
      source: "cache",
      area: areaKey,
      quota: quotaPayload(quota),
    });
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Response.json({
      places: [],
      source: "none",
      area: areaKey,
      quota: quotaPayload(quota),
      message:
        "Add GOOGLE_PLACES_API_KEY to .env.local (enable Places API New in Google Cloud).",
    });
  }

  const consumed = await tryConsumeQuota(apiCost(cuisines, venue));
  if (!consumed.allowed) {
    return Response.json(
      {
        places: [],
        source: "quota",
        area: areaKey,
        quota: quotaPayload(consumed),
        message: `Monthly API cap reached (${consumed.used}/${consumed.cap} calls used). Resets on the 1st of next month. Cached searches still work.`,
      },
      { status: 429 },
    );
  }

  try {
    const places = await fetchNearbyFoodPlaces({
      apiKey,
      lat: center.lat,
      lng: center.lng,
      radiusMeters,
      areaId: resolvedAreaId,
      areaName: resolvedAreaName ?? areaName(resolvedAreaId),
      cuisines,
      venueType: venue,
    });

    if (!places.length) {
      const venueLabel =
        venue === "any"
          ? ""
          : venue === "hawker"
            ? "hawker / food court "
            : `${venue} `;
      return Response.json({
        places: [],
        source: "places",
        area: areaKey,
        quota: quotaPayload(consumed),
        message: cuisines.length
          ? `No ${venueLabel}${cuisines.join(" / ")} spots found nearby. Try wider reach or another filter.`
          : `No ${venueLabel || "food "}places found nearby. Try a wider reach.`,
      });
    }

    cache.set(cacheKey, { places, expires: Date.now() + TTL_MS });

    return Response.json({
      places,
      source: "places",
      area: areaKey,
      quota: quotaPayload(consumed),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google Places request failed";
    console.error("[api/places]", message);
    return Response.json(
      {
        places: [],
        source: "error",
        area: areaKey,
        quota: quotaPayload(consumed),
        message,
      },
      { status: 502 },
    );
  }
}
