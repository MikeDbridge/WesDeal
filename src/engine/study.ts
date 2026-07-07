/**
 * The research "study population": balanced or semi-balanced hands, per the
 * house rules (2026-07-07). Shared by the research CLI (research/) and the
 * WesLab page, so there is exactly one definition.
 *
 *   - 4333, 4432, 5332
 *   - 6322 with the six-card suit a minor
 *   - 4441 or 5431 with the singleton an A/K/Q in a minor
 *   - 5422, except exactly 5♠-4♥
 *   - 1M-route rule: at 15-16 HCP, a 5+ card major plus a 4+ card LOWER-ranking
 *     suit opens 1M instead (excluded) unless ≥ SHORT_VALUES_MIN HCP sit
 *     outside the two long suits.
 */

import type { Card } from './cards';

export type ShapeClass = '4333' | '4432' | '5332' | '6m322' | '4441' | '5431' | '5422';

/** Per-suit rank lists (♠♥♦♣ order) for shape/honor questions. */
export function suitRanks(cards: Card[]): number[][] {
  const suits: number[][] = [[], [], [], []];
  for (const c of cards) suits[(c / 13) | 0].push((c % 13) + 2);
  return suits;
}

const hcpOfRank = (r: number): number => (r >= 11 ? r - 10 : 0); // J=1 Q=2 K=3 A=4

export function shapeClass(cards: Card[]): ShapeClass | null {
  const suits = suitRanks(cards);
  const len = suits.map((s) => s.length);
  const pattern = [...len].sort((a, b) => b - a).join('');
  if (pattern === '4333' || pattern === '4432' || pattern === '5332') return pattern;
  if (pattern === '6322') return len[2] === 6 || len[3] === 6 ? '6m322' : null; // six-card minor
  if (pattern === '4441' || pattern === '5431') {
    const s = len.findIndex((l) => l === 1);
    if (s < 2) return null; // singleton must be in a minor
    return suits[s][0] >= 12 ? pattern : null; // and be A, K or Q
  }
  if (pattern === '5422') return len[0] === 5 && len[1] === 4 ? null : '5422'; // never 5♠-4♥
  return null;
}

/** "A lot of values in the short suits" threshold for the 1M-route exception. */
export const SHORT_VALUES_MIN = 6;

function opensOneMajorInstead(suits: number[][], hcp: number): boolean {
  if (hcp < 15 || hcp > 16) return false;
  const len = suits.map((s) => s.length);
  for (let m = 0; m < 2; m++) {
    if (len[m] < 5) continue;
    for (let s = m + 1; s < 4; s++) {
      if (len[s] < 4) continue;
      let outside = 0;
      for (let k = 0; k < 4; k++) {
        if (k !== m && k !== s) outside += suits[k].reduce((a, r) => a + hcpOfRank(r), 0);
      }
      if (outside < SHORT_VALUES_MIN) return true;
    }
  }
  return false;
}

/** True when the hand belongs to the balanced / semi-balanced study population. */
export function ntEligible(cards: Card[]): boolean {
  if (shapeClass(cards) === null) return false;
  const suits = suitRanks(cards);
  const hcp = suits.flat().reduce((a, r) => a + hcpOfRank(r), 0);
  return !opensOneMajorInstead(suits, hcp);
}
