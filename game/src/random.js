// Dapur Kilat — a tiny seeded random generator (mulberry32) so a screenshot
// seed always stages the same kitchen, while a real game still varies.

/** Build a generator from a 32-bit seed; every call returns a float in [0, 1). */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `list` with the generator. */
export function pickRandom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Shuffle a copy of `list` in place order with the generator (Fisher-Yates). */
export function shuffleRandom(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/** An integer in [min, max] with the generator. */
export function intRandom(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
