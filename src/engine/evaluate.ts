/**
 * Evaluate a (possibly partial, x-containing) hand spec for display.
 *
 * HCP and exact shape come straight from the spec. K&R is well-defined too: an
 * "x" is a small card (rank ≤ 7), which affects K&R only through suit length —
 * never through an honor or the 8/9/10 bonuses — so any concrete filling of the
 * x slots yields the same K&R. We build one sample filling and evaluate it.
 */

import { type Card, type Suit, SUITS, makeCard, hcpOfRank } from './cards';
import type { HandSpec } from './parse';
import { knrPoints } from './knr';

export interface SpecEvaluation {
  hcp: number;
  /** Null when the spec can't be realised (e.g. a suit asks for too many x). */
  knr: number | null;
  lengths: Record<Suit, number>;
  /** Total cards specified (specific ranks + x). */
  length: number;
}

/** Fill x slots with arbitrary distinct small cards; null if a suit overflows. */
function sampleCards(spec: HandSpec): Card[] | null {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    const used = new Set(spec[suit].ranks);
    for (const rank of spec[suit].ranks) cards.push(makeCard(suit, rank));
    let need = spec[suit].x;
    for (let rank = 2; rank <= 7 && need > 0; rank++) {
      if (!used.has(rank)) {
        cards.push(makeCard(suit, rank));
        need -= 1;
      }
    }
    if (need > 0) return null;
  }
  return cards;
}

export function evaluateSpec(spec: HandSpec): SpecEvaluation {
  let hcp = 0;
  let length = 0;
  const lengths = {} as Record<Suit, number>;
  for (const suit of SUITS) {
    lengths[suit] = spec[suit].ranks.length + spec[suit].x;
    length += lengths[suit];
    for (const rank of spec[suit].ranks) hcp += hcpOfRank(rank);
  }
  const sample = sampleCards(spec);
  return { hcp, knr: sample ? knrPoints(sample) : null, lengths, length };
}
