/** Places photo resource: `places/{placeId}/photos/{photo_reference}`. */
export const PLACE_PHOTO_NAME_PATTERN =
  /^places\/[A-Za-z0-9_.-]+\/photos\/[A-Za-z0-9_.-]+$/;

export function parsePlacePhotoName(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\/media\/?$/, "");
  if (!PLACE_PHOTO_NAME_PATTERN.test(name)) return null;
  return name;
}

export function placePhotoSrc(photoName: string): string {
  return `/api/places/photo?name=${encodeURIComponent(photoName)}`;
}

const ALLOWED_PHOTO_HOST_SUFFIXES = [
  "googleusercontent.com",
  "ggpht.com",
] as const;

export function isAllowedPhotoUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    if (url.protocol !== "https:") return false;
    return ALLOWED_PHOTO_HOST_SUFFIXES.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export async function fetchPlacePhotoBytes(opts: {
  apiKey: string;
  photoName: string;
  maxWidthPx?: number;
  maxHeightPx?: number;
}): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const name = parsePlacePhotoName(opts.photoName);
  if (!name) return null;

  const maxWidthPx = opts.maxWidthPx ?? 1200;
  const maxHeightPx = opts.maxHeightPx ?? 900;
  const mediaUrl = new URL(`https://places.googleapis.com/v1/${name}/media`);
  mediaUrl.searchParams.set("maxWidthPx", String(maxWidthPx));
  mediaUrl.searchParams.set("maxHeightPx", String(maxHeightPx));
  mediaUrl.searchParams.set("skipHttpRedirect", "true");

  const mediaRes = await fetch(mediaUrl, {
    headers: { "X-Goog-Api-Key": opts.apiKey },
    cache: "no-store",
  });
  if (!mediaRes.ok) return null;

  const data = (await mediaRes.json()) as { photoUri?: unknown };
  if (typeof data.photoUri !== "string" || !isAllowedPhotoUri(data.photoUri)) {
    return null;
  }

  const imgRes = await fetch(data.photoUri, { cache: "no-store" });
  if (!imgRes.ok) return null;
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;
  const body = await imgRes.arrayBuffer();
  return { body, contentType };
}
