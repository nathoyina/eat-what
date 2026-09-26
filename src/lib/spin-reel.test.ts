import { describe, expect, it } from "vitest";
import { mulberry32 } from "./random";
import {
  pickSpinWinner,
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

describe("reel travel from the current position", () => {
  const positions = [0, 1, spots.length, REEL_LOOPS * spots.length + 2];

  it("travels at least one full loop and lands on the chosen winner", () => {
    for (const from of positions) {
      for (let target = 0; target < spots.length; target++) {
        const land = reelLandIndex(spots.length, target, REEL_LOOPS, from);
        const delta = land - from;
        expect(delta).toBeGreaterThanOrEqual(spots.length);
        expect(delta).toBeGreaterThanOrEqual(REEL_LOOPS * spots.length);
        expect(delta).toBeLessThan(REEL_LOOPS * spots.length + spots.length);
        expect(land % spots.length).toBe(target);
        expect(reelItemAt(spots, land)?.id).toBe(spots[target]?.id);
      }
    }
  });

  it("does not reuse the first spin's window, which only nudges one row", () => {
    const n = spots.length;
    const first = reelLandIndex(n, 0);
    const second = reelLandIndex(n, 1, REEL_LOOPS, first);
    expect(second - first).toBeGreaterThanOrEqual(n);
    expect(second).not.toBe(REEL_LOOPS * n + 1);
  });

  it("frames the same winner the ResultCard would show, including after a respin", () => {
    const rng = mulberry32(7);
    let from = 0;
    let previous: string | null = null;
    for (let spin = 0; spin < 12; spin++) {
      const excludeId: string | null = previous;
      const pick: { winner: (typeof spots)[number]; index: number } | null =
        pickSpinWinner(spots, { excludeId, random: rng });
      if (!pick) throw new Error("expected a winner");
      if (previous) expect(pick.winner.id).not.toBe(previous);
      const land = reelDisplayIndex({
        candidates: spots,
        targetIndex: pick.index,
        spinning: true,
        winnerId: null,
        fromIndex: from,
      });
      expect(land - from).toBeGreaterThanOrEqual(spots.length);
      expect(reelItemAt(spots, land)?.id).toBe(pick.winner.id);
      const settled = reelDisplayIndex({
        candidates: spots,
        targetIndex: pick.index,
        spinning: false,
        winnerId: pick.winner.id,
        fromIndex: land,
      });
      expect(reelItemAt(spots, settled)?.id).toBe(pick.winner.id);
      previous = pick.winner.id;
      from = settled;
    }
  });
});

describe("pickSpinWinner", () => {
  it("is roughly uniform over many seeded trials", () => {
    const rng = mulberry32(99);
    const trials = 4000;
    const counts = new Map(spots.map((spot) => [spot.id, 0]));
    for (let i = 0; i < trials; i++) {
      const pick = pickSpinWinner(spots, { random: rng });
      expect(pick).not.toBeNull();
      if (!pick) return;
      counts.set(pick.winner.id, (counts.get(pick.winner.id) ?? 0) + 1);
    }
    const expected = trials / spots.length;
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(expected * 0.75);
      expect(count).toBeLessThan(expected * 1.25);
    }
  });

  it("never repeats the last winner when the pool has 3 or more", () => {
    const rng = mulberry32(3);
    let last = "kuriya";
    for (let i = 0; i < 200; i++) {
      const pick = pickSpinWinner(spots, { excludeId: last, random: rng });
      expect(pick?.winner.id).not.toBe(last);
      if (!pick) return;
      last = pick.winner.id;
    }
  });

  it("alternates a pool of exactly 2", () => {
    const pair = spots.slice(0, 2);
    expect(pickSpinWinner(pair, { excludeId: "kuriya" })?.winner.id).toBe(
      "ichiban",
    );
    expect(pickSpinWinner(pair, { excludeId: "ichiban" })?.winner.id).toBe(
      "kuriya",
    );
    const rng = mulberry32(1);
    let last: string | null = null;
    for (let i = 0; i < 8; i++) {
      const excludeId: string | null = last;
      const pick: { winner: (typeof pair)[number]; index: number } | null =
        pickSpinWinner(pair, { excludeId, random: rng });
      if (!pick) throw new Error("expected a winner");
      if (excludeId) expect(pick.winner.id).not.toBe(excludeId);
      last = pick.winner.id;
    }
  });
});

describe("reelCenterOffset", () => {
  it("places the indexed row in the middle of a 3-row viewport", () => {
    expect(reelCenterOffset(0)).toBe(REEL_ITEM_H);
    expect(reelCenterOffset(1)).toBe(0);
    expect(reelCenterOffset(2)).toBe(-REEL_ITEM_H);
  });
});
