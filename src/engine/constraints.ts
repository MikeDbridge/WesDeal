/**
 * The constraint model — the stable core of the program.
 *
 * Phase 1 exposes this through a simple form (per-hand HCP / suit-length ranges
 * and partnership point totals). A future scripting layer can compile text into
 * this exact same model, so nothing here needs to change to gain that power.
 */

import { type Suit, SUITS, HCP_BY_CARD } from './cards';
import { type Seat, SEATS, type Deal } from './deal';
import { type HandAnalysis, isBalanced } from './hand';
import { knrPoints, knrPointsRange } from './knr';
import { compileFilter, type CompiledFilter, type HandContext } from './filter';

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
  /** A custom filter expression (see filter.ts) the hand must satisfy. */
  filter?: string;
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

/** A constraint set compiled into a fast predicate (see `compileMatcher`). */
export interface CompiledMatcher {
  /** Evaluate a Deal object (used for given-hand dealing and one-off checks). */
  matchDeal(deal: Deal): boolean;
  /** Evaluate a flat, seat-ordered 52-card array in place (the hot path). */
  matchFlat(deck: ArrayLike<number>): boolean;
}

interface CompiledHand {
  i: number;
  hcp?: Range;
  knr?: Range;
  balanced?: boolean;
  suit: Array<Range | undefined> | null;
  filter: CompiledFilter | null;
}

/**
 * Compile a constraint set into a reusable, allocation-free predicate.
 *
 * Hot-loop strategy: a single pass over each constrained seat's 13 cards yields
 * HCP and suit lengths (no sorting, no per-suit arrays); cheap checks (HCP,
 * length, balanced) run for every seat before the expensive Kaplan-Rubens count
 * is touched; and any failing check bails immediately. Per-seat HCP/K&R are
 * cached in scratch buffers so partnership totals reuse the work.
 */
export function compileMatcher(set: ConstraintSet): CompiledMatcher {
  const hands: CompiledHand[] = [];
  if (set.hands) {
    for (let i = 0; i < 4; i++) {
      const c = set.hands[SEATS[i]];
      if (!c) continue;
      let filter: CompiledFilter | null = null;
      if (c.filter && c.filter.trim() !== '') {
        const r = compileFilter(c.filter);
        if (r.error) throw new Error(`Filter error (${SEATS[i]}): ${r.error}`);
        filter = r.filter ?? null;
      }
      hands.push({
        i,
        hcp: c.hcp,
        knr: c.knr,
        balanced: c.balanced,
        suit: c.suit ? [c.suit.S, c.suit.H, c.suit.D, c.suit.C] : null,
        filter,
      });
    }
  }
  const anyFilter = hands.some((h) => h.filter !== null);
  const nsHcp = set.partnership?.NS?.hcp;
  const nsKnr = set.partnership?.NS?.knr;
  const ewHcp = set.partnership?.EW?.hcp;
  const ewKnr = set.partnership?.EW?.knr;
  const needHcpCache = !!(nsHcp || ewHcp);
  const needKnrCache = !!(nsKnr || ewKnr);

  // Scratch reused across every evaluation (single-threaded hot loop).
  const len = [0, 0, 0, 0];
  const mask = [0, 0, 0, 0];
  const hcpCache = [0, 0, 0, 0];
  const hcpDone = [false, false, false, false];
  const knrCache = [0, 0, 0, 0];
  const knrDone = [false, false, false, false];
  // Reusable context for custom filters (filled per seat just before use).
  const fctx: HandContext = { hcp: 0, knr: 0, controls: 0, len, mask };

  /** Check HCP / suit-length / balanced for one hand using `len` (just filled). */
  const checkCheap = (h: CompiledHand, hcp: number): boolean => {
    if (h.hcp && !inRange(hcp, h.hcp)) return false;
    if (h.suit) {
      for (let s = 0; s < 4; s++) {
        const r = h.suit[s];
        if (r && !inRange(len[s], r)) return false;
      }
    }
    if (h.balanced !== undefined && balancedFromLengths(len) !== h.balanced) return false;
    return true;
  };

  const run = (
    hcpLen: (i: number, withMask: boolean) => number, // fills `len` (and `mask`), returns hcp
    hcpOnly: (i: number) => number,
    knrOf: (i: number) => number,
  ): boolean => {
    if (needHcpCache) hcpDone[0] = hcpDone[1] = hcpDone[2] = hcpDone[3] = false;
    if (needKnrCache || anyFilter) knrDone[0] = knrDone[1] = knrDone[2] = knrDone[3] = false;

    for (const h of hands) {
      const hcp = hcpLen(h.i, h.filter !== null);
      if (needHcpCache) {
        hcpCache[h.i] = hcp;
        hcpDone[h.i] = true;
      }
      if (!checkCheap(h, hcp)) return false;
      if (h.filter) {
        fctx.hcp = hcp; // len and mask are already filled for this seat
        if (h.filter.usesKnr) fctx.knr = cachedKnr(knrOf, h.i);
        if (h.filter.usesControls) fctx.controls = controlsFromMask(mask);
        if (!h.filter.predicate(fctx)) return false;
      }
    }

    if (nsHcp && !inRange(cachedHcp(hcpOnly, 0) + cachedHcp(hcpOnly, 2), nsHcp)) return false;
    if (ewHcp && !inRange(cachedHcp(hcpOnly, 1) + cachedHcp(hcpOnly, 3), ewHcp)) return false;

    for (const h of hands) {
      if (!h.knr) continue;
      const k = knrOf(h.i);
      if (needKnrCache) {
        knrCache[h.i] = k;
        knrDone[h.i] = true;
      }
      if (!inRange(k, h.knr)) return false;
    }

    if (nsKnr && !inRange(cachedKnr(knrOf, 0) + cachedKnr(knrOf, 2), nsKnr)) return false;
    if (ewKnr && !inRange(cachedKnr(knrOf, 1) + cachedKnr(knrOf, 3), ewKnr)) return false;

    return true;
  };

  const cachedHcp = (hcpOnly: (i: number) => number, i: number): number => {
    if (hcpDone[i]) return hcpCache[i];
    const v = hcpOnly(i);
    hcpCache[i] = v;
    hcpDone[i] = true;
    return v;
  };
  const cachedKnr = (knrOf: (i: number) => number, i: number): number => {
    if (knrDone[i]) return knrCache[i];
    const v = knrOf(i);
    knrCache[i] = v;
    knrDone[i] = true;
    return v;
  };

  return {
    matchDeal(deal: Deal): boolean {
      const hcpLen = (i: number, withMask: boolean): number => {
        const cards = deal.hands[SEATS[i]];
        let hcp = 0;
        len[0] = len[1] = len[2] = len[3] = 0;
        if (withMask) mask[0] = mask[1] = mask[2] = mask[3] = 0;
        for (let k = 0; k < 13; k++) {
          const card = cards[k];
          hcp += HCP_BY_CARD[card];
          const su = (card / 13) | 0;
          len[su]++;
          if (withMask) mask[su] |= 1 << card % 13;
        }
        return hcp;
      };
      const hcpOnly = (i: number): number => {
        const cards = deal.hands[SEATS[i]];
        let hcp = 0;
        for (let k = 0; k < 13; k++) hcp += HCP_BY_CARD[cards[k]];
        return hcp;
      };
      const knrOf = (i: number): number => knrPoints(deal.hands[SEATS[i]]);
      return run(hcpLen, hcpOnly, knrOf);
    },

    matchFlat(deck: ArrayLike<number>): boolean {
      const hcpLen = (i: number, withMask: boolean): number => {
        const off = i * 13;
        let hcp = 0;
        len[0] = len[1] = len[2] = len[3] = 0;
        if (withMask) mask[0] = mask[1] = mask[2] = mask[3] = 0;
        for (let k = 0; k < 13; k++) {
          const card = deck[off + k];
          hcp += HCP_BY_CARD[card];
          const su = (card / 13) | 0;
          len[su]++;
          if (withMask) mask[su] |= 1 << card % 13;
        }
        return hcp;
      };
      const hcpOnly = (i: number): number => {
        const off = i * 13;
        let hcp = 0;
        for (let k = 0; k < 13; k++) hcp += HCP_BY_CARD[deck[off + k]];
        return hcp;
      };
      const knrOf = (i: number): number => knrPointsRange(deck, i * 13, i * 13 + 13);
      return run(hcpLen, hcpOnly, knrOf);
    },
  };
}

/** Honor controls (A=2, K=1) summed across four suit rank-masks. */
function controlsFromMask(mask: ArrayLike<number>): number {
  let c = 0;
  for (let s = 0; s < 4; s++) {
    if (mask[s] & (1 << 12)) c += 2; // ace
    if (mask[s] & (1 << 11)) c += 1; // king
  }
  return c;
}

/** True if four suit lengths form a balanced shape (4-3-3-3, 4-4-3-2, 5-3-3-2). */
function balancedFromLengths(len: ArrayLike<number>): boolean {
  let a = len[0];
  let b = len[1];
  let c = len[2];
  let d = len[3];
  // Sort the four lengths ascending (tiny fixed network).
  if (a > b) [a, b] = [b, a];
  if (c > d) [c, d] = [d, c];
  if (a > c) [a, c] = [c, a];
  if (b > d) [b, d] = [d, b];
  if (b > c) [b, c] = [c, b];
  return (
    (a === 3 && b === 3 && c === 3 && d === 4) || // 4-3-3-3
    (a === 2 && b === 3 && c === 4 && d === 4) || // 4-4-3-2
    (a === 2 && b === 3 && c === 3 && d === 5) // 5-3-3-2
  );
}

/**
 * Evaluate a full deal against a constraint set. Convenience wrapper that
 * compiles the set on each call — for the dealer's hot loop, compile once with
 * `compileMatcher` and reuse the predicate.
 */
export function matchesDeal(deal: Deal, set: ConstraintSet): boolean {
  return compileMatcher(set).matchDeal(deal);
}

/** True if a constraint set imposes no restrictions (matches every deal). */
export function isEmptyConstraintSet(set: ConstraintSet): boolean {
  const hasHand = set.hands && SEATS.some((s) => set.hands![s]);
  const p = set.partnership;
  const hasPartnership = p && (p.NS?.hcp || p.NS?.knr || p.EW?.hcp || p.EW?.knr);
  return !hasHand && !hasPartnership;
}
