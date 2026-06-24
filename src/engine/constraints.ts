/**
 * The constraint model — the stable core of the program.
 *
 * Phase 1 exposes this through a simple form (per-hand HCP / suit-length ranges
 * and partnership point totals). A future scripting layer can compile text into
 * this exact same model, so nothing here needs to change to gain that power.
 */

import { type Suit, SUITS } from './cards';
import { type Seat, SEATS, type Deal } from './deal';
import { analyzeHand, type HandAnalysis, isBalanced } from './hand';
import { knrPoints } from './knr';

/** An inclusive numeric range; either bound may be omitted (open-ended). */
export interface Range {
  min?: number;
  max?: number;
}

export interface HandConstraint {
  /** High-card points range (Milton Work 4-3-2-1). */
  hcp?: Range;
  /** Kaplan-Rubens points range (fractional evaluation). */
  knr?: Range;
  /** Per-suit length ranges. */
  suit?: Partial<Record<Suit, Range>>;
  /** If set, require the hand to be balanced (true) or unbalanced (false). */
  balanced?: boolean;
}

export interface PartnershipConstraint {
  /** Combined HCP range for the partnership. */
  hcp?: Range;
  /** Combined Kaplan-Rubens points range for the partnership. */
  knr?: Range;
}

export interface ConstraintSet {
  hands?: Partial<Record<Seat, HandConstraint>>;
  partnership?: {
    NS?: PartnershipConstraint;
    EW?: PartnershipConstraint;
  };
}

export function inRange(value: number, range: Range | undefined): boolean {
  if (!range) return true;
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

export function matchesHand(analysis: HandAnalysis, c: HandConstraint): boolean {
  if (!inRange(analysis.hcp, c.hcp)) return false;
  if (c.knr && !inRange(knrPoints(analysis.cards), c.knr)) return false;
  if (c.balanced !== undefined && isBalanced(analysis) !== c.balanced) return false;
  if (c.suit) {
    for (const suit of SUITS) {
      const r = c.suit[suit];
      if (r && !inRange(analysis.lengths[suit], r)) return false;
    }
  }
  return true;
}

/**
 * Evaluate a full deal against a constraint set. Hands are analyzed lazily and
 * cached so partnership totals reuse the per-seat work.
 */
export function matchesDeal(deal: Deal, set: ConstraintSet): boolean {
  const cache = {} as Partial<Record<Seat, HandAnalysis>>;
  const analyze = (seat: Seat): HandAnalysis =>
    (cache[seat] ??= analyzeHand(deal.hands[seat]));
  const knrCache = {} as Partial<Record<Seat, number>>;
  const knr = (seat: Seat): number => (knrCache[seat] ??= knrPoints(analyze(seat).cards));

  if (set.hands) {
    for (const seat of SEATS) {
      const c = set.hands[seat];
      if (c && !matchesHand(analyze(seat), c)) return false;
    }
  }

  if (set.partnership) {
    const ns = set.partnership.NS;
    if (ns?.hcp && !inRange(analyze('N').hcp + analyze('S').hcp, ns.hcp)) return false;
    if (ns?.knr && !inRange(knr('N') + knr('S'), ns.knr)) return false;
    const ew = set.partnership.EW;
    if (ew?.hcp && !inRange(analyze('E').hcp + analyze('W').hcp, ew.hcp)) return false;
    if (ew?.knr && !inRange(knr('E') + knr('W'), ew.knr)) return false;
  }

  return true;
}

/** True if a constraint set imposes no restrictions (matches every deal). */
export function isEmptyConstraintSet(set: ConstraintSet): boolean {
  const hasHand = set.hands && SEATS.some((s) => set.hands![s]);
  const p = set.partnership;
  const hasPartnership = p && (p.NS?.hcp || p.NS?.knr || p.EW?.hcp || p.EW?.knr);
  return !hasHand && !hasPartnership;
}
