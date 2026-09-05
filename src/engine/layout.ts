/**
 * The setup-phase card layout for WesPlay: every one of the 52 cards is
 * either in one of the four hands or in the unassigned pool. Because a card
 * exists exactly once, duplicate-card errors are structurally impossible —
 * the only thing left to validate is that each hand ends up with 13.
 *
 * Hands may hold any number of cards while editing; the UI shades hands
 * that are short or over. Conversions to/from the dotted-holdings encoding
 * (AnalyzeState.hands) keep the URL hash format unchanged.
 */

import { type Card, SUITS, rankOf, cardLabel } from './cards';
import { SEATS, type Seat, type Deal } from './deal';
import { parseSuitHolding } from './parse';
import { handToPBN } from './format';

/** Cards per seat; a card in no hand is in the pool. */
export type Layout = Record<Seat, Card[]>;

export const emptyLayout = (): Layout => ({ N: [], E: [], S: [], W: [] });

/** Where a card may sit. */
export type Zone = Seat | 'pool';

/**
 * Build a layout from dotted holdings. A card claimed twice stays with the
 * first seat that named it; later claims are dropped and reported. Junk
 * characters are dropped silently (the importer already reports them).
 */
export function layoutFromHands(hands: Record<Seat, string>): { layout: Layout; dropped: string[] } {
  const layout = emptyLayout();
  const owner = new Map<Card, Seat>();
  const dropped: string[] = [];
  for (const seat of SEATS) {
    const parts = hands[seat].split('.');
    SUITS.forEach((suit, i) => {
      for (const card of parseSuitHolding(suit, parts[i] ?? '').cards) {
        const first = owner.get(card);
        if (first !== undefined) {
          dropped.push(`${cardLabel(card)} was in both ${first} and ${seat}; kept in ${first}.`);
          continue;
        }
        owner.set(card, seat);
        layout[seat].push(card);
      }
    });
  }
  return { layout, dropped };
}

/** Dotted holdings (ranks high→low) for the URL hash; '' for an empty hand. */
export function handsFromLayout(layout: Layout): Record<Seat, string> {
  const hands = {} as Record<Seat, string>;
  for (const seat of SEATS) {
    hands[seat] = layout[seat].length === 0 ? '' : handToPBN(layout[seat]);
  }
  return hands;
}

/** The cards in no hand, sorted by suit then rank high→low. */
export function poolOf(layout: Layout): Card[] {
  const used = new Set<Card>();
  for (const seat of SEATS) for (const card of layout[seat]) used.add(card);
  const pool: Card[] = [];
  for (let card = 0; card < 52; card++) if (!used.has(card)) pool.push(card);
  return pool.sort((a, b) => Math.floor(a / 13) - Math.floor(b / 13) || rankOf(b) - rankOf(a));
}

/** The zone currently holding a card. */
export function zoneOf(layout: Layout, card: Card): Zone {
  for (const seat of SEATS) if (layout[seat].includes(card)) return seat;
  return 'pool';
}

/** Move a card to a zone (in place). Returns true if anything changed. */
export function moveCard(layout: Layout, card: Card, dest: Zone): boolean {
  const from = zoneOf(layout, card);
  if (from === dest) return false;
  if (from !== 'pool') {
    const hand = layout[from];
    hand.splice(hand.indexOf(card), 1);
  }
  if (dest !== 'pool') layout[dest].push(card);
  return true;
}

/** Every hand has exactly 13 (and therefore the pool is empty). */
export function layoutComplete(layout: Layout): boolean {
  return SEATS.every((seat) => layout[seat].length === 13);
}

/** A Deal from a complete layout. */
export function dealFromLayout(layout: Layout): Deal {
  return { hands: { N: [...layout.N], E: [...layout.E], S: [...layout.S], W: [...layout.W] } };
}

/**
 * When exactly one hand is short by precisely the pool size, that hand is
 * the obvious home for the whole pool — returns it, else null.
 */
export function poolFillTarget(layout: Layout): Seat | null {
  const pool = poolOf(layout);
  if (pool.length === 0) return null;
  const short = SEATS.filter((seat) => layout[seat].length < 13);
  if (short.length !== 1) return null;
  return 13 - layout[short[0]].length === pool.length ? short[0] : null;
}
