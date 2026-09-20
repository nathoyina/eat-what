import { describe, expect, it } from "vitest";
import {
  reelCenterOffset,
  reelDisplayIndex,
  reelItemAt,
  reelLandIndex,
  REEL_ITEM_H,
  REEL_LOOPS,
} from "./spin-reel";

const spots = [
  { id: "kuriya", name: "Kuriya Dining" },
  { id: "ichiban", name: "Ichiban Eats" },
  { id: "maxwell", name: "Maxwell Food Centre" },
];

describe("reel land index", () => {
  it("lands on the same restaurant the timeout reports as the winner", () => {
    const targetIndex = 1;
    const land = reelLandIndex(spots.length, targetIndex);
    expect(reelItemAt(spots, land)?.id).toBe("ichiban");
    expect(reelItemAt(spots, targetIndex)?.id).toBe("ichiban");
    expect(land).toBe(REEL_LOOPS * spots.length + targetIndex);
  });

  it("keeps wrap-around copies aligned with the candidate list", () => {
    expect(reelItemAt(spots, 0)?.id).toBe("kuriya");
    expect(reelItemAt(spots, 3)?.id).toBe("kuriya");
    expect(reelItemAt(spots, 4)?.id).toBe("ichiban");
  });
});

describe("reelDisplayIndex", () => {
  it("frames the ResultCard winner after settle, even if strip copy 0 is someone else", () => {
    const idx = reelDisplayIndex({
      candidates: spots,
      targetIndex: 1,
      spinning: false,
      winnerId: "ichiban",
    });
    expect(reelItemAt(spots, idx)?.name).toBe("Ichiban Eats");
    expect(reelItemAt(spots, 0)?.name).toBe("Kuriya Dining");
  });

  it("snaps to the winner if targetIndex points at a different place", () => {
    const idx = reelDisplayIndex({
      candidates: spots,
      targetIndex: 0,
      spinning: false,
      winnerId: "ichiban",
    });
    expect(idx).toBe(1);
    expect(reelItemAt(spots, idx)?.id).toBe("ichiban");
  });

  it("uses the looped land index while spinning", () => {
    const idx = reelDisplayIndex({
      candidates: spots,
      targetIndex: 2,
      spinning: true,
      winnerId: null,
    });
    expect(idx).toBe(reelLandIndex(spots.length, 2));
    expect(reelItemAt(spots, idx)?.id).toBe("maxwell");
  });
});

describe("reelCenterOffset", () => {
  it("places the indexed row in the middle of a 3-row viewport", () => {
    expect(reelCenterOffset(0)).toBe(REEL_ITEM_H);
    expect(reelCenterOffset(1)).toBe(0);
    expect(reelCenterOffset(2)).toBe(-REEL_ITEM_H);
  });
});
