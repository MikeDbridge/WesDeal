/**
 * Opening-lead analysis over a set of double-dummy-solved deals.
 *
 * For each deal, DDS's SolveBoardPBN (target −1, solutions 3) returns every
 * distinct legal lead with its exact double-dummy score — the tricks the
 * LEADING side takes against best play — plus an `equals` bitmask of
 * lower equivalent cards. `expandFutureTricks` unfolds that into one entry per
 * actual card; `aggregateLeads` then combines many deals into per-card stats.
 *
 * Seat/strain indices follow DDS: strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT; seats 0=N 1=E
 * 2=S 3=W. The opening leader is declarer's LHO: leader = (declarer + 1) % 4,
 * equivalently declarer = (leader + 3) % 4.
 */

import type { FutureTricks } from 'bridge-dds';

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

export interface LeadRow {
  suit: number;
  rank: number;
  /** Deals in which this card appeared as a legal lead (normally all). */
  n: number;
  /** Mean defensive tricks. */
  avg: number;
  /** Share of deals where the lead defeats the contract. */
  setPct: number;
  /** Share of deals where the lead is (tied-)best double dummy. */
  bestPct: number;
  /** Mean tricks conceded versus the best lead on the same deal. */
  avgCost: number;
}

/**
 * Combine per-deal lead scores into one row per card, sorted by set percentage
 * (then average tricks). `level` fixes the beat threshold.
 */
export function aggregateLeads(perDeal: LeadCardScore[][], level: number): LeadRow[] {
  const need = tricksToSet(level);
  const acc = new Map<number, { n: number; sum: number; sets: number; best: number; cost: number }>();
  for (const deal of perDeal) {
    if (deal.length === 0) continue;
    let max = 0;
    for (const c of deal) if (c.score > max) max = c.score;
    for (const c of deal) {
      const key = c.suit * 13 + (c.rank - 2);
      const slot = acc.get(key) ?? { n: 0, sum: 0, sets: 0, best: 0, cost: 0 };
      slot.n++;
      slot.sum += c.score;
      if (c.score >= need) slot.sets++;
      if (c.score === max) slot.best++;
      slot.cost += max - c.score;
      acc.set(key, slot);
    }
  }
  const rows: LeadRow[] = [];
  for (const [key, s] of acc) {
    rows.push({
      suit: (key / 13) | 0,
      rank: (key % 13) + 2,
      n: s.n,
      avg: s.sum / s.n,
      setPct: s.sets / s.n,
      bestPct: s.best / s.n,
      avgCost: s.cost / s.n,
    });
  }
  rows.sort((a, b) => b.setPct - a.setPct || b.avg - a.avg || b.suit - a.suit || b.rank - a.rank);
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
