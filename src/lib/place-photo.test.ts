import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPlacePhotoBytes,
  isAllowedPhotoUri,
  parsePlacePhotoName,
  placePhotoSrc,
} from "./place-photo";

describe("Places photo names", () => {
  it("accepts a Places photo resource name and strips a trailing /media", () => {
    const name =
      "places/ChIJ2fzCmcW7j4AR2JzfXBBoh6E/photos/AUacShh3_Dd8yvV2JZMtNjjbbSbFhSv-0VmUN";
    expect(parsePlacePhotoName(name)).toBe(name);
    expect(parsePlacePhotoName(`${name}/media`)).toBe(name);
    expect(placePhotoSrc(name)).toBe(
      `/api/places/photo?name=${encodeURIComponent(name)}`,
    );
  });

  it("rejects path traversal, absolute URLs, and extra segments", () => {
    expect(parsePlacePhotoName("../etc/passwd")).toBeNull();
    expect(
      parsePlacePhotoName("https://evil.example/places/x/photos/y"),
    ).toBeNull();
    expect(parsePlacePhotoName("places/x/photos/y/extra")).toBeNull();
    expect(parsePlacePhotoName("places/x/photos/y?q=1")).toBeNull();
    expect(parsePlacePhotoName("")).toBeNull();
    expect(parsePlacePhotoName(undefined)).toBeNull();
  });

  it("only allows Google photo hosts for media URIs", () => {
    expect(
      isAllowedPhotoUri("https://lh3.googleusercontent.com/photo=s800"),
    ).toBe(true);
    expect(isAllowedPhotoUri("https://lh3.ggpht.com/p/abc")).toBe(true);
    expect(isAllowedPhotoUri("http://lh3.googleusercontent.com/p")).toBe(false);
    expect(isAllowedPhotoUri("https://evil.example/photo")).toBe(false);
  });
});

describe("fetchPlacePhotoBytes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves skipHttpRedirect photoUri then returns image bytes", async () => {
    const name = "places/ChIJabc/photos/AUacShh";
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("places.googleapis.com")) {
          expect(url).toContain(name);
          expect(url).toContain("skipHttpRedirect=true");
          expect(
            new Headers(init?.headers).get("X-Goog-Api-Key"),
          ).toBe("test-key");
          return {
            ok: true,
            json: async () => ({
              photoUri: "https://lh3.googleusercontent.com/photo=s800",
            }),
          };
        }
        return {
          ok: true,
          headers: {
            get: (key: string) => (key === "content-type" ? "image/jpeg" : null),
          },
          arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        };
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const photo = await fetchPlacePhotoBytes({
      apiKey: "test-key",
      photoName: name,
    });
    expect(photo?.contentType).toBe("image/jpeg");
    expect(photo?.body.byteLength).toBe(3);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("drops a photoUri that is not a Google image host", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ photoUri: "https://evil.example/phish.jpg" }),
      })),
    );
    expect(
      await fetchPlacePhotoBytes({
        apiKey: "test-key",
        photoName: "places/ChIJabc/photos/AUacShh",
      }),
    ).toBeNull();
  });
});
