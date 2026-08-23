import { areaName, areas } from "@/lib/restaurants";
import {
  fetchNearbyFoodPlaces,
  SALAD_SEARCH_API_COST,
} from "@/lib/google-places";
import { cuisineUsesTextSearch } from "@/lib/cuisine-types";
import {
  getQuotaStatus,
  tryConsumeQuota,
} from "@/lib/places-quota";
import {
  REACH_KM,
  type PriceFilter,
  type Restaurant,
} from "@/lib/types";

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

function parsePrice(raw: string | null): PriceFilter {
  if (raw === "1" || raw === "2" || raw === "3" || raw === "any") return raw;
  return "any";
}

function apiCost(cuisines: string[]): number {
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
  const price = parsePrice(url.searchParams.get("price"));
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
    // Bucket to ~100m so nearby GPS users share the 24h cache.
    const lat = Number(Number(latParam).toFixed(3));
    const lng = Number(Number(lngParam).toFixed(3));
    center = { lat, lng };
    areaKey = `geo-${lat.toFixed(3)}-${lng.toFixed(3)}`;
    resolvedAreaId = areaKey;
    resolvedAreaName = "near me";
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

  const cacheKey = `${areaKey}:${radiusMeters}:${price}:${cuisines.sort().join("|") || "all"}`;
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

  const consumed = await tryConsumeQuota(apiCost(cuisines));
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
      priceFilter: price,
    });

    if (!places.length) {
      const priceHint =
        price === "any"
          ? ""
          : price === "1"
            ? "$ "
            : price === "2"
              ? "$$ "
              : "$$$ ";
      return Response.json({
        places: [],
        source: "places",
        area: areaKey,
        quota: quotaPayload(consumed),
        message: cuisines.length
          ? `No ${priceHint}${cuisines.join(" / ")} spots found nearby. Try another price or wider reach.`
          : `No ${priceHint || ""}food places found nearby. Try a wider reach or another price.`,
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
