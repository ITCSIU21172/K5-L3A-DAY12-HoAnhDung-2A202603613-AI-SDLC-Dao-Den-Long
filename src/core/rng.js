/**
 * Seeded PRNG using Mulberry32 for 100% deterministic pseudo-random sequences.
 */
export class PRNG {
  constructor(seed = 123456789) {
    this.seed = (seed >>> 0) || 1;
  }

  /**
   * Returns a float in [0, 1)
   */
  next() {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a float in [min, max)
   */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Returns an integer in [min, max]
   */
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}
