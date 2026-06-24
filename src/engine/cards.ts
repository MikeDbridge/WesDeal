/**
 * Core card model.
 *
 * A card is encoded as a single integer 0..51 for a compact, fast inner loop:
 *   card = suitIndex * 13 + (rank - 2)
 * where suitIndex follows SUITS order (S, H, D, C) and rank is 2..14.
 * Helpers below convert to/from the human-friendly representation.
 */

export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

export const SUIT_NAMES: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  S: '♠', // ♠
  H: '♥', // ♥
  D: '♦', // ♦
  C: '♣', // ♣
};

/** Rank as its point value position: J=11, Q=12, K=13, A=14. */
export type Rank = number;
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const RANK_LABELS: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: 'T',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

/** Standard Milton Work high-card points: A=4, K=3, Q=2, J=1. */
export const HCP_BY_RANK: Record<number, number> = { 14: 4, 13: 3, 12: 2, 11: 1 };
export function hcpOfRank(rank: Rank): number {
  return HCP_BY_RANK[rank] ?? 0;
}

/** Honor controls: A=2, K=1 (used by some evaluation methods). */
export function controlsOfRank(rank: Rank): number {
  if (rank === 14) return 2;
  if (rank === 13) return 1;
  return 0;
}

export type Card = number;
export const DECK_SIZE = 52;

export function makeCard(suit: Suit, rank: Rank): Card {
  return SUITS.indexOf(suit) * 13 + (rank - 2);
}

export function suitOf(card: Card): Suit {
  return SUITS[Math.floor(card / 13)];
}

export function rankOf(card: Card): Rank {
  return (card % 13) + 2;
}

export function cardLabel(card: Card): string {
  return SUIT_SYMBOLS[suitOf(card)] + RANK_LABELS[rankOf(card)];
}
