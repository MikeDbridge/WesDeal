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
  /** Count of A/K/Q per suit. */
  akq: number[];
  /** Count of A/K/Q/J/T per suit — the filter-language quality clause (top(x,5)). */
  akqjt: number[];
  /** Suit texture index per suit, 0–10 (see textureIndex). */
  txi: number[];
  /** Classic stopper per suit: A, or Kx+, or Qxx+. */
  stop: boolean[];
  balanced: boolean;
}

/**
 * Suit texture index, 0–10: how much of the suit's playing strength lives in
 * its top cards and how connected they are.
 *
 * Cards A…7 carry weights 4.5/3.5/2.5/1.75/1.25/0.75/0.4/0.2 (top-card
 * emphasis), plus 0.3 per touching pair held among them (KQJ beats K-Q-x-ish
 * holdings of equal count). The raw score is normalised by the best possible
 * holding of the same length (capped at 8 cards), so a solid AKQJT = 10.0
 * regardless of length, QJT98 ≈ 5.3, KQ743 ≈ 4.4, A8532 ≈ 3.3, jack-high
 * rags ≈ 1. Empty suits score 0.
 */
const TX_WEIGHT: Record<number, number> = {
  14: 4.5, 13: 3.5, 12: 2.5, 11: 1.75, 10: 1.25, 9: 0.75, 8: 0.4, 7: 0.2,
};

function textureRaw(ranks: boolean[]): number {
  let raw = 0;
  for (let r = 7; r <= 14; r++) if (ranks[r]) raw += TX_WEIGHT[r];
  for (let r = 8; r <= 14; r++) if (ranks[r] && ranks[r - 1]) raw += 0.3;
  return raw;
}

/** Reference (best-possible) raw score per suit length. */
const TX_REF: number[] = (() => {
  const ref = [0];
  for (let len = 1; len <= 13; len++) {
    const ranks = new Array<boolean>(15).fill(false);
    for (let i = 0; i < Math.min(len, 8); i++) ranks[14 - i] = true;
    ref.push(textureRaw(ranks));
  }
  return ref;
})();

/** Texture index 0–10 from the set of held ranks (index 2..14) in one suit. */
export function textureIndex(ranks: boolean[], len: number): number {
  if (len === 0) return 0;
  return Math.min(10, (10 * textureRaw(ranks)) / TX_REF[len]);
}

export function featuresFromPbn(pbn: string): SeatFeatures[] {
  const hands = parsePBN(pbn);
  return SEATS.map((seat: Seat) => {
    const cards = hands[seat];
    let hcp = 0;
    const len = [0, 0, 0, 0];
    const akq = [0, 0, 0, 0];
    const akqjt = [0, 0, 0, 0];
    const ranks = [
      new Array<boolean>(15).fill(false),
      new Array<boolean>(15).fill(false),
      new Array<boolean>(15).fill(false),
      new Array<boolean>(15).fill(false),
    ];
    for (const c of cards) {
      const suit = (c / 13) | 0;
      const rank = (c % 13) + 2;
      hcp += HCP_BY_CARD[c];
      len[suit]++;
      ranks[suit][rank] = true;
      if (rank >= 12) akq[suit]++;
      if (rank >= 10) akqjt[suit]++;
    }
    const stop = len.map(
      (l, s) => ranks[s][14] || (ranks[s][13] && l >= 2) || (ranks[s][12] && l >= 3),
    );
    const txi = len.map((l, s) => textureIndex(ranks[s], l));
    const sorted = [...len].sort((a, b) => b - a);
    const balanced =
      sorted[3] >= 2 && sorted[0] <= 5 && !(sorted[0] === 5 && sorted[1] === 4);
    return { hcp, len, akq, akqjt, txi, stop, balanced };
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

/** Their-suit length bucket for the shortage/length × HCP cross-tab. */
export function theirLenBucket(len: number): number {
  return len <= 1 ? 0 : len === 2 ? 1 : len === 3 ? 2 : 3;
}
export const THEIR_LEN_LABELS = ['0–1', '2', '3', '4+'];

/** HCP band for double-anatomy tables. */
export function hcpBand(hcp: number): number {
  return hcp <= 10 ? 0 : hcp <= 13 ? 1 : hcp <= 16 ? 2 : 3;
}
export const HCP_BAND_LABELS = ['≤10', '11–13', '14–16', '17+'];

/** What the acting hand adds to a double-anatomy sample. */
export interface XShapeInput {
  /** Min length among unbid majors (minor opened) / the other major (major opened). */
  majMin: number;
  /** Min length among unbid minors (major opened) / the other minor (minor opened). */
  minorMin: number;
}

/**
 * Interpretable hand-type partition for responder hands — the rows of the
 * reverse-engineered "what does each bid show" matrices, and the components
 * multi-way response rules are decomposed into.
 */
export const RESP_TYPES = [
  '≤4 HCP',
  '5–11 · 4♥ only',
  '5–11 · 4♠ only',
  '5–11 · 4-4+ majors',
  '5–11 · no 4M',
  '12+ · 4♥ only',
  '12+ · 4♠ only',
  '12+ · 4-4+ majors',
  '12+ · no 4M bal',
  '12+ · no 4M unbal',
] as const;

export function respHandType(f: SeatFeatures): number {
  if (f.hcp <= 4) return 0;
  const h4 = f.len[1] >= 4;
  const s4 = f.len[0] >= 4;
  const gf = f.hcp >= 12;
  if (h4 && s4) return gf ? 7 : 3;
  if (h4) return gf ? 5 : 1;
  if (s4) return gf ? 6 : 2;
  if (!gf) return 4;
  return f.balanced ? 8 : 9;
}

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
  /** A/K/Q/J/T count in the bid suit (0..5) — overall and by own strength. */
  qualHist = new Uint32Array(6);
  qualWeakHist = new Uint32Array(6); // hands with ≤10 HCP
  qualSoundHist = new Uint32Array(6); // hands with 11+ HCP
  /** Bid-suit texture index ×10 (0..100) — overall and by own strength. */
  txiHist = new Uint32Array(101);
  txiWeakHist = new Uint32Array(101);
  txiSoundHist = new Uint32Array(101);
  balanced = 0;
  /** Combined-suit length hists (for two-suited bids): min/max of majors/minors. */
  minMajHist = new Uint32Array(14);
  maxMajHist = new Uint32Array(14);
  minMinHist = new Uint32Array(14);
  maxMinHist = new Uint32Array(14);
  /**
   * Mutually-exclusive shape patterns for convention detection:
   * 0 = both majors 4+, 1 = else a 5+ major, 2 = else a 5+ minor, 3 = rest.
   */
  patternHist = new Uint32Array(4);
  /** Hand-type counts (RESP_TYPES) — powers the 1C-complex decision matrices. */
  respTypeHist = new Uint32Array(RESP_TYPES.length);
  /** hcp × their-suit-length bucket cross-tab, when the context has "their suit". */
  hcpByTheirLen: Uint32Array | null = null; // 4 buckets × (MAX_HCP+1)
  /** Hands holding a classic stopper in their suit. */
  theirStop = 0;
  theirN = 0;
  /** Double anatomy per HCP band, when the action is X of a suit opening. */
  xBandN: Uint32Array | null = null; // 4 bands
  xMajMin: Uint32Array | null = null; // 4 bands × 8 lengths (capped 7)
  xMinorMin: Uint32Array | null = null;

  add(f: SeatFeatures, bidSuit: number | null, theirSuit: number | null, isX: boolean): void {
    this.n++;
    this.hcpHist[f.hcp]++;
    for (let s = 0; s < 4; s++) this.lenHist[s][f.len[s]]++;
    if (bidSuit !== null && bidSuit < 4) {
      this.akqHist[f.akq[bidSuit]]++;
      this.qualHist[f.akqjt[bidSuit]]++;
      const t = Math.min(100, Math.round(10 * f.txi[bidSuit]));
      this.txiHist[t]++;
      if (f.hcp <= 10) {
        this.qualWeakHist[f.akqjt[bidSuit]]++;
        this.txiWeakHist[t]++;
      } else {
        this.qualSoundHist[f.akqjt[bidSuit]]++;
        this.txiSoundHist[t]++;
      }
    }
    if (f.balanced) this.balanced++;
    this.minMajHist[Math.min(f.len[0], f.len[1])]++;
    this.maxMajHist[Math.max(f.len[0], f.len[1])]++;
    this.minMinHist[Math.min(f.len[2], f.len[3])]++;
    this.maxMinHist[Math.max(f.len[2], f.len[3])]++;
    const pattern =
      Math.min(f.len[0], f.len[1]) >= 4
        ? 0
        : Math.max(f.len[0], f.len[1]) >= 5
          ? 1
          : Math.max(f.len[2], f.len[3]) >= 5
            ? 2
            : 3;
    this.patternHist[pattern]++;
    this.respTypeHist[respHandType(f)]++;
    if (theirSuit !== null && theirSuit < 4) {
      if (!this.hcpByTheirLen) this.hcpByTheirLen = new Uint32Array(4 * (MAX_HCP + 1));
      this.hcpByTheirLen[theirLenBucket(f.len[theirSuit]) * (MAX_HCP + 1) + f.hcp]++;
      this.theirN++;
      if (f.stop[theirSuit]) this.theirStop++;
      if (isX) {
        if (!this.xBandN) {
          this.xBandN = new Uint32Array(4);
          this.xMajMin = new Uint32Array(4 * 8);
          this.xMinorMin = new Uint32Array(4 * 8);
        }
        const band = hcpBand(f.hcp);
        const theirIsMajor = theirSuit === 0 || theirSuit === 1;
        const majMin = theirIsMajor
          ? f.len[1 - theirSuit] // the other major
          : Math.min(f.len[0], f.len[1]);
        const minorMin = theirIsMajor
          ? Math.min(f.len[2], f.len[3])
          : f.len[theirSuit === 2 ? 3 : 2]; // the other minor
        this.xBandN[band]++;
        this.xMajMin![band * 8 + Math.min(7, majMin)]++;
        this.xMinorMin![band * 8 + Math.min(7, minorMin)]++;
      }
    }
  }

  /** Accumulate another aggregate into this one (all parts, including cross-tabs). */
  mergeFrom(o: Agg): void {
    this.n += o.n;
    for (let h = 0; h < this.hcpHist.length; h++) this.hcpHist[h] += o.hcpHist[h];
    for (let s = 0; s < 4; s++)
      for (let l = 0; l < 14; l++) this.lenHist[s][l] += o.lenHist[s][l];
    for (let a = 0; a < 4; a++) this.akqHist[a] += o.akqHist[a];
    for (let q = 0; q < 6; q++) {
      this.qualHist[q] += o.qualHist[q];
      this.qualWeakHist[q] += o.qualWeakHist[q];
      this.qualSoundHist[q] += o.qualSoundHist[q];
    }
    for (let t = 0; t <= 100; t++) {
      this.txiHist[t] += o.txiHist[t];
      this.txiWeakHist[t] += o.txiWeakHist[t];
      this.txiSoundHist[t] += o.txiSoundHist[t];
    }
    this.balanced += o.balanced;
    for (let l = 0; l < 14; l++) {
      this.minMajHist[l] += o.minMajHist[l];
      this.maxMajHist[l] += o.maxMajHist[l];
      this.minMinHist[l] += o.minMinHist[l];
      this.maxMinHist[l] += o.maxMinHist[l];
    }
    for (let p = 0; p < 4; p++) this.patternHist[p] += o.patternHist[p];
    for (let r = 0; r < RESP_TYPES.length; r++) this.respTypeHist[r] += o.respTypeHist[r];
    if (o.hcpByTheirLen) {
      if (!this.hcpByTheirLen) this.hcpByTheirLen = new Uint32Array(4 * (MAX_HCP + 1));
      for (let i = 0; i < o.hcpByTheirLen.length; i++)
        this.hcpByTheirLen[i] += o.hcpByTheirLen[i];
    }
    this.theirStop += o.theirStop;
    this.theirN += o.theirN;
    if (o.xBandN) {
      if (!this.xBandN) {
        this.xBandN = new Uint32Array(4);
        this.xMajMin = new Uint32Array(4 * 8);
        this.xMinorMin = new Uint32Array(4 * 8);
      }
      for (let b = 0; b < 4; b++) this.xBandN[b] += o.xBandN[b];
      for (let i = 0; i < 32; i++) {
        this.xMajMin![i] += o.xMajMin![i];
        this.xMinorMin![i] += o.xMinorMin![i];
      }
    }
  }

  /** HCP histogram restricted to one or more their-suit-length buckets. */
  hcpForBuckets(buckets: number[]): Uint32Array {
    const out = new Uint32Array(MAX_HCP + 1);
    if (!this.hcpByTheirLen) return out;
    for (const b of buckets)
      for (let h = 0; h <= MAX_HCP; h++) out[h] += this.hcpByTheirLen[b * (MAX_HCP + 1) + h];
    return out;
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

/** Smallest cap L such that ≥`coverage` of hands hold ≤L cards (suggested dealer maximum). */
export function maxLenAtCoverage(hist: ArrayLike<number>, coverage: number): number {
  let n = 0;
  for (let v = 0; v < hist.length; v++) n += hist[v];
  if (n === 0) return 13;
  let below = 0;
  for (let L = 0; L < hist.length; L++) {
    below += hist[L];
    if (below / n >= coverage) return L;
  }
  return hist.length - 1;
}

// ---------------------------------------------------------------------------
// Team standings (strength filter)
// ---------------------------------------------------------------------------

export interface MatchVp {
  tournament: string;
  event: string;
  stage: string;
  home: string;
  away: string;
  vpHome: number | null;
  vpAway: number | null;
}

/**
 * Identify the bottom `k` teams of each tournament/event by average round-robin
 * VP per match. Returns keys "tournament|event|team". Knockout matches carry no
 * VP and are ignored — KO participants qualified anyway.
 */
export function bottomTeams(rows: MatchVp[], k: number): Set<string> {
  const sums = new Map<string, Map<string, { vp: number; n: number }>>();
  for (const r of rows) {
    if (r.stage !== 'RR') continue;
    const evKey = `${r.tournament}|${r.event}`;
    let teams = sums.get(evKey);
    if (!teams) {
      teams = new Map();
      sums.set(evKey, teams);
    }
    for (const [team, vp] of [
      [r.home, r.vpHome],
      [r.away, r.vpAway],
    ] as const) {
      if (team === '' || vp === null) continue;
      let t = teams.get(team);
      if (!t) {
        t = { vp: 0, n: 0 };
        teams.set(team, t);
      }
      t.vp += vp;
      t.n++;
    }
  }
  const out = new Set<string>();
  for (const [evKey, teams] of sums) {
    const ranked = [...teams.entries()]
      .filter(([, t]) => t.n >= 3)
      .sort((a, b) => a[1].vp / a[1].n - b[1].vp / b[1].n);
    for (let i = 0; i < Math.min(k, ranked.length); i++) out.add(`${evKey}|${ranked[i][0]}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1C response-style detection (transfer walsh)
// ---------------------------------------------------------------------------

/**
 * Classify a pair's responses to their (natural/short) 1C opening: 'xfer'
 * (transfer responses: 1D = hearts, 1H = spades, 1S = no-major NT-ish) vs
 * 'std' (natural). Driven by what the pair actually held: transfer pairs hold
 * 4+ of the NEXT suit in essentially every 1D/1H response; natural pairs
 * rarely do.
 */
export function classifyRespStyle(
  n1D: number,
  hearts4Share: number,
  n1H: number,
  spades4Share: number,
): 'xfer' | 'std' | 'unknown' {
  if (n1D >= 3) {
    if (hearts4Share >= 0.75) return 'xfer';
    if (hearts4Share <= 0.45) return 'std';
  }
  if (n1H >= 3) {
    if (spades4Share >= 0.75) return 'xfer';
    if (spades4Share <= 0.45) return 'std';
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Rule derivation (dealer filters)
// ---------------------------------------------------------------------------

export interface SuitCond {
  /** Engine suit index 0=♠ 1=♥ 2=♦ 3=♣. */
  suit: number;
  min?: number;
  max?: number;
}

export interface RuleBranch {
  label: string;
  hcp: { min: number; max?: number };
  suit?: SuitCond[];
}

export interface BidRule {
  /** The hand must satisfy `common` plus at least one branch. */
  anyOf: RuleBranch[];
  common: SuitCond[];
  /** Suit-quality floor for every hand: A/K/Q/J/T count in the suit (top(x,5)). */
  quality?: { suit: number; minTop5: number };
  /**
   * Extra quality demanded of WEAK hands only (≤10 HCP): sound values excuse a
   * moderate suit, a light action needs the suit to carry it.
   */
  qualityWeak?: { suit: number; minTop5: number };
  /** Classic stopper required in this suit (NT actions). */
  stopper?: number;
  /** ≥80% of hands were balanced (HandConstraint.balanced; not in filterExpr). */
  balanced?: boolean;
  /** The rule in the dealer's filter language (src/engine/filter.ts). */
  filterExpr: string;
}

export const SUIT_CHAR = ['s', 'h', 'd', 'c'];

function suitCondExpr(c: SuitCond): string {
  const ch = SUIT_CHAR[c.suit];
  if (c.min !== undefined && c.max !== undefined)
    return c.min === c.max ? `${ch} == ${c.min}` : `${ch} in ${c.min}..${c.max}`;
  if (c.min !== undefined) return `${ch} >= ${c.min}`;
  return `${ch} <= ${c.max}`;
}

function hcpExpr(min: number, max?: number): string {
  return max === undefined ? `hcp >= ${min}` : `hcp in ${min}..${max}`;
}

function stopperExpr(suit: number): string {
  const ch = SUIT_CHAR[suit];
  return `(has(${ch},a) or (has(${ch},k) and ${ch} >= 2) or (has(${ch},q) and ${ch} >= 3))`;
}

function buildExpr(rule: Omit<BidRule, 'filterExpr'>): string {
  const commonParts = rule.common.map(suitCondExpr);
  if (rule.quality) commonParts.push(`top(${SUIT_CHAR[rule.quality.suit]},5) >= ${rule.quality.minTop5}`);
  if (rule.qualityWeak) {
    commonParts.push(
      `(hcp >= 11 or top(${SUIT_CHAR[rule.qualityWeak.suit]},5) >= ${rule.qualityWeak.minTop5})`,
    );
  }
  if (rule.stopper !== undefined) commonParts.push(stopperExpr(rule.stopper));
  const branchExprs = rule.anyOf.map((b) => {
    const parts = [hcpExpr(b.hcp.min, b.hcp.max), ...(b.suit ?? []).map(suitCondExpr)];
    return parts.length === 1 ? parts[0] : `(${parts.join(' and ')})`;
  });
  const branches =
    branchExprs.length === 1 ? [branchExprs[0]] : [`(${branchExprs.join(' or ')})`];
  const all = [...commonParts, ...branches];
  return all.join(' and ');
}

/** Percentile-based HCP range [p5, p95] of a histogram. */
function hcpRange(hist: ArrayLike<number>): { min: number; max: number } {
  const st = histStats(hist);
  return { min: st.p[0], max: st.p[6] };
}

/**
 * Suit-quality clauses from the weak/sound strata: everyone needs the sound
 * floor; hands of ≤10 HCP need the (higher) weak floor — light actions lean on
 * the suit, sound values excuse a moderate one. Skipped for conventional bids.
 */
function qualityClauses(
  agg: Agg,
  bidSuit: number,
): { quality?: BidRule['quality']; qualityWeak?: BidRule['qualityWeak'] } {
  const total = agg.qualHist.reduce((a, b) => a + b, 0);
  if (total < 25) return {};
  const weakN = agg.qualWeakHist.reduce((a, b) => a + b, 0);
  const soundN = agg.qualSoundHist.reduce((a, b) => a + b, 0);
  if (weakN >= 25 && soundN >= 25) {
    const weakMin = minLenAtCoverage(agg.qualWeakHist, 0.9);
    const soundMin = minLenAtCoverage(agg.qualSoundHist, 0.9);
    if (weakMin > soundMin) {
      return {
        quality: soundMin >= 1 ? { suit: bidSuit, minTop5: soundMin } : undefined,
        qualityWeak: { suit: bidSuit, minTop5: weakMin },
      };
    }
  }
  const overall = minLenAtCoverage(agg.qualHist, 0.9);
  return overall >= 1 ? { quality: { suit: bidSuit, minTop5: overall } } : {};
}

/**
 * Rule for a suit bid (opening, overcall, response). When the context has
 * "their suit" and enough data, the HCP minimum is split by length held in
 * their suit (shortage acts lighter, length needs more). A cue bid
 * (bidSuit === theirSuit) is derived as a two-suiter, and a suit bid over a
 * NT opening is checked for conventional meanings (both majors / one long
 * major / long minor) before being taken at face value.
 */
export function deriveSuitBidRule(
  agg: Agg,
  bidSuit: number,
  theirSuit: number | null,
  facingNT = false,
): BidRule {
  const whole = hcpRange(agg.hcpHist);
  // Cue bid → two-suited: lengths live in the other suits.
  if (theirSuit !== null && bidSuit === theirSuit) {
    const common: SuitCond[] = [];
    if (theirSuit >= 2) {
      // Minor cue (Michaels): both majors.
      const m = minLenAtCoverage(agg.minMajHist, 0.9);
      if (m >= 4) {
        common.push({ suit: 0, min: m }, { suit: 1, min: m });
      }
    } else {
      // Major cue: the other major + a long minor.
      const om = 1 - theirSuit;
      const m = minLenAtCoverage(agg.lenHist[om], 0.9);
      if (m >= 4) common.push({ suit: om, min: m });
      const minor = minLenAtCoverage(agg.maxMinHist, 0.9);
      if (minor >= 4) {
        // "a minor of at least `minor`" — expressible only as d|c alternation.
        const rule: Omit<BidRule, 'filterExpr'> = {
          anyOf: [
            { label: `with ♦${minor}+`, hcp: whole, suit: [{ suit: 2, min: minor }] },
            { label: `with ♣${minor}+`, hcp: whole, suit: [{ suit: 3, min: minor }] },
          ],
          common,
        };
        return { ...rule, filterExpr: buildExpr(rule) };
      }
    }
    const rule: Omit<BidRule, 'filterExpr'> = {
      anyOf: [{ label: 'two-suiter', hcp: whole }],
      common,
    };
    return { ...rule, filterExpr: buildExpr(rule) };
  }

  const bidMin = minLenAtCoverage(agg.lenHist[bidSuit], 0.9);

  // Suit bid over a NT opening whose own suit is NOT long: conventional.
  // Detect the shape the field actually holds (defence-to-1NT conventions).
  if (facingNT && bidMin < 4) {
    const bothMaj = minLenAtCoverage(agg.minMajHist, 0.9);
    if (bothMaj >= 4) {
      const rule: Omit<BidRule, 'filterExpr'> = {
        anyOf: [{ label: 'both majors', hcp: whole }],
        common: [
          { suit: 0, min: bothMaj },
          { suit: 1, min: bothMaj },
        ],
      };
      return { ...rule, filterExpr: buildExpr(rule) };
    }
    const oneMaj = minLenAtCoverage(agg.maxMajHist, 0.9);
    if (oneMaj >= 5) {
      const rule: Omit<BidRule, 'filterExpr'> = {
        anyOf: [
          { label: 'long ♠', hcp: whole, suit: [{ suit: 0, min: oneMaj }] },
          { label: 'long ♥', hcp: whole, suit: [{ suit: 1, min: oneMaj }] },
        ],
        common: [],
      };
      return { ...rule, filterExpr: buildExpr(rule) };
    }
    const oneMin = minLenAtCoverage(agg.maxMinHist, 0.9);
    if (oneMin >= 5) {
      const rule: Omit<BidRule, 'filterExpr'> = {
        anyOf: [
          { label: 'long ♦', hcp: whole, suit: [{ suit: 2, min: oneMin }] },
          { label: 'long ♣', hcp: whole, suit: [{ suit: 3, min: oneMin }] },
        ],
        common: [],
      };
      return { ...rule, filterExpr: buildExpr(rule) };
    }
    // No single shape covers 90% — the field plays a MIXTURE of treatments.
    // Union the patterns that each cover ≥20% of the hands.
    const patternN = agg.patternHist.reduce((a, b) => a + b, 0);
    if (patternN >= 25) {
      const share = (p: number): number => agg.patternHist[p] / patternN;
      const branches: RuleBranch[] = [];
      if (share(0) >= 0.2) {
        branches.push({
          label: 'both majors',
          hcp: whole,
          suit: [
            { suit: 0, min: 4 },
            { suit: 1, min: 4 },
          ],
        });
      }
      if (share(1) >= 0.2) {
        branches.push(
          { label: 'long ♠', hcp: whole, suit: [{ suit: 0, min: 5 }] },
          { label: 'long ♥', hcp: whole, suit: [{ suit: 1, min: 5 }] },
        );
      }
      if (share(2) >= 0.2) {
        branches.push(
          { label: 'long ♦', hcp: whole, suit: [{ suit: 2, min: 5 }] },
          { label: 'long ♣', hcp: whole, suit: [{ suit: 3, min: 5 }] },
        );
      }
      if (branches.length > 0) {
        const rule: Omit<BidRule, 'filterExpr'> = { anyOf: branches, common: [] };
        return { ...rule, filterExpr: buildExpr(rule) };
      }
    }
    const rule: Omit<BidRule, 'filterExpr'> = {
      anyOf: [{ label: 'conventional (shape varies)', hcp: whole }],
      common: [],
    };
    return { ...rule, filterExpr: buildExpr(rule) };
  }

  const common: SuitCond[] = [];
  if (bidMin >= 3) common.push({ suit: bidSuit, min: bidMin });
  // Natural bid of a major over NT often carries a second suit (e.g. 5M+4m);
  // 75% coverage — some of the field plays plain natural 2M.
  if (facingNT && bidMin >= 4 && bidSuit <= 1) {
    const secondMin = minLenAtCoverage(agg.maxMinHist, 0.75);
    if (secondMin >= 4) {
      const rule: Omit<BidRule, 'filterExpr'> = {
        anyOf: [
          { label: `with ♦${secondMin}+`, hcp: whole, suit: [{ suit: 2, min: secondMin }] },
          { label: `with ♣${secondMin}+`, hcp: whole, suit: [{ suit: 3, min: secondMin }] },
        ],
        common,
        ...qualityClauses(agg, bidSuit),
      };
      return { ...rule, filterExpr: buildExpr(rule) };
    }
  }

  let anyOf: RuleBranch[] = [{ label: 'any', hcp: whole }];
  if (theirSuit !== null && agg.hcpByTheirLen) {
    const short = agg.hcpForBuckets([0, 1]); // ≤2 in their suit
    const long = agg.hcpForBuckets([2, 3]); // 3+ in their suit
    const shortSt = histStats(short);
    const longSt = histStats(long);
    if (shortSt.n >= 25 && longSt.n >= 25 && longSt.p[0] - shortSt.p[0] >= 1) {
      const theirMax = maxLenAtCoverage(agg.lenHist[theirSuit], 0.95);
      anyOf = [
        {
          label: `short in theirs (≤2): lighter`,
          hcp: { min: shortSt.p[0], max: whole.max },
          suit: [{ suit: theirSuit, max: 2 }],
        },
        {
          label: `length in theirs (3+): sounder`,
          hcp: { min: longSt.p[0], max: whole.max },
          suit: [{ suit: theirSuit, min: 3, max: Math.max(3, theirMax) }],
        },
      ];
    }
  }
  const rule: Omit<BidRule, 'filterExpr'> = { anyOf, common, ...qualityClauses(agg, bidSuit) };
  return { ...rule, filterExpr: buildExpr(rule) };
}

/**
 * Rule for a response to partner's 1M after a takeout double when the action
 * is, for most of the field, a raise in disguise (transfers / constructive vs
 * weak raises): the real message is support + a strength band, and the named
 * suit is incidental.
 */
export function deriveRaiseishRule(agg: Agg, partnerSuit: number): BidRule {
  const whole = hcpRange(agg.hcpHist);
  const supportMin = minLenAtCoverage(agg.lenHist[partnerSuit], 0.9);
  const rule: Omit<BidRule, 'filterExpr'> = {
    anyOf: [{ label: 'raise-equivalent (transfer/raise treatments)', hcp: whole }],
    common: supportMin >= 3 ? [{ suit: partnerSuit, min: supportMin }] : [],
  };
  return { ...rule, filterExpr: buildExpr(rule) };
}

/**
 * Rule for a takeout/balancing double of a suit opening: a shape branch
 * (support-driven, moderate strength) OR a strength branch (top decile,
 * shape-free). Support minimums come from the sub-17 HCP bands at 85% coverage
 * — doubles of a minor demand both majors, doubles of a major the other major
 * plus tolerance for the unbid minors.
 */
export function deriveDoubleRule(agg: Agg, theirSuit: number): BidRule {
  const whole = hcpRange(agg.hcpHist);
  const st = histStats(agg.hcpHist);
  const strongT = Math.max(15, Math.min(18, st.p[5])); // p90, clamped
  const common: SuitCond[] = [];
  // Their-suit cap for the shape branches.
  const theirMax = Math.max(2, maxLenAtCoverage(agg.lenHist[theirSuit], 0.9));
  // Support requirements from the sub-strong bands (0..2 = ≤16).
  const support: SuitCond[] = [];
  if (agg.xMajMin && agg.xMinorMin) {
    const majHist = new Uint32Array(8);
    const minorHist = new Uint32Array(8);
    for (let band = 0; band <= 2; band++) {
      for (let l = 0; l < 8; l++) {
        majHist[l] += agg.xMajMin[band * 8 + l];
        minorHist[l] += agg.xMinorMin[band * 8 + l];
      }
    }
    const majMin = minLenAtCoverage(majHist, 0.85);
    const minorMin = minLenAtCoverage(minorHist, 0.85);
    const theirIsMajor = theirSuit <= 1;
    if (theirIsMajor) {
      if (majMin >= 3) support.push({ suit: 1 - theirSuit, min: majMin });
      for (const minor of [2, 3]) if (minorMin >= 2) support.push({ suit: minor, min: minorMin });
    } else {
      if (majMin >= 3) {
        support.push({ suit: 0, min: majMin });
        support.push({ suit: 1, min: majMin });
      }
      const otherMinor = theirSuit === 2 ? 3 : 2;
      if (minorMin >= 2) support.push({ suit: otherMinor, min: minorMin });
    }
  }
  // Shape branches: split shortage (≤2 in theirs) from length when the HCP
  // floor genuinely differs — doubling with length in their suit costs more.
  const shapeBranches: RuleBranch[] = [];
  const shortSt = histStats(agg.hcpForBuckets([0, 1]));
  const longBuckets = theirMax >= 4 ? [2, 3] : [2];
  const longSt = histStats(agg.hcpForBuckets(longBuckets));
  const capHcp = (min: number): number => Math.min(min, strongT - 1);
  if (
    theirMax >= 3 &&
    shortSt.n >= 25 &&
    longSt.n >= 25 &&
    longSt.p[0] - shortSt.p[0] >= 1
  ) {
    shapeBranches.push({
      label: 'takeout shape, short in theirs',
      hcp: { min: capHcp(shortSt.p[0]), max: strongT - 1 },
      suit: [{ suit: theirSuit, max: 2 }, ...support],
    });
    shapeBranches.push({
      label: 'takeout shape, length in theirs',
      hcp: { min: capHcp(longSt.p[0]), max: strongT - 1 },
      suit: [{ suit: theirSuit, min: 3, max: theirMax }, ...support],
    });
  } else {
    shapeBranches.push({
      label: 'takeout shape',
      hcp: { min: capHcp(whole.min), max: strongT - 1 },
      suit: [{ suit: theirSuit, max: theirMax }, ...support],
    });
  }
  const rule: Omit<BidRule, 'filterExpr'> = {
    anyOf: [...shapeBranches, { label: 'strength, any shape', hcp: { min: strongT } }],
    common,
  };
  return { ...rule, filterExpr: buildExpr(rule) };
}

/** Rule for a natural NT call: HCP range, balance, stopper in their suit. */
export function deriveNtRule(agg: Agg, theirSuit: number | null): BidRule {
  const whole = hcpRange(agg.hcpHist);
  const balanced = agg.n > 0 && agg.balanced / agg.n >= 0.8 ? true : undefined;
  const stopper =
    theirSuit !== null && agg.theirN >= 25 && agg.theirStop / agg.theirN >= 0.85
      ? theirSuit
      : undefined;
  const rule: Omit<BidRule, 'filterExpr'> = {
    anyOf: [{ label: 'any', hcp: whole }],
    common: [],
    stopper,
    balanced,
  };
  return { ...rule, filterExpr: buildExpr(rule) };
}

/** Plain HCP-range rule (P, XX, doubles without takeout anatomy, …). */
export function deriveHcpRule(agg: Agg): BidRule {
  const rule: Omit<BidRule, 'filterExpr'> = {
    anyOf: [{ label: 'any', hcp: hcpRange(agg.hcpHist) }],
    common: [],
  };
  return { ...rule, filterExpr: buildExpr(rule) };
}

/**
 * Rule for a suit response that may be conventional: when the named suit is
 * NOT what the field holds, decompose the hands into interpretable components
 * (RESP_TYPES) and union the ones covering ≥12% — a transfer 1D comes out as
 * "hearts", and a multi-way 1S as "weak no-major OR GF no-major OR GF with a
 * long minor". Falls back to the plain natural derivation for real suits.
 */
export function deriveRespSuitRule(agg: Agg, bidSuit: number, theirSuit: number | null): BidRule {
  if (agg.n >= 25) {
    const share4 = (s: number): number => {
      let c = 0;
      for (let l = 4; l < 14; l++) c += agg.lenHist[s][l];
      return c / agg.n;
    };
    if (share4(bidSuit) < 0.5) {
      const whole = hcpRange(agg.hcpHist);
      const t = agg.respTypeHist;
      const share = (idxs: number[]): number =>
        idxs.reduce((a, i) => a + t[i], 0) / agg.n;
      const CUT = 0.12;
      const hearts = share([1, 5]);
      const spades = share([2, 6]);
      const bothM = share([3, 7]);
      const nomWeak = share([4]);
      const nomGfBal = share([8]);
      const nomGfUnbal = share([9]);
      // A branch's HCP span comes from the bands that actually contribute
      // (e.g. only GF hands route 4♥ through a transfer-walsh 1S).
      const bandSpan = (weakIdx: number, gfIdx: number): { min: number; max: number } => {
        const w = share([weakIdx]) >= 0.06;
        const g = share([gfIdx]) >= 0.06;
        if (w && !g) return { min: whole.min, max: 11 };
        if (g && !w) return { min: 12, max: whole.max };
        return whole;
      };
      const branches: RuleBranch[] = [];
      if (hearts >= CUT) {
        branches.push({
          label: `hearts (${Math.round(100 * (hearts + bothM))}%)`,
          hcp: bandSpan(1, 5),
          suit: [{ suit: 1, min: 4 }],
        });
      }
      if (spades >= CUT) {
        branches.push({
          label: `spades (${Math.round(100 * (spades + bothM))}%)`,
          hcp: bandSpan(2, 6),
          suit: [{ suit: 0, min: 4 }],
        });
      }
      // Both-majors hands ride along with a hearts/spades branch; only a
      // dedicated both-majors bid needs its own branch.
      if (bothM >= CUT && hearts < CUT && spades < CUT) {
        branches.push({
          label: `both majors (${Math.round(100 * bothM)}%)`,
          hcp: bandSpan(3, 7),
          suit: [
            { suit: 0, min: 4 },
            { suit: 1, min: 4 },
          ],
        });
      }
      const noM: SuitCond[] = [
        { suit: 0, max: 3 },
        { suit: 1, max: 3 },
      ];
      if (nomWeak >= CUT && nomGfBal >= CUT) {
        branches.push({
          label: `no 4M, all ranges (${Math.round(100 * (nomWeak + nomGfBal))}%)`,
          hcp: whole,
          suit: noM,
        });
      } else if (nomWeak >= CUT) {
        branches.push({
          label: `no 4M, limited (${Math.round(100 * nomWeak)}%)`,
          hcp: { min: whole.min, max: 11 },
          suit: noM,
        });
      } else if (nomGfBal >= CUT) {
        branches.push({
          label: `no 4M, GF balanced (${Math.round(100 * nomGfBal)}%)`,
          hcp: { min: 12, max: whole.max },
          suit: noM,
        });
      }
      if (nomGfUnbal >= CUT) {
        // Which long minor those GF hands carry.
        for (const minor of [2, 3]) {
          let m5 = 0;
          for (let l = 5; l < 14; l++) m5 += agg.lenHist[minor][l];
          if (m5 / agg.n >= 0.08) {
            branches.push({
              label: `GF, 5+${SUIT_CHAR[minor]} (${Math.round(100 * nomGfUnbal)}% unbal GF)`,
              hcp: { min: 12, max: whole.max },
              suit: [{ suit: minor, min: 5 }],
            });
          }
        }
      }
      if (branches.length > 0) {
        const rule: Omit<BidRule, 'filterExpr'> = { anyOf: branches, common: [] };
        return { ...rule, filterExpr: buildExpr(rule) };
      }
      // Nothing dominant — an honest HCP-only rule.
      const rule: Omit<BidRule, 'filterExpr'> = {
        anyOf: [{ label: 'treatments vary (see suit dists)', hcp: whole }],
        common: [],
      };
      return { ...rule, filterExpr: buildExpr(rule) };
    }
  }
  return deriveSuitBidRule(agg, bidSuit, theirSuit);
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
