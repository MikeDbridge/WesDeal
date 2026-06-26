/**
 * Distribution of *specific* missing cards between the two opponents.
 *
 * Where {@link ./odds} only counts how many cards each opponent holds, this
 * enumerates every distinct *lie* of a named holding — e.g. for the opponents'
 * `K Q x x x` it tells you the chance that East holds `KQx` and West `xx`, that
 * East holds `Kx` and West `Qxx`, and so on. This is what you need to compare
 * lines of play (finesses, drops, safety plays) rather than just suit breaks.
 *
 * Notation, following automaton.gr's OddsTbl: the program does not care what your
 * characters *mean*. Each distinct character is one group of interchangeable cards,
 * and how many times it appears is the group's size. So `KQxxx` is K, Q and three
 * interchangeable `x`s; `hhhccc` is three `h`s and three `c`s; and you can mix
 * suits freely — `QcccJdddd` is four clubs to the queen (Q + ccc) plus five
 * diamonds to the jack (J + dddd), with every group splitting independently.
 *
 * Model (the "vacant spaces" model). Each opponent has a number of unknown card
 * slots — its *vacant spaces*. A specific subset of the `m` missing cards landing
 * in East (size k) and the rest in West has probability
 *
 *   P(specific k in East) = C(vE + vW - m, vE - k) / C(vE + vW, vE)
 *
 * which depends only on k, not on *which* cards. A-priori, before anything is
 * known, each opponent has 13 vacant spaces, so this reduces to the same
 * hypergeometric odds as the a-priori suit break.
 *
 * A *lie* groups together labelled subsets that look the same once interchangeable
 * cards are folded together. Its probability is the per-subset probability times
 * the number of labelled subsets that match it.
 */

import { comb } from './odds';

/** A run of interchangeable cards sharing one character (`token`). */
export interface CardGroup {
  /** The character used for these cards (the user's own mnemonic). */
  token: string;
  count: number;
}

export interface ParsedHolding {
  /** Card groups in first-appearance order. */
  groups: CardGroup[];
  /** Total missing cards. */
  cards: number;
  /** Set if the input could not be parsed. */
  error?: string;
}

/**
 * Parse a holding into groups of like characters, preserving first-appearance
 * order. Every non-whitespace character counts as a card; cards written with the
 * same character are interchangeable, different characters are kept apart. `10` is
 * read as the single token `T`. More than 26 cards (the opponents' whole holding)
 * is an error.
 */
export function parseHolding(src: string): ParsedHolding {
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const ch of src.replace(/10/g, 'T')) {
    if (/\s/.test(ch)) continue;
    if (!counts.has(ch)) order.push(ch);
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  const groups = order.map((token) => ({ token, count: counts.get(token)! }));
  const cards = groups.reduce((n, g) => n + g.count, 0);
  if (cards > 26) {
    return { groups: [], cards: 0, error: 'The opponents hold at most 26 cards' };
  }
  return { groups, cards };
}

export interface CardLie {
  /** East's cards, by group in input order (e.g. `Qccd`); `—` if void. */
  east: string;
  /** West's cards. */
  west: string;
  eastCount: number;
  westCount: number;
  /** Number of labelled subsets matching this lie (relative weight). */
  cases: number;
  /** Probability, 0..1. */
  probability: number;
}

/** How to sort the returned lies. */
export type LieOrder = 'probability' | 'westLength';

/**
 * Every distinct lie of `holding` across the two opponents.
 * `vacantE`/`vacantW` are the opponents' vacant spaces (default 13 each = a-priori).
 * `order` is `'probability'` (most likely first, default) or `'westLength'` (most
 * cards in West first). Lies whose split exceeds the available vacant spaces are dropped.
 */
export function cardLieOdds(
  holding: ParsedHolding,
  vacantE = 13,
  vacantW = 13,
  order: LieOrder = 'probability',
): CardLie[] {
  const { groups, cards: m } = holding;
  const v = vacantE + vacantW;
  const denom = comb(v, vacantE);

  const lies: CardLie[] = [];
  // Each group independently sends 0..count of its cards East; the rest go West.
  const recurse = (i: number, kEast: number, weight: number, east: string, west: string): void => {
    if (i === groups.length) {
      const ways = comb(v - m, vacantE - kEast); // per-subset probability numerator
      if (ways === 0) return; // split impossible with these vacant spaces
      lies.push({
        east: east || '—',
        west: west || '—',
        eastCount: kEast,
        westCount: m - kEast,
        cases: weight,
        probability: (weight * ways) / denom,
      });
      return;
    }
    const { token, count } = groups[i];
    for (let e = 0; e <= count; e++) {
      recurse(
        i + 1,
        kEast + e,
        weight * comb(count, e),
        east + token.repeat(e),
        west + token.repeat(count - e),
      );
    }
  };
  recurse(0, 0, 1, '', '');

  if (order === 'westLength') {
    lies.sort((x, y) => y.westCount - x.westCount || y.probability - x.probability);
  } else {
    lies.sort((x, y) => y.probability - x.probability || x.eastCount - y.eastCount);
  }
  return lies;
}
