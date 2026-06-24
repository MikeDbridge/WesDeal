/**
 * Parsing user-typed card holdings into engine `Card`s.
 *
 * A holding is the ranks of a single suit, e.g. "AKQ52" or "K T 9" (spaces and
 * commas are ignored, "10" is accepted as ten). Invalid characters and repeated
 * ranks are reported rather than silently dropped, so the UI can guide the user.
 */

import { type Card, type Suit, SUITS, makeCard, RANK_LABELS, SUIT_SYMBOLS } from './cards';

const RANK_BY_CHAR: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

export interface SuitParse {
  cards: Card[];
  errors: string[];
}

/** Parse the ranks of one suit. */
export function parseSuitHolding(suit: Suit, raw: string): SuitParse {
  const cards: Card[] = [];
  const errors: string[] = [];
  const seen = new Set<number>();
  // Normalise: uppercase, accept "10" as ten, drop spaces/commas.
  const text = raw.toUpperCase().replace(/10/g, 'T').replace(/[\s,]/g, '');

  for (const ch of text) {
    const rank = RANK_BY_CHAR[ch];
    if (rank === undefined) {
      errors.push(`${SUIT_SYMBOLS[suit]} "${ch}" is not a card rank`);
      continue;
    }
    if (seen.has(rank)) {
      errors.push(`${SUIT_SYMBOLS[suit]} ${RANK_LABELS[rank]} is listed twice`);
      continue;
    }
    seen.add(rank);
    cards.push(makeCard(suit, rank));
  }
  return { cards, errors };
}

export interface HandParse {
  cards: Card[];
  errors: string[];
  length: number;
}

/** Parse a full hand from per-suit holding strings (S, H, D, C). */
export function parseHandHoldings(holdings: Partial<Record<Suit, string>>): HandParse {
  const cards: Card[] = [];
  const errors: string[] = [];
  for (const suit of SUITS) {
    const r = parseSuitHolding(suit, holdings[suit] ?? '');
    cards.push(...r.cards);
    errors.push(...r.errors);
  }
  return { cards, errors, length: cards.length };
}

/**
 * A partial specification of one suit: specific ranks plus a count of "x" cards
 * (unspecified small cards, rank 7 or below, resolved when dealing).
 */
export interface SuitSpec {
  ranks: number[];
  x: number;
}

export type HandSpec = Record<Suit, SuitSpec>;

export interface SuitSpecParse {
  spec: SuitSpec;
  errors: string[];
}

/** Parse one suit's holding into specific ranks plus a count of "x" small cards. */
export function parseSuitSpec(suit: Suit, raw: string): SuitSpecParse {
  const ranks: number[] = [];
  const errors: string[] = [];
  let x = 0;
  const seen = new Set<number>();
  const text = raw.toUpperCase().replace(/10/g, 'T').replace(/[\s,]/g, '');

  for (const ch of text) {
    if (ch === 'X') {
      x += 1;
      continue;
    }
    const rank = RANK_BY_CHAR[ch];
    if (rank === undefined) {
      errors.push(`${SUIT_SYMBOLS[suit]} "${ch}" is not a card rank`);
      continue;
    }
    if (seen.has(rank)) {
      errors.push(`${SUIT_SYMBOLS[suit]} ${RANK_LABELS[rank]} is listed twice`);
      continue;
    }
    seen.add(rank);
    ranks.push(rank);
  }
  return { spec: { ranks, x }, errors };
}

export interface HandSpecParse {
  spec: HandSpec;
  errors: string[];
  /** Total cards specified (specific ranks + x placeholders). */
  length: number;
}

function emptyHandSpec(): HandSpec {
  return { S: { ranks: [], x: 0 }, H: { ranks: [], x: 0 }, D: { ranks: [], x: 0 }, C: { ranks: [], x: 0 } };
}

/**
 * Parse a hand written as four space-separated holdings in ♠ ♥ ♦ ♣ order, where
 * each holding may include specific ranks and "x" for small cards, e.g.
 * "AKxxx Kx Qxx Axx". Use "-" for a void.
 */
export function parseHandSpec(text: string): HandSpecParse {
  const spec = emptyHandSpec();
  const trimmed = text.trim();
  if (trimmed === '') return { spec, errors: [], length: 0 };

  const tokens = trimmed.split(/\s+/);
  const errors: string[] = [];
  if (tokens.length !== 4) {
    errors.push(
      `Type four suits (♠ ♥ ♦ ♣) separated by spaces — use "-" for a void; got ${tokens.length}.`,
    );
  }

  SUITS.forEach((suit, i) => {
    const tok = tokens[i] ?? '';
    if (VOID_MARKERS.has(tok)) return; // void: leave empty
    const r = parseSuitSpec(suit, tok);
    spec[suit] = r.spec;
    errors.push(...r.errors);
  });

  const length = SUITS.reduce((n, s) => n + spec[s].ranks.length + spec[s].x, 0);
  return { spec, errors, length };
}

/** Tokens that stand for a void suit in a space-separated hand string. */
const VOID_MARKERS = new Set(['-', '–', '—', '.']);

/**
 * Parse a hand written as four space-separated holdings in ♠ ♥ ♦ ♣ order, e.g.
 * "AKQ52 K9 Q84 K76". Use a dash ("-") for a void, e.g. "AKQ52 - Q84 K765".
 */
export function parseHandString(text: string): HandParse {
  const trimmed = text.trim();
  if (trimmed === '') return { cards: [], errors: [], length: 0 };

  const tokens = trimmed.split(/\s+/);
  const errors: string[] = [];
  if (tokens.length !== 4) {
    errors.push(
      `Type four suits (♠ ♥ ♦ ♣) separated by spaces — use "-" for a void; got ${tokens.length}.`,
    );
  }

  const holdings: Record<Suit, string> = { S: '', H: '', D: '', C: '' };
  SUITS.forEach((suit, i) => {
    const tok = tokens[i] ?? '';
    holdings[suit] = VOID_MARKERS.has(tok) ? '' : tok;
  });

  const parsed = parseHandHoldings(holdings);
  return { cards: parsed.cards, errors: [...errors, ...parsed.errors], length: parsed.length };
}
