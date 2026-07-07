/**
 * Shared helpers for the hand-evaluation research pipeline.
 *
 * Datasets are JSONL, one deal per line: { pbn, dd } where `dd` is the full
 * double-dummy table dd[strain][declarer] (strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT,
 * declarer 0=N 1=E 2=S 3=W). Features are recomputed from the PBN at analysis
 * time, so the solved dataset stays useful as the feature set evolves.
 */

import { SUITS, RANK_LABELS, makeCard, HCP_BY_CARD, type Card, type Rank } from '../src/engine/cards';
import { SEATS, type Seat } from '../src/engine/deal';
import { knrPoints } from '../src/engine/knr';

export interface StoredDeal {
  pbn: string;
  /** dd[strain][declarer], as produced by CalcDDTablePBN. */
  dd: number[][];
}

const RANK_OF_CHAR: Record<string, Rank> = {};
for (let r = 2; r <= 14; r++) RANK_OF_CHAR[RANK_LABELS[r as Rank]] = r as Rank;

/** Parse a PBN deal string "N:AKQ52.K9.Q84.K76 ..." back into per-seat cards. */
export function parsePBN(pbn: string): Record<Seat, Card[]> {
  if (!pbn.startsWith('N:')) throw new Error(`PBN must start with "N:": ${pbn}`);
  const handStrs = pbn.slice(2).trim().split(/\s+/);
  if (handStrs.length !== 4) throw new Error(`expected 4 hands: ${pbn}`);
  const out = {} as Record<Seat, Card[]>;
  handStrs.forEach((handStr, i) => {
    const suits = handStr.split('.');
    if (suits.length !== 4) throw new Error(`expected 4 suits in "${handStr}"`);
    const cards: Card[] = [];
    suits.forEach((ranks, si) => {
      for (const ch of ranks) {
        const rank = RANK_OF_CHAR[ch];
        if (!rank) throw new Error(`bad rank "${ch}" in "${handStr}"`);
        cards.push(makeCard(SUITS[si], rank));
      }
    });
    if (cards.length !== 13) throw new Error(`hand "${handStr}" has ${cards.length} cards`);
    out[SEATS[i]] = cards;
  });
  return out;
}

/** BUM-RAP honour values (A=4.5 K=3 Q=1.5 J=0.75 T=0.25). */
const BUMRAP: Partial<Record<number, number>> = { 14: 4.5, 13: 3, 12: 1.5, 11: 0.75, 10: 0.25 };

export interface HandFeatures {
  hcp: number;
  knr: number;
  controls: number;
  bumrap: number;
  aces: number;
  tens: number;
  /** [♠, ♥, ♦, ♣] */
  lengths: number[];
  /** Classic length points: +1 per card beyond four in each suit. */
  lengthPts: number;
}

export function handFeatures(cards: Card[]): HandFeatures {
  let hcp = 0;
  let controls = 0;
  let bumrap = 0;
  let aces = 0;
  let tens = 0;
  const lengths = [0, 0, 0, 0];
  for (const c of cards) {
    const rank = (c % 13) + 2;
    hcp += HCP_BY_CARD[c];
    lengths[(c / 13) | 0]++;
    if (rank === 14) {
      controls += 2;
      aces++;
    } else if (rank === 13) controls += 1;
    if (rank === 10) tens++;
    bumrap += BUMRAP[rank] ?? 0;
  }
  const lengthPts = lengths.reduce((acc, l) => acc + Math.max(0, l - 4), 0);
  return { hcp, knr: knrPoints(cards), controls, bumrap, aces, tens, lengths, lengthPts };
}

/**
 * The study population: balanced or semi-balanced hands (user spec 2026-07-07).
 *   - 4333, 4432, 5332
 *   - 6322 with the six-card suit a minor
 *   - 4441 or 5431 with the singleton an A/K/Q in a minor
 * (5422 and 7222 deliberately excluded.)
 */
export function ntEligible(cards: Card[]): boolean {
  const suits: number[][] = [[], [], [], []];
  for (const c of cards) suits[(c / 13) | 0].push((c % 13) + 2);
  const len = suits.map((s) => s.length);
  const pattern = [...len].sort((a, b) => b - a).join('');
  if (pattern === '4333' || pattern === '4432' || pattern === '5332') return true;
  if (pattern === '6322') return len[2] === 6 || len[3] === 6; // six-card minor
  if (pattern === '4441' || pattern === '5431') {
    const s = len.findIndex((l) => l === 1);
    if (s < 2) return false; // singleton must be in a minor
    return suits[s][0] >= 12; // and be A, K or Q
  }
  return false;
}

// ---- Small statistics helpers ----------------------------------------------

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sd(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / xs.length);
}

export function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export interface LinFit {
  slope: number;
  intercept: number;
  r: number;
  r2: number;
  /** Standard deviation of the residuals (tricks). */
  residSD: number;
}

/** Ordinary least-squares fit y = slope·x + intercept. */
export function linfit(xs: number[], ys: number[]): LinFit {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const resid = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const r = pearson(xs, ys);
  return { slope, intercept, r, r2: r * r, residSD: sd(resid) };
}
