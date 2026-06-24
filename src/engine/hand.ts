/**
 * Hand analysis: everything the constraint evaluator needs to test a 13-card
 * hand — suit lengths, HCP, controls, shape, and honor lookups.
 */

import {
  type Card,
  type Suit,
  SUITS,
  type Rank,
  suitOf,
  rankOf,
  hcpOfRank,
  controlsOfRank,
} from './cards';

export interface HandAnalysis {
  cards: Card[];
  /** Cards in each suit, sorted high → low. */
  bySuit: Record<Suit, Card[]>;
  /** Number of cards in each suit. */
  lengths: Record<Suit, number>;
  /** Suit lengths sorted descending, e.g. [4, 4, 3, 2]. */
  shape: number[];
  hcp: number;
  controls: number;
}

function emptyBySuit(): Record<Suit, Card[]> {
  return { S: [], H: [], D: [], C: [] };
}

export function analyzeHand(cards: Card[]): HandAnalysis {
  const bySuit = emptyBySuit();
  let hcp = 0;
  let controls = 0;

  for (const card of cards) {
    const suit = suitOf(card);
    bySuit[suit].push(card);
    const rank = rankOf(card);
    hcp += hcpOfRank(rank);
    controls += controlsOfRank(rank);
  }

  const lengths = {} as Record<Suit, number>;
  for (const suit of SUITS) {
    bySuit[suit].sort((a, b) => rankOf(b) - rankOf(a));
    lengths[suit] = bySuit[suit].length;
  }

  const shape = SUITS.map((s) => lengths[s]).sort((a, b) => b - a);

  return { cards, bySuit, lengths, shape, hcp, controls };
}

/** True if the hand holds a specific card (e.g. the ♠A). */
export function hasCard(analysis: HandAnalysis, suit: Suit, rank: Rank): boolean {
  return analysis.bySuit[suit].some((c) => rankOf(c) === rank);
}

/**
 * A hand is "balanced" if its shape is 4-3-3-3, 4-4-3-2, or 5-3-3-2.
 * (Semi-balanced 5-4-2-2 and 6-3-2-2 are excluded by the strict definition.)
 */
export function isBalanced(analysis: HandAnalysis): boolean {
  const s = analysis.shape.join('-');
  return s === '4-3-3-3' || s === '4-4-3-2' || s === '5-3-3-2';
}

/**
 * Exact shape in suit order ♠♥♦♣, e.g. "5=3=3=2" — the standard notation for a
 * shape tied to specific suits (as opposed to "5-3-3-2", which is sorted).
 */
export function exactShape(lengths: Record<Suit, number>): string {
  return SUITS.map((s) => lengths[s]).join('=');
}
