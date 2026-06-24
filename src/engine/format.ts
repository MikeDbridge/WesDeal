/**
 * Human- and machine-readable rendering of deals.
 *
 * PBN (Portable Bridge Notation) is the standard interchange format used by
 * most bridge software, so emitting it lets deals flow into other tools.
 */

import { type Card, type Suit, SUITS, RANK_LABELS, rankOf, suitOf } from './cards';
import { type Deal, type Seat, SEATS } from './deal';

/** Ranks of one suit, high → low, as a string like "AKQ" (T for ten). */
function suitString(cards: Card[], suit: Suit): string {
  return cards
    .filter((c) => suitOf(c) === suit)
    .sort((a, b) => rankOf(b) - rankOf(a))
    .map((c) => RANK_LABELS[rankOf(c)])
    .join('');
}

/** One hand in PBN order: spades.hearts.diamonds.clubs (dots separate suits). */
export function handToPBN(cards: Card[]): string {
  return SUITS.map((s) => suitString(cards, s)).join('.');
}

/**
 * A full deal as a PBN Deal value, e.g. "N:AKQ.. .. .. ..".
 * Hands are listed clockwise starting from the given seat (default N).
 */
export function dealToPBN(deal: Deal, first: Seat = 'N'): string {
  const order: Seat[] = [];
  let i = SEATS.indexOf(first);
  for (let k = 0; k < 4; k++) {
    order.push(SEATS[i % 4]);
    i++;
  }
  return `${first}:` + order.map((seat) => handToPBN(deal.hands[seat])).join(' ');
}

/** A single hand as a readable multi-line block with suit symbols. */
export function handToText(cards: Card[]): string {
  const symbols: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
  return SUITS.map((s) => {
    const ranks = suitString(cards, s);
    return `${symbols[s]} ${ranks || '—'}`;
  }).join('\n');
}
