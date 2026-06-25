/**
 * A-priori suit-break odds.
 *
 * When your side holds some cards in a suit, the opponents hold the rest. Before
 * any cards are seen, the chance the missing cards split a given way between the
 * two opponents follows the hypergeometric distribution: each opponent is dealt
 * 13 of the 26 unknown cards, so
 *
 *   P(one opponent holds exactly k of the m missing) =
 *       C(m, k) · C(26 - m, 13 - k) / C(26, 13)
 *
 * A named split a-b (a ≥ b, a + b = m) covers both opponents, so its probability
 * is that of k = a plus k = b (equal by symmetry), i.e. doubled unless a = b.
 */

const TOTAL = 10_400_600; // C(26, 13): ways to deal 13 of the 26 unknown cards

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
 * `missing` is the number of cards your side does NOT hold (0..13).
 */
export function suitBreakOdds(missing: number): SuitSplit[] {
  const splits: SuitSplit[] = [];
  for (let a = Math.ceil(missing / 2); a <= missing; a++) {
    const b = missing - a;
    const ways = comb(missing, a) * comb(26 - missing, 13 - a);
    const cases = a === b ? ways : 2 * ways;
    splits.push({ a, b, cases, probability: cases / TOTAL });
  }
  return splits;
}
