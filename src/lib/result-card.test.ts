import { describe, expect, it, vi } from "vitest";
import {
  buildSharePayload,
  formatConfidenceLine,
  formatOpenLabel,
  formatRatingLabel,
  formatShareClipboard,
  formatWalkLabel,
  originFromLocation,
  shareResult,
  walkLabelFromOrigin,
} from "./result-card";
import type { Area } from "./types";

const tiongBahru: Area = {
  id: "tiong-bahru",
  name: "Tiong Bahru",
  lat: 1.2868,
  lng: 103.827,
};

describe("ResultCard labels", () => {
  it("formats rating honestly and omits missing or zero values", () => {
    expect(formatRatingLabel(4.6)).toBe("4.6");
    expect(formatRatingLabel(4)).toBe("4.0");
    expect(formatRatingLabel(0)).toBeNull();
    expect(formatRatingLabel(undefined)).toBeNull();
    expect(formatRatingLabel(Number.NaN)).toBeNull();
  });

  it("formats Open / Closed only when Google reported openNow", () => {
    expect(formatOpenLabel(true)).toBe("Open");
    expect(formatOpenLabel(false)).toBe("Closed");
    expect(formatOpenLabel(undefined)).toBeNull();
    expect(formatOpenLabel(null)).toBeNull();
  });

  it("turns 500 m into a 6 min walk and omits unknown distance", () => {
    expect(formatWalkLabel(0.5)).toBe("6 min walk");
    expect(formatWalkLabel(0)).toBe("1 min walk");
    expect(formatWalkLabel(-1)).toBeNull();
    expect(formatWalkLabel(undefined)).toBeNull();
  });

  it("joins rating · walk · open and drops segments it cannot compute", () => {
    expect(
      formatConfidenceLine({
        rating: 4.6,
        walkLabel: "6 min walk",
        openNow: true,
      }),
    ).toBe("4.6 · 6 min walk · Open");
    expect(
      formatConfidenceLine({
        rating: undefined,
        walkLabel: "6 min walk",
        openNow: false,
      }),
    ).toBe("6 min walk · Closed");
    expect(
      formatConfidenceLine({
        rating: undefined,
        walkLabel: null,
        openNow: undefined,
      }),
    ).toBeNull();
  });
});

describe("walk label from the current origin", () => {
  it("uses GPS or the selected area pin, and skips location:none", () => {
    expect(originFromLocation({ type: "none" }, [tiongBahru])).toBeNull();
    expect(
      originFromLocation({ type: "area", areaId: "tiong-bahru" }, [tiongBahru]),
    ).toEqual({ lat: tiongBahru.lat, lng: tiongBahru.lng });
    expect(
      originFromLocation({ type: "geo", lat: 1.3, lng: 103.8 }, [tiongBahru]),
    ).toEqual({ lat: 1.3, lng: 103.8 });

    const nearby = walkLabelFromOrigin(
      { lat: tiongBahru.lat, lng: tiongBahru.lng },
      { lat: tiongBahru.lat + 0.001, lng: tiongBahru.lng },
    );
    expect(nearby).toMatch(/^\d+ min walk$/);
    expect(walkLabelFromOrigin(null, { lat: 1.3, lng: 103.8 })).toBeNull();
  });
});

describe("share payload", () => {
  it("shares the place name, confidence line, and homepage URL", () => {
    const payload = buildSharePayload({
      name: "Maxwell Fish Soup",
      line: "4.6 · 6 min walk · Open",
      url: "https://eatwhat.sg/",
    });
    expect(payload).toEqual({
      title: "Maxwell Fish Soup",
      text: "Maxwell Fish Soup · 4.6 · 6 min walk · Open",
      url: "https://eatwhat.sg/",
    });
    expect(formatShareClipboard(payload)).toBe(
      "Maxwell Fish Soup · 4.6 · 6 min walk · Open\nhttps://eatwhat.sg/",
    );
  });

  it("uses navigator.share when available and copies otherwise", async () => {
    const payload = buildSharePayload({
      name: "Maxwell Fish Soup",
      url: "https://eatwhat.sg/",
    });

    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { share });
    expect(await shareResult(payload)).toBe("shared");
    expect(share).toHaveBeenCalledWith(payload);

    const abort = new Error("Ignore");
    abort.name = "AbortError";
    share.mockRejectedValueOnce(abort);
    expect(await shareResult(payload)).toBe("aborted");

    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn(async () => undefined) },
    });
    expect(await shareResult(payload)).toBe("copied");

    vi.stubGlobal("navigator", {});
    expect(await shareResult(payload)).toBe("failed");

    vi.unstubAllGlobals();
  });
});
