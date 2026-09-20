import { areaName, areas } from "@/lib/restaurants";
import {
  DRINKS_SEARCH_API_COST,
  fetchNearbyFoodPlaces,
  fetchThinShortlistFallback,
  SALAD_SEARCH_API_COST,
} from "@/lib/google-places";
import { cuisineUsesTextSearch } from "@/lib/cuisine-types";
import {
  getQuotaStatus,
  tryConsumeQuota,
} from "@/lib/places-quota";
import {
  emptyPlacesMessage,
  needsThinFallback,
} from "@/lib/shortlist";
import {
  REACH_KM,
  matchesPriceFilter,
  type FoodKind,
  type PriceFilter,
  type Restaurant,
} from "@/lib/types";

export const runtime = "nodejs";

type CacheEntry = {
  places: Restaurant[];
  expires: number;
  fallbackAttempted: boolean;
};
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

function parseKind(raw: string | null): FoodKind {
  if (raw === "snack" || raw === "drinks" || raw === "meal") return raw;
  return "meal";
}

function parsePrice(raw: string | null): PriceFilter {
  if (raw === "1" || raw === "2" || raw === "3" || raw === "any") return raw;
  return "any";
}

function apiCost(kind: FoodKind, cuisines: string[]): number {
  if (kind === "drinks") return DRINKS_SEARCH_API_COST;
  if (cuisines.some((c) => cuisineUsesTextSearch([c]))) {
    return SALAD_SEARCH_API_COST;
  }
  return 1;
}

function filterByPrice(places: Restaurant[], price: PriceFilter): Restaurant[] {
  return places.filter((p) => matchesPriceFilter(p.priceLevel, price));
}

function mergePlaces(
  current: Restaurant[],
  extra: Restaurant[],
): Restaurant[] {
  const byId = new Map<string, Restaurant>();
  for (const p of current) byId.set(p.id, p);
  for (const p of extra) byId.set(p.id, p);
  return [...byId.values()];
}

function jsonPlaces(
  places: Restaurant[],
  extra: {
    source: string;
    areaKey: string;
    quota: ReturnType<typeof quotaPayload>;
    price: PriceFilter;
    kind: FoodKind;
    cuisines: string[];
  },
) {
  if (!places.length) {
    return Response.json({
      places: [],
      source: extra.source,
      area: extra.areaKey,
      quota: extra.quota,
      message: emptyPlacesMessage(extra.price, extra.kind, extra.cuisines),
    });
  }
  return Response.json({
    places,
    source: extra.source,
    area: extra.areaKey,
    quota: extra.quota,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const areaId = url.searchParams.get("areaId");
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const reach = url.searchParams.get("reach") ?? "short";
  const price = parsePrice(url.searchParams.get("price"));
  const kind = parseKind(url.searchParams.get("kind"));
  const cuisinesParam = url.searchParams.get("cuisines") ?? "";
  const cuisines =
    kind === "meal"
      ? cuisinesParam
        ? cuisinesParam.split(",").map((c) => c.trim()).filter(Boolean)
        : []
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

  // Price is applied after fetch — Google Nearby ignores priceLevels and
  // returns the same 20 spots for $ and Any.
  const cacheKey = `${areaKey}:${radiusMeters}:${kind}:${cuisines.sort().join("|") || "all"}`;
  const cached = cache.get(cacheKey);
  let quota = await getQuotaStatus();

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const fallbackOpts = {
    apiKey: apiKey ?? "",
    lat: center.lat,
    lng: center.lng,
    radiusMeters,
    areaId: resolvedAreaId,
    areaName: resolvedAreaName ?? areaName(resolvedAreaId),
    cuisines,
    priceFilter: price,
    foodKind: kind,
  };

  async function maybeFallback(
    catalog: Restaurant[],
    alreadyAttempted: boolean,
  ): Promise<{ places: Restaurant[]; catalog: Restaurant[]; attempted: boolean; source: string }> {
    const priced = filterByPrice(catalog, price);
    if (!needsThinFallback(priced.length) || alreadyAttempted) {
      return {
        places: priced,
        catalog,
        attempted: alreadyAttempted,
        source: "cache",
      };
    }
    if (!apiKey) {
      return {
        places: priced,
        catalog,
        attempted: true,
        source: "none",
      };
    }
    const extra = await tryConsumeQuota(1);
    quota = extra;
    if (!extra.allowed) {
      return {
        places: priced,
        catalog,
        attempted: true,
        source: "quota",
      };
    }
    try {
      const more = await fetchThinShortlistFallback(fallbackOpts);
      const merged = mergePlaces(catalog, more);
      return {
        places: filterByPrice(merged, price),
        catalog: merged,
        attempted: true,
        source: "places",
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google Places request failed";
      console.error("[api/places] thin fallback", message);
      return {
        places: priced,
        catalog,
        attempted: true,
        source: "error",
      };
    }
  }

  if (cached && cached.expires > Date.now()) {
    const next = await maybeFallback(cached.places, cached.fallbackAttempted);
    cache.set(cacheKey, {
      places: next.catalog,
      expires: cached.expires,
      fallbackAttempted: next.attempted,
    });
    return jsonPlaces(next.places, {
      source: next.source === "places" ? "places" : "cache",
      areaKey,
      quota: quotaPayload(quota),
      price,
      kind,
      cuisines,
    });
  }

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

  const consumed = await tryConsumeQuota(apiCost(kind, cuisines));
  quota = consumed;
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
    const catalog = await fetchNearbyFoodPlaces({
      apiKey,
      lat: center.lat,
      lng: center.lng,
      radiusMeters,
      areaId: resolvedAreaId,
      areaName: resolvedAreaName ?? areaName(resolvedAreaId),
      cuisines,
      foodKind: kind,
    });

    const next = await maybeFallback(catalog, false);
    cache.set(cacheKey, {
      places: next.catalog,
      expires: Date.now() + TTL_MS,
      fallbackAttempted: next.attempted,
    });

    return jsonPlaces(next.places, {
      source: "places",
      areaKey,
      quota: quotaPayload(quota),
      price,
      kind,
      cuisines,
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
        quota: quotaPayload(quota),
        message,
      },
      { status: 502 },
    );
  }
}
