/**
 * Dealing: a seedable RNG, an unbiased Fisher–Yates shuffle, and the split of
 * a 52-card deck into four 13-card hands (N, E, S, W).
 *
 * The RNG is seedable so deals are reproducible — important for testing and for
 * features like "show me that board again" / sharing a deal by its seed.
 */

import { type Card, type Suit, SUITS, DECK_SIZE, cardLabel, makeCard, SUIT_SYMBOLS } from './cards';
import type { HandSpec } from './parse';

export const SEATS = ['N', 'E', 'S', 'W'] as const;
export type Seat = (typeof SEATS)[number];

export interface Deal {
  /** Each seat's 13 cards, encoded as integers 0..51 (unsorted). */
  hands: Record<Seat, Card[]>;
}

export type RNG = () => number;

/**
 * mulberry32: a small, fast, well-distributed seedable PRNG returning [0, 1).
 * Good enough for dealing; not cryptographic.
 */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fullDeck(): Card[] {
  const deck = new Array<Card>(DECK_SIZE);
  for (let i = 0; i < DECK_SIZE; i++) deck[i] = i;
  return deck;
}

/** In-place unbiased Fisher–Yates shuffle using the provided RNG. */
export function shuffleInPlace(deck: Card[], rng: RNG): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

/** Split a 52-card array into four hands of 13: first 13 → N, etc. */
export function dealFromDeck(deck: Card[]): Deal {
  return {
    hands: {
      N: deck.slice(0, 13),
      E: deck.slice(13, 26),
      S: deck.slice(26, 39),
      W: deck.slice(39, 52),
    },
  };
}

export function randomDeal(rng: RNG): Deal {
  return dealFromDeck(shuffleInPlace(fullDeck(), rng));
}

/**
 * Hands that are "locked" / given: each present seat holds a fixed 13 cards.
 * The dealer deals the remaining cards to the other seats.
 */
export type GivenHands = Partial<Record<Seat, Card[]>>;

export function givenSeats(given: GivenHands): Seat[] {
  return SEATS.filter((s) => given[s] !== undefined);
}

export function hasGivenHands(given: GivenHands | undefined): boolean {
  return given !== undefined && givenSeats(given).length > 0;
}

/**
 * Validate a set of given hands. Returns human-readable error messages; an empty
 * array means the set is usable. Checks: at most 2 locked hands, each exactly 13
 * cards, and no card claimed by two seats.
 */
export function validateGivenHands(given: GivenHands): string[] {
  const errors: string[] = [];
  const seats = givenSeats(given);
  if (seats.length > 2) {
    errors.push('At most 2 hands can be locked.');
  }
  const owner = new Map<Card, Seat>();
  for (const seat of seats) {
    const cards = given[seat]!;
    if (cards.length !== 13) {
      errors.push(`${seat} has ${cards.length} card${cards.length === 1 ? '' : 's'}; a hand needs exactly 13.`);
    }
    for (const card of cards) {
      const other = owner.get(card);
      if (other !== undefined) {
        errors.push(`${cardLabel(card)} can't be in both ${other} and ${seat}.`);
      } else {
        owner.set(card, seat);
      }
    }
  }
  return errors;
}

/**
 * Hands specified with "x" placeholders for small cards (rank 7 or below). Each
 * present seat is a partial holding that is resolved to concrete cards per deal,
 * so the unspecified small cards vary from board to board.
 */
export type GivenSpecs = Partial<Record<Seat, HandSpec>>;

export function givenSpecSeats(specs: GivenSpecs): Seat[] {
  return SEATS.filter((s) => specs[s] !== undefined);
}

export function hasGivenSpecs(specs: GivenSpecs | undefined): boolean {
  return specs !== undefined && givenSpecSeats(specs).length > 0;
}

export function specLength(spec: HandSpec): number {
  return SUITS.reduce((n, s) => n + spec[s].ranks.length + spec[s].x, 0);
}

/** The highest rank an "x" (small) card may take. */
const X_MAX_RANK = 7;

/**
 * Validate a set of given specs. Checks: at most 2 locked hands, each exactly 13
 * cards, no specific card claimed twice, and enough small cards to satisfy the
 * "x" placeholders in each suit.
 */
export function validateGivenSpecs(specs: GivenSpecs): string[] {
  const errors: string[] = [];
  const seats = givenSpecSeats(specs);
  if (seats.length > 2) errors.push('At most 2 hands can be locked.');

  const owner = new Map<Card, Seat>();
  for (const seat of seats) {
    const spec = specs[seat]!;
    const len = specLength(spec);
    if (len !== 13) {
      errors.push(`${seat} has ${len} card${len === 1 ? '' : 's'}; a hand needs exactly 13.`);
    }
    for (const suit of SUITS) {
      for (const rank of spec[suit].ranks) {
        const card = makeCard(suit, rank);
        const other = owner.get(card);
        if (other !== undefined) errors.push(`${cardLabel(card)} can't be in both ${other} and ${seat}.`);
        else owner.set(card, seat);
      }
    }
  }

  for (const suit of SUITS) {
    let need = 0;
    for (const seat of seats) need += specs[seat]![suit].x;
    if (need === 0) continue;
    let available = 0;
    for (let rank = 2; rank <= X_MAX_RANK; rank++) {
      if (!owner.has(makeCard(suit, rank))) available += 1;
    }
    if (need > available) {
      errors.push(
        `${SUIT_SYMBOLS[suit]} needs ${need} small card${need === 1 ? '' : 's'} (x) but only ${available} are free.`,
      );
    }
  }
  return errors;
}

/**
 * Resolve "x" placeholders to concrete small cards drawn at random from those
 * still available, producing fully specified hands. Assumes `validateGivenSpecs`
 * has passed.
 */
function resolveSpecs(specs: GivenSpecs, rng: RNG): GivenHands {
  const used = new Set<Card>();
  const fixed: GivenHands = {};
  for (const seat of SEATS) {
    const spec = specs[seat];
    if (!spec) continue;
    const cards: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of spec[suit].ranks) {
        const card = makeCard(suit, rank);
        cards.push(card);
        used.add(card);
      }
    }
    fixed[seat] = cards;
  }

  const smallPool = {} as Record<Suit, Card[]>;
  for (const suit of SUITS) {
    const pool: Card[] = [];
    for (let rank = 2; rank <= X_MAX_RANK; rank++) {
      const card = makeCard(suit, rank);
      if (!used.has(card)) pool.push(card);
    }
    smallPool[suit] = shuffleInPlace(pool, rng);
  }

  for (const seat of SEATS) {
    const spec = specs[seat];
    if (!spec) continue;
    for (const suit of SUITS) {
      for (let k = 0; k < spec[suit].x; k++) {
        const card = smallPool[suit].pop();
        if (card === undefined) throw new Error('Not enough small cards to resolve x placeholders.');
        fixed[seat]!.push(card);
      }
    }
  }
  return fixed;
}

/** Deal around given specs, resolving "x" small cards per board. */
export function dealWithGivenSpecs(specs: GivenSpecs, rng: RNG): Deal {
  return dealWithGiven(resolveSpecs(specs, rng), rng);
}

/**
 * Deal the cards not held by the given hands to the remaining seats.
 * Assumes `given` has already passed `validateGivenHands`.
 */
export function dealWithGiven(given: GivenHands, rng: RNG): Deal {
  const used = new Set<Card>();
  for (const seat of SEATS) {
    const cards = given[seat];
    if (cards) for (const card of cards) used.add(card);
  }

  const remaining: Card[] = [];
  for (let card = 0; card < DECK_SIZE; card++) {
    if (!used.has(card)) remaining.push(card);
  }
  shuffleInPlace(remaining, rng);

  const hands = {} as Record<Seat, Card[]>;
  let i = 0;
  for (const seat of SEATS) {
    const fixed = given[seat];
    if (fixed) {
      hands[seat] = fixed;
    } else {
      hands[seat] = remaining.slice(i, i + 13);
      i += 13;
    }
  }
  return { hands };
}
