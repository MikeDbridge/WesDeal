/**
 * Bidding-range study over the WBF/EBL championship scrape.
 *
 * Replays every recorded auction (117k tables: Riga 2026 + Herning 2024 Euro
 * RRs, Herning 2025 worlds RR+KO, Marrakech 2023 KO), attaches the actual hand
 * to every call, classifies early-auction contexts (openings, direct actions
 * over an opening, balancing, responses with and without interference,
 * advances), detects each partnership's system from its own openings (strong
 * club / nebulous 1D / weak NT / multi 2D …), and aggregates empirical hand
 * ranges per context × action × vulnerability × opener style.
 *
 * Outputs:
 *   research/bidding-report.md          human-readable study
 *   research/bidding/bid-profiles.json  dealer-ready filter profiles
 *
 * Run: npm run research:bidding   (data must exist: npm run bridge:scrape +
 * bridge:flatten for each tournament, or use the committed _all CSVs.)
 */

import { it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  parseCsv,
  csvColumns,
  checkAuction,
  classifyCall,
  contextLabel,
  featuresFromPbn,
  relVul,
  isBid,
  bidParts,
  bidRank,
  Agg,
  histStats,
  minLenAtCoverage,
  bottomTeams,
  deriveSuitBidRule,
  deriveDoubleRule,
  deriveNtRule,
  deriveHcpRule,
  deriveRaiseishRule,
  deriveRespSuitRule,
  classifyRespStyle,
  RESP_TYPES,
  PairOpenings,
  classifyPair,
  median,
  HCP_BAND_LABELS,
  THEIR_LEN_LABELS,
  MAX_HCP,
  type MatchVp,
  type BidRule,
  type PairStyle,
  type SeatFeatures,
  type CallContext,
  type RelVul,
} from './lib';
import { compileFilter } from '../../src/engine/filter';

const SCRAPE_DIR = path.join(
  import.meta.dirname,
  '..',
  '..',
  'Bridge - World Championship data scrape',
  'data',
  '_all',
);
const REPORT_PATH = path.join(import.meta.dirname, '..', 'bidding-report.md');
const PROFILES_PATH = path.join(import.meta.dirname, 'bid-profiles.json');

const SEAT_IDX: Record<string, number> = { N: 0, E: 1, S: 2, W: 3 };
const SUIT_NAMES = ['S', 'H', 'D', 'C'];

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

interface TableRow {
  tournament: string;
  event: string;
  stage: string;
  dealerIdx: number;
  vul: string;
  calls: string[];
  pbn: string;
  /** Partnership keys for NS and EW at this table. */
  nsPair: string;
  ewPair: string;
  /** Team names for NS and EW at this table (open room: NS = home). */
  nsTeam: string;
  ewTeam: string;
}

interface MatchesData {
  /** matchKey → per-room seat player ids (open_N … closed_W). */
  pairs: Map<string, { open: string[]; closed: string[] }>;
  /** One row per match with VPs, for team standings. */
  vps: MatchVp[];
}

function loadMatches(): MatchesData {
  const rows = parseCsv(readFileSync(path.join(SCRAPE_DIR, 'matches.csv'), 'utf8'));
  const col = csvColumns(rows);
  const pairs = new Map<string, { open: string[]; closed: string[] }>();
  const vps: MatchVp[] = [];
  const get = (row: string[], name: string): string => row[col.get(name)!] ?? '';
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    const key = ['tournament', 'event', 'stage', 'segment', 'matchid'].map((c) => get(r, c)).join('|');
    const seatIds = (room: string): string[] =>
      ['N', 'E', 'S', 'W'].map((s) => {
        const id = get(r, `${room}_${s}_id`);
        return id !== '' ? id : get(r, `${room}_${s}`); // fall back to the name
      });
    pairs.set(key, { open: seatIds('open'), closed: seatIds('closed') });
    vps.push({
      tournament: get(r, 'tournament'),
      event: get(r, 'event'),
      stage: get(r, 'stage'),
      home: get(r, 'home_team'),
      away: get(r, 'away_team'),
      vpHome: get(r, 'vp_home') === '' ? null : Number(get(r, 'vp_home')),
      vpAway: get(r, 'vp_away') === '' ? null : Number(get(r, 'vp_away')),
    });
  }
  return { pairs, vps };
}

function pairKey(a: string, b: string): string {
  return a <= b ? `${a}+${b}` : `${b}+${a}`;
}

interface LoadResult {
  tables: TableRow[];
  counters: Map<string, number>;
  coverage: Map<string, number>;
  vps: MatchVp[];
}

function loadTables(): LoadResult {
  const { pairs, vps } = loadMatches();
  const text = readFileSync(path.join(SCRAPE_DIR, 'contracts.csv'), 'utf8');
  const lines = text.split('\n');
  const header = parseCsv(lines[0] + '\n')[0];
  const col = csvColumns([header]);
  const idx = (name: string): number => {
    const i = col.get(name);
    if (i === undefined) throw new Error(`contracts.csv missing column ${name}`);
    return i;
  };
  const iTourn = idx('tournament');
  const iEvent = idx('event');
  const iStage = idx('stage');
  const iSegment = idx('segment');
  const iMatch = idx('matchid');
  const iRoom = idx('room');
  const iHome = idx('home_team');
  const iAway = idx('away_team');
  const iDealer = idx('dealer');
  const iVul = idx('vul');
  const iContract = idx('contract');
  const iDoubled = idx('doubled');
  const iDeclarer = idx('declarer');
  const iAuction = idx('auction');
  const iPbn = idx('pbn');

  const tables: TableRow[] = [];
  const counters = new Map<string, number>();
  const coverage = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string): void => {
    m.set(k, (m.get(k) ?? 0) + 1);
  };

  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    if (line.trim() === '') continue;
    bump(counters, 'rows');
    const f = parseCsv(line + '\n')[0];
    const auction = f[iAuction];
    if (!auction || auction.trim() === '') {
      bump(counters, 'no-auction');
      continue;
    }
    const calls = auction.trim().split(/\s+/);
    const dealerIdx = SEAT_IDX[f[iDealer]];
    // Doubled contracts carry a lowercase suffix ("4Sx", "3NTxx"); the doubling
    // state is validated separately via the `doubled` column.
    const check = checkAuction(
      calls,
      dealerIdx,
      f[iContract].replace(/x+$/, ''),
      Number(f[iDoubled]),
      SEAT_IDX[f[iDeclarer]],
    );
    if (!check.ok) {
      bump(counters, `invalid:${check.reason}`);
      continue;
    }
    const matchKey = [f[iTourn], f[iEvent], f[iStage], f[iSegment], f[iMatch]].join('|');
    const roomPlayers = pairs.get(matchKey)?.[f[iRoom] as 'open' | 'closed'];
    const nsPair = roomPlayers ? pairKey(roomPlayers[0], roomPlayers[2]) : '?';
    const ewPair = roomPlayers ? pairKey(roomPlayers[1], roomPlayers[3]) : '?';
    if (!roomPlayers) bump(counters, 'no-players');
    const isOpen = f[iRoom] === 'open';
    tables.push({
      tournament: f[iTourn],
      event: f[iEvent],
      stage: f[iStage],
      dealerIdx,
      vul: f[iVul],
      calls,
      pbn: f[iPbn],
      nsPair,
      ewPair,
      nsTeam: isOpen ? f[iHome] : f[iAway],
      ewTeam: isOpen ? f[iAway] : f[iHome],
    });
    bump(counters, 'valid');
    bump(coverage, `${f[iTourn]}/${f[iStage]}`);
  }
  return { tables, counters, coverage, vps };
}

// ---------------------------------------------------------------------------
// Pass 1: partnership system detection
// ---------------------------------------------------------------------------

function detectStyles(tables: TableRow[], feats: Map<string, SeatFeatures[]>): Map<string, PairStyle> {
  const openings = new Map<string, PairOpenings>();
  for (const t of tables) {
    // First non-pass call is the opening.
    let o = -1;
    for (let i = 0; i < t.calls.length && i < 4; i++) {
      if (t.calls[i] !== 'P') {
        o = i;
        break;
      }
    }
    if (o === -1) continue;
    const bid = t.calls[o];
    if (!isBid(bid)) continue;
    const seat = (t.dealerIdx + o) % 4;
    const pair = seat % 2 === 0 ? t.nsPair : t.ewPair;
    if (pair === '?') continue;
    const f = feats.get(t.pbn)![seat];
    let po = openings.get(pair);
    if (!po) {
      po = new PairOpenings();
      openings.set(pair, po);
    }
    if (bid === '1C') {
      po.n1C++;
      po.hcp1C.push(f.hcp);
      po.clubs1C.push(f.len[3]);
    } else if (bid === '1D') {
      po.n1D++;
      po.dia1D.push(f.len[2]);
    } else if (bid === '1NT') {
      po.n1NT++;
      po.hcp1NT.push(f.hcp);
    } else if (bid === '2C') {
      po.n2C++;
      po.clubs2C.push(f.len[3]);
    } else if (bid === '2D') {
      po.n2D++;
      po.dia2D.push(f.len[2]);
      po.maj2D.push(Math.max(f.len[0], f.len[1]));
    }
  }
  const styles = new Map<string, PairStyle>();
  for (const [pair, po] of openings) styles.set(pair, classifyPair(po));
  return styles;
}

/**
 * Detect each pair's 1C RESPONSE style (transfer walsh vs standard) from
 * their own uncontested 1D/1H responses to a natural/short 1C: transfer pairs
 * hold 4+ of the next suit up essentially always. Tags: 'xfer' | 'std' |
 * 'unkresp' (not enough evidence).
 */
function detectRespStyles(
  tables: TableRow[],
  feats: Map<string, SeatFeatures[]>,
  styles: Map<string, PairStyle>,
): Map<string, string> {
  interface Samples {
    n1D: number;
    h4: number;
    n1H: number;
    s4: number;
  }
  const samples = new Map<string, Samples>();
  for (const t of tables) {
    let o = -1;
    for (let i = 0; i < t.calls.length && i < 4; i++) {
      if (t.calls[i] !== 'P') {
        o = i;
        break;
      }
    }
    if (o === -1 || t.calls[o] !== '1C') continue;
    if (t.calls.length <= o + 2 || t.calls[o + 1] !== 'P') continue;
    const resp = t.calls[o + 2];
    if (resp !== '1D' && resp !== '1H') continue;
    const openerSeat = (t.dealerIdx + o) % 4;
    const pair = openerSeat % 2 === 0 ? t.nsPair : t.ewPair;
    if (pair === '?') continue;
    const oneClub = styles.get(pair)?.oneClub;
    if (oneClub !== 'natural' && oneClub !== 'short') continue;
    const f = feats.get(t.pbn)![(openerSeat + 2) % 4];
    let s = samples.get(pair);
    if (!s) {
      s = { n1D: 0, h4: 0, n1H: 0, s4: 0 };
      samples.set(pair, s);
    }
    if (resp === '1D') {
      s.n1D++;
      if (f.len[1] >= 4) s.h4++;
    } else {
      s.n1H++;
      if (f.len[0] >= 4) s.s4++;
    }
  }
  const out = new Map<string, string>();
  for (const [pair, s] of samples) {
    const cls = classifyRespStyle(
      s.n1D,
      s.n1D > 0 ? s.h4 / s.n1D : 0,
      s.n1H,
      s.n1H > 0 ? s.s4 / s.n1H : 0,
    );
    out.set(pair, cls === 'unknown' ? 'unkresp' : cls);
  }
  return out;
}

/**
 * Style tag for an opening bid made by a pair (conditions all derived
 * contexts). Short tags shared by the aggregation keys and the report:
 * nat/short/strong/polish (1C), nat/neb (1D), strong/weak (1NT), strong/nat
 * (2C), weak/multi/other (2D), nat/oth (everything else, by natural base).
 */
const STYLE_SHORT: Record<string, string> = {
  natural: 'nat',
  short: 'short',
  strong: 'strong',
  polish: 'polish',
  nebulous: 'neb',
  weak: 'weak',
  multi: 'multi',
  other: 'other',
  unknown: 'unk',
};

function styleTag(openBid: string, style: PairStyle | undefined): string {
  if (!style) return 'unk';
  switch (openBid) {
    case '1C':
      return STYLE_SHORT[style.oneClub];
    case '1D':
      return STYLE_SHORT[style.oneDiamond];
    case '1NT':
      return STYLE_SHORT[style.oneNT];
    case '2C':
      return STYLE_SHORT[style.twoClubs];
    case '2D':
      return STYLE_SHORT[style.twoDiamonds];
    default:
      return style.naturalBase ? 'nat' : 'oth';
  }
}

// ---------------------------------------------------------------------------
// Pass 2: aggregation
// ---------------------------------------------------------------------------

type CellKey = string; // family|key|action|vul|style

interface Cells {
  map: Map<CellKey, Agg>;
  /** family|key → distinct pbn count (sampling-independence context). */
  dealSets: Map<string, Set<string>>;
  /** Calls dropped because the acting team is in the bottom-k of its event. */
  excluded: number;
}

/**
 * "Their suit" from the acting player's perspective, for the shortage cross-tab
 * and double anatomy: the opponents' opening suit (or, when responding after
 * interference, the suit RHO bid).
 */
function theirSuitFor(family: string, key: string): number | null {
  const parts = key.split('|');
  let bid: string | undefined;
  switch (family) {
    case 'overOpen':
    case 'balance':
    case 'sandwich':
    case 'advance':
      bid = parts[0];
      break;
    case 'respInterf':
      bid = parts[1];
      break;
    default:
      return null; // open, resp
  }
  if (!bid || !isBid(bid)) return null;
  const idx = bidParts(bid).strainIdx;
  return idx < 4 ? idx : null;
}

/** Families whose X is a takeout/balancing double of the opening (anatomy applies). */
const TAKEOUT_X_FAMILIES = new Set(['overOpen', 'balance', 'sandwich']);

function aggregate(
  tables: TableRow[],
  feats: Map<string, SeatFeatures[]>,
  styles: Map<string, PairStyle>,
  respStyles: Map<string, string>,
  weakTeams: Set<string>,
): Cells {
  const map = new Map<CellKey, Agg>();
  const dealSets = new Map<string, Set<string>>();
  let excluded = 0;
  for (const t of tables) {
    const tf = feats.get(t.pbn)!;
    for (let i = 0; i < t.calls.length; i++) {
      const ctx = classifyCall(t.calls, i);
      if (!ctx) continue;
      const seat = (t.dealerIdx + i) % 4;
      const actorTeam = seat % 2 === 0 ? t.nsTeam : t.ewTeam;
      if (weakTeams.has(`${t.tournament}|${t.event}|${actorTeam}`)) {
        excluded++;
        continue;
      }
      const actorPair = seat % 2 === 0 ? t.nsPair : t.ewPair;
      const otherPair = seat % 2 === 0 ? t.ewPair : t.nsPair;
      const vul = relVul(t.vul, seat);
      // Which pair's style conditions this context? The opener's.
      const openBid = ctx.family === 'open' ? ctx.action : ctx.key.split('|')[0];
      let openerPair: string;
      switch (ctx.family) {
        case 'open':
        case 'resp':
        case 'respInterf':
          openerPair = actorPair;
          break;
        default:
          openerPair = otherPair; // overOpen, balance, sandwich, advance
      }
      let style =
        ctx.family === 'open' && !isBid(ctx.action)
          ? styles.get(actorPair)?.naturalBase
            ? 'nat'
            : styles.get(actorPair)
              ? 'oth'
              : 'unk'
          : styleTag(openBid, styles.get(openerPair));
      // Responses to a natural/short 1C split by the pair's RESPONSE style
      // (transfer walsh vs standard) instead of the opening style.
      if (
        (ctx.family === 'resp' || ctx.family === 'respInterf') &&
        openBid === '1C' &&
        (style === 'nat' || style === 'short')
      ) {
        style = respStyles.get(actorPair) ?? 'unkresp';
      }
      const cellKey = `${ctx.family}|${ctx.key}|${ctx.action}|${vul}|${style}`;
      let agg = map.get(cellKey);
      if (!agg) {
        agg = new Agg();
        map.set(cellKey, agg);
      }
      const bidSuit = isBid(ctx.action) ? bidParts(ctx.action).strainIdx : null;
      const theirSuit = ctx.family === 'open' ? null : theirSuitFor(ctx.family, ctx.key);
      const isX = ctx.action === 'X' && TAKEOUT_X_FAMILIES.has(ctx.family);
      agg.add(tf[seat], bidSuit !== null && bidSuit < 4 ? bidSuit : null, theirSuit, isX);
      const dealKey = `${ctx.family}|${ctx.key}|${ctx.action}`;
      let ds = dealSets.get(dealKey);
      if (!ds) {
        ds = new Set();
        dealSets.set(dealKey, ds);
      }
      ds.add(t.pbn);
    }
  }
  return { map, dealSets, excluded };
}

/** Sum aggregates matching family|key|action across chosen vuls and styles. */
function sumCells(
  cells: Cells,
  family: string,
  key: string,
  action: string,
  vuls: RelVul[] | 'all',
  stylesWanted: string[] | 'all',
): Agg {
  // The cell key uses '|' inside `key` too (respInterf/advance), so look up
  // reconstructed candidate keys instead of splitting stored ones.
  const out = new Agg();
  const vulList: string[] = vuls === 'all' ? ['none', 'we', 'they', 'both'] : vuls;
  const styleList =
    stylesWanted === 'all'
      ? ['nat', 'short', 'strong', 'polish', 'neb', 'weak', 'multi', 'other', 'oth', 'unk', 'xfer', 'std', 'unkresp']
      : stylesWanted;
  for (const vul of vulList) {
    for (const style of styleList) {
      const agg = cells.map.get(`${family}|${key}|${action}|${vul}|${style}`);
      if (agg) out.mergeFrom(agg);
    }
  }
  return out;
}

/** Total decisions (all actions incl. P) in a context slice — freq denominators. */
function totalFor(
  cells: Cells,
  family: string,
  key: string,
  vuls: RelVul[] | 'all',
  stylesWanted: string[] | 'all',
): number {
  let total = 0;
  for (const action of actionsFor(cells, family, key)) {
    total += sumCells(cells, family, key, action, vuls, stylesWanted).n;
  }
  return total;
}

/** All actions seen for a family|key, ordered by frequency. */
function actionsFor(cells: Cells, family: string, key: string): string[] {
  const counts = new Map<string, number>();
  for (const [k, agg] of cells.map) {
    // family|<key parts...>|action|vul|style — key may itself contain '|'.
    const parts = k.split('|');
    if (parts[0] !== family) continue;
    if (parts.slice(1, parts.length - 3).join('|') !== key) continue;
    const action = parts[parts.length - 3];
    counts.set(action, (counts.get(action) ?? 0) + agg.n);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function fmtStats(agg: Agg): string {
  const st = histStats(agg.hcpHist);
  if (st.n === 0) return '—';
  return `${st.p[0]}/${st.p[2]}/**${st.p[3]}**/${st.p[4]}/${st.p[6]}`;
}

/** Texture cell: median (p25–p75) on the 0–10 scale. */
function fmtTxi(agg: Agg): string {
  const st = histStats(agg.txiHist);
  if (st.n === 0) return '—';
  const f = (v: number): string => (v / 10).toFixed(1);
  return `**${f(st.p[3])}** (${f(st.p[2])}–${f(st.p[4])})`;
}

function pct(x: number, n: number): string {
  return n === 0 ? '—' : `${Math.round((100 * x) / n)}%`;
}

// ---------------------------------------------------------------------------
// Profiles (dealer integration)
// ---------------------------------------------------------------------------

interface Profile {
  family: string;
  key: string;
  action: string;
  label: string;
  vul: string;
  style: string;
  n: number;
  /** Share of all decisions in this context slice that chose this action. */
  freq: number | null;
  hcp: { mean: number; sd: number; min: number; max: number; p: number[]; hist: number[] };
  suitLen: Record<string, { p: number[]; hist: number[] }>;
  /** A/K/Q/J/T count in the bid suit: overall + weak (≤10 HCP) + sound (11+). */
  qual: { hist: number[]; weak: number[]; sound: number[] } | null;
  /**
   * Bid-suit texture index percentiles [p5,p10,p25,p50,p75,p90,p95] on the
   * 0–10 scale — overall + weak (≤10 HCP) + sound (11+) strata.
   */
  texture: { p: number[]; weak: number[]; sound: number[] } | null;
  balancedPct: number;
  /** % of hands with a classic stopper in their suit (competitive contexts). */
  stopperPct: number | null;
  /** HCP percentiles by length held in their suit (shortage acts lighter). */
  hcpByTheirLen: Record<string, { n: number; p: number[] }> | null;
  /** Hand-type counts (RESP_TYPES order) — response families only. */
  respTypes: number[] | null;
  /** Derived dealer rule: structured branches + a compiled-checked filterExpr. */
  rule: BidRule;
}

/** Texture percentiles on the 0–10 scale (histogram is ×10). */
function txPercentiles(hist: ArrayLike<number>): number[] {
  const st = histStats(hist);
  return st.n === 0 ? [] : st.p.map((v) => Number((v / 10).toFixed(1)));
}

/** Drop the trailing zeros of a histogram (index still = value). */
function trimHist(hist: ArrayLike<number>): number[] {
  let last = -1;
  for (let i = 0; i < hist.length; i++) if (hist[i] !== 0) last = i;
  const out: number[] = [];
  for (let i = 0; i <= last; i++) out.push(hist[i]);
  return out;
}

/** Derive the dealer rule appropriate to this action in this context. */
function deriveRule(family: string, key: string, action: string, agg: Agg): BidRule {
  const theirSuit = theirSuitFor(family, key);
  const parts = key.split('|');
  const opening = family === 'open' ? action : parts[0];
  // A suit bid over a NT opening may be conventional (Landy/multi-style).
  const facingNT =
    TAKEOUT_X_FAMILIES.has(family) && isBid(opening) && bidParts(opening).strainIdx === 4;
  if (action === 'X' && TAKEOUT_X_FAMILIES.has(family) && theirSuit !== null) {
    return deriveDoubleRule(agg, theirSuit);
  }
  if (isBid(action)) {
    const { strainIdx } = bidParts(action);
    // After 1M (X), many pairs play transfers / graded raises (2NT = Jordan):
    // when most hands hold 3+ of partner's major, the bid — suit or NT — is a
    // raise in disguise and keys on support + strength band.
    if (family === 'respInterf' && parts[1] === 'X' && isBid(parts[0])) {
      const pSuit = bidParts(parts[0]).strainIdx;
      if (pSuit <= 1 && agg.n >= 25) {
        let support3 = 0;
        for (let l = 3; l < 14; l++) support3 += agg.lenHist[pSuit][l];
        if (support3 / agg.n >= 0.7) return deriveRaiseishRule(agg, pSuit);
      }
    }
    if (strainIdx < 4) {
      // Responses may be transfers (1C-1D = hearts, continued over intervention):
      // key on the suit actually held when the named suit isn't it.
      if (family === 'resp' || family === 'respInterf') {
        return deriveRespSuitRule(agg, strainIdx, theirSuit);
      }
      return deriveSuitBidRule(agg, strainIdx, theirSuit, facingNT);
    }
    return deriveNtRule(agg, theirSuit);
  }
  return deriveHcpRule(agg); // P, XX, other doubles
}

/** Distribution cell: per-value percentages (≥2% shown, tails lumped). */
function fmtDist(hist: ArrayLike<number>, suffix = ''): string {
  let n = 0;
  for (let v = 0; v < hist.length; v++) n += hist[v];
  if (n === 0) return '—';
  const pctOf = (c: number): number => (100 * c) / n;
  let lo = -1;
  let hi = -1;
  for (let v = 0; v < hist.length; v++) {
    if (pctOf(hist[v]) >= 2) {
      if (lo === -1) lo = v;
      hi = v;
    }
  }
  if (lo === -1) return '—';
  const parts: string[] = [];
  let below = 0;
  for (let v = 0; v < lo; v++) below += hist[v];
  if (pctOf(below) >= 1) parts.push(`<${lo}:${Math.round(pctOf(below))}%`);
  for (let v = lo; v <= hi; v++) {
    const p = pctOf(hist[v]);
    if (p >= 1) parts.push(`${v}${suffix}:${Math.round(p)}%`);
  }
  let above = 0;
  for (let v = hi + 1; v < hist.length; v++) above += hist[v];
  if (pctOf(above) >= 1) parts.push(`${hi + 1}+:${Math.round(pctOf(above))}%`);
  return parts.join(' ');
}

function toProfile(
  family: string,
  key: string,
  action: string,
  ctxLabel: string,
  vul: string,
  style: string,
  agg: Agg,
  freq: number | null,
): Profile {
  const hcp = histStats(agg.hcpHist);
  const suitLen: Profile['suitLen'] = {};
  for (let s = 0; s < 4; s++) {
    const st = histStats(agg.lenHist[s]);
    suitLen[SUIT_NAMES[s]] = { p: st.p, hist: trimHist(agg.lenHist[s]) };
  }
  let hcpByTheirLen: Profile['hcpByTheirLen'] = null;
  if (agg.hcpByTheirLen) {
    hcpByTheirLen = {};
    for (let b = 0; b < 4; b++) {
      const st = histStats(agg.hcpForBuckets([b]));
      if (st.n > 0) hcpByTheirLen[THEIR_LEN_LABELS[b]] = { n: st.n, p: st.p };
    }
  }
  return {
    family,
    key,
    action,
    label: ctxLabel,
    vul,
    style,
    n: agg.n,
    freq: freq === null ? null : Number(freq.toFixed(4)),
    hcp: {
      mean: Number(hcp.mean.toFixed(2)),
      sd: Number(hcp.sd.toFixed(2)),
      min: hcp.min,
      max: hcp.max,
      p: hcp.p,
      hist: trimHist(agg.hcpHist),
    },
    suitLen,
    qual:
      isBid(action) && bidParts(action).strainIdx < 4
        ? {
            hist: trimHist(agg.qualHist),
            weak: trimHist(agg.qualWeakHist),
            sound: trimHist(agg.qualSoundHist),
          }
        : null,
    texture:
      isBid(action) && bidParts(action).strainIdx < 4
        ? {
            p: txPercentiles(agg.txiHist),
            weak: txPercentiles(agg.txiWeakHist),
            sound: txPercentiles(agg.txiSoundHist),
          }
        : null,
    balancedPct: agg.n === 0 ? 0 : Number(((100 * agg.balanced) / agg.n).toFixed(1)),
    stopperPct: agg.theirN >= 25 ? Number(((100 * agg.theirStop) / agg.theirN).toFixed(1)) : null,
    hcpByTheirLen,
    respTypes:
      family === 'resp' || family === 'respInterf' ? [...agg.respTypeHist] : null,
    rule: deriveRule(family, key, action, agg),
  };
}

// ---------------------------------------------------------------------------
// The task
// ---------------------------------------------------------------------------

/** Bottom-k teams per event excluded from all hand-range aggregation. */
const WEAK_TEAM_CUT = 4;

it('bidding-range study', () => {
  if (!existsSync(path.join(SCRAPE_DIR, 'contracts.csv'))) {
    throw new Error(`missing ${SCRAPE_DIR}/contracts.csv — run bridge:scrape + bridge:flatten`);
  }
  console.log('loading contracts…');
  const { tables, counters, coverage, vps } = loadTables();
  console.log(`  ${tables.length} valid auction tables`);

  const weakTeams = bottomTeams(vps, WEAK_TEAM_CUT);
  console.log(`  ${weakTeams.size} bottom-${WEAK_TEAM_CUT} teams flagged for exclusion`);

  console.log('computing hand features…');
  const feats = new Map<string, SeatFeatures[]>();
  for (const t of tables) {
    if (!feats.has(t.pbn)) feats.set(t.pbn, featuresFromPbn(t.pbn));
  }
  console.log(`  ${feats.size} distinct deals`);

  console.log('pass 1: partnership system detection…');
  const styles = detectStyles(tables, feats);
  const respStyles = detectRespStyles(tables, feats, styles);
  {
    const c = { xfer: 0, std: 0, unkresp: 0 };
    for (const v of respStyles.values()) c[v as keyof typeof c]++;
    console.log(`  1C response styles: std ${c.std}, xfer ${c.xfer}, unknown ${c.unkresp}`);
  }

  console.log('pass 2: context aggregation…');
  const cells = aggregate(tables, feats, styles, respStyles, weakTeams);
  console.log(`  ${cells.map.size} context cells; ${cells.excluded} weak-team calls excluded`);

  console.log('writing report + profiles…');
  const report = buildReport(tables, counters, coverage, styles, respStyles, cells, weakTeams);
  writeFileSync(REPORT_PATH, report);

  const profiles = buildProfiles(cells);
  let badExpr = 0;
  for (const p of profiles) {
    if (!p.rule) continue;
    const r = compileFilter(p.rule.filterExpr);
    if (r.error) {
      badExpr++;
      console.error(`  BAD filterExpr for ${p.label}: ${p.rule.filterExpr} — ${r.error}`);
    }
  }
  if (badExpr > 0) throw new Error(`${badExpr} filter expressions failed to compile`);
  const lines = profiles.map((p) => JSON.stringify(p));
  writeFileSync(
    PROFILES_PATH,
    `{"version":4,"source":"WBF/EBL championships 2023-2026, ${tables.length} tables, bottom-${WEAK_TEAM_CUT} teams per event excluded","profiles":[\n${lines.join(',\n')}\n]}\n`,
  );
  console.log(`  ${profiles.length} profiles (all filter expressions compile) → ${PROFILES_PATH}`);
  console.log(`  report → ${REPORT_PATH}`);
});

/** Per family|key|vul|style totals (freq denominators), one pass over cells. */
function buildTotals(cells: Cells): Map<string, number> {
  const totals = new Map<string, number>();
  for (const [k, agg] of cells.map) {
    const parts = k.split('|');
    const family = parts[0];
    const key = parts.slice(1, parts.length - 3).join('|');
    const vul = parts[parts.length - 2];
    const style = parts[parts.length - 1];
    const tk = `${family}|${key}|${vul}|${style}`;
    totals.set(tk, (totals.get(tk) ?? 0) + agg.n);
  }
  return totals;
}

function sliceTotal(
  totals: Map<string, number>,
  family: string,
  key: string,
  vuls: RelVul[] | 'all',
  stylesWanted: string[] | 'all',
): number {
  const vulList: string[] = vuls === 'all' ? ['none', 'we', 'they', 'both'] : vuls;
  const styleList =
    stylesWanted === 'all'
      ? ['nat', 'short', 'strong', 'polish', 'neb', 'weak', 'multi', 'other', 'oth', 'unk', 'xfer', 'std', 'unkresp']
      : stylesWanted;
  let total = 0;
  for (const vul of vulList)
    for (const style of styleList) total += totals.get(`${family}|${key}|${vul}|${style}`) ?? 0;
  return total;
}

function buildProfiles(cells: Cells): Profile[] {
  const out: Profile[] = [];
  const totals = buildTotals(cells);
  // Enumerate distinct family|key|action triples.
  const triples = new Map<string, { family: string; key: string; action: string }>();
  for (const k of cells.map.keys()) {
    const parts = k.split('|');
    const family = parts[0];
    const action = parts[parts.length - 3];
    const key = parts.slice(1, parts.length - 3).join('|');
    triples.set(`${family}|${key}|${action}`, { family, key, action });
  }
  for (const { family, key, action } of triples.values()) {
    const ctx: CallContext = {
      family: family as CallContext['family'],
      key,
      action,
      seatPos: family === 'open' ? Number(key.replace('seat', '')) : 0,
      passedHand: false,
    };
    const label = contextLabel(ctx);
    const freqOf = (agg: Agg, vuls: RelVul[] | 'all', stylesW: string[] | 'all'): number | null => {
      const total = sliceTotal(totals, family, key, vuls, stylesW);
      return total > 0 ? agg.n / total : null;
    };
    // Collapsed (all vuls, all styles) …
    const all = sumCells(cells, family, key, action, 'all', 'all');
    if (all.n >= 25)
      out.push(toProfile(family, key, action, label, 'all', 'all', all, freqOf(all, 'all', 'all')));
    // … per style (all vuls) for the style-sensitive openings and responses …
    for (const style of ['nat', 'short', 'strong', 'polish', 'neb', 'weak', 'multi', 'xfer', 'std']) {
      const styled = sumCells(cells, family, key, action, 'all', [style]);
      if (styled.n >= 25 && styled.n < all.n) {
        out.push(
          toProfile(family, key, action, label, 'all', style, styled, freqOf(styled, 'all', [style])),
        );
      }
    }
    // … and per vul (all styles).
    for (const vul of ['none', 'we', 'they', 'both'] as RelVul[]) {
      const v = sumCells(cells, family, key, action, [vul], 'all');
      if (v.n >= 25)
        out.push(toProfile(family, key, action, label, vul, 'all', v, freqOf(v, [vul], 'all')));
    }
  }
  out.sort((a, b) => a.family.localeCompare(b.family) || a.key.localeCompare(b.key) || b.n - a.n);
  return out;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function buildReport(
  tables: TableRow[],
  counters: Map<string, number>,
  coverage: Map<string, number>,
  styles: Map<string, PairStyle>,
  respStyles: Map<string, string>,
  cells: Cells,
  weakTeams: Set<string>,
): string {
  const L: string[] = [];
  const add = (s = ''): void => {
    L.push(s);
  };
  const totals = buildTotals(cells);

  add('# What championship players actually hold for every bid');
  add();
  add('This is a **measured picture of a real expert bidding system**, not a textbook.');
  add('It is built by taking every recorded auction from recent World and European');
  add('team championships, dealing the real hand back onto each call, and asking: when');
  add('a world-class player made *this* bid in *this* situation, what did they actually');
  add('have? The result is an empirical range — HCP, shape, suit length and quality —');
  add('for every opening, overcall, double and response up to the four level, split by');
  add('vulnerability and by the partnership’s system where it matters.');
  add();
  add('**Why it exists.** Bridge books quote ranges like "1♥ = 11–20, five-card suit"');
  add('or "overcalls 8–16". Those are teaching approximations. This sheet replaces them');
  add('with what the best players in the world do under championship pressure, so a deal');
  add('generator can produce hands that look like the real thing — and so the ranges can');
  add('be pasted straight into the [WesDeal](./index.html) dealer as filters.');
  add();
  add('**How to read a row.** Each context (e.g. `(1♣) 1♥` = they open 1♣, we overcall');
  add('1♥) lists the actions taken and, for each, how often it was chosen (`freq`), how');
  add('many times it occurred (`n`), and the hand it showed. Key columns:');
  add();
  add('- **HCP** — high-card points as p5 / p25 / **median** / p75 / p95, so you see the');
  add('  centre and the edges of the range, not just an average.');
  add('- **bid-suit length / their suit** — the full shape distribution as per-length');
  add('  percentages (e.g. `5:66% 6:23%`); tails are lumped as `<k` / `k+`.');
  add('- **texture** — a 0–10 suit-quality index: cards A…7 weighted top-down plus a');
  add('  bonus for touching cards, normalised so a solid AKQJT suit scores 10 at any');
  add('  length (QJT98 ≈ 5.3, KQ743 ≈ 4.4, jack-high rags ≈ 1). Shown as median');
  add('  (p25–p75). This replaces raw honour-counts because top players judge a suit by');
  add('  its whole texture, not by how many top honours it contains.');
  add('- **%bal** — share of strictly balanced shapes only: 4-3-3-3, 4-4-3-2, 5-3-3-2.');
  add('  A 5-4 or 6-3-2-2 hand is *not* balanced here even though it has no short suit.');
  add('- **filter** — the same range written in the dealer’s filter language, ready to');
  add('  paste (see [Dealer integration](#dealer-integration)).');
  add();
  add('Where a bid means different things to different partnerships — a strong vs natural');
  add('1♣, transfer vs standard responses, multi vs weak 2♦ — the field is **split by');
  add('system** so the ranges aren’t blurred together; the detection is described in each');
  add('section. Generated by research/bidding/bidding.task.ts from the WBF/EBL scrape —');
  add('do not edit by hand; re-run `npm run research:bidding`.');
  add();

  // --- data section
  add('## Data');
  add();
  const rows = counters.get('rows') ?? 0;
  const noAuction = counters.get('no-auction') ?? 0;
  const valid = counters.get('valid') ?? 0;
  add(`- ${rows} table results scanned; ${rows - noAuction} carry an auction; ${valid} auctions`);
  add('  replay as legal sequences consistent with the recorded contract, doubling');
  add('  state, and declarer (the rest are site glitches, e.g. card tokens inside');
  add('  the bidding tooltip).');
  const rejects = [...counters.entries()].filter(([k]) => k.startsWith('invalid:'));
  rejects.sort((a, b) => b[1] - a[1]);
  add(`- Rejected: ${rejects.map(([k, v]) => `${k.slice(8)} ${v}`).join(', ')}.`);
  add('- Coverage by tournament/stage (valid auctions):');
  add();
  add('| tournament/stage | auctions |');
  add('|---|---|');
  for (const [k, v] of [...coverage.entries()].sort((a, b) => b[1] - a[1])) {
    add(`| ${k} | ${v} |`);
  }
  add();
  add(`- Strength filter: the bottom ${WEAK_TEAM_CUT} teams of each event (by average`);
  add(`  round-robin VP) are excluded as actors — ${weakTeams.size} teams, ${cells.excluded}`);
  add('  calls dropped. Their opponents’ calls still count, and their systems are');
  add('  still classified (needed to condition actions against them).');
  add();
  add('Caveats: passed-out deals never reach the dataset (the site records them as');
  add('"Pass" with no auction), so 4th-seat pass frequencies are unobservable. The');
  add('same deal is bid at many tables (round-robins), so per-context samples are');
  add('correlated across tables; n counts tables, and the distinct-deal count is');
  add('shown for headline contexts. Alerts/explanations are not captured — systemic');
  add('meaning is inferred from the hands themselves (see system detection).');
  add();

  // Shared accessors for the narrative sections.
  const stat = (
    family: string,
    key: string,
    action: string,
    stylesW: string[] | 'all',
    vuls: RelVul[] | 'all' = 'all',
  ): Agg => sumCells(cells, family, key, action, vuls, stylesW);
  const med = (agg: Agg): number => histStats(agg.hcpHist).p[3];
  const range90 = (agg: Agg): string => {
    const st = histStats(agg.hcpHist);
    return `${st.p[0]}–${st.p[6]} (med ${st.p[3]})`;
  };
  const SUIT_GLYPH = ['♠', '♥', '♦', '♣'];

  // --- key findings
  add('## Key findings');
  add();
  {
    const o1H = stat('open', 'seat1', '1H', ['nat']);
    const o1H2 = stat('open', 'seat2', '1H', ['nat']);
    const merged = new Agg();
    for (const a of [o1H, o1H2]) {
      merged.n += a.n;
      for (let h = 0; h < a.hcpHist.length; h++) merged.hcpHist[h] += a.hcpHist[h];
    }
    const oc1 = stat('overOpen', '1C', '1H', ['nat', 'short']);
    const x1S = stat('overOpen', '1S', 'X', 'all');
    const nt1 = stat('overOpen', '1H', '1NT', 'all');
    const ntBal = stat('balance', '1H', '1NT', 'all');
    const wjoFav = stat('overOpen', '1C', '2H', ['nat', 'short'], ['they']);
    const wjoUnfav = stat('overOpen', '1C', '2H', ['nat', 'short'], ['we']);
    const mich = stat('overOpen', '1H', '2H', 'all');
    const negX = stat('respInterf', '1S|2H', 'X', 'all');
    const xx = stat('respInterf', '1C|X', 'XX', ['std', 'xfer', 'unkresp']);
    add(`- **The field opens light and overcalls light.** Natural 1M openings in seats 1–2`);
    add(`  centre on ${med(merged)} HCP with p5 = ${histStats(merged.hcpHist).p[0]} — nearly every 11-count and many decent`);
    add(`  10-counts get opened. One-level overcalls ((1C) 1H) run ${range90(oc1)} HCP —`);
    add(`  the book "8–16" is real but the median sits ${med(merged) - med(oc1)} HCP below the median opening.`);
    {
      const txMed = (hist: ArrayLike<number>): string =>
        (histStats(hist).p[3] / 10).toFixed(1);
      add(`- **Suit quality is a weak-hand requirement.** Light (≤10 HCP) 1H overcalls of a`);
      add(`  natural 1C carry a median suit texture of ${txMed(oc1.txiWeakHist)}/10; sound ones (11+) get away`);
      add(`  with ${txMed(oc1.txiSoundHist)}/10 — the values carry a moderate suit. The derived filters`);
      add(`  encode exactly that: a quality floor everyone meets, plus a higher bar that`);
      add(`  only applies below 11 HCP (\`hcp >= 11 or top(h,5) >= …\`).`);
    }
    add(`- **Takeout doubles are opening-strength, not 12+**: (1S) X runs ${range90(x1S)};`);
    add(`  the light tail (10–11) comes with shape.`);
    add(`- **The 1NT overcall is a strong NT**: (1H) 1NT = ${range90(nt1)}; balancing`);
    add(`  (1H) P (P) 1NT is ${med(nt1) - med(ntBal)} HCP lighter at ${range90(ntBal)}.`);
    add(`- **Vulnerability moves preempts, not constructive bids.** Weak jump overcalls`);
    add(`  swing hardest: (1C) 2H is median ${med(wjoFav)} at favourable but ${med(wjoUnfav)} at unfavourable.`);
    add(`  Simple overcalls and doubles barely move (±1 HCP).`);
    add(`- **Two-suited bids are universal**: (1H) 2H (Michaels) = ${range90(mich)} with ≤2`);
    add(`  hearts ${Math.round((100 * (mich.lenHist[1][0] + mich.lenHist[1][1] + mich.lenHist[1][2])) / Math.max(1, mich.n))}% of the time; (1M) 2NT is the two lowest suits, unbalanced.`);
    add(`- **Negative doubles start at ~7**: 1S (2H) X = ${range90(negX)}. Redouble after`);
    add(`  1C (X) shows ${range90(xx)}.`);
    // Transfer responses to 1C.
    {
      const c = { xfer: 0, std: 0, unkresp: 0 };
      for (const v of respStyles.values()) c[v as keyof typeof c]++;
      const x1d = stat('resp', '1C', '1D', ['xfer']);
      const x1s = stat('resp', '1C', '1S', ['xfer']);
      if (x1d.n >= 25) {
        const h4 = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13].reduce((a, l) => a + x1d.lenHist[1][l], 0);
        const noMaj = [0, 1, 2, 3].reduce((a, l) => a + x1s.maxMajHist[l], 0);
        add(`- **Transfer responses to 1C are mainstream**: of classified natural-club pairs,`);
        add(`  ${c.xfer} play transfers vs ${c.std} standard. Their 1C (P) 1D holds 4+ hearts ${Math.round((100 * h4) / x1d.n)}%`);
        add(`  of the time (${range90(x1d)} HCP), and 1S is the no-major hand${
          x1s.n >= 25 ? ` (${Math.round((100 * noMaj) / Math.max(1, x1s.n))}% with no 4-card major, ${range90(x1s)})` : ''
        } — the`);
        add('  derived rules follow the shown suit, and the treatment carries on over a');
        add('  double or 1D overcall (see the transfer-responder sections).');
      }
    }
    // Defence to 1NT: conventional shapes detected from the hands.
    {
      const twoC = stat('overOpen', '1NT', '2C', 'all');
      const twoD = stat('overOpen', '1NT', '2D', 'all');
      const shareHist = (hist: ArrayLike<number>, min: number, n: number): string =>
        n === 0 ? '—' : `${Math.round((100 * [...Array(hist.length).keys()].filter((v) => v >= min).reduce((a, v) => a + (hist[v] as number), 0)) / n)}%`;
      if (twoC.n >= 25 && twoD.n >= 25) {
        add(`- **Defence to 1NT is conventional and the data shows it**: (1NT) 2C holds both`);
        add(`  majors 4+ ${shareHist(twoC.minMajHist, 4, twoC.n)} of the time (clubs are incidental); (1NT) 2D has a 5+`);
        add(`  major ${shareHist(twoD.maxMajHist, 5, twoD.n)} (6+ ${shareHist(twoD.maxMajHist, 6, twoD.n)}) — multi-style; 2M shows the major plus a 4+ minor.`);
        add('  The derived rules detect these shapes instead of reading the bid suit at');
        add('  face value (see the (1NT) ? section).');
      }
    }
    const styleCount = (pick: (s: PairStyle) => string, want: string): number =>
      [...styles.values()].filter((s) => pick(s) === want).length;
    const nMulti = styleCount((s) => s.twoDiamonds, 'multi');
    const nWeak2D = styleCount((s) => s.twoDiamonds, 'weak');
    const nStrongC = styleCount((s) => s.oneClub, 'strong');
    add(`- **At this level 2D is multi** (${nMulti} pairs multi vs ${nWeak2D} weak among classified),`);
    add(`  2C strong is standard, and strong-club pairs are ${Math.round((100 * nStrongC) / styles.size)}% of the field (${nStrongC} of ${styles.size}).`);
    // Shortage vs length in their suit.
    const ov = stat('overOpen', '1D', '1S', ['nat']);
    if (ov.hcpByTheirLen) {
      const short = histStats(ov.hcpForBuckets([0, 1]));
      const long = histStats(ov.hcpForBuckets([2, 3]));
      add(`- **Shortage in their suit buys lighter action.** (1D) 1S overcallers with ≤2`);
      add(`  diamonds are median ${short.p[3]} HCP (p5 ${short.p[0]}); with 3+ diamonds median ${long.p[3]} (p5 ${long.p[0]}).`);
      add('  The same gradient shows up in every overcall and double context (see the');
      add('  per-context cross-tabs), so the derived filters split their-suit shortage');
      add('  from length.');
    }
    // Double anatomy summary.
    const x1h = stat('overOpen', '1H', 'X', 'all');
    const x1c = stat('overOpen', '1C', 'X', ['nat', 'short']);
    if (x1h.xBandN && x1c.xBandN) {
      const share = (agg: Agg, metric: Uint32Array, minLen: number, bands: number[]): string => {
        let num = 0;
        let den = 0;
        for (const b of bands) {
          den += agg.xBandN![b];
          for (let l = minLen; l < 8; l++) num += metric[b * 8 + l];
        }
        return den === 0 ? '—' : `${Math.round((100 * num) / den)}%`;
      };
      add(`- **Doubles are support-first below 17, shape-free above.** Under 17 HCP, (1H) X`);
      add(`  holds 3+ spades ${share(x1h, x1h.xMajMin!, 3, [0, 1, 2])} of the time (4+ ${share(x1h, x1h.xMajMin!, 4, [0, 1, 2])}) and 2+ in both`);
      add(`  minors ${share(x1h, x1h.xMinorMin!, 2, [0, 1, 2])}; (1C) X holds both majors 3+ ${share(x1c, x1c.xMajMin!, 3, [0, 1, 2])}. At 17+ those rates`);
      add(`  drop to ${share(x1h, x1h.xMajMin!, 3, [3])} / ${share(x1c, x1c.xMajMin!, 3, [3])} — the strong double is its own animal, and the derived`);
      add('  filters carry it as a separate shape-free branch.');
    }
    // Action rates vs opening meaning, at fixed own strength (9–11 HCP).
    const fixedRate = (key: string, sw: string[] | 'all'): number => {
      let act = 0;
      let tot = 0;
      for (const action of actionsFor(cells, 'overOpen', key)) {
        const agg = sumCells(cells, 'overOpen', key, action, 'all', sw);
        for (let h = 9; h <= 11; h++) {
          tot += agg.hcpHist[h];
          if (action !== 'P') act += agg.hcpHist[h];
        }
      }
      return tot < 50 ? NaN : (100 * act) / tot;
    };
    const rNat = fixedRate('1C', ['nat']);
    const rStrong = fixedRate('1C', ['strong']);
    const r1D = fixedRate('1D', ['nat']);
    const parts: string[] = [];
    if (!Number.isNaN(rNat)) parts.push(`${Math.round(rNat)}% over a natural 1C`);
    if (!Number.isNaN(r1D)) parts.push(`${Math.round(r1D)}% over 1D`);
    if (!Number.isNaN(rStrong)) parts.push(`${Math.round(rStrong)}% over a strong 1C`);
    add(`- **Action rates need a fixed-strength lens** (a strong 1C depletes the seats`);
    add(`  behind it). Holding 9–11 HCP, the direct seat acts ${parts.join(', ')}.`);
    add('  See the action-rate section for the full grid.');
    add();
  }

  // --- system census
  add('## Partnership system census');
  add();
  add('Each partnership is classified from its own openings (min 6 samples per bid).');
  add();
  const census = (pick: (s: PairStyle) => string): Map<string, number> => {
    const m = new Map<string, number>();
    for (const s of styles.values()) {
      const k = pick(s);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const fmtCensus = (m: Map<string, number>): string =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');
  add(`- 1C style: ${fmtCensus(census((s) => s.oneClub))}`);
  add(`- 1D style: ${fmtCensus(census((s) => s.oneDiamond))}`);
  add(`- 1NT range: ${fmtCensus(census((s) => s.oneNT))}`);
  add(`- 2C style: ${fmtCensus(census((s) => s.twoClubs))}`);
  add(`- 2D style: ${fmtCensus(census((s) => s.twoDiamonds))}`);
  add(`- natural base (1C natural/short and 1D not nebulous): ${fmtCensus(census((s) => (s.naturalBase ? 'yes' : 'no')))}`);
  {
    const c = { xfer: 0, std: 0, unkresp: 0 };
    for (const v of respStyles.values()) c[v as keyof typeof c]++;
    add(`- 1C response style (natural/short openers, from their own 1D/1H responses):`);
    add(`  standard ${c.std}, transfer-walsh ${c.xfer}, insufficient data ${c.unkresp}`);
  }
  add();

  const dealCount = (family: string, key: string, action: string): number =>
    cells.dealSets.get(`${family}|${key}|${action}`)?.size ?? 0;

  // --- openings
  add('## Openings (natural-base pairs)');
  add();
  add('HCP shown as p5/p25/**median**/p75/p95. Length is the bid suit, p5–p95 (median).');
  add('Style filter: 1C/1D/1NT/2C/2D rows use pairs whose that-bid style is natural');
  add('(1C natural or short-club; 1D natural; 2C strong excluded from "natural" row…);');
  add('1M and preempts use natural-base pairs.');
  add();
  for (const seatGroup of [
    ['seat1', 'seat2'],
    ['seat3'],
    ['seat4'],
  ]) {
    add(`### ${seatGroup.join(' + ').replace(/seat/g, 'Seat ')}`);
    add();
    add('| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |');
    add('|---|---|---|---|---|---|---|');
    const bids = new Set<string>();
    for (const key of seatGroup) {
      for (const a of actionsFor(cells, 'open', key)) if (isBid(a)) bids.add(a);
    }
    const ordered = [...bids].sort((a, b) => {
      const r = (x: string): number => Number(x[0]) * 5 + ['C', 'D', 'H', 'S', 'NT'].indexOf(x.slice(1));
      return r(a) - r(b);
    });
    for (const bid of ordered) {
      const styleFilter: string[] =
        bid === '1C' ? ['nat', 'short'] : bid === '1D' ? ['nat'] : bid === '1NT' ? ['strong'] : bid === '2C' ? ['strong'] : bid === '2D' ? ['weak'] : ['nat'];
      const agg = new Agg();
      for (const key of seatGroup) {
        agg.mergeFrom(sumCells(cells, 'open', key, bid, 'all', styleFilter));
      }
      if (agg.n < 25) continue;
      const suitIdx = bidParts(bid).strainIdx;
      const lenCell = suitIdx < 4 ? fmtDist(agg.lenHist[suitIdx]) : '—';
      const qualCell = suitIdx < 4 ? fmtTxi(agg) : '—';
      const deals = seatGroup.reduce((acc, key) => acc + dealCount('open', key, bid), 0);
      add(
        `| ${bid} | ${agg.n} | ${deals} | ${fmtStats(agg)} | ${lenCell} | ${qualCell} | ${pct(agg.balanced, agg.n)} |`,
      );
    }
    add();
  }

  // Preempts by vulnerability.
  add('### Preempts by vulnerability (all seats, natural-base pairs)');
  add();
  add('| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |');
  add('|---|---|---|---|---|---|');
  for (const bid of ['2H', '2S', '3C', '3D', '3H', '3S', '4C', '4D', '4H', '4S']) {
    for (const vul of ['they', 'none', 'both', 'we'] as RelVul[]) {
      const agg = new Agg();
      for (const key of ['seat1', 'seat2', 'seat3', 'seat4']) {
        agg.mergeFrom(sumCells(cells, 'open', key, bid, [vul], bid === '2D' ? ['weak'] : ['nat']));
      }
      if (agg.n < 25) continue;
      const suitIdx = bidParts(bid).strainIdx;
      const vulLabel = vul === 'they' ? 'fav' : vul === 'we' ? 'unfav' : vul;
      add(
        `| ${bid} | ${vulLabel} | ${agg.n} | ${fmtStats(agg)} | ${fmtDist(agg.lenHist[suitIdx])} | ${fmtTxi(agg)} |`,
      );
    }
  }
  add();

  // --- section helper for competitive families
  const competitiveSection = (
    title: string,
    family: string,
    keys: string[],
    styleFor: (key: string) => string[] | 'all',
    note = '',
    labelSuffix = '',
  ): void => {
    add(`## ${title}`);
    add();
    if (note) {
      add(note);
      add();
    }
    for (const key of keys) {
      const actions = actionsFor(cells, family, key);
      if (actions.length === 0) continue;
      const label =
        contextLabel({
          family: family as CallContext['family'],
          key,
          action: '?',
          seatPos: 0,
          passedHand: false,
        }) + labelSuffix;
      const styleW = styleFor(key);
      const contextTotal = sliceTotal(totals, family, key, 'all', styleW);
      if (contextTotal < 50) continue;
      // Partner's known suit, when the family has one (support tells the story
      // for raises/transfers after 1M (X), and for advances of an overcall).
      const keyParts = key.split('|');
      const partnerBid =
        family === 'respInterf' ? keyParts[0] : family === 'advance' ? keyParts[1] : null;
      const partnerSuit =
        partnerBid && isBid(partnerBid) && bidParts(partnerBid).strainIdx < 4
          ? bidParts(partnerBid).strainIdx
          : null;
      add(`### ${label}`);
      add();
      const partnerCol = partnerSuit !== null ? ` partner's ${SUIT_GLYPH[partnerSuit]} |` : '';
      add(
        `| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |${partnerCol}`,
      );
      add(`|---|---|---|---|---|---|---|---|${partnerSuit !== null ? '---|' : ''}`);
      for (const action of actions) {
        const agg = sumCells(cells, family, key, action, 'all', styleW);
        if (agg.n < 25) continue;
        const suitIdx = isBid(action) ? bidParts(action).strainIdx : 4;
        const lenCell =
          suitIdx < 4
            ? fmtDist(agg.lenHist[suitIdx])
            : action === 'X' && theirSuitFor(family, key) !== null
              ? `theirs: ${fmtDist(agg.lenHist[theirSuitFor(family, key)!])}`
              : '—';
        const qualCell = suitIdx < 4 ? fmtTxi(agg) : '—';
        const freq = contextTotal > 0 ? `${((100 * agg.n) / contextTotal).toFixed(1)}%` : '—';
        const partnerCell =
          partnerSuit !== null ? ` ${fmtDist(agg.lenHist[partnerSuit])} |` : '';
        add(
          `| ${action} | ${freq} | ${agg.n} | ${dealCount(family, key, action)} | ${fmtStats(agg)} | ${lenCell} | ${qualCell} | ${pct(agg.balanced, agg.n)} |${partnerCell}`,
        );
      }
      add();
      const nonPass = actions.filter((a) => a !== 'P').slice(0, 6);
      // Vulnerability split for the most common non-pass actions.
      const vulRows: string[] = [];
      for (const action of nonPass) {
        for (const vul of ['none', 'they', 'we', 'both'] as RelVul[]) {
          const agg = sumCells(cells, family, key, action, [vul], styleW);
          if (agg.n < 25) continue;
          const vulLabel = vul === 'they' ? 'fav' : vul === 'we' ? 'unfav' : vul;
          vulRows.push(`| ${action} | ${vulLabel} | ${agg.n} | ${fmtStats(agg)} |`);
        }
      }
      if (vulRows.length > 0) {
        add('By vulnerability (fav = they vul, we not; unfav = we vul, they not):');
        add();
        add('| action | vul | n | HCP p5/p25/med/p75/p95 |');
        add('|---|---|---|---|');
        for (const r of vulRows) add(r);
        add();
      }
      // Shortage/length in their suit vs HCP, for the top actions.
      const crossRows: string[] = [];
      for (const action of nonPass.slice(0, 4)) {
        const agg = sumCells(cells, family, key, action, 'all', styleW);
        if (!agg.hcpByTheirLen || agg.n < 100) continue;
        const cellsTxt = [0, 1, 2, 3].map((b) => {
          const st = histStats(agg.hcpForBuckets([b]));
          return st.n < 15 ? '—' : `${st.p[2]}/**${st.p[3]}**/${st.p[4]} (${st.n})`;
        });
        crossRows.push(`| ${action} | ${cellsTxt.join(' | ')} |`);
      }
      if (crossRows.length > 0) {
        add('HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:');
        add();
        add(`| action | ${THEIR_LEN_LABELS.join(' | ')} |`);
        add('|---|---|---|---|---|');
        for (const r of crossRows) add(r);
        add();
      }
      // Double anatomy: what supports/shape sit under X, by strength band.
      const xAgg = sumCells(cells, family, key, 'X', 'all', styleW);
      if (xAgg.xBandN && xAgg.n >= 100) {
        const theirSuit = theirSuitFor(family, key)!;
        const theirIsMajor = theirSuit <= 1;
        const majLabel = theirIsMajor ? 'other major' : 'both majors';
        add(`Anatomy of X: per HCP band, support held (${majLabel} = min length; unbid`);
        add('minors = min length). Strong doubles relax shape:');
        add();
        add(`| band | n | ${majLabel} ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |`);
        add('|---|---|---|---|---|---|');
        const bandBounds = [
          [0, 10],
          [11, 13],
          [14, 16],
          [17, MAX_HCP],
        ];
        for (let band = 0; band < 4; band++) {
          const bn = xAgg.xBandN[band];
          if (bn < 15) continue;
          let maj3 = 0;
          let maj4 = 0;
          let minor2 = 0;
          for (let l = 0; l < 8; l++) {
            if (l >= 3) maj3 += xAgg.xMajMin![band * 8 + l];
            if (l >= 4) maj4 += xAgg.xMajMin![band * 8 + l];
            if (l >= 2) minor2 += xAgg.xMinorMin![band * 8 + l];
          }
          // Short-in-their-suit share within this strength band (from the cross-tab).
          let short = 0;
          let bandTotal = 0;
          const [lo, hi] = bandBounds[band];
          for (let bucket = 0; bucket < 4; bucket++) {
            for (let h = lo; h <= hi; h++) {
              const c = xAgg.hcpByTheirLen![bucket * (MAX_HCP + 1) + h];
              bandTotal += c;
              if (bucket <= 1) short += c; // buckets 0–1 = ≤2 cards
            }
          }
          add(
            `| ${HCP_BAND_LABELS[band]} | ${bn} | ${pct(maj3, bn)} | ${pct(maj4, bn)} | ${pct(minor2, bn)} | ${pct(short, Math.max(1, bandTotal))} |`,
          );
        }
        add();
      }
      // Ready-to-paste dealer filters for the top actions.
      const filterLines: string[] = [];
      for (const action of nonPass.slice(0, 6)) {
        const agg = sumCells(cells, family, key, action, 'all', styleW);
        if (agg.n < 50) continue;
        const rule = deriveRule(family, key, action, agg);
        const extras: string[] = [];
        if (rule.balanced) extras.push('balanced');
        filterLines.push(
          `- \`${action}\` → \`${rule.filterExpr}\`${extras.length ? ` *(+ ${extras.join(', ')})*` : ''}`,
        );
      }
      if (filterLines.length > 0) {
        add('Dealer filters (paste into the custom filter box; derived from the data):');
        add();
        for (const l of filterLines) add(l);
        add();
      }
    }
  };

  // Dynamic key lists: every opening faced with enough data, ranked 1C…4S.
  const keysWithData = (family: string, minN: number): string[] => {
    const byKey = new Map<string, number>();
    for (const [k, agg] of cells.map) {
      const parts = k.split('|');
      if (parts[0] !== family) continue;
      const key = parts.slice(1, parts.length - 3).join('|');
      byKey.set(key, (byKey.get(key) ?? 0) + agg.n);
    }
    return [...byKey.entries()]
      .filter(([key, n]) => {
        const open = key.split('|')[0];
        return n >= minN && isBid(open) && bidRank(open) <= bidRank('4S');
      })
      .map(([key]) => key)
      .sort((a, b) => bidRank(a.split('|')[0]) - bidRank(b.split('|')[0]));
  };

  competitiveSection(
    'Direct seat: RHO opens, we act — (opening) ?',
    'overOpen',
    keysWithData('overOpen', 150),
    (key) => (key === '1C' ? ['nat', 'short'] : key === '1D' ? ['nat'] : key === '2D' ? ['weak'] : 'all'),
    'Every opening 1C–4S with enough data. For 1C/1D the tables face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately below); (2D) faces a weak 2D. ' +
      'Suit actions over (1NT) are largely conventional — 2C = both majors, 2D = one long major (multi-style), 2M = the major + a minor — and their derived rules detect those shapes from the hands instead of reading the bid at face value.',
  );

  // How often does the direct seat act, by what the opening really is?
  add('## Action rates: how the opening’s meaning changes the direct seat');
  add();
  add('Share of direct-seat decisions when RHO opens. Raw rates are confounded by');
  add('strength depletion — a strong 1C means opener holds 16+, so the seats behind');
  add('hold less — so the second table fixes the acting hand’s own HCP band.');
  add();
  {
    const rateRows: Array<[string, string, string[] | 'all']> = [
      ['1C natural (3+)', '1C', ['nat']],
      ['1C short (2+)', '1C', ['short']],
      ['1C strong', '1C', ['strong']],
      ['1C Polish', '1C', ['polish']],
      ['1D natural', '1D', ['nat']],
      ['1D nebulous', '1D', ['neb']],
      ['1H (any)', '1H', 'all'],
      ['1S (any)', '1S', 'all'],
    ];
    add('| opening faced | n | pass | X | suit bid | NT | any action |');
    add('|---|---|---|---|---|---|---|');
    // Per row also collect pass/act HCP hists for the fixed-strength table.
    const actByHcp: Array<[string, Uint32Array, Uint32Array]> = []; // label, actHist, totalHist
    for (const [label, key, sw] of rateRows) {
      const total = sliceTotal(totals, 'overOpen', key, 'all', sw);
      if (total < 200) continue;
      let passN = 0;
      let xN = 0;
      let suitN = 0;
      let ntN = 0;
      const actHist = new Uint32Array(MAX_HCP + 1);
      const totalHist = new Uint32Array(MAX_HCP + 1);
      for (const action of actionsFor(cells, 'overOpen', key)) {
        const agg = sumCells(cells, 'overOpen', key, action, 'all', sw);
        for (let h = 0; h <= MAX_HCP; h++) {
          totalHist[h] += agg.hcpHist[h];
          if (action !== 'P') actHist[h] += agg.hcpHist[h];
        }
        if (action === 'P') passN += agg.n;
        else if (action === 'X') xN += agg.n;
        else if (isBid(action) && bidParts(action).strainIdx < 4) suitN += agg.n;
        else if (isBid(action)) ntN += agg.n;
      }
      actByHcp.push([label, actHist, totalHist]);
      add(
        `| ${label} | ${total} | ${pct(passN, total)} | ${pct(xN, total)} | ${pct(suitN, total)} | ${pct(ntN, total)} | ${pct(total - passN, total)} |`,
      );
    }
    add();
    add('Action rate at fixed own strength (the fair comparison):');
    add();
    const bands: Array<[string, number, number]> = [
      ['6–8', 6, 8],
      ['9–11', 9, 11],
      ['12–14', 12, 14],
      ['15+', 15, MAX_HCP],
    ];
    add(`| opening faced | ${bands.map(([l]) => l + ' HCP').join(' | ')} |`);
    add('|---|---|---|---|---|');
    for (const [label, actHist, totalHist] of actByHcp) {
      const rateCells = bands.map(([, lo, hi]) => {
        let act = 0;
        let tot = 0;
        for (let h = lo; h <= hi; h++) {
          act += actHist[h];
          tot += totalHist[h];
        }
        return tot < 50 ? '—' : pct(act, tot);
      });
      add(`| ${label} | ${rateCells.join(' | ')} |`);
    }
    add();
  }

  // Strong 1C faced.
  add('### (1C = strong, Precision-style) ? — for comparison');
  add();
  add('| action | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |');
  add('|---|---|---|---|---|');
  for (const action of actionsFor(cells, 'overOpen', '1C')) {
    const agg = sumCells(cells, 'overOpen', '1C', action, 'all', ['strong']);
    if (agg.n < 25) continue;
    const suitIdx = isBid(action) ? bidParts(action).strainIdx : 4;
    add(
      `| ${action} | ${agg.n} | ${fmtStats(agg)} | ${suitIdx < 4 ? fmtDist(agg.lenHist[suitIdx]) : '—'} | ${suitIdx < 4 ? fmtTxi(agg) : '—'} |`,
    );
  }
  add();

  competitiveSection(
    'Balancing seat: (opening) P (P) ?',
    'balance',
    keysWithData('balance', 80),
    (key) => (key === '1C' ? ['nat', 'short'] : key === '1D' ? ['nat'] : 'all'),
    'Includes balancing over weak twos and preempts — the classic "protect with less" seat.',
  );

  // Natural-style filter for contexts whose key starts with an opening bid.
  const naturalOpener = (key: string): string[] | 'all' => {
    const open = key.split('|')[0];
    return open === '1C' ? ['nat', 'short'] : open === '1D' ? ['nat'] : 'all';
  };

  // For 1C contexts in the RESPONSE families, cells are tagged by the
  // responder's treatment (std/xfer/unkresp), not the opening style.
  const respStyleFor = (key: string): string[] | 'all' => {
    const open = key.split('|')[0];
    return open === '1C' ? ['std'] : open === '1D' ? ['nat'] : 'all';
  };

  competitiveSection(
    'Responding after interference: partner opens, RHO acts',
    'respInterf',
    [
      '1C|X', '1D|X', '1H|X', '1S|X',
      '1C|1S', '1D|1S', '1H|1S',
      '1C|1H', '1D|1H',
      '1S|2H', '1H|2D', '1S|2D', '1H|2C', '1S|2C', '1D|2C',
      '1NT|X',
    ],
    respStyleFor,
    'Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C contexts show STANDARD responders (transfer-response pairs are tabulated separately below); 1D contexts use natural openers. ' +
      'After 1M (X) much of the field plays transfers / graded raises (2M−1 constructive, 2M weak or vice versa), so read the **partner\'s suit** column: when most hands hold 3+ support, the bid is a raise in disguise and its derived rule keys on support + strength band, not the named suit.',
  );

  competitiveSection(
    'Transfer responses over interference: 1C (…) ? by transfer-walsh pairs',
    'respInterf',
    ['1C|X', '1C|1D', '1C|1H'],
    () => ['xfer'],
    'Pairs whose 1C responses are transfers keep them on over a double or 1D overcall: X/1D = hearts, 1H = spades, 1S = no major. The derived rules key on the suit actually held.',
    ' — transfer responders',
  );

  competitiveSection(
    'Advancing partner’s direct action: (1x) act (…) ?',
    'advance',
    [
      '1C|1H|P', '1C|1S|P', '1D|1H|P', '1D|1S|P', '1H|1S|P', '1H|2C|P', '1S|2C|P', '1S|2H|P',
      '1C|X|P', '1D|X|P', '1H|X|P', '1S|X|P',
      '1H|X|2H', '1S|X|2S',
    ],
    naturalOpener,
    'Includes advances of overcalls and of takeout doubles (partner doubled, RHO passed or raised). 1C/1D contexts face natural openers only.',
  );

  competitiveSection(
    'Uncontested responses: 1x (P) ?',
    'resp',
    ['1C', '1D', '1H', '1S', '1NT'],
    (key) =>
      key === '1C' ? ['std'] : key === '1D' ? ['nat'] : key === '1NT' ? ['strong'] : ['nat'],
    'Partner opened (natural style), RHO passed. Responder ranges. The 1C row shows STANDARD responders; transfer-walsh pairs (1D = ♥, 1H = ♠, 1S = no-major NT-ish) are tabulated separately below.',
  );

  competitiveSection(
    'Transfer responses to 1C: 1C (P) ? by transfer-walsh pairs',
    'resp',
    ['1C'],
    () => ['xfer'],
    'Detected per partnership from the hands (4+ of the next suit in essentially every 1D/1H response). The derived rules key on the suit actually shown: 1D = hearts, 1H = spades. The field’s 1S is multi-way — see the decision matrices below for its components.',
    ' — transfer responders',
  );

  // --- reverse-engineered decision matrices for the 1C complex
  add('## Reverse-engineering the 1C complex: what does each bid show?');
  add();
  add('Single 1C-auction bids are multi-way (a transfer-walsh 1S = weak no-major OR');
  add('GF balanced OR GF with a minor; 1C (1D) X may be 4-4 majors or just hearts), so');
  add('face-value stats can’t isolate hand types. These matrices invert the question:');
  add('for each **hand type** the responder can hold, what did they actually bid?');
  add('Rows are mutually exclusive hand types, cells are P(action | hand type) as %.');
  add('Read the ambiguity off the table: the `4♠ only` and `4-4 majors` rows show');
  add('whether X/1D carries spades, and the `no 4M` rows show where the NT-ish and');
  add('GF hands route. (Next steps: the same inversion per partnership, and');
  add('cross-checking against the published convention cards.)');
  add();
  {
    const matrixContexts: Array<[string, string, string]> = [
      ['resp', '1C', '1C (P) ?'],
      ['respInterf', '1C|X', '1C (X) ?'],
      ['respInterf', '1C|1D', '1C (1D) ?'],
    ];
    for (const [group, groupLabel] of [
      ['std', 'standard responders'],
      ['xfer', 'transfer-walsh responders'],
    ] as const) {
      for (const [family, key, ctxLabel] of matrixContexts) {
        const actions = actionsFor(cells, family, key);
        if (actions.length === 0) continue;
        // Per-action aggs restricted to this responder group.
        const perAction = actions
          .map((a) => [a, sumCells(cells, family, key, a, 'all', [group])] as const)
          .filter(([, agg]) => agg.n > 0);
        const totalN = perAction.reduce((s, [, agg]) => s + agg.n, 0);
        if (totalN < 200) continue;
        // Column set: most frequent actions, the rest lumped as "other".
        const cols = perAction
          .slice()
          .sort((a, b) => b[1].n - a[1].n)
          .slice(0, 7)
          .map(([a]) => a);
        add(`### ${ctxLabel} — ${groupLabel}`);
        add();
        add(`| hand type | n | ${cols.join(' | ')} | other |`);
        add(`|---|---|${cols.map(() => '---').join('|')}|---|`);
        for (let ti = 0; ti < RESP_TYPES.length; ti++) {
          let typeN = 0;
          for (const [, agg] of perAction) typeN += agg.respTypeHist[ti];
          if (typeN < 25) continue;
          const cellsTxt = cols.map((a) => {
            const agg = perAction.find(([act]) => act === a)![1];
            const p = Math.round((100 * agg.respTypeHist[ti]) / typeN);
            return p >= 1 ? `${p}%` : '·';
          });
          let inCols = 0;
          for (const a of cols) inCols += perAction.find(([act]) => act === a)![1].respTypeHist[ti];
          const otherP = Math.round((100 * (typeN - inCols)) / typeN);
          add(`| ${RESP_TYPES[ti]} | ${typeN} | ${cellsTxt.join(' | ')} | ${otherP >= 1 ? `${otherP}%` : '·'} |`);
        }
        add();
      }
    }
  }

  // --- book comparison
  add('## Book vs field');
  add();
  add('"Book" is the SAYC/2-over-1 teaching range (ACBL SAYC card/booklet). "Field" is');
  add('this dataset: p5–p95 (median). The field is systematically lighter than the book');
  add('at the bottom of ranges, and vulnerability is the biggest modifier for preempts.');
  add();
  add('| context | book | field |');
  add('|---|---|---|');
  {
    const sumSeats = (bid: string, seats: string[], stylesW: string[] | 'all'): Agg => {
      const out = new Agg();
      for (const s of seats) out.mergeFrom(stat('open', s, bid, stylesW));
      return out;
    };
    const s12 = ['seat1', 'seat2'];
    const rows: Array<[string, string, Agg]> = [
      ['1M opening (seats 1–2)', '12–21 (light 11s common in practice)', (() => {
        const m = new Agg();
        m.mergeFrom(sumSeats('1H', s12, ['nat']));
        m.mergeFrom(sumSeats('1S', s12, ['nat']));
        return m;
      })()],
      ['1NT opening (strong-NT pairs)', '15–17', sumSeats('1NT', [...s12, 'seat3', 'seat4'], ['strong'])],
      ['2NT opening', '20–21', sumSeats('2NT', [...s12, 'seat3', 'seat4'], ['nat'])],
      ['weak 2S (seats 1–3)', '5–11, 6-card suit', sumSeats('2S', [...s12, 'seat3'], ['nat'])],
      ['1-level overcall (1C) 1H', '8–16 (down to ~8)', stat('overOpen', '1C', '1H', ['nat', 'short'])],
      ['2-level overcall (1S) 2H', '10–17ish, good suit', stat('overOpen', '1S', '2H', 'all')],
      ['1NT overcall (1H) 1NT', '15–18', stat('overOpen', '1H', '1NT', 'all')],
      ['takeout double (1S) X', 'opening values (12+) or shape', stat('overOpen', '1S', 'X', 'all')],
      ['weak jump overcall (1C) 2H', '~6–10, 6-card suit', stat('overOpen', '1C', '2H', ['nat', 'short'])],
      ['Michaels (1H) 2H', '8–12 or 16+, 5-5', stat('overOpen', '1H', '2H', 'all')],
      ['unusual 2NT (1S) 2NT', 'weak or 17+, 5-5 minors', stat('overOpen', '1S', '2NT', 'all')],
      ['negative double 1S (2H) X', '7+ (level-adjusted)', stat('respInterf', '1S|2H', 'X', 'all')],
      ['redouble 1C (X) XX', '10+', stat('respInterf', '1C|X', 'XX', ['nat', 'short'])],
      ['new suit response 1C (P) 1H (std responders)', '6+', stat('resp', '1C', '1H', ['std'])],
    ];
    for (const [label, book, agg] of rows) {
      if (agg.n < 25) continue;
      add(`| ${label} | ${book} | ${range90(agg)}, n=${agg.n} |`);
    }
  }
  add();

  // --- dealer integration
  add('## Dealer integration');
  add();
  add('`research/bidding/bid-profiles.json` (v2) holds one record per context × action ×');
  add('(vul | "all") × (style | "all") with n≥25. Each record carries the action');
  add('frequency, full HCP histogram, per-suit length histograms/percentiles, the');
  add('HCP-by-their-length cross-tab, stopper rate, and a derived `rule`:');
  add();
  add('```json');
  {
    const agg = stat('overOpen', '1H', 'X', 'all');
    const p = toProfile('overOpen', '1H', 'X', '(1H) X', 'all', 'all', agg, null);
    const compact = {
      family: p.family, key: p.key, action: p.action, label: p.label,
      n: p.n,
      hcp: { ...p.hcp, hist: '…' },
      suitLen: '… per-suit percentiles + histograms …',
      hcpByTheirLen: p.hcpByTheirLen,
      rule: p.rule,
    };
    add(JSON.stringify(compact, null, 2));
  }
  add('```');
  add();
  add('The `rule` is the integration contract:');
  add();
  add('- `rule.filterExpr` pastes directly into the dealer’s per-seat **custom filter**');
  add('  box (the expression language in src/engine/filter.ts) — every emitted');
  add('  expression is compile-checked against the real engine during generation.');
  add('- Doubles carry two branches: a support/shape branch below the strong');
  add('  threshold, plus a shape-free strength branch (very strong doubles are real');
  add('  and must stay in the filter).');
  add('- Overcalls split their-suit shortage (lighter HCP floor) from length');
  add('  (sounder), matching the observed gradient.');
  add('- Suit quality uses `top(x,5)` (A/K/Q/J/T count): a floor everyone meets plus a');
  add('  stricter bar that binds only below 11 HCP — sound values excuse a moderate');
  add('  suit, a light action needs the suit to carry it.');
  add('- Conventional actions are detected, not assumed: suit bids over (1NT) derive');
  add('  as both-majors / one-long-major / long-minor shapes when that is what the');
  add('  field holds, and 1M (X) responses that are raises in disguise (transfers,');
  add('  graded raises) key on support for partner’s major.');
  add('- `rule.balanced` isn’t expressible in the filter language — set the seat’s');
  add('  Balanced checkbox alongside the expression.');
  add('- To deal a whole auction start (e.g. West opens 1H, North doubles), apply the');
  add('  opening profile’s rule to one seat and the action profile’s rule to the');
  add('  next; generate-and-test handles the joint constraint.');
  add();
  add('The histograms are retained so stricter (p10–p90) or looser (min–max) cuts can');
  add('be derived without re-running the study.');
  add();

  add('## Files');
  add();
  add('- `research/bidding/bid-profiles.json` — machine-readable profiles (v2): every');
  add('  context×action with n≥25, overall + per-vul + per-style, each with action');
  add('  frequency, HCP histogram/percentiles, per-suit length histograms, the');
  add('  their-suit cross-tab, and a derived `rule` with a compile-checked `filterExpr`.');
  add('- Rules map onto the dealer’s `HandConstraint` (src/engine/constraints.ts):');
  add('  `filterExpr` → custom filter box, `balanced` → the Balanced toggle.');
  add('- Profiles also cover families not tabulated above (e.g. sandwich-seat actions');
  add('  `(1C) P (1S) ?`) — filter by `family`.');
  add();
  return L.join('\n') + '\n';
}
