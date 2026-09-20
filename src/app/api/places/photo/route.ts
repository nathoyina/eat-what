import { fetchPlacePhotoBytes, parsePlacePhotoName } from "@/lib/place-photo";
import { getPlacesApiKey } from "@/lib/places-env";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = parsePlacePhotoName(url.searchParams.get("name"));
  if (!name) {
    return new Response("Invalid photo", { status: 400 });
  }

  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    return new Response("Photos unavailable", { status: 503 });
  }

  try {
    const photo = await fetchPlacePhotoBytes({ apiKey, photoName: name });
    if (!photo) {
      return new Response("Photo not found", { status: 404 });
    }
    return new Response(photo.body, {
      status: 200,
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Photo request failed";
    console.error("[api/places/photo]", message);
    return new Response("Photo not found", { status: 502 });
  }
}
