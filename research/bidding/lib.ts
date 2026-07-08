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
  /** Classic stopper per suit: A, or Kx+, or Qxx+. */
  stop: boolean[];
  balanced: boolean;
}

export function featuresFromPbn(pbn: string): SeatFeatures[] {
  const hands = parsePBN(pbn);
  return SEATS.map((seat: Seat) => {
    const cards = hands[seat];
    let hcp = 0;
    const len = [0, 0, 0, 0];
    const akq = [0, 0, 0, 0];
    const hasA = [false, false, false, false];
    const hasK = [false, false, false, false];
    const hasQ = [false, false, false, false];
    for (const c of cards) {
      const suit = (c / 13) | 0;
      const rank = (c % 13) + 2;
      hcp += HCP_BY_CARD[c];
      len[suit]++;
      if (rank >= 12) akq[suit]++;
      if (rank === 14) hasA[suit] = true;
      else if (rank === 13) hasK[suit] = true;
      else if (rank === 12) hasQ[suit] = true;
    }
    const stop = len.map(
      (l, s) => hasA[s] || (hasK[s] && l >= 2) || (hasQ[s] && l >= 3),
    );
    const sorted = [...len].sort((a, b) => b - a);
    const balanced =
      sorted[3] >= 2 && sorted[0] <= 5 && !(sorted[0] === 5 && sorted[1] === 4);
    return { hcp, len, akq, stop, balanced };
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
  /** Combined-suit length hists (for two-suited bids): min/max of majors/minors. */
  minMajHist = new Uint32Array(14);
  maxMajHist = new Uint32Array(14);
  minMinHist = new Uint32Array(14);
  maxMinHist = new Uint32Array(14);
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
    if (bidSuit !== null && bidSuit < 4) this.akqHist[f.akq[bidSuit]]++;
    if (f.balanced) this.balanced++;
    this.minMajHist[Math.min(f.len[0], f.len[1])]++;
    this.maxMajHist[Math.max(f.len[0], f.len[1])]++;
    this.minMinHist[Math.min(f.len[2], f.len[3])]++;
    this.maxMinHist[Math.max(f.len[2], f.len[3])]++;
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
    this.balanced += o.balanced;
    for (let l = 0; l < 14; l++) {
      this.minMajHist[l] += o.minMajHist[l];
      this.maxMajHist[l] += o.maxMajHist[l];
      this.minMinHist[l] += o.minMinHist[l];
      this.maxMinHist[l] += o.maxMinHist[l];
    }
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
  /** Minimum A/K/Q count in the bid suit, when the data demands quality. */
  quality?: { suit: number; minTop3: number };
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
  if (rule.quality) commonParts.push(`top(${SUIT_CHAR[rule.quality.suit]},3) >= ${rule.quality.minTop3}`);
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
 * Rule for a natural suit bid (opening, overcall, response). When the context
 * has "their suit" and enough data, the HCP minimum is split by length held in
 * their suit (shortage acts lighter, length needs more). A cue bid
 * (bidSuit === theirSuit) is derived as a two-suiter instead.
 */
export function deriveSuitBidRule(agg: Agg, bidSuit: number, theirSuit: number | null): BidRule {
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

  const common: SuitCond[] = [];
  const bidMin = minLenAtCoverage(agg.lenHist[bidSuit], 0.9);
  if (bidMin >= 3) common.push({ suit: bidSuit, min: bidMin });
  const akqTotal = agg.akqHist.reduce((a, b) => a + b, 0);
  const quality =
    akqTotal >= 25 && (akqTotal - agg.akqHist[0]) / akqTotal >= 0.9
      ? { suit: bidSuit, minTop3: 1 }
      : undefined;

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
  const rule: Omit<BidRule, 'filterExpr'> = { anyOf, common, quality };
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
