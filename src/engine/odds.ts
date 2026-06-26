/**
 * Suit-break odds under the vacant-spaces model.
 *
 * When your side holds some cards in a suit, the opponents hold the rest. With
 * `vE`/`vW` unknown card slots ("vacant spaces") in the two hands, the chance one
 * opponent holds exactly k of the m missing cards is hypergeometric:
 *
 *   P(East holds exactly k) = C(m, k) · C(vE + vW - m, vE - k) / C(vE + vW, vE)
 *
 * A named split a-b (a ≥ b, a + b = m) covers both opponents, so its probability
 * is P(East = a) + P(East = b) — equal when vacant spaces match, but not otherwise.
 * A-priori each opponent has 13 vacant spaces (vE = vW = 13), the default.
 */

export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const r = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

export interface SuitSplit {
  /** Longer holding. */
  a: number;
  /** Shorter holding. */
  b: number;
  /** Number of deals (out of C(26,13)) giving this split. */
  cases: number;
  /** Probability, 0..1. */
  probability: number;
}

/**
 * Every way `missing` opponent cards can split, most even first, with odds.
 * `missing` is the number of cards your side does NOT hold. `vacantE`/`vacantW`
 * are the opponents' vacant spaces (default 13 each = a-priori).
 */
export function suitBreakOdds(missing: number, vacantE = 13, vacantW = 13): SuitSplit[] {
  const v = vacantE + vacantW;
  const denom = comb(v, vacantE);
  // ways East holds exactly k of the missing cards.
  const east = (k: number): number => comb(missing, k) * comb(v - missing, vacantE - k);
  const splits: SuitSplit[] = [];
  for (let a = Math.ceil(missing / 2); a <= missing; a++) {
    const b = missing - a;
    const cases = a === b ? east(a) : east(a) + east(b);
    splits.push({ a, b, cases, probability: cases / denom });
  }
  return splits;
}

export interface OrientedSplit {
  /** Cards in West. */
  west: number;
  /** Cards in East. */
  east: number;
  probability: number;
}

/**
 * Suit breaks with West and East kept distinct, West's holding descending.
 * Unlike {@link suitBreakOdds}, the two orientations of a split (e.g. West 3 /
 * East 2 vs West 2 / East 3) are separate rows — they only matter when the
 * opponents' vacant spaces differ. P(West holds exactly w) = C(m, w) ·
 * C(vE + vW - m, vW - w) / C(vE + vW, vW).
 */
export function orientedSuitBreaks(missing: number, vacantE = 13, vacantW = 13): OrientedSplit[] {
  const v = vacantE + vacantW;
  const denom = comb(v, vacantW);
  const out: OrientedSplit[] = [];
  for (let w = missing; w >= 0; w--) {
    const cases = comb(missing, w) * comb(v - missing, vacantW - w);
    out.push({ west: w, east: missing - w, probability: cases / denom });
  }
  return out;
}
