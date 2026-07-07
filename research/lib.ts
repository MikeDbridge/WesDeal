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
 *   - 5422, except exactly 5♠-4♥ ("almost never" NT-ish per user). Honor
 *     quality in the doubletons is NOT gated here — it's measured at analysis
 *     time (doubletonHonours), so the dataset stays unbiased for any tighter
 *     definition chosen later.
 * (7222 deliberately excluded.)
 */
export type ShapeClass = '4333' | '4432' | '5332' | '6m322' | '4441' | '5431' | '5422';

/** Per-suit rank lists (♠♥♦♣ order) for shape/honor questions. */
function suitRanks(cards: Card[]): number[][] {
  const suits: number[][] = [[], [], [], []];
  for (const c of cards) suits[(c / 13) | 0].push((c % 13) + 2);
  return suits;
}

const hcpOfRank = (r: number): number => (r >= 11 ? r - 10 : 0); // J=1 Q=2 K=3 A=4

export function shapeClass(cards: Card[]): ShapeClass | null {
  const suits = suitRanks(cards);
  const len = suits.map((s) => s.length);
  const pattern = [...len].sort((a, b) => b - a).join('');
  if (pattern === '4333' || pattern === '4432' || pattern === '5332') return pattern;
  if (pattern === '6322') return len[2] === 6 || len[3] === 6 ? '6m322' : null; // six-card minor
  if (pattern === '4441' || pattern === '5431') {
    const s = len.findIndex((l) => l === 1);
    if (s < 2) return null; // singleton must be in a minor
    return suits[s][0] >= 12 ? pattern : null; // and be A, K or Q
  }
  if (pattern === '5422') return len[0] === 5 && len[1] === 4 ? null : '5422'; // never 5♠-4♥
  return null;
}

/** "A lot of values in the short suits" threshold for the 1M-route exception. */
export const SHORT_VALUES_MIN = 6;

/**
 * The 1M-opening-route exclusion (user 2026-07-07): with 15-16 HCP, a 5+ card
 * major and another 4+ card LOWER-ranking suit, the hand opens 1M and rebids
 * the second suit — so it leaves the NT-ish population — unless the values
 * outside those two long suits are substantial (≥ SHORT_VALUES_MIN HCP).
 */
function opensOneMajorInstead(suits: number[][], hcp: number): boolean {
  if (hcp < 15 || hcp > 16) return false;
  const len = suits.map((s) => s.length);
  for (let m = 0; m < 2; m++) {
    if (len[m] < 5) continue;
    for (let s = m + 1; s < 4; s++) {
      if (len[s] < 4) continue;
      let outside = 0;
      for (let k = 0; k < 4; k++) {
        if (k !== m && k !== s) outside += suits[k].reduce((a, r) => a + hcpOfRank(r), 0);
      }
      if (outside < SHORT_VALUES_MIN) return true;
    }
  }
  return false;
}

export function ntEligible(cards: Card[]): boolean {
  if (shapeClass(cards) === null) return false;
  const suits = suitRanks(cards);
  const hcp = suits.flat().reduce((a, r) => a + hcpOfRank(r), 0);
  return !opensOneMajorInstead(suits, hcp);
}

/** Honor cards (T or higher) held in the hand's two-card suits (0–4 for 5422). */
export function doubletonHonours(cards: Card[]): number {
  let n = 0;
  for (const s of suitRanks(cards)) if (s.length === 2) n += s.filter((r) => r >= 10).length;
  return n;
}

const RANK_CHAR: Record<number, string> = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T' };

/**
 * Each doubleton the hand holds, as an honor-holding class: both cards T+ give
 * a pairing ("AK", "KT", "JT", …), one honor gives "Ax"/"Kx"/…, none is "xx".
 */
export function doubletonClasses(cards: Card[]): string[] {
  return suitRanks(cards)
    .filter((s) => s.length === 2)
    .map((s) => {
      const honors = s.filter((r) => r >= 10).sort((a, b) => b - a).map((r) => RANK_CHAR[r]);
      if (honors.length === 2) return honors.join('');
      if (honors.length === 1) return `${honors[0]}x`;
      return 'xx';
    });
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

/** OLS with intercept via normal equations; returns [intercept, ...coefs]. */
export function olsFit(X: number[][], y: number[]): number[] {
  const k = X[0].length + 1;
  const A = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  const b = new Array<number>(k).fill(0);
  for (let i = 0; i < X.length; i++) {
    const xi = [1, ...X[i]];
    for (let p = 0; p < k; p++) {
      b[p] += xi[p] * y[i];
      for (let q = p; q < k; q++) A[p][q] += xi[p] * xi[q];
    }
  }
  for (let p = 0; p < k; p++) for (let q = 0; q < p; q++) A[p][q] = A[q][p];
  for (let col = 0; col < k; col++) {
    let piv = col;
    for (let r = col + 1; r < k; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    const d = A[col][col];
    for (let q = col; q < k; q++) A[col][q] /= d;
    b[col] /= d;
    for (let r = 0; r < k; r++) {
      if (r === col || A[r][col] === 0) continue;
      const f = A[r][col];
      for (let q = col; q < k; q++) A[r][q] -= f * A[col][q];
      b[r] -= f * b[col];
    }
  }
  return b;
}

export function olsPredict(beta: number[], x: number[]): number {
  let s = beta[0];
  for (let i = 0; i < x.length; i++) s += beta[i + 1] * x[i];
  return s;
}

/** AUC — P(score of a making deal > score of a failing deal), ties count half. */
export function auc(scores: number[], positive: boolean[]): number {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a] - scores[b]);
  const ranks = new Array<number>(scores.length).fill(0);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && scores[idx[j + 1]] === scores[idx[i]]) j++;
    const avg = (i + j) / 2 + 1;
    for (let t = i; t <= j; t++) ranks[idx[t]] = avg;
    i = j + 1;
  }
  let nPos = 0;
  let nNeg = 0;
  let sumPos = 0;
  for (let t = 0; t < positive.length; t++) {
    if (positive[t]) {
      nPos++;
      sumPos += ranks[t];
    } else nNeg++;
  }
  if (nPos === 0 || nNeg === 0) return NaN;
  return (sumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

/** The cut maximizing accuracy of "bid when score ≥ threshold". */
export function bestThreshold(scores: number[], positive: boolean[]): { thr: number; acc: number } {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a] - scores[b]);
  const n = scores.length;
  let totalPos = 0;
  for (const p of positive) if (p) totalPos++;
  let best = { thr: -Infinity, acc: totalPos / n }; // bid on everything
  let negBelow = 0;
  let posBelow = 0;
  for (let c = 0; c < n; c++) {
    if (positive[idx[c]]) posBelow++;
    else negBelow++;
    if (c + 1 < n && scores[idx[c + 1]] === scores[idx[c]]) continue;
    const acc = (negBelow + (totalPos - posBelow)) / n;
    if (acc > best.acc) {
      best = { thr: c + 1 < n ? (scores[idx[c]] + scores[idx[c + 1]]) / 2 : scores[idx[c]] + 1e-9, acc };
    }
  }
  return best;
}

/** Score at which P(success) crosses 50%, interpolated over rounded-score bins. */
export function fiftyPct(scores: number[], positive: boolean[], minBin = 25): number | null {
  const bins = new Map<number, { n: number; pos: number }>();
  for (let i = 0; i < scores.length; i++) {
    const key = Math.round(scores[i]);
    const slot = bins.get(key) ?? { n: 0, pos: 0 };
    slot.n++;
    if (positive[i]) slot.pos++;
    bins.set(key, slot);
  }
  const keys = [...bins.keys()].sort((a, b) => a - b).filter((k) => bins.get(k)!.n >= minBin);
  for (let i = 0; i + 1 < keys.length; i++) {
    const p1 = bins.get(keys[i])!.pos / bins.get(keys[i])!.n;
    const p2 = bins.get(keys[i + 1])!.pos / bins.get(keys[i + 1])!.n;
    if (p1 < 0.5 && p2 >= 0.5) return keys[i] + ((0.5 - p1) / (p2 - p1)) * (keys[i + 1] - keys[i]);
  }
  return null;
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
