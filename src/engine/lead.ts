/**
 * Opening-lead analysis over a set of double-dummy-solved deals.
 *
 * For each deal, DDS's SolveBoardPBN (target −1, solutions 3) returns every
 * distinct legal lead with its exact double-dummy score — the tricks the
 * LEADING side takes against best play — plus an `equals` bitmask of lower
 * equivalent cards. `expandFutureTricks` unfolds that into one entry per
 * actual card.
 *
 * Cards of consecutive rank in the leader's own hand (♦54, ♠KQJ) are
 * interchangeable on every deal — no missing card can lie between them — so
 * analysis runs on `groupTouching` groups, and `aggregateLeadGroups` combines
 * many deals into per-group stats including the full trick distribution.
 *
 * Seat/strain indices follow DDS: strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT; seats 0=N 1=E
 * 2=S 3=W. The opening leader is declarer's LHO: leader = (declarer + 1) % 4,
 * equivalently declarer = (leader + 3) % 4.
 */

import type { FutureTricks } from 'bridge-dds';
import type { Card } from './cards';

export interface LeadCardScore {
  /** 0=♠ 1=♥ 2=♦ 3=♣ */
  suit: number;
  /** 2..14 */
  rank: number;
  /** Double-dummy tricks for the DEFENSE (the leading side) after this lead. */
  score: number;
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

/** A maximal run of touching cards in one suit of the leader's hand. */
export interface LeadGroup {
  /** 0=♠ 1=♥ 2=♦ 3=♣ */
  suit: number;
  /** Consecutive ranks, highest first, e.g. [13, 12, 11] for KQJ. */
  ranks: number[];
}

/**
 * Group a 13-card hand into maximal touching runs per suit (♠ first, then by
 * rank descending). Touching cards are strictly interchangeable as leads.
 */
export function groupTouching(cards: Card[]): LeadGroup[] {
  const bySuit: number[][] = [[], [], [], []];
  for (const c of cards) bySuit[(c / 13) | 0].push((c % 13) + 2);
  const groups: LeadGroup[] = [];
  for (let suit = 0; suit < 4; suit++) {
    const ranks = bySuit[suit].sort((a, b) => b - a);
    let run: number[] = [];
    for (const r of ranks) {
      if (run.length > 0 && run[run.length - 1] !== r + 1) {
        groups.push({ suit, ranks: run });
        run = [];
      }
      run.push(r);
    }
    if (run.length > 0) groups.push({ suit, ranks: run });
  }
  return groups;
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

export interface LeadGroupRow {
  group: LeadGroup;
  /** Deals in which the group's lead was scored. */
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

/** Mean defender-perspective score for a row (− declarer's duplicate score). */
export function avgDefenderScore(row: LeadGroupRow, level: number, strain: number, vul: boolean): number {
  let sum = 0;
  for (let t = 0; t <= 13; t++) {
    if (row.counts[t] > 0) sum += row.counts[t] * -scoreContract(level, strain, 13 - t, vul);
  }
  return sum / row.n;
}

/**
 * Combine per-deal lead scores into one row per touching group, sorted by set
 * percentage (then average tricks). Group members share identical scores, so
 * each group reads its highest card's score.
 */
export function aggregateLeadGroups(perDeal: LeadCardScore[][], groups: LeadGroup[], level: number): LeadGroupRow[] {
  const need = tricksToSet(level);
  const acc = groups.map(() => ({ n: 0, sum: 0, sets: 0, best: 0, cost: 0, counts: new Array<number>(14).fill(0) }));
  for (const deal of perDeal) {
    if (deal.length === 0) continue;
    const byCard = new Map<number, number>();
    let max = 0;
    for (const c of deal) {
      byCard.set(c.suit * 13 + (c.rank - 2), c.score);
      if (c.score > max) max = c.score;
    }
    groups.forEach((g, i) => {
      const score = byCard.get(g.suit * 13 + (g.ranks[0] - 2));
      if (score === undefined) return;
      const slot = acc[i];
      slot.n++;
      slot.sum += score;
      slot.counts[score]++;
      if (score >= need) slot.sets++;
      if (score === max) slot.best++;
      slot.cost += max - score;
    });
  }
  const rows: LeadGroupRow[] = groups
    .map((group, i) => {
      const s = acc[i];
      return {
        group,
        n: s.n,
        avg: s.n ? s.sum / s.n : 0,
        setPct: s.n ? s.sets / s.n : 0,
        bestPct: s.n ? s.best / s.n : 0,
        avgCost: s.n ? s.cost / s.n : 0,
        counts: s.counts,
      };
    })
    .filter((r) => r.n > 0);
  rows.sort((a, b) => b.setPct - a.setPct || b.avg - a.avg || a.group.suit - b.group.suit || b.group.ranks[0] - a.group.ranks[0]);
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
