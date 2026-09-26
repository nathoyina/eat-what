/** Deterministic RNG for tests. Returns values in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clamp a unit random source so `floor(random() * n)` stays inside `0..n-1`. */
export function unitRandom(random: () => number): number {
  const raw = random();
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  if (raw >= 1) return 1 - Number.EPSILON;
  return raw;
}
