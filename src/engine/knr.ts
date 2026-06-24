/**
 * Kaplan-Rubens (K&R) hand evaluation.
 *
 * A precise, fractional alternative to flat 4-3-2-1 HCP, devised by Edgar Kaplan
 * and Jeff Rubens (The Bridge World, 1982). Values run from -0.5 (a 4-3-3-3
 * Yarborough) to 35.6 in 0.05 increments.
 *
 * This implements Richard Pavlicek's 26-step specification
 * (https://rpbridge.net/8j19.htm) and is verified against Jeff Goldsmith's
 * reference calculator (e.g. AKQ52 K9 Q84 K76 = 17.35; see knr.test.ts).
 *
 * Per suit:
 *   Phase A  – steps 1-11: base honor values and ten/nine/length bonuses
 *   Step 12  – multiply the Phase A total by (suit length / 10)
 *   Phase B  – steps 13-26: post-length honor values and short-suit values
 * Then: sum the four suits, subtract 1, and add 0.5 for a 4-3-3-3 hand.
 */

import { type Card, type Suit, SUITS, suitOf, rankOf } from './cards';

const A = 14;
const K = 13;
const Q = 12;
const J = 11;
const T = 10;
const NINE = 9;
const EIGHT = 8;

function knrSuit(ranks: Set<number>, len: number): number {
  const has = (r: number): boolean => ranks.has(r);
  const hasA = has(A);
  const hasK = has(K);
  const hasQ = has(Q);
  const hasJ = has(J);
  const hasT = has(T);
  const has9 = has(NINE);
  const has8 = has(EIGHT);

  const countAboveJ = (hasA ? 1 : 0) + (hasK ? 1 : 0) + (hasQ ? 1 : 0); // higher than J
  const countAboveT = countAboveJ + (hasJ ? 1 : 0); // higher than T
  const countAbove9 = countAboveT + (hasT ? 1 : 0); // higher than 9

  // ---- Phase A (steps 1-11) ----
  let a = 0;
  if (hasA) a += 4;
  if (hasK) a += 3;
  if (hasQ) a += 2;
  if (hasJ) a += 1;
  if (hasT) a += 0.5;
  // 6: 2-6 cards, ten with jack or two+ higher honors
  if (hasT && len >= 2 && len <= 6 && (hasJ || countAboveT >= 2)) a += 0.5;
  // 7: 2-6 cards, nine with eight, ten, or exactly two higher honors
  if (has9 && len >= 2 && len <= 6 && (has8 || hasT || countAbove9 === 2)) a += 0.5;
  // 8: 4-6 cards, nine (no eight or ten) and exactly three higher honors
  if (has9 && len >= 4 && len <= 6 && !has8 && !hasT && countAboveT === 3) a += 0.5;
  // 9-11: long suits missing top honors
  if (len >= 7 && !(hasQ && hasJ)) a += 1;
  if (len >= 8 && !hasQ) a += 1;
  if (len >= 9 && !hasQ && !hasJ) a += 1;

  // ---- Step 12: length multiplier ----
  let s = (a * len) / 10;

  // ---- Phase B (steps 13-26) ----
  if (hasA) s += 3;
  if (hasK && len >= 2) s += 2; // guarded king
  if (hasK && len === 1) s += 0.5; // singleton king
  if (hasQ && len >= 3) s += hasA || hasK ? 1 : 0.75;
  if (hasQ && len === 2) s += hasA || hasK ? 0.5 : 0.25;
  if (hasJ && countAboveJ === 2) s += 0.5;
  if (hasJ && countAboveJ === 1) s += 0.25;
  if (hasT && countAboveT === 2) s += 0.25;
  if (hasT && has9 && countAboveT === 1) s += 0.25;
  if (len === 0) s += 3; // void
  if (len === 1) s += 2; // singleton
  if (len === 2) s += 1; // doubleton

  return s;
}

/** Kaplan-Rubens points for a 13-card hand, rounded to the nearest 0.05. */
export function knrPoints(cards: Card[]): number {
  const ranksBySuit: Record<Suit, Set<number>> = { S: new Set(), H: new Set(), D: new Set(), C: new Set() };
  for (const card of cards) ranksBySuit[suitOf(card)].add(rankOf(card));

  let total = 0;
  const lengths: number[] = [];
  for (const suit of SUITS) {
    const ranks = ranksBySuit[suit];
    lengths.push(ranks.size);
    total += knrSuit(ranks, ranks.size);
  }

  total -= 1;
  const shape = [...lengths].sort((x, y) => y - x);
  if (shape[0] === 4 && shape[1] === 3 && shape[2] === 3 && shape[3] === 3) total += 0.5;

  return Math.round(total * 20) / 20;
}
