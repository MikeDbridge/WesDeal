/**
 * Bidding-range study: shared library.
 *
 * Reads the WBF/EBL championship scrape (contracts.csv + matches.csv), replays
 * every recorded auction call-by-call, attaches the actual hand to each call,
 * and classifies calls into auction contexts ("opening in 2nd seat", "direct
 * overcall of a natural 1C", "negative double after 1S (2H)", …). The task in
 * bidding.task.ts aggregates these into empirical bid ranges and emits both a
 * report and dealer-ready filter profiles.
 *
 * Everything here is pure and unit-tested (tests/bidding.test.ts).
 */

import { HCP_BY_CARD } from '../../src/engine/cards';
import { SEATS, type Seat } from '../../src/engine/deal';
import { parsePBN } from '../lib';

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Minimal RFC-4180 CSV parser (quotes, embedded commas/newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
      field = '';
      rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
    rows.push(row);
  }
  return rows;
}

/** Header-indexed accessor over a parsed CSV. */
export function csvColumns(rows: string[][]): Map<string, number> {
  const map = new Map<string, number>();
  rows[0].forEach((name, i) => map.set(name, i));
  return map;
}

// ---------------------------------------------------------------------------
// Calls and auctions
// ---------------------------------------------------------------------------

/** Strain letter → engine suit index (0=♠ 1=♥ 2=♦ 3=♣), NT = 4. */
export const STRAIN_INDEX: Record<string, number> = { S: 0, H: 1, D: 2, C: 3, NT: 4 };

const CALL_RE = /^(?:P|X|XX|[1-7](?:C|D|H|S|NT))$/;

export function isCall(tok: string): boolean {
  return CALL_RE.test(tok);
}

export function isBid(call: string): boolean {
  return call !== 'P' && call !== 'X' && call !== 'XX';
}

/** Bid → { level, strain letter, strain index }. */
export function bidParts(bid: string): { level: number; strain: string; strainIdx: number } {
  const level = Number(bid[0]);
  const strain = bid.slice(1);
  return { level, strain, strainIdx: STRAIN_INDEX[strain] };
}

/** Rank a bid for legality comparisons (higher = outranks). */
export function bidRank(bid: string): number {
  const { level, strain } = bidParts(bid);
  return level * 5 + ['C', 'D', 'H', 'S', 'NT'].indexOf(strain);
}

export interface AuctionCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Validate a dealer-first auction against the recorded contract.
 *
 * The site truncates the closing pass(es) sometimes, so an auction is accepted
 * when it is a legal PREFIX whose last bid equals the contract, the doubling
 * state matches, and the derived declarer (first of the winning side to name
 * the contract strain) matches. Junk tokens and illegal sequences are rejected.
 */
export function checkAuction(
  calls: string[],
  dealerIdx: number,
  contract: string,
  doubled: number,
  declarerIdx: number,
): AuctionCheck {
  if (calls.length === 0) return { ok: false, reason: 'empty' };
  let lastBid = '';
  let lastBidSeat = -1;
  let dbl = 0; // 0 / 1 (X) / 2 (XX)
  let passesAfterBid = 0;
  const firstNamer = new Map<string, number>(); // "side|strain" → seat
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const seat = (dealerIdx + i) % 4;
    if (!isCall(call)) return { ok: false, reason: 'bad-token' };
    if (lastBid !== '' && passesAfterBid >= 3) return { ok: false, reason: 'calls-after-end' };
    if (call === 'P') {
      if (lastBid !== '') passesAfterBid++;
      continue;
    }
    if (call === 'X') {
      if (lastBid === '' || dbl !== 0) return { ok: false, reason: 'bad-x' };
      if ((lastBidSeat - seat + 4) % 2 === 0) return { ok: false, reason: 'x-own-side' };
      dbl = 1;
    } else if (call === 'XX') {
      if (dbl !== 1) return { ok: false, reason: 'bad-xx' };
      if ((lastBidSeat - seat + 4) % 2 !== 0) return { ok: false, reason: 'xx-their-side' };
      dbl = 2;
    } else {
      if (lastBid !== '' && bidRank(call) <= bidRank(lastBid)) {
        return { ok: false, reason: 'insufficient' };
      }
      lastBid = call;
      lastBidSeat = seat;
      dbl = 0;
      const key = `${seat % 2}|${bidParts(call).strain}`;
      if (!firstNamer.has(key)) firstNamer.set(key, seat);
    }
    if (call !== 'P') passesAfterBid = 0;
  }
  if (lastBid === '') return { ok: false, reason: 'no-bid' };
  if (lastBid !== contract) return { ok: false, reason: 'contract-mismatch' };
  if (dbl !== doubled) return { ok: false, reason: 'double-mismatch' };
  const namer = firstNamer.get(`${lastBidSeat % 2}|${bidParts(lastBid).strain}`);
  if (namer !== declarerIdx) return { ok: false, reason: 'declarer-mismatch' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Hand features
// ---------------------------------------------------------------------------

export interface SeatFeatures {
  hcp: number;
  /** Suit lengths, engine order 0=♠ 1=♥ 2=♦ 3=♣. */
  len: number[];
  /** Count of A/K/Q per suit (suit quality). */
  akq: number[];
  balanced: boolean;
}

export function featuresFromPbn(pbn: string): SeatFeatures[] {
  const hands = parsePBN(pbn);
  return SEATS.map((seat: Seat) => {
    const cards = hands[seat];
    let hcp = 0;
    const len = [0, 0, 0, 0];
    const akq = [0, 0, 0, 0];
    for (const c of cards) {
      const suit = (c / 13) | 0;
      const rank = (c % 13) + 2;
      hcp += HCP_BY_CARD[c];
      len[suit]++;
      if (rank >= 12) akq[suit]++;
    }
    const sorted = [...len].sort((a, b) => b - a);
    const balanced =
      sorted[3] >= 2 && sorted[0] <= 5 && !(sorted[0] === 5 && sorted[1] === 4);
    return { hcp, len, akq, balanced };
  });
}

// ---------------------------------------------------------------------------
// Context classification
// ---------------------------------------------------------------------------

/** Vulnerability from the acting player's perspective. */
export type RelVul = 'none' | 'we' | 'they' | 'both';

export function relVul(vul: string, seatIdx: number): RelVul {
  const ns = vul === 'N-S' || vul === 'All' || vul === 'Both';
  const ew = vul === 'E-W' || vul === 'All' || vul === 'Both';
  const we = seatIdx % 2 === 0 ? ns : ew;
  const they = seatIdx % 2 === 0 ? ew : ns;
  return we ? (they ? 'both' : 'we') : they ? 'they' : 'none';
}

/**
 * A classified call context. `family` groups auction shapes; `key` is the
 * family-specific context (e.g. the opening bid faced); `action` is the call
 * made. All keys use the acting player's perspective: opponents' calls are in
 * parentheses in the human-readable `label`.
 */
export interface CallContext {
  family:
    | 'open' // all pass so far; includes action=P (chose not to open)
    | 'overOpen' // RHO opened, we act directly
    | 'balance' // LHO opened, two passes to us
    | 'respInterf' // partner opened, RHO acted, we respond
    | 'resp' // partner opened, RHO passed, we respond
    | 'advance' // LHO opened, partner acted directly, RHO in between, we advance
    | 'sandwich'; // LHO opened, partner passed, RHO responded, we act
  key: string;
  action: string;
  /** 1–4 for openings (seat position); 0 otherwise. */
  seatPos: number;
  /** True if the acting player had already passed earlier in the auction. */
  passedHand: boolean;
}

/**
 * Classify the call at index `i` of a dealer-first auction into zero or one
 * context. Only "early auction" shapes are classified — later rounds of the
 * auction (rebids, competitive follow-ups) are out of scope for now.
 */
export function classifyCall(calls: string[], i: number): CallContext | null {
  const action = calls[i];
  // Index of the first non-pass call before i (the auction's first action).
  let o = -1;
  for (let j = 0; j < i; j++) {
    if (calls[j] !== 'P') {
      o = j;
      break;
    }
  }
  if (o === -1) {
    // Nothing but passes so far: this is an opening decision, seat i+1 (0..3
    // passes before us; a 4th-seat pass would end the auction and such deals
    // never reach the dataset, so action=P here is seats 1–3 plus 4th-seat
    // openings).
    if (i > 3) return null;
    return { family: 'open', key: `seat${i + 1}`, action, seatPos: i + 1, passedHand: false };
  }
  const opening = calls[o];
  if (!isBid(opening)) return null; // defensive; first action is always a bid
  const passedHand = o >= 4 || (o === 3 && i > 3); // we passed before the opening only if 4th-seat opening
  switch (i - o) {
    case 1:
      // RHO opened, we act directly: (1C) ?
      return { family: 'overOpen', key: opening, action, seatPos: 0, passedHand: i >= 4 };
    case 2: {
      // Partner opened; RHO passed (resp) or acted (respInterf).
      const rho = calls[i - 1];
      if (rho === 'P') {
        return { family: 'resp', key: opening, action, seatPos: 0, passedHand };
      }
      return {
        family: 'respInterf',
        key: `${opening}|${rho}`,
        action,
        seatPos: 0,
        passedHand,
      };
    }
    case 3: {
      // LHO opened. Partner and RHO have each called once since.
      const partner = calls[i - 2];
      const rho = calls[i - 1];
      if (partner === 'P' && rho === 'P') {
        return { family: 'balance', key: opening, action, seatPos: 0, passedHand };
      }
      if (partner !== 'P') {
        return {
          family: 'advance',
          key: `${opening}|${partner}|${rho}`,
          action,
          seatPos: 0,
          passedHand,
        };
      }
      // partner passed, RHO responded
      return {
        family: 'sandwich',
        key: `${opening}|${rho}`,
        action,
        seatPos: 0,
        passedHand,
      };
    }
    default:
      return null;
  }
}

/** Human-readable label for a context+action, opponents' calls in parens. */
export function contextLabel(ctx: CallContext): string {
  switch (ctx.family) {
    case 'open':
      return `open seat ${ctx.seatPos}: ${ctx.action}`;
    case 'overOpen':
      return `(${ctx.key}) ${ctx.action}`;
    case 'balance':
      return `(${ctx.key}) P (P) ${ctx.action}`;
    case 'resp':
      return `${ctx.key} (P) ${ctx.action}`;
    case 'respInterf': {
      const [open, rho] = ctx.key.split('|');
      return `${open} (${rho}) ${ctx.action}`;
    }
    case 'advance': {
      const [open, partner, rho] = ctx.key.split('|');
      return `(${open}) ${partner} (${rho}) ${ctx.action}`;
    }
    case 'sandwich': {
      const [open, rho] = ctx.key.split('|');
      return `(${open}) P (${rho}) ${ctx.action}`;
    }
  }
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export const MAX_HCP = 37;

/** Streaming aggregate for one context×action×vul cell. */
export class Agg {
  n = 0;
  hcpHist = new Uint32Array(MAX_HCP + 1);
  /** lenHist[suit][length 0..13] */
  lenHist = [
    new Uint32Array(14),
    new Uint32Array(14),
    new Uint32Array(14),
    new Uint32Array(14),
  ];
  /** A/K/Q count in a designated "bid suit" (suit bids only), 0..3. */
  akqHist = new Uint32Array(4);
  balanced = 0;

  add(f: SeatFeatures, bidSuit: number | null): void {
    this.n++;
    this.hcpHist[f.hcp]++;
    for (let s = 0; s < 4; s++) this.lenHist[s][f.len[s]]++;
    if (bidSuit !== null && bidSuit < 4) this.akqHist[f.akq[bidSuit]]++;
    if (f.balanced) this.balanced++;
  }
}

export interface HistStats {
  n: number;
  mean: number;
  sd: number;
  min: number;
  max: number;
  /** [p5, p10, p25, p50, p75, p90, p95] */
  p: number[];
}

export function histStats(hist: ArrayLike<number>): HistStats {
  let n = 0;
  let sum = 0;
  let min = -1;
  let max = -1;
  for (let v = 0; v < hist.length; v++) {
    const c = hist[v];
    if (c === 0) continue;
    n += c;
    sum += v * c;
    if (min === -1) min = v;
    max = v;
  }
  if (n === 0) return { n, mean: NaN, sd: NaN, min: NaN, max: NaN, p: [] };
  const mean = sum / n;
  let ss = 0;
  for (let v = 0; v < hist.length; v++) ss += hist[v] * (v - mean) * (v - mean);
  const sd = Math.sqrt(ss / n);
  const pct = (q: number): number => {
    // Nearest-rank percentile on the discrete histogram.
    const target = q * n;
    let cum = 0;
    for (let v = 0; v < hist.length; v++) {
      cum += hist[v];
      if (cum >= target) return v;
    }
    return max;
  };
  return {
    n,
    mean,
    sd,
    min,
    max,
    p: [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95].map(pct),
  };
}

/** Smallest length L such that ≥`coverage` of hands hold ≥L cards (suggested dealer minimum). */
export function minLenAtCoverage(hist: ArrayLike<number>, coverage: number): number {
  let n = 0;
  for (let v = 0; v < hist.length; v++) n += hist[v];
  if (n === 0) return 0;
  let best = 0;
  let above = n;
  for (let L = 0; L < hist.length; L++) {
    if (above / n >= coverage) best = L;
    else break;
    above -= hist[L];
  }
  return best;
}

// ---------------------------------------------------------------------------
// Partnership system detection
// ---------------------------------------------------------------------------

/** Per-pair samples of their own openings, for system classification. */
export class PairOpenings {
  n1C = 0;
  hcp1C: number[] = [];
  clubs1C: number[] = [];
  n1D = 0;
  dia1D: number[] = [];
  n1NT = 0;
  hcp1NT: number[] = [];
  n2C = 0;
  clubs2C: number[] = [];
  n2D = 0;
  dia2D: number[] = [];
  maj2D: number[] = [];
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function fractionAtLeast(xs: number[], t: number): number {
  if (xs.length === 0) return 0;
  return xs.filter((x) => x >= t).length / xs.length;
}

export interface PairStyle {
  /** 1C: natural (3+), short (2+ / could-be-short), strong (Precision-like), polish, unknown */
  oneClub: 'natural' | 'short' | 'strong' | 'polish' | 'unknown';
  /** 1D: natural (3+/4+) vs nebulous (frequent ≤2) */
  oneDiamond: 'natural' | 'nebulous' | 'unknown';
  /** 1NT: strong (14+ median), weak (≤13 median) */
  oneNT: 'strong' | 'weak' | 'unknown';
  twoClubs: 'strong' | 'natural' | 'unknown';
  twoDiamonds: 'weak' | 'multi' | 'other' | 'unknown';
  /** Natural base system: 1C not strong and 1D not nebulous. */
  naturalBase: boolean;
}

export function classifyPair(po: PairOpenings): PairStyle {
  const MIN = 6;
  let oneClub: PairStyle['oneClub'] = 'unknown';
  if (po.hcp1C.length >= MIN) {
    const med = median(po.hcp1C);
    const fr16 = fractionAtLeast(po.hcp1C, 16);
    const frShort = 1 - fractionAtLeast(po.clubs1C, 3); // fraction with ≤2 clubs
    if (med >= 15.5 || fr16 >= 0.65) oneClub = 'strong';
    else if (fr16 >= 0.2 && frShort >= 0.25) oneClub = 'polish';
    else if (frShort >= 0.2) oneClub = 'short';
    else oneClub = 'natural';
  }
  let oneDiamond: PairStyle['oneDiamond'] = 'unknown';
  if (po.dia1D.length >= MIN) {
    const frShort = 1 - fractionAtLeast(po.dia1D, 3);
    oneDiamond = frShort >= 0.15 ? 'nebulous' : 'natural';
  }
  let oneNT: PairStyle['oneNT'] = 'unknown';
  if (po.hcp1NT.length >= MIN) {
    oneNT = median(po.hcp1NT) >= 13.75 ? 'strong' : 'weak';
  }
  let twoClubs: PairStyle['twoClubs'] = 'unknown';
  if (po.clubs2C.length >= 4) {
    twoClubs = fractionAtLeast(po.clubs2C, 5) >= 0.5 ? 'natural' : 'strong';
  }
  let twoDiamonds: PairStyle['twoDiamonds'] = 'unknown';
  if (po.dia2D.length >= 4) {
    const diaMed = median(po.dia2D);
    const majMed = median(po.maj2D);
    if (diaMed >= 5.5) twoDiamonds = 'weak';
    else if (majMed >= 5.5 && diaMed <= 3.5) twoDiamonds = 'multi';
    else twoDiamonds = 'other';
  }
  return {
    oneClub,
    oneDiamond,
    oneNT,
    twoClubs,
    twoDiamonds,
    naturalBase: (oneClub === 'natural' || oneClub === 'short') && oneDiamond !== 'nebulous',
  };
}
