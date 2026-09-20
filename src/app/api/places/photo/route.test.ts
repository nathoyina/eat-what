import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/places/photo/route";

describe("GET /api/places/photo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects invalid names before calling Google", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(
      new Request("http://localhost/api/places/photo?name=../secret"),
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies image bytes with the server API key and does not expose it", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "server-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("places.googleapis.com")) {
          return {
            ok: true,
            json: async () => ({
              photoUri: "https://lh3.googleusercontent.com/p/abc",
            }),
          };
        }
        return {
          ok: true,
          headers: {
            get: (key: string) => (key === "content-type" ? "image/jpeg" : null),
          },
          arrayBuffer: async () => new Uint8Array([9, 8, 7]).buffer,
        };
      }),
    );

    const res = await GET(
      new Request(
        "http://localhost/api/places/photo?name=places/ChIJabc/photos/AUacShh",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(await res.arrayBuffer()).toEqual(new Uint8Array([9, 8, 7]).buffer);
    expect(res.headers.get("Location")).toBeNull();
  });
});
