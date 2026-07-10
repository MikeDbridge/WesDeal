/**
 * Opening-lead analysis over a set of double-dummy-solved deals.
 *
 * For each deal, DDS's SolveBoardPBN (target −1, solutions 3) returns every
 * distinct legal lead with its exact double-dummy score — the tricks the
 * LEADING side takes against best play — plus an `equals` bitmask of lower
 * equivalent cards. `expandFutureTricks` unfolds that into one entry per actual
 * card; `aggregateLeads` combines many deals into per-card stats including the
 * full trick distribution.
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
  /** 2..14 */
  rank: number;
  /** Deals in which this card was scored as a lead. */
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
 * Combine per-deal lead scores into one row per card, sorted by set percentage
 * (then average tricks).
 */
export function aggregateLeads(perDeal: LeadCardScore[][], level: number): LeadRow[] {
  const need = tricksToSet(level);
  const acc = new Map<number, { n: number; sum: number; sets: number; best: number; cost: number; counts: number[] }>();
  for (const deal of perDeal) {
    if (deal.length === 0) continue;
    let max = 0;
    for (const c of deal) if (c.score > max) max = c.score;
    for (const c of deal) {
      const key = c.suit * 13 + (c.rank - 2);
      let slot = acc.get(key);
      if (!slot) {
        slot = { n: 0, sum: 0, sets: 0, best: 0, cost: 0, counts: new Array<number>(14).fill(0) };
        acc.set(key, slot);
      }
      slot.n++;
      slot.sum += c.score;
      slot.counts[c.score]++;
      if (c.score >= need) slot.sets++;
      if (c.score === max) slot.best++;
      slot.cost += max - c.score;
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
      counts: s.counts,
    });
  }
  rows.sort((a, b) => b.setPct - a.setPct || b.avg - a.avg || a.suit - b.suit || b.rank - a.rank);
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
