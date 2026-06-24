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
 * For speed each suit is represented as a 13-bit mask (bit `rank - 2` set when
 * that rank is present), so the hot loop allocates nothing.
 *
 * Per suit:
 *   Phase A  – steps 1-11: base honor values and ten/nine/length bonuses
 *   Step 12  – multiply the Phase A total by (suit length / 10)
 *   Phase B  – steps 13-26: post-length honor values and short-suit values
 * Then: sum the four suits, subtract 1, and add 0.5 for a 4-3-3-3 hand.
 */

import type { Card } from './cards';

// Bit positions (rank - 2): A=12, K=11, Q=10, J=9, T=8, 9=7, 8=6.
const BIT_A = 1 << 12;
const BIT_K = 1 << 11;
const BIT_Q = 1 << 10;
const BIT_J = 1 << 9;
const BIT_T = 1 << 8;
const BIT_9 = 1 << 7;
const BIT_8 = 1 << 6;

function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

function knrSuit(mask: number, len: number): number {
  const hasA = (mask & BIT_A) !== 0;
  const hasK = (mask & BIT_K) !== 0;
  const hasQ = (mask & BIT_Q) !== 0;
  const hasJ = (mask & BIT_J) !== 0;
  const hasT = (mask & BIT_T) !== 0;
  const has9 = (mask & BIT_9) !== 0;
  const has8 = (mask & BIT_8) !== 0;

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
  if (hasT && len >= 2 && len <= 6 && (hasJ || countAboveT >= 2)) a += 0.5;
  if (has9 && len >= 2 && len <= 6 && (has8 || hasT || countAbove9 === 2)) a += 0.5;
  if (has9 && len >= 4 && len <= 6 && !has8 && !hasT && countAboveT === 3) a += 0.5;
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

/**
 * Kaplan-Rubens points for the 13 cards in `cards[start..end)`, rounded to the
 * nearest 0.05. Reads a slice so the dealer can evaluate a flat deck in place.
 */
export function knrPointsRange(cards: ArrayLike<number>, start: number, end: number): number {
  let mS = 0;
  let mH = 0;
  let mD = 0;
  let mC = 0;
  for (let i = start; i < end; i++) {
    const card = cards[i];
    const bit = 1 << card % 13;
    const suit = (card / 13) | 0;
    if (suit === 0) mS |= bit;
    else if (suit === 1) mH |= bit;
    else if (suit === 2) mD |= bit;
    else mC |= bit;
  }

  const lS = popcount(mS);
  const lH = popcount(mH);
  const lD = popcount(mD);
  const lC = popcount(mC);

  let total = knrSuit(mS, lS) + knrSuit(mH, lH) + knrSuit(mD, lD) + knrSuit(mC, lC) - 1;

  // 4-3-3-3 bonus (one four-card suit, three threes).
  const threes =
    (lS === 3 ? 1 : 0) + (lH === 3 ? 1 : 0) + (lD === 3 ? 1 : 0) + (lC === 3 ? 1 : 0);
  const fours = (lS === 4 ? 1 : 0) + (lH === 4 ? 1 : 0) + (lD === 4 ? 1 : 0) + (lC === 4 ? 1 : 0);
  if (threes === 3 && fours === 1) total += 0.5;

  return Math.round(total * 20) / 20;
}

/** Kaplan-Rubens points for a 13-card hand, rounded to the nearest 0.05. */
export function knrPoints(cards: ArrayLike<Card>): number {
  return knrPointsRange(cards, 0, cards.length);
}
