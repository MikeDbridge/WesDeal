/**
 * Opening-lead analysis over a set of double-dummy-solved deals.
 *
 * For each deal, DDS's SolveBoardPBN (target −1, solutions 3) returns every
 * distinct legal lead with its exact double-dummy score — the tricks the
 * LEADING side takes against best play — plus an `equals` bitmask of lower
 * equivalent cards. `expandFutureTricks` unfolds that into one entry per actual
 * card; `aggregateLeadGroups` combines many deals into per-lead-group stats
 * (pooling the fixed hand's touching cards) including the full trick distribution.
 *
 * Seat/strain indices follow DDS: strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT; seats 0=N 1=E
 * 2=S 3=W. The opening leader is declarer's LHO: leader = (declarer + 1) % 4,
 * equivalently declarer = (leader + 3) % 4.
 */

import type { FutureTricks } from 'bridge-dds';
import { RANK_LABELS } from './cards';

export interface LeadCardScore {
  /** 0=♠ 1=♥ 2=♦ 3=♣ */
  suit: number;
  /** 2..14 */
  rank: number;
  /** Double-dummy tricks for the DEFENSE (the leading side) after this lead. */
  score: number;
}

/**
 * A pool of interchangeable leads: cards of one suit whose ranks are consecutive
 * in the leader's (fixed) holding. Because no card lies between them, leading any
 * one is identical double dummy, so they are treated as a single lead.
 */
export interface LeadGroup {
  /** 0=♠ 1=♥ 2=♦ 3=♣ */
  suit: number;
  /** The pooled ranks, highest first (e.g. [12, 11] for QJ, [4, 3, 2] for 432). */
  ranks: number[];
}

/** Split a fixed hand into lead groups (maximal runs of touching ranks per suit). */
export function computeLeadGroups(cards: Array<{ suit: number; rank: number }>): LeadGroup[] {
  const bySuit: number[][] = [[], [], [], []];
  for (const c of cards) bySuit[c.suit].push(c.rank);
  const groups: LeadGroup[] = [];
  for (let suit = 0; suit < 4; suit++) {
    const ranks = bySuit[suit].sort((a, b) => b - a);
    let i = 0;
    while (i < ranks.length) {
      const run = [ranks[i]];
      let j = i + 1;
      while (j < ranks.length && ranks[j] === ranks[j - 1] - 1) run.push(ranks[j++]);
      groups.push({ suit, ranks: run });
      i = j;
    }
  }
  return groups;
}

/** Stable key for a lead group (suit + its top rank). */
export function groupKey(g: LeadGroup): string {
  return `${g.suit}-${g.ranks[0]}`;
}

/** Human label for a group's ranks, e.g. "QJ" or "432". */
export function groupLabel(g: LeadGroup): string {
  return g.ranks.map((r) => RANK_LABELS[r]).join('');
}

/** The defensive tricks each group scores on one deal (via its top card). */
export function groupTricks(deal: LeadCardScore[], groups: LeadGroup[]): number[] {
  const score = new Map<number, number>();
  for (const c of deal) score.set(c.suit * 16 + c.rank, c.score);
  return groups.map((g) => score.get(g.suit * 16 + g.ranks[0]) ?? 0);
}

/** Declarer seat for a given opening leader (leader is declarer's LHO). */
export function declarerFor(leader: number): number {
  return (leader + 3) % 4;
}

/** Defensive tricks needed to defeat a contract of `level`. */
export function tricksToSet(level: number): number {
  return 8 - level;
}

/** Unfold a SolveBoard result into one scored entry per actual card. */
export function expandFutureTricks(ft: FutureTricks): LeadCardScore[] {
  const out: LeadCardScore[] = [];
  for (let i = 0; i < ft.cards; i++) {
    out.push({ suit: ft.suit[i], rank: ft.rank[i], score: ft.score[i] });
    const eq = ft.equals[i];
    for (let r = 2; r <= 14; r++) {
      if (eq & (1 << r)) out.push({ suit: ft.suit[i], rank: r, score: ft.score[i] });
    }
  }
  return out;
}

/**
 * Duplicate-bridge score for the DECLARING side (undoubled): positive when the
 * contract makes (with over-trick, game/part-score and slam bonuses), negative
 * when it goes down. `vul` is the declaring side's vulnerability.
 */
export function scoreContract(level: number, strain: number, declTricks: number, vul: boolean): number {
  const need = 6 + level;
  if (declTricks < need) return -(vul ? 100 : 50) * (need - declTricks);
  const per = strain === 2 || strain === 3 ? 20 : 30; // minors 20, majors/NT 30
  const trickScore = strain === 4 ? 40 + 30 * (level - 1) : per * level;
  let score = trickScore + (declTricks - need) * (strain === 4 ? 30 : per);
  score += trickScore >= 100 ? (vul ? 500 : 300) : 50;
  if (level === 6) score += vul ? 750 : 500;
  if (level === 7) score += vul ? 1500 : 1000;
  return score;
}

export interface LeadRow {
  /** 0=♠ 1=♥ 2=♦ 3=♣ */
  suit: number;
  /** The pooled ranks, highest first. */
  ranks: number[];
  /** Rank label for display, e.g. "QJ" or "432". */
  label: string;
  /** Deals in which this lead was scored. */
  n: number;
  /** Mean defensive tricks. */
  avg: number;
  /** Share of deals where the lead defeats the contract. */
  setPct: number;
  /** Share of deals where the lead is (tied-)best double dummy. */
  bestPct: number;
  /** Mean tricks conceded versus the best lead on the same deal. */
  avgCost: number;
  /** counts[t] = deals on which the defense takes exactly t tricks (0..13). */
  counts: number[];
}

/** Mean defender-perspective duplicate score for a trick distribution. */
export function avgDefenderScore(counts: number[], n: number, level: number, strain: number, vul: boolean): number {
  if (n === 0) return 0;
  let sum = 0;
  for (let t = 0; t <= 13; t++) {
    if (counts[t] > 0) sum += counts[t] * -scoreContract(level, strain, 13 - t, vul);
  }
  return sum / n;
}

/**
 * Combine per-deal lead scores into one row per lead group (pooling touching
 * cards of the fixed hand), sorted by set percentage (then average tricks).
 */
export function aggregateLeadGroups(perDeal: LeadCardScore[][], groups: LeadGroup[], level: number): LeadRow[] {
  const need = tricksToSet(level);
  const acc = groups.map(() => ({ n: 0, sum: 0, sets: 0, best: 0, cost: 0, counts: new Array<number>(14).fill(0) }));
  for (const deal of perDeal) {
    if (deal.length === 0) continue;
    const tricks = groupTricks(deal, groups);
    let max = 0;
    for (const t of tricks) if (t > max) max = t;
    tricks.forEach((t, gi) => {
      const slot = acc[gi];
      slot.n++;
      slot.sum += t;
      slot.counts[t]++;
      if (t >= need) slot.sets++;
      if (t === max) slot.best++;
      slot.cost += max - t;
    });
  }
  const rows: LeadRow[] = groups
    .map((g, gi) => {
      const s = acc[gi];
      return {
        suit: g.suit,
        ranks: g.ranks,
        label: groupLabel(g),
        n: s.n,
        avg: s.n ? s.sum / s.n : 0,
        setPct: s.n ? s.sets / s.n : 0,
        bestPct: s.n ? s.best / s.n : 0,
        avgCost: s.n ? s.cost / s.n : 0,
        counts: s.counts,
      };
    })
    .filter((r) => r.n > 0);
  rows.sort((a, b) => b.setPct - a.setPct || b.avg - a.avg || a.suit - b.suit || b.ranks[0] - a.ranks[0]);
  return rows;
}

/** Share of deals where even the best defense fails to set (declarer always makes, DD). */
export function unbeatablePct(perDeal: LeadCardScore[][], level: number): number {
  const need = tricksToSet(level);
  let unbeatable = 0;
  let n = 0;
  for (const deal of perDeal) {
    if (deal.length === 0) continue;
    n++;
    if (!deal.some((c) => c.score >= need)) unbeatable++;
  }
  return n === 0 ? 0 : unbeatable / n;
}
