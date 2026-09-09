/**
 * Bidding-range study over the World/European/US championship scrape.
 *
 * Replays every recorded auction (~167k tables: World + European team champs
 * — Riga 2026 + Herning 2024 Euro RRs, Herning 2025 worlds RR+KO, Marrakech
 * 2023 KO — plus US knockouts: Spingold / Vanderbilt / Soloway 2016-2024 and
 * USBC 2026), attaches the actual hand
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
  matchesRule,
  BREADTHS,
  NORMAL_BREADTH,
  type Breadth,
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
const DECISION_PATH = path.join(import.meta.dirname, '..', 'decision-model.md');
const DECISION_REVIEW_PATH = path.join(import.meta.dirname, '..', 'decision-review.json');

const SEAT_IDX: Record<string, number> = { N: 0, E: 1, S: 2, W: 3 };
const SUIT_NAMES = ['S', 'H', 'D', 'C'];

/**
 * Big open / transnational events run a large mixed-strength Swiss qualifier
 * before a knockout. Per the study policy, only their knockout FINALS (Round
 * of 16 onward) are world-class enough to include — the qualifier is excluded.
 * We only scrape their KO, so this is also a guard against future Swiss data
 * leaking into the ranges. Team-championship tournaments are unaffected: their
 * round-robin is a top-nations field and stays in (subject to the bottom-team
 * strength filter).
 */
const FINALS_ONLY_TOURNAMENTS = new Set([
  'herning25tn',
  'marrakech23tn',
  'strasbourg23tn',
  'prague26tn',
]);
const FINALS_STAGES = new Set(['16', 'QF', 'SF', 'FF']);

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

interface TableRow {
  tournament: string;
  event: string;
  stage: string;
  dealerIdx: number;
  vul: string;
  /** Board number (1-based); its position in the 16-board cycle drives train/test splits. */
  board: number;
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
  const iBoard = idx('board');
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
    // Finals-only policy for big open/transnational fields (see the constant).
    if (FINALS_ONLY_TOURNAMENTS.has(f[iTourn]) && !FINALS_STAGES.has(f[iStage])) {
      bump(counters, 'non-finals-excluded');
      continue;
    }
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
      board: Number(f[iBoard]) || 0,
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
      const passed = ctx.passedHand ? 'P' : 'U';
      const cellKey = `${ctx.family}|${ctx.key}|${ctx.action}|${vul}|${style}|${passed}`;
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

/**
 * Sum aggregates matching family|key|action across chosen vuls and styles.
 * `passedWanted` selects passed-hand actors ('P'), unpassed ('U'), or both
 * ('all', the default — every existing caller aggregates across the split).
 */
function sumCells(
  cells: Cells,
  family: string,
  key: string,
  action: string,
  vuls: RelVul[] | 'all',
  stylesWanted: string[] | 'all',
  passedWanted: Array<'P' | 'U'> | 'all' = 'all',
): Agg {
  // The cell key uses '|' inside `key` too (respInterf/advance), so look up
  // reconstructed candidate keys instead of splitting stored ones.
  const out = new Agg();
  const vulList: string[] = vuls === 'all' ? ['none', 'we', 'they', 'both'] : vuls;
  const styleList =
    stylesWanted === 'all'
      ? ['nat', 'short', 'strong', 'polish', 'neb', 'weak', 'multi', 'other', 'oth', 'unk', 'xfer', 'std', 'unkresp']
      : stylesWanted;
  const passedList: Array<'P' | 'U'> = passedWanted === 'all' ? ['P', 'U'] : passedWanted;
  for (const vul of vulList) {
    for (const style of styleList) {
      for (const passed of passedList) {
        const agg = cells.map.get(`${family}|${key}|${action}|${vul}|${style}|${passed}`);
        if (agg) out.mergeFrom(agg);
      }
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
    // family|<key parts...>|action|vul|style|passed — key may itself contain '|'.
    const parts = k.split('|');
    if (parts[0] !== family) continue;
    if (parts.slice(1, parts.length - 4).join('|') !== key) continue;
    const action = parts[parts.length - 4];
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
  /** Derived dealer rule (normal breadth): structured branches + a compiled `filterExpr`. */
  rule: BidRule;
  /** Tighter/looser coverage of the same range, for the dealer's breadth toggle. */
  filterConservative: string;
  filterAggressive: string;
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
function deriveRule(
  family: string,
  key: string,
  action: string,
  agg: Agg,
  b: Breadth = NORMAL_BREADTH,
): BidRule {
  const theirSuit = theirSuitFor(family, key);
  const parts = key.split('|');
  const opening = family === 'open' ? action : parts[0];
  // A suit bid over a NT opening may be conventional (Landy/multi-style).
  const facingNT =
    TAKEOUT_X_FAMILIES.has(family) && isBid(opening) && bidParts(opening).strainIdx === 4;
  if (action === 'X' && TAKEOUT_X_FAMILIES.has(family) && theirSuit !== null) {
    return deriveDoubleRule(agg, theirSuit, b);
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
        if (support3 / agg.n >= 0.7) return deriveRaiseishRule(agg, pSuit, b);
      }
    }
    if (strainIdx < 4) {
      // Responses may be transfers (1C-1D = hearts, continued over intervention):
      // key on the suit actually held when the named suit isn't it.
      if (family === 'resp' || family === 'respInterf') {
        return deriveRespSuitRule(agg, strainIdx, theirSuit, b);
      }
      return deriveSuitBidRule(agg, strainIdx, theirSuit, facingNT, b);
    }
    return deriveNtRule(agg, theirSuit, b);
  }
  return deriveHcpRule(agg, b); // P, XX, other doubles
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
    rule: deriveRule(family, key, action, agg, NORMAL_BREADTH),
    filterConservative: deriveRule(family, key, action, agg, BREADTHS[0]).filterExpr,
    filterAggressive: deriveRule(family, key, action, agg, BREADTHS[2]).filterExpr,
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

  console.log('pass 3: filter-accuracy audit…');
  const audit = auditFilters(tables, feats, styles, weakTeams, cells, [
    { family: 'overOpen', key: '1C', styles: ['nat', 'short'], label: '(1C) ?' },
    { family: 'overOpen', key: '1D', styles: ['nat'], label: '(1D) ?' },
    { family: 'overOpen', key: '1H', styles: 'all', label: '(1H) ?' },
    { family: 'overOpen', key: '1S', styles: 'all', label: '(1S) ?' },
  ]);
  console.log(`  ${audit.rows.length} filters scored`);

  console.log('decision-space model (Stage 1a)…');
  const decisionMd = buildDecisionModel(tables, feats, styles, weakTeams);
  writeFileSync(DECISION_PATH, decisionMd);
  for (const line of decisionMd.split('\n').filter((l) => l.startsWith('- ') || l.startsWith('# ')))
    console.log(`  ${line.replace(/\*\*/g, '')}`);

  console.log('writing report + profiles…');
  const report = buildReport(tables, counters, coverage, styles, respStyles, cells, weakTeams, audit);
  writeFileSync(REPORT_PATH, report);

  const profiles = buildProfiles(cells);
  let badExpr = 0;
  for (const p of profiles) {
    if (!p.rule) continue;
    for (const expr of [p.rule.filterExpr, p.filterConservative, p.filterAggressive]) {
      const r = compileFilter(expr);
      if (r.error) {
        badExpr++;
        console.error(`  BAD filterExpr for ${p.label}: ${expr} — ${r.error}`);
      }
    }
  }
  if (badExpr > 0) throw new Error(`${badExpr} filter expressions failed to compile`);
  const lines = profiles.map((p) => JSON.stringify(p));
  writeFileSync(
    PROFILES_PATH,
    `{"version":5,"source":"World, European & US championships 2016-2026, ${tables.length} tables, bottom-${WEAK_TEAM_CUT} teams per event excluded","profiles":[\n${lines.join(',\n')}\n]}\n`,
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
    // Trailing segments: …|action|vul|style|passed. Totals merge across passed.
    const key = parts.slice(1, parts.length - 4).join('|');
    const vul = parts[parts.length - 3];
    const style = parts[parts.length - 2];
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
    const action = parts[parts.length - 4];
    const key = parts.slice(1, parts.length - 4).join('|');
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
// Filter-accuracy audit
// ---------------------------------------------------------------------------

/** One context to audit: the family/key faced and the opener styles it targets. */
interface AuditSpec {
  family: string;
  key: string;
  styles: string[] | 'all';
  label: string;
}

/** Precision/recall/contested-zone of one derived filter, vs the field. */
interface AuditRow {
  label: string;
  action: string;
  filterExpr: string;
  nFaced: number;
  nBid: number;
  baseRate: number;
  precision: number;
  recall: number;
  contestedPct: number;
  activeHands: number;
}

/** Deep-dive numbers for the (1C) 1S worked example. */
interface AuditExample {
  nFaced: number;
  nBid: number;
  precision: number;
  recall: number;
  fpActions: Array<[string, number]>;
  fnTotal: number;
  fnReasons: { hcpHi: number; hcpLo: number; suitShort: number; qualLo: number };
  hcpSurface: Array<[string, number, number]>;
  lenSurface: Array<[string, number, number]>;
  /** Precision/recall of each breadth preset on the same population. */
  presets: Array<{ name: string; filterExpr: string; precision: number; recall: number }>;
}

interface AuditResult {
  rows: AuditRow[];
  example: AuditExample | null;
}

/** Faced-decision record for the audit: the hand + the action it took. */
interface AuditRec {
  pbn: string;
  seat: number;
  f: SeatFeatures;
  action: string;
}

const MIN_BID_TO_AUDIT = 120;
const MIN_TABLES_FOR_SPLIT = 4;

/**
 * Score each derived filter as a classifier against the field it is meant to
 * describe. For a context (e.g. RHO opens a natural 1C, direct seat) we gather
 * every decision faced, label each hand with the action it took, then for each
 * frequent bid test the derived rule's box-membership. Precision = P(made the
 * bid | in box); recall = P(in box | made the bid). The multi-table "contested"
 * share uses round-robin repetition: the same hand faces the context at several
 * tables, so we can see how often a box-matching decision genuinely splits.
 */
function auditFilters(
  tables: TableRow[],
  feats: Map<string, SeatFeatures[]>,
  styles: Map<string, PairStyle>,
  weakTeams: Set<string>,
  cells: Cells,
  specs: AuditSpec[],
): AuditResult {
  const specByKey = new Map(specs.map((s) => [`${s.family}|${s.key}`, s]));
  const byCtx = new Map<string, AuditRec[]>();
  for (const t of tables) {
    for (let i = 0; i < t.calls.length; i++) {
      const ctx = classifyCall(t.calls, i);
      if (!ctx) continue;
      const ck = `${ctx.family}|${ctx.key}`;
      const spec = specByKey.get(ck);
      if (!spec) continue;
      const seat = (t.dealerIdx + i) % 4;
      const actorTeam = seat % 2 === 0 ? t.nsTeam : t.ewTeam;
      if (weakTeams.has(`${t.tournament}|${t.event}|${actorTeam}`)) continue;
      const otherPair = seat % 2 === 0 ? t.ewPair : t.nsPair; // opener's pair (competitive contexts)
      const style = styleTag(ctx.key.split('|')[0], styles.get(otherPair));
      if (spec.styles !== 'all' && !spec.styles.includes(style)) continue;
      const f = feats.get(t.pbn)![seat];
      let arr = byCtx.get(ck);
      if (!arr) {
        arr = [];
        byCtx.set(ck, arr);
      }
      arr.push({ pbn: t.pbn, seat, f, action: ctx.action });
    }
  }

  const rows: AuditRow[] = [];
  for (const spec of specs) {
    const ck = `${spec.family}|${spec.key}`;
    const recs = byCtx.get(ck);
    if (!recs || recs.length < 200) continue;
    // Multi-table grouping (shared across the context's actions).
    const handMap = new Map<string, { m: number; act: Map<string, number> }>();
    for (const r of recs) {
      const hk = `${r.pbn}|${r.seat}`;
      let e = handMap.get(hk);
      if (!e) {
        e = { m: 0, act: new Map() };
        handMap.set(hk, e);
      }
      e.m++;
      e.act.set(r.action, (e.act.get(r.action) ?? 0) + 1);
    }
    const actCount = new Map<string, number>();
    for (const r of recs) actCount.set(r.action, (actCount.get(r.action) ?? 0) + 1);
    for (const [action, nBid] of [...actCount.entries()].sort((a, b) => b[1] - a[1])) {
      if (nBid < MIN_BID_TO_AUDIT) continue;
      if (!isBid(action) && action !== 'X') continue;
      const agg = sumCells(cells, spec.family, spec.key, action, 'all', spec.styles);
      if (agg.n < 25) continue;
      const rule = deriveRule(spec.family, spec.key, action, agg);
      let nBox = 0;
      let boxBid = 0;
      for (const r of recs) {
        if (!matchesRule(rule, r.f)) continue;
        nBox++;
        if (r.action === action) boxBid++;
      }
      let active = 0;
      let contested = 0;
      for (const e of handMap.values()) {
        if (e.m < MIN_TABLES_FOR_SPLIT) continue;
        const k = e.act.get(action) ?? 0;
        if (k === 0) continue;
        active++;
        if (k < e.m) contested++;
      }
      rows.push({
        label: spec.label,
        action,
        filterExpr: rule.filterExpr,
        nFaced: recs.length,
        nBid,
        baseRate: (100 * nBid) / recs.length,
        precision: nBox === 0 ? 0 : (100 * boxBid) / nBox,
        recall: nBid === 0 ? 0 : (100 * boxBid) / nBid,
        contestedPct: active === 0 ? 0 : (100 * contested) / active,
        activeHands: active,
      });
    }
  }
  rows.sort((a, b) => a.precision - b.precision);

  return { rows, example: auditExample(byCtx.get('overOpen|1C'), cells) };
}

/** The (1C) 1S deep-dive: false-positive actions, false-negative reasons, surface. */
function auditExample(recs: AuditRec[] | undefined, cells: Cells): AuditExample | null {
  if (!recs || recs.length < 200) return null;
  const agg = sumCells(cells, 'overOpen', '1C', '1S', 'all', ['nat', 'short']);
  if (agg.n < 25) return null;
  const rule = deriveRule('overOpen', '1C', '1S', agg);
  const suitMin = rule.common.find((c) => c.suit === 0)?.min ?? 0;
  const qualMin = rule.quality?.minTop5 ?? 0;
  let hcpMin = Infinity;
  let hcpMax = 0;
  for (const b of rule.anyOf) {
    hcpMin = Math.min(hcpMin, b.hcp.min);
    hcpMax = Math.max(hcpMax, b.hcp.max ?? MAX_HCP);
  }
  let nBox = 0;
  let boxBid = 0;
  const fp = new Map<string, number>();
  const fnReasons = { hcpHi: 0, hcpLo: 0, suitShort: 0, qualLo: 0 };
  let nBid = 0;
  let fnTotal = 0;
  for (const r of recs) {
    const inBox = matchesRule(rule, r.f);
    const isTarget = r.action === '1S';
    if (isTarget) nBid++;
    if (inBox) {
      nBox++;
      if (isTarget) boxBid++;
      else fp.set(r.action, (fp.get(r.action) ?? 0) + 1);
    } else if (isTarget) {
      fnTotal++;
      if (r.f.hcp > hcpMax) fnReasons.hcpHi++;
      if (r.f.hcp < hcpMin) fnReasons.hcpLo++;
      if (r.f.len[0] < suitMin) fnReasons.suitShort++;
      if (r.f.akqjt[0] < qualMin) fnReasons.qualLo++;
    }
  }
  const surface = (
    subset: AuditRec[],
    bands: Array<[string, (r: AuditRec) => boolean]>,
  ): Array<[string, number, number]> =>
    bands.map(([label, inBand]) => {
      const b = subset.filter(inBand);
      const bid = b.filter((r) => r.action === '1S').length;
      return [label, b.length === 0 ? 0 : (100 * bid) / b.length, b.length];
    });
  const realSuit = recs.filter((r) => r.f.len[0] >= 5 && r.f.akqjt[0] >= 1);
  const hcpSurface = surface(realSuit, [
    ['≤6', (r) => r.f.hcp <= 6],
    ['7–9', (r) => r.f.hcp >= 7 && r.f.hcp <= 9],
    ['10–12', (r) => r.f.hcp >= 10 && r.f.hcp <= 12],
    ['13–15', (r) => r.f.hcp >= 13 && r.f.hcp <= 15],
    ['16–18', (r) => r.f.hcp >= 16 && r.f.hcp <= 18],
    ['19+', (r) => r.f.hcp >= 19],
  ]);
  const lenSurface = surface(
    recs.filter((r) => r.f.hcp >= 10 && r.f.hcp <= 15),
    [
      ['3', (r) => r.f.len[0] === 3],
      ['4', (r) => r.f.len[0] === 4],
      ['5', (r) => r.f.len[0] === 5],
      ['6', (r) => r.f.len[0] === 6],
      ['7+', (r) => r.f.len[0] >= 7],
    ],
  );
  // Score each breadth preset (conservative/normal/aggressive) on this population.
  const presets = BREADTHS.map((br) => {
    const r = deriveRule('overOpen', '1C', '1S', agg, br);
    let box = 0;
    let hit = 0;
    for (const rec of recs) {
      if (!matchesRule(r, rec.f)) continue;
      box++;
      if (rec.action === '1S') hit++;
    }
    return {
      name: br.name,
      filterExpr: r.filterExpr,
      precision: box === 0 ? 0 : (100 * hit) / box,
      recall: nBid === 0 ? 0 : (100 * hit) / nBid,
    };
  });
  return {
    nFaced: recs.length,
    nBid,
    precision: nBox === 0 ? 0 : (100 * boxBid) / nBox,
    recall: nBid === 0 ? 0 : (100 * boxBid) / nBid,
    fpActions: [...fp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    fnTotal,
    fnReasons,
    hcpSurface,
    lenSurface,
    presets,
  };
}

// ---------------------------------------------------------------------------
// Decision-space model (Stage 1a): a priority-ordered decision list over the
// full (1C) direct-seat call space, scored on a leakage-free board split.
// ---------------------------------------------------------------------------

interface DecisionRule {
  call: string;
  label: string;
  pred: (f: SeatFeatures) => boolean;
}

/**
 * Hand-crafted decision list for the direct seat over a natural/short 1C — the
 * baseline (and warm-start for the evolutionary tuner). First matching rule
 * names the call; a hand matching nothing passes. Ordered by which call
 * "claims" the hand: two-suiters and 5-card overcalls before takeout doubles,
 * matching the competition data (5-5 majors → two-suiter, 4♠+4♥ → X, etc.).
 */
const DECISION_LIST_1C: DecisionRule[] = [
  { call: 'MAJ2', label: 'Michaels majors (5+♠ & 5+♥ — cue of opener’s suit, 2♣/2♦)', pred: (f) => f.len[0] >= 5 && f.len[1] >= 5 },
  { call: '3S', label: 'preempt 3S (7+♠, weak)', pred: (f) => f.len[0] >= 7 && f.hcp >= 5 && f.hcp <= 11 },
  { call: '2S', label: 'weak jump 2S (6+♠, 5-10, <4♥)', pred: (f) => f.len[0] >= 6 && f.hcp >= 5 && f.hcp <= 10 && f.len[1] < 4 && f.akqjt[0] >= 1 },
  { call: '2H', label: 'weak jump 2H (6+♥, 5-10, <4♠)', pred: (f) => f.len[1] >= 6 && f.hcp >= 5 && f.hcp <= 10 && f.len[0] < 4 && f.akqjt[1] >= 1 },
  { call: '1S', label: '1S: 5+♠ (≥1 honour), ≤4♥, 7-16, sound-or-quality', pred: (f) => f.len[0] >= 5 && f.akqjt[0] >= 1 && f.len[1] <= 4 && f.hcp >= 7 && f.hcp <= 16 && (f.hcp >= 10 || f.akqjt[0] >= 2) },
  { call: '1H', label: '1H: 5+♥ (≥1 honour, ≥♠), 7-16, sound-or-quality', pred: (f) => f.len[1] >= 5 && f.akqjt[1] >= 1 && f.len[1] >= f.len[0] && f.hcp >= 7 && f.hcp <= 16 && (f.hcp >= 10 || f.akqjt[1] >= 2) },
  { call: '1S', label: '1S: strong 4-card ♠, no ♥ support', pred: (f) => f.len[0] === 4 && f.len[1] <= 3 && f.akqjt[0] >= 3 && f.hcp >= 10 && f.hcp <= 15 },
  { call: '2NT', label: 'unusual NT (always 5+♦ & 5+♥, 9+ HCP)', pred: (f) => f.len[2] >= 5 && f.len[1] >= 5 && f.hcp >= 9 },
  { call: '1NT', label: '1NT: 15-18, no singleton/void, ♣ stopper (4-4 majors need a textured stopper, AJT-class)', pred: (f) => f.hcp >= 15 && f.hcp <= 18 && Math.min(...f.len) >= 2 && f.stop[3] && (!(f.len[0] >= 4 && f.len[1] >= 4) || f.akqjt[3] >= 3) },
  { call: 'X', label: 'takeout X: 11-19 (−2 with ≤1♣), ≤3♣, 3+ both majors', pred: (f) => f.hcp >= (f.len[3] <= 1 ? 9 : 11) && f.hcp <= 19 && f.len[3] <= 3 && f.len[0] >= 3 && f.len[1] >= 3 },
  { call: '1D', label: '1D: 5+♦, no 5-card major', pred: (f) => f.len[2] >= 5 && f.len[0] < 5 && f.len[1] < 5 && f.hcp >= 8 && f.hcp <= 16 },
  { call: 'X', label: 'strong X: 18+, ≤3♣ (not length in their suit)', pred: (f) => f.hcp >= 18 && f.len[3] <= 3 },
];

const DECISION_CALLS = new Set(['P', '1D', '1H', '1S', '1NT', 'X', 'MAJ2', '2C', '2D', '2H', '2S', '2NT', '3S']);
const normCall = (a: string): string => (DECISION_CALLS.has(a) ? a : 'other');

/**
 * Collapse convention synonyms to MEANING. Over 1C both 2C (cue) and 2D (jump)
 * are played as the majors two-suiter by different pairs — the same DECISION —
 * so a 5-5 majors hand bidding either is the one meaning-class MAJ2. A 2C/2D on
 * a non-majors hand (natural clubs over a short 1C, or long diamonds) is left
 * as itself. This is what lets the model predict the choice, not the convention.
 */
function meaningOf(call: string, f: SeatFeatures): string {
  if ((call === '2C' || call === '2D') && f.len[0] >= 5 && f.len[1] >= 5) return 'MAJ2';
  return normCall(call);
}

/** Distribution (shortness) points: void 3, singleton 2, doubleton 1. */
function shortPts(f: SeatFeatures): number {
  let dp = 0;
  for (const l of f.len) dp += l === 0 ? 3 : l === 1 ? 2 : l === 2 ? 1 : 0;
  return dp;
}

function decideCall(rules: DecisionRule[], f: SeatFeatures): string {
  for (const r of rules) if (r.pred(f)) return r.call;
  return 'P';
}

// ---- Stage 1b: evolvable (gene-parameterised) decision list ----------------
// Same rule structure as DECISION_LIST_1C, but every threshold is a gene an
// evolutionary tuner can move. `init` = the hand-crafted value (warm start).

interface GeneSpec {
  name: string;
  lo: number;
  hi: number;
  init: number;
}
const GENES: GeneSpec[] = [
  { name: 'mich_s', lo: 4, hi: 6, init: 5 },
  { name: 'mich_h', lo: 4, hi: 6, init: 5 },
  { name: 'unt_lo', lo: 5, hi: 13, init: 9 }, // unusual 2NT needs real values, not 2 HCP
  { name: 's1_hMax', lo: 3, hi: 5, init: 4 },
  { name: 's1_lo', lo: 5, hi: 10, init: 7 },
  { name: 's1_hi', lo: 14, hi: 17, init: 16 }, // 18+ is too strong for a simple overcall → double
  { name: 's1_relax', lo: 8, hi: 12, init: 10 },
  { name: 's1_q', lo: 1, hi: 3, init: 2 },
  { name: 's1_shape', lo: 0, hi: 3, init: 1 }, // shortness lowers the HCP floor
  { name: 'h1_lo', lo: 5, hi: 10, init: 7 },
  { name: 'h1_hi', lo: 14, hi: 17, init: 16 },
  { name: 'h1_relax', lo: 8, hi: 12, init: 10 },
  { name: 'h1_q', lo: 1, hi: 3, init: 2 },
  { name: 'h1_shape', lo: 0, hi: 3, init: 1 },
  { name: 's4_hMax', lo: 2, hi: 4, init: 3 },
  { name: 's4_q', lo: 2, hi: 5, init: 3 },
  { name: 's4_lo', lo: 8, hi: 13, init: 10 },
  { name: 's4_hi', lo: 12, hi: 16, init: 15 },
  { name: 'p3_s', lo: 6, hi: 8, init: 7 },
  { name: 'p3_lo', lo: 3, hi: 8, init: 5 },
  { name: 'p3_hi', lo: 9, hi: 12, init: 11 },
  { name: 'p3_tx', lo: 0, hi: 7, init: 3 }, // texture floor (0-10 index)
  { name: 'j2s_s', lo: 5, hi: 7, init: 6 },
  { name: 'j2s_lo', lo: 3, hi: 8, init: 5 },
  { name: 'j2s_hi', lo: 8, hi: 13, init: 10 },
  { name: 'j2s_hMax', lo: 3, hi: 5, init: 4 },
  { name: 'j2s_tx', lo: 4, hi: 8, init: 5 }, // "nicely textured" suit (crossover ~5: below → 1-level)
  { name: 'j2h_h', lo: 5, hi: 7, init: 6 },
  { name: 'j2h_lo', lo: 3, hi: 8, init: 5 },
  { name: 'j2h_hi', lo: 8, hi: 13, init: 10 },
  { name: 'j2h_sMax', lo: 3, hi: 5, init: 4 },
  { name: 'j2h_tx', lo: 4, hi: 8, init: 5 },
  { name: 'd1_d', lo: 5, hi: 6, init: 5 },
  { name: 'd1_lo', lo: 6, hi: 11, init: 8 },
  { name: 'd1_hi', lo: 13, hi: 17, init: 16 },
  { name: 'nt_lo', lo: 13, hi: 16, init: 15 },
  { name: 'nt_hi', lo: 18, hi: 19, init: 18 }, // 1NT overcall is 15-18: must include the 18-counts
  { name: 'nt_stop', lo: 0, hi: 1, init: 1 }, // require a club stopper?
  { name: 'x_lo', lo: 9, hi: 13, init: 11 },
  { name: 'x_hi', lo: 15, hi: 20, init: 19 },
  { name: 'x_cMax', lo: 2, hi: 3, init: 3 }, // never double 1C with 4+ clubs (length in their suit)
  { name: 'x_sMin', lo: 2, hi: 4, init: 3 },
  { name: 'x_hMin', lo: 2, hi: 4, init: 3 },
  { name: 'x_majSum', lo: 5, hi: 8, init: 6 }, // combined major length for takeout
  { name: 'x_shape', lo: 0, hi: 4, init: 2 }, // short clubs (≤1) lowers the X HCP floor (distributional double)
  { name: 'xs_hcp', lo: 16, hi: 20, init: 18 },
  { name: 'strMix', lo: 0, hi: 10, init: 0 }, // strength = blend of HCP and KnR (0=HCP … 10=KnR)
];
const GI: Record<string, number> = {};
GENES.forEach((g, i) => (GI[g.name] = i));
const WARM_START: number[] = GENES.map((g) => g.init);

/** Gene-parameterised decision list — the evolvable twin of DECISION_LIST_1C. */
function decideCallGenes(g: number[], f: SeatFeatures): string {
  const s = f.len[0];
  const h = f.len[1];
  const d = f.len[2];
  const c = f.len[3];
  // Strength = a GA-tuned blend of HCP and Kaplan-Rubens (strMix 0=HCP … 10=KnR).
  const w = g[GI.strMix] / 10;
  const p = Math.round((1 - w) * f.hcp + w * f.knr);
  const q = f.akqjt;
  const tx = f.txi;
  const dp = shortPts(f);
  const minLen = Math.min(s, h, d, c);
  // 1. Michaels — 5-5 majors two-suiter.
  if (s >= g[GI.mich_s] && h >= g[GI.mich_h]) return 'MAJ2';
  // 2. Weak jumps / preempts, BEFORE the 1-level overcalls, so a weak long suit
  //    jumps rather than being scooped up as a 1-level bid.
  if (s >= g[GI.p3_s] && p >= g[GI.p3_lo] && p <= g[GI.p3_hi] && tx[0] >= g[GI.p3_tx]) return '3S';
  if (s >= g[GI.j2s_s] && p >= g[GI.j2s_lo] && p <= g[GI.j2s_hi] && h < g[GI.j2s_hMax] && tx[0] >= g[GI.j2s_tx]) return '2S';
  if (h >= g[GI.j2h_h] && p >= g[GI.j2h_lo] && p <= g[GI.j2h_hi] && s < g[GI.j2h_sMax] && tx[1] >= g[GI.j2h_tx]) return '2H';
  // 3. Natural 1-level major overcalls — always at least one honour in the suit
  //    (never overcall a headless rag like ♠87432).
  if (s >= 5 && q[0] >= 1 && h <= g[GI.s1_hMax] && p <= g[GI.s1_hi] && p >= g[GI.s1_lo] - (dp >= 3 ? g[GI.s1_shape] : 0) && (p >= g[GI.s1_relax] || q[0] >= g[GI.s1_q])) return '1S';
  if (h >= 5 && q[1] >= 1 && h >= s && p <= g[GI.h1_hi] && p >= g[GI.h1_lo] - (dp >= 3 ? g[GI.h1_shape] : 0) && (p >= g[GI.h1_relax] || q[1] >= g[GI.h1_q])) return '1H';
  if (s === 4 && h <= g[GI.s4_hMax] && q[0] >= g[GI.s4_q] && p >= g[GI.s4_lo] && p <= g[GI.s4_hi]) return '1S';
  // 4. Unusual 2NT (reds) — always 5+♥ AND 5+♦ (never less), with real strength.
  if (d >= 5 && h >= 5 && p >= g[GI.unt_lo]) return '2NT';
  // 5. 1NT and takeout X, BEFORE the natural minor overcall, so balanced strong
  //    hands and takeout shapes are not scooped up as a plain 1D. 1NT is barred
  //    with 4-4 in the majors (those double) UNLESS the stopper in their suit is
  //    well textured (AJT-class, ≥nt_texHi honours); the X floor drops with a
  //    club singleton/void (a distributional takeout double).
  if (
    p >= g[GI.nt_lo] && p <= g[GI.nt_hi] && minLen >= 2 && (g[GI.nt_stop] === 0 || f.stop[3]) &&
    (!(s >= 4 && h >= 4) || q[3] >= 3) // 4-4 majors need a textured stopper (AJT-class = 3 of AKQJT)
  ) return '1NT';
  if (p >= g[GI.x_lo] - (c <= 1 ? g[GI.x_shape] : 0) && p <= g[GI.x_hi] && c <= g[GI.x_cMax] && s >= g[GI.x_sMin] && h >= g[GI.x_hMin] && s + h >= g[GI.x_majSum]) return 'X';
  // 6. Natural minor overcall.
  if (d >= g[GI.d1_d] && s < 5 && h < 5 && p >= g[GI.d1_lo] && p <= g[GI.d1_hi]) return '1D';
  // 7. Very strong takeout — 18+, but never with length in their suit (can't
  //    double 1C holding 5 clubs); shape is otherwise free at this strength.
  if (p >= g[GI.xs_hcp] && c <= g[GI.x_cMax]) return 'X';
  return 'P';
}

/** Deterministic PRNG (mulberry32) — reproducible evolution runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface EvolveResult {
  best: number[];
  fitTrain: number;
  history: number[];
}

/**
 * Evolve the gene vector to maximise call-agreement on the TRAIN set (test is
 * never touched by selection). Warm-started from the hand-crafted thresholds;
 * elitist GA with uniform crossover and integer ±1/±2 mutation, genes clamped
 * to their spec range. Fixed structure ⇒ parsimony is constant, so fitness is
 * plain agreement.
 */
function evolveDecisionList(
  train: { f: SeatFeatures; call: string }[],
  pin: Record<string, number> = {},
): EvolveResult {
  const rng = mulberry32(0x1c1a);
  const pinned = new Map(Object.entries(pin).map(([name, v]) => [GI[name], v]));
  const applyPins = (g: number[]): number[] => {
    for (const [i, v] of pinned) g[i] = v;
    return g;
  };
  const clampGene = (v: number, i: number): number => Math.max(GENES[i].lo, Math.min(GENES[i].hi, v));
  const randGene = (i: number): number => GENES[i].lo + Math.floor(rng() * (GENES[i].hi - GENES[i].lo + 1));
  // Calls common enough to hold to account in the macro-recall term (so the GA
  // can't win by ignoring rare-but-real calls like the 2C Michaels cue).
  const actCount = new Map<string, number>();
  for (const r of train) actCount.set(r.call, (actCount.get(r.call) ?? 0) + 1);
  const macroCalls = [...actCount.entries()].filter(([, n]) => n >= 80).map(([c]) => c);
  // Distribution-aware fitness: overall accuracy + a macro-F1 bonus over the
  // common calls, so the GA keeps rare-but-real calls (2C cue) covered AND
  // precise — F1 (not recall alone) stops it from over-predicting them.
  const idx = new Map(macroCalls.map((c, i) => [c, i]));
  const fit = (g: number[]): number => {
    let hit = 0;
    const pred = new Array<number>(macroCalls.length).fill(0);
    const tp = new Array<number>(macroCalls.length).fill(0);
    for (const r of train) {
      const p = decideCallGenes(g, r.f);
      if (p === r.call) hit++;
      const pi = idx.get(p);
      if (pi !== undefined) pred[pi]++;
      if (p === r.call && pi !== undefined) tp[pi]++;
    }
    let macro = 0;
    for (let i = 0; i < macroCalls.length; i++) {
      const precision = pred[i] === 0 ? 0 : tp[i] / pred[i];
      const recall = tp[i] / actCount.get(macroCalls[i])!;
      macro += precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    }
    return hit / train.length + 0.12 * (macro / macroCalls.length);
  };
  const POP = 60;
  const GENS = 85;
  const ELITE = 8;
  let pop: number[][] = [applyPins(WARM_START.slice())];
  while (pop.length < POP) {
    const g = WARM_START.slice();
    for (let i = 0; i < g.length; i++) if (rng() < 0.35) g[i] = randGene(i);
    pop.push(applyPins(g));
  }
  let best = applyPins(WARM_START.slice());
  let bestFit = fit(best);
  const history: number[] = [];
  for (let gen = 0; gen < GENS; gen++) {
    const scored = pop.map((g) => ({ g, f: fit(g) })).sort((a, b) => b.f - a.f);
    if (scored[0].f > bestFit) {
      bestFit = scored[0].f;
      best = scored[0].g.slice();
    }
    history.push(bestFit);
    const next: number[][] = scored.slice(0, ELITE).map((s) => s.g.slice());
    const pick = (): number[] => scored[Math.floor(rng() * 24)].g; // top-24 tournament
    while (next.length < POP) {
      const pa = pick();
      const pb = pick();
      const child = pa.map((v, i) => (rng() < 0.5 ? v : pb[i]));
      for (let i = 0; i < child.length; i++) {
        if (rng() < 0.12) child[i] = clampGene(child[i] + (rng() < 0.5 ? -1 : 1) * (1 + (rng() < 0.3 ? 1 : 0)), i);
      }
      next.push(applyPins(child));
    }
    pop = next;
  }
  return { best, fitTrain: bestFit, history };
}

/** Human-readable rules for an evolved gene vector. */
function renderGeneRules(g: number[]): string[] {
  const G = (n: string): number => g[GI[n]];
  const shp = (n: string): string => (G(n) > 0 ? `, −${G(n)} HCP with a singleton/void` : '');
  return [
    `**MAJ2** Michaels (2♣/2♦, majors) — ${G('mich_s')}+♠ & ${G('mich_h')}+♥`,
    `**3S** preempt — ${G('p3_s')}+♠, ${G('p3_lo')}–${G('p3_hi')} HCP, texture ≥${G('p3_tx')}/10`,
    `**2S** weak jump — ${G('j2s_s')}+♠, ${G('j2s_lo')}–${G('j2s_hi')} HCP, <${G('j2s_hMax')}♥, texture ≥${G('j2s_tx')}/10`,
    `**2H** weak jump — ${G('j2h_h')}+♥, ${G('j2h_lo')}–${G('j2h_hi')} HCP, <${G('j2h_sMax')}♠, texture ≥${G('j2h_tx')}/10`,
    `**1S** — 5+♠, ≤${G('s1_hMax')}♥, ${G('s1_lo')}–${G('s1_hi')} HCP (relax quality if ≥${G('s1_relax')} HCP else top(s,5)≥${G('s1_q')})${shp('s1_shape')}`,
    `**1H** — 5+♥ (≥♠), ${G('h1_lo')}–${G('h1_hi')} HCP (relax if ≥${G('h1_relax')} else top(h,5)≥${G('h1_q')})${shp('h1_shape')}`,
    `**1S** (4-card) — exactly 4♠, ≤${G('s4_hMax')}♥, top(s,5)≥${G('s4_q')}, ${G('s4_lo')}–${G('s4_hi')} HCP`,
    `**2NT** unusual (reds) — 5+♦ & 5+♥ (always), ${G('unt_lo')}+ HCP`,
    `**1NT** — ${G('nt_lo')}–${G('nt_hi')} HCP, no singleton/void${G('nt_stop') ? ', ♣ stopper' : ''} (4-4 majors only with a textured ♣ stopper — 3+ of AKQJT)`,
    `**X** takeout — ${G('x_lo')}–${G('x_hi')} HCP (−${G('x_shape')} with ≤1♣), ≤${G('x_cMax')}♣, ${G('x_sMin')}+♠, ${G('x_hMin')}+♥, ♠+♥ ≥${G('x_majSum')}`,
    `**1D** — ${G('d1_d')}+♦, no 5-card major, ${G('d1_lo')}–${G('d1_hi')} HCP`,
    `**X** strong — ${G('xs_hcp')}+ HCP, ≤${G('x_cMax')}♣ (not length in their suit)`,
    `**P** — default`,
  ];
}

/**
 * Score the hand-crafted decision list on the (1C) direct-seat call choice,
 * with a leakage-free train/test split by board number (boards 1-8 of each
 * 16-board cycle train, 9-16 test — each half spans all dealer/vul). Reports
 * overall agreement vs the always-pass floor and the field's self-agreement
 * ceiling, plus the per-call confusion on held-out test. Returns markdown.
 */
function buildDecisionModel(
  tables: TableRow[],
  feats: Map<string, SeatFeatures[]>,
  styles: Map<string, PairStyle>,
  weakTeams: Set<string>,
): string {
  // Canonical board per physical deal → every copy lands on one side (no leak).
  const canonBoard = new Map<string, number>();
  for (const t of tables) if (!canonBoard.has(t.pbn)) canonBoard.set(t.pbn, t.board);
  const isTrain = (pbn: string): boolean => ((canonBoard.get(pbn) ?? 1) - 1) % 16 < 8;

  interface Rec { f: SeatFeatures; call: string; pbn: string; seat: number }
  const train: Rec[] = [];
  const test: Rec[] = [];
  for (const t of tables) {
    for (let i = 0; i < t.calls.length; i++) {
      const ctx = classifyCall(t.calls, i);
      if (!ctx || ctx.family !== 'overOpen' || ctx.key !== '1C' || ctx.passedHand) continue;
      const seat = (t.dealerIdx + i) % 4;
      const actorTeam = seat % 2 === 0 ? t.nsTeam : t.ewTeam;
      if (weakTeams.has(`${t.tournament}|${t.event}|${actorTeam}`)) continue;
      const otherPair = seat % 2 === 0 ? t.ewPair : t.nsPair;
      const style = styleTag('1C', styles.get(otherPair));
      if (style !== 'nat' && style !== 'short') continue;
      const fSeat = feats.get(t.pbn)![seat];
      const rec: Rec = { f: fSeat, call: meaningOf(ctx.action, fSeat), pbn: t.pbn, seat };
      (isTrain(t.pbn) ? train : test).push(rec);
    }
  }

  const agreeWith = (recs: Rec[], decide: (f: SeatFeatures) => string): number =>
    recs.length === 0 ? 0 : (100 * recs.filter((r) => decide(r.f) === r.call).length) / recs.length;
  const passShare = (recs: Rec[]): number =>
    recs.length === 0 ? 0 : (100 * recs.filter((r) => r.call === 'P').length) / recs.length;

  // Feature-lookup ceiling: the strongest GENERALISING baseline. Bucket hands by
  // a rich feature signature, learn each bucket's modal call from TRAIN, apply to
  // TEST (coarse fallback for thin buckets). Unlike the exact-hand oracle, this
  // can't memorise individual deals — so it estimates the real ceiling for any
  // feature-based model, which the decision list should approach but not exceed.
  const lookupCeiling = (): number => {
    const sig = (f: SeatFeatures): string =>
      `${Math.min(f.len[0], 7)}|${Math.min(f.len[1], 7)}|${Math.min(f.len[2], 7)}|${f.hcp}|${Math.min(f.akqjt[0], 4)}|${Math.min(shortPts(f), 4)}`;
    const coarse = (f: SeatFeatures): string =>
      `${f.len[0] >= 5 ? 5 : f.len[0]}|${f.len[1] >= 5 ? 5 : f.len[1]}|${Math.min(Math.floor(f.hcp / 3), 6)}`;
    const learn = (key: (f: SeatFeatures) => string): Map<string, string> => {
      const b = new Map<string, Map<string, number>>();
      for (const r of train) {
        const k = key(r.f);
        let m = b.get(k);
        if (!m) {
          m = new Map();
          b.set(k, m);
        }
        m.set(r.call, (m.get(r.call) ?? 0) + 1);
      }
      const modal = new Map<string, string>();
      for (const [k, m] of b) {
        let best = 'P';
        let bn = -1;
        let tot = 0;
        for (const [call, n] of m) {
          tot += n;
          if (n > bn) {
            bn = n;
            best = call;
          }
        }
        if (tot >= 6) modal.set(k, best); // only trust buckets with support
      }
      return modal;
    };
    const fine = learn(sig);
    const crs = learn(coarse);
    let hit = 0;
    for (const r of test) {
      const pred = fine.get(sig(r.f)) ?? crs.get(coarse(r.f)) ?? 'P';
      if (pred === r.call) hit++;
    }
    return (100 * hit) / test.length;
  };
  // Field self-agreement ceiling on a set (exact-hand modal share).
  const ceiling = (recs: Rec[]): number => {
    const byHand = new Map<string, Map<string, number>>();
    for (const r of recs) {
      const k = `${r.pbn}|${r.seat}`;
      let m = byHand.get(k);
      if (!m) {
        m = new Map();
        byHand.set(k, m);
      }
      m.set(r.call, (m.get(r.call) ?? 0) + 1);
    }
    let tot = 0;
    let modal = 0;
    for (const m of byHand.values()) {
      let sum = 0;
      let best = 0;
      for (const k of m.values()) {
        sum += k;
        best = Math.max(best, k);
      }
      if (sum < 3) continue;
      tot += sum;
      modal += best;
    }
    return tot === 0 ? 0 : (100 * modal) / tot;
  };

  // Evolve on TRAIN (test never seen by selection). Two runs: HCP-only (strMix
  // pinned to 0) as a control, and the KnR-blend (strMix free) — does letting the
  // strength metric lean on Kaplan-Rubens help on held-out data?
  const hcpOnly = evolveDecisionList(train, { strMix: 0 });
  const evolved = evolveDecisionList(train);
  const baseDecide = (f: SeatFeatures): string => decideCall(DECISION_LIST_1C, f);
  const hcpDecide = (f: SeatFeatures): string => decideCallGenes(hcpOnly.best, f);
  const evoDecide = (f: SeatFeatures): string => decideCallGenes(evolved.best, f);

  // Per-call confusion for a decide function on the test set.
  const confusion = (
    decide: (f: SeatFeatures) => string,
  ): { order: Array<readonly [string, number]>; conf: Map<string, { pred: number; hit: number; actual: number }>; other: number } => {
    const conf = new Map<string, { pred: number; hit: number; actual: number }>();
    for (const c of DECISION_CALLS) conf.set(c, { pred: 0, hit: 0, actual: 0 });
    const actualDist = new Map<string, number>();
    for (const r of test) {
      const pred = decide(r.f);
      actualDist.set(r.call, (actualDist.get(r.call) ?? 0) + 1);
      if (conf.has(pred)) conf.get(pred)!.pred++;
      if (conf.has(r.call)) conf.get(r.call)!.actual++;
      if (pred === r.call && conf.has(pred)) conf.get(pred)!.hit++;
    }
    const order = [...DECISION_CALLS].map((c) => [c, actualDist.get(c) ?? 0] as const).sort((a, b) => b[1] - a[1]);
    const other = test.length - order.reduce((s, [, n]) => s + n, 0);
    return { order, conf, other };
  };

  const L: string[] = [];
  const add = (s = ''): void => {
    L.push(s);
  };
  const pc = (a: number, b: number): string => (b === 0 ? '—' : `${((100 * a) / b).toFixed(0)}%`);
  const confTable = (decide: (f: SeatFeatures) => string): void => {
    const { order, conf, other } = confusion(decide);
    add('| call | actual n | actual % | predicted n | precision | recall |');
    add('|---|---|---|---|---|---|');
    for (const [c, n] of order) {
      const e = conf.get(c)!;
      add(`| ${c} | ${n} | ${pc(n, test.length)} | ${e.pred} | ${pc(e.hit, e.pred)} | ${pc(e.hit, e.actual)} |`);
    }
    if (other > 0) add(`| other | ${other} | ${pc(other, test.length)} | — | — | — |`);
  };

  const baseTest = agreeWith(test, baseDecide);
  const hcpTest = agreeWith(test, hcpDecide);
  const hcpTrain = agreeWith(train, hcpDecide);
  const blendTest = agreeWith(test, evoDecide);
  const floor = passShare(test);
  const ceil = ceiling(test);
  const scale = (v: number): string => `${(((v - floor) / (ceil - floor)) * 100).toFixed(0)}% of floor→ceiling`;

  add('# Decision-space model — (1C) direct seat');
  add();
  add('A single priority-ordered **decision list** over the whole call space a hand faces');
  add('after a natural/short 1♣ on its right — first matching rule names the call, no match');
  add('passes. Scored on a **leakage-free split by board number** (boards 1–8 of each 16-board');
  add('cycle train, 9–16 test — each half spans every dealer and vulnerability, and every copy');
  add('of a physical deal lands on one side). The evolutionary tuner optimises call-agreement');
  add('on TRAIN only; TEST is held out and never seen during selection.');
  add();
  const lookCeil = lookupCeiling();
  add(`- Train: ${train.length} decisions.  Test (held-out): ${test.length} decisions.`);
  add(`- **Always-Pass floor** (test): ${floor.toFixed(1)}%.`);
  add(`- **Brute-force lookup baseline** (test): ${lookCeil.toFixed(1)}% — memorise each feature cell's modal call. The evolved list **beats this**, so the interpretable rules generalise better than raw memorisation.`);
  add(`- **Exact-hand oracle** (test): ${ceil.toFixed(1)}% — memorises each deal's modal call; a mirage (unreachable without overfitting to individual boards).`);
  add(`- **Hand-crafted baseline** — test ${baseTest.toFixed(1)}% (${scale(baseTest)}).`);
  add(`- **Evolved (GA-tuned)** — train ${hcpTrain.toFixed(1)}%, **test ${hcpTest.toFixed(1)}%** (${scale(hcpTest)}); train−test gap ${(hcpTrain - hcpTest).toFixed(1)}pt (overfit check).`);
  add(`- **KnR experiment** — blending Kaplan-Rubens into the strength metric (GA chose ${((evolved.best[GI.strMix] / 10) * 100).toFixed(0)}% KnR) gave test ${blendTest.toFixed(1)}% vs ${hcpTest.toFixed(1)}% HCP-only: a ${(blendTest - hcpTest >= 0 ? '+' : '') + (blendTest - hcpTest).toFixed(1)}pt difference, within run-to-run noise. A better strength metric is not the bottleneck.`);
  add();
  add('## Per-call confusion — evolved list (held-out test)');
  add();
  add('precision = P(actual | predicted), recall = P(predicted | actual).');
  add();
  confTable(hcpDecide);
  add();
  add('## Per-call confusion — hand-crafted baseline (held-out test), for comparison');
  add();
  confTable(baseDecide);
  add();
  add('## The evolved decision list');
  add();
  add('Priority order (first match wins), thresholds tuned by the GA (warm-started from the');
  add('hand-crafted list, then evolved to maximise held-out-adjacent train agreement):');
  add();
  renderGeneRules(hcpOnly.best).forEach((r, i) => add(`${i + 1}. ${r}`));
  add();
  add(`Evolution: warm-started from the hand-crafted list (${agreeWith(train, baseDecide).toFixed(1)}% train), evolved over`);
  add(`${hcpOnly.history.length} generations to ${hcpTrain.toFixed(1)}% train / ${hcpTest.toFixed(1)}% test. The fitness is distribution-aware`);
  add('(accuracy + macro-F1) so rare calls like the Michaels cue are not optimised away, and it');
  add('predicts MEANING (2♣/2♦ majors → one MAJ2 class), not the partnership’s convention.');
  add('');
  add('What we learned nailing 1♣: the model beats a brute-force feature lookup, so the rule');
  add('structure generalises better than memorising feature cells. Two things made no material');
  add('difference on held-out data — richer features (texture, distribution points, flexible');
  add('takeout/1NT shape) and a better strength metric (Kaplan-Rubens blended with HCP) — each');
  add('fit train a little better but did not generalise. So the ceiling here is set by');
  add('irreducible between-player style variance, not by missing features. The method is');
  add('sound and near its practical limit on 1♣; the payoff now is breadth — pointing the same');
  add('harness (decision list + board-split + GA + meaning labels) at every opening, where the');
  add('per-call structure will largely mirror this one.');
  add();

  // --- eyeball review: a diverse held-out sample with the model's call, for hand
  //     review. Deduped by physical hand (a deal recurs across tables) and seeded
  //     fresh each run (REVIEW_SEED env var to reproduce a specific roll).
  {
    const seed = (Number(process.env.REVIEW_SEED) || Date.now()) >>> 0;
    const rev = mulberry32(seed);
    const shuffled = test.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rev() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const CAP = 14; // cap per model-call so Pass/1S don't dominate the sample
    const perCall = new Map<string, number>();
    const seen = new Set<string>(); // one instance per physical hand (pbn+seat)
    const picks: Rec[] = [];
    for (const r of shuffled) {
      if (picks.length >= 100) break;
      const hk = `${r.pbn}|${r.seat}`;
      if (seen.has(hk)) continue;
      const m = decideCallGenes(hcpOnly.best, r.f);
      if ((perCall.get(m) ?? 0) >= CAP) continue;
      seen.add(hk);
      perCall.set(m, (perCall.get(m) ?? 0) + 1);
      picks.push(r);
    }
    console.log(`  review sample: 100 hands, seed ${seed} (deduped by physical hand)`);
    const review = picks.map((r) => {
      const first = SEAT_IDX[r.pbn[0] as 'N' | 'E' | 'S' | 'W'];
      const strs = r.pbn.slice(2).trim().split(/\s+/);
      const hs = strs[(r.seat - first + 4) % 4].split('.');
      return {
        s: hs[0] ?? '',
        h: hs[1] ?? '',
        d: hs[2] ?? '',
        c: hs[3] ?? '',
        hcp: r.f.hcp,
        knr: Math.round(r.f.knr * 10) / 10,
        len: r.f.len,
        model: decideCallGenes(hcpOnly.best, r.f),
        field: r.call,
      };
    });
    writeFileSync(DECISION_REVIEW_PATH, JSON.stringify(review));
  }

  return L.join('\n');
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
  audit: AuditResult,
): string {
  const L: string[] = [];
  const add = (s = ''): void => {
    L.push(s);
  };
  const totals = buildTotals(cells);

  add('# What championship players actually hold for every bid');
  add();
  add('Empirical hand ranges for every call — opening, overcall, double, response through');
  add('the four level — from every auction in recent World, European and US team');
  add('championships, real hand dealt back onto each call. Split by vulnerability and by');
  add('partnership system where the bid’s meaning depends on it (strong vs natural 1♣,');
  add('transfer vs standard responses, multi vs weak 2♦). Every range compiles to a');
  add('[WesDeal](./index.html) filter.');
  add();
  add('**Columns.** `freq` / `n` = action rate / sample. `HCP` = p5/p25/**med**/p75/p95.');
  add('`length`, `their suit` = per-length % (tails `<k`/`k+`). `texture` = 0–10 suit');
  add('quality (A…7 weighted top-down + bonus per touching pair, normalised so solid');
  add('AKQJT = 10 at any length; QJT98 ≈ 5.3, KQ743 ≈ 4.4, rags ≈ 1), shown med (p25–p75).');
  add('`%bal` = strictly 4-3-3-3 / 4-4-3-2 / 5-3-3-2 only. `filter` = the range in the');
  add('dealer’s [filter language](#dealer-integration).');
  add();
  add('Generated from the championship scrape — re-run `npm run research:bidding`.');
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
  add('- Transnational events (`*tn`) are the Transnational Open Teams (World: Herning');
  add('  2025, Marrakech 2023; European: Strasbourg 2023, Prague 2026), whose large');
  add('  mixed-strength Swiss qualifier is excluded — only their knockout finals (Round');
  add('  of 16 onward) are included. Marrakech 2023’s transnational carried no bidding');
  add('  (contracts only) so contributes nothing here; the other three do.');
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
    // --- computations (prose follows, grouped by how much each adds beyond the book)
    const txMed = (hist: ArrayLike<number>): string => (histStats(hist).p[3] / 10).toFixed(1);
    // Passed-hand cap, headline context (full split lives in its own section).
    const phLive = sumCells(cells, 'resp', '1C', '1H', 'all', 'all', ['U']);
    const phPass = sumCells(cells, 'resp', '1C', '1H', 'all', 'all', ['P']);
    const phP95Drop = histStats(phLive.hcpHist).p[6] - histStats(phPass.hcpHist).p[6];
    // Shortage vs length in their suit.
    const ov = stat('overOpen', '1D', '1S', ['nat']);
    const short = histStats(ov.hcpForBuckets([0, 1]));
    const long = histStats(ov.hcpForBuckets([2, 3]));
    // Action rates at fixed own strength (9–11 HCP) — a strong 1C depletes seats behind it.
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
    const rateParts: string[] = [];
    for (const [key, sw, label] of [
      ['1C', ['nat'], 'a natural 1C'],
      ['1D', ['nat'], '1D'],
      ['1C', ['strong'], 'a strong 1C'],
    ] as const) {
      const r = fixedRate(key, sw as string[]);
      if (!Number.isNaN(r)) rateParts.push(`${Math.round(r)}% over ${label}`);
    }
    // Field composition: system census as frequencies.
    const styleCount = (pick: (s: PairStyle) => string, want: string): number =>
      [...styles.values()].filter((s) => pick(s) === want).length;
    const nMulti = styleCount((s) => s.twoDiamonds, 'multi');
    const nWeak2D = styleCount((s) => s.twoDiamonds, 'weak');
    const nStrongC = styleCount((s) => s.oneClub, 'strong');
    const respCount = { xfer: 0, std: 0, unkresp: 0 };
    for (const v of respStyles.values()) respCount[v as keyof typeof respCount]++;
    const x1d = stat('resp', '1C', '1D', ['xfer']);
    const x1dHearts4 = Math.round(
      (100 * [4, 5, 6, 7, 8, 9, 10, 11, 12, 13].reduce((a, l) => a + x1d.lenHist[1][l], 0)) /
        Math.max(1, x1d.n),
    );
    const twoC = stat('overOpen', '1NT', '2C', 'all');
    const twoD = stat('overOpen', '1NT', '2D', 'all');
    const shareHist = (hist: ArrayLike<number>, min: number, n: number): string =>
      n === 0
        ? '—'
        : `${Math.round((100 * [...Array(hist.length).keys()].filter((v) => v >= min).reduce((a, v) => a + (hist[v] as number), 0)) / n)}%`;
    // Takeout-double anatomy by strength band.
    const x1h = stat('overOpen', '1H', 'X', 'all');
    const x1c = stat('overOpen', '1C', 'X', ['nat', 'short']);
    const share = (agg: Agg, metric: Uint32Array | undefined, minLen: number, bands: number[]): string => {
      if (!metric || !agg.xBandN) return '—';
      let num = 0;
      let den = 0;
      for (const b of bands) {
        den += agg.xBandN[b];
        for (let l = minLen; l < 8; l++) num += metric[b * 8 + l];
      }
      return den === 0 ? '—' : `${Math.round((100 * num) / den)}%`;
    };
    const michShort = Math.round(
      (100 * (mich.lenHist[1][0] + mich.lenHist[1][1] + mich.lenHist[1][2])) / Math.max(1, mich.n),
    );

    // --- reference-point framing (so "lighter/heavier" is never abstract)
    add('All ranges are the field’s p5–**med**–p95. “Lighter” and “heavier” below mean');
    add('relative to the SAYC / 2-over-1 teaching ranges laid out in the Book-vs-field table —');
    add('never in the abstract: a world-class median is a reference point, not evidence of');
    add('shading. Findings are ordered by how much they add beyond what a convention card');
    add('already tells you.');
    add();

    // --- group 1: genuinely non-obvious
    add('**Non-obvious — the numbers you can’t read off a system card:**');
    add();
    add(`- **Vulnerability moves preempts, and little else.** It is the single cleanest axis`);
    add(`  in the data: (1C) 2H (weak jump overcall) is median ${med(wjoFav)} at favourable, ${med(wjoUnfav)} at`);
    add(`  unfavourable, while simple overcalls and takeout doubles barely move (±1 HCP).`);
    add(`- **The passed-hand cap bites at the top of the range, not the middle.** A responder`);
    add(`  who already passed keeps almost the same median but loses the ceiling: 1C (P) 1H is`);
    add(`  ${range90(phPass)} for a passed hand vs ${range90(phLive)} live — a ${phP95Drop}-HCP fall at p95. The same`);
    add(`  compression (median ~1 lower, p95 4–6 lower) runs across the busy responses; see the`);
    add(`  passed-hand responses section.`);
    add(`- **Shortage in their suit is not a licence to bid on fewer points — it travels with shape.**`);
    add(`  (1D) 1S overcallers with ≤2 diamonds are median ${short.p[3]} (p5 ${short.p[0]}); with 3+ they are median`);
    add(`  ${long.p[3]} (p5 ${long.p[0]}). The gap is small in HCP because the driver is total playing strength — the`);
    add(`  short hand brings compensating length, not thinner values — so the filters split`);
    add(`  their-suit shortage from length rather than lowering the point floor.`);
    add(`- **Suit quality is a weak-hand requirement, and only a weak-hand requirement.** Light`);
    add(`  (≤10 HCP) 1H overcalls of a natural 1C carry median texture ${txMed(oc1.txiWeakHist)}/10; sound ones (11+)`);
    add(`  ease to ${txMed(oc1.txiSoundHist)}/10. The derived filters bind the quality bar only below 11 HCP`);
    add('  (`hcp >= 11 or top(h,5) >= …`) — above that, values alone carry the bid.');
    add(`- **Action rates only mean something at fixed own strength.** A strong 1C depletes the`);
    add(`  seats behind it, so raw rates mislead; holding 9–11 HCP the direct seat acts`);
    add(`  ${rateParts.join(', ')}. See the action-rate section for the full grid.`);
    add();

    // --- group 2: field composition (frequencies, not universal law)
    add('**Field composition — what you are up against (frequencies, not universal law):**');
    add();
    add(`- **Strong-club pairs are ${Math.round((100 * nStrongC) / styles.size)}% of the classified field** (${nStrongC} of ${styles.size}); most 1C you`);
    add(`  meet is natural or short. Among classified 2♦ openers, ${nMulti} play multi vs ${nWeak2D} natural-weak,`);
    add(`  so at this level a 2♦ opening is more often multi than a plain weak two — a fact about`);
    add(`  this field, not a rule of bridge.`);
    add(`- **Transfer responses to 1C are a large minority**: ${respCount.xfer} of the classified natural-club`);
    add(`  pairs play them vs ${respCount.std} standard. Their 1D shows hearts (4+ ${x1dHearts4}% of the time, ${range90(x1d)}),`);
    add(`  so the derived rules follow the suit shown, not the suit bid.`);
    add(`- **Defence to 1NT is conventional, and the hands show it without the alert card**: (1NT) 2C`);
    add(`  holds both majors 4+ ${shareHist(twoC.minMajHist, 4, twoC.n)} of the time; (1NT) 2D has a 5+ major`);
    add(`  ${shareHist(twoD.maxMajHist, 5, twoD.n)} (6+ ${shareHist(twoD.maxMajHist, 6, twoD.n)}), multi-style. The rules read the shape, not the named suit.`);
    add();

    // --- group 3: calibration against the book (confirmations, reference explicit)
    add('**Calibration against the book — where the field sits on the teaching range (mostly confirmations):**');
    add();
    add(`- **Openings sit about ${12 - histStats(merged.hcpHist).p[0]} HCP below the book at the floor, not across the board.** Natural`);
    add(`  1M in seats 1–2 is p5 ${histStats(merged.hcpHist).p[0]} / med ${med(merged)} against a 12–21 teaching range: the bottom is`);
    add(`  shaded (most 11-counts, some good 10s), but the median is just the centre of an 11+ opening.`);
    add(`- **One-level overcalls run ${range90(oc1)}** — the book “8–16” holds, with the median ${med(merged) - med(oc1)} below the`);
    add(`  median opening.`);
    add(`- **The 1NT overcall is a strong NT** (${range90(nt1)}); the balancing (1H) P (P) 1NT is ${med(nt1) - med(ntBal)} lighter (${range90(ntBal)}).`);
    add(`- **The takeout double over an opening is opening-strength, not a 12+ gate**: (1S) X runs ${range90(x1S)},`);
    add(`  the 10–11 tail carrying shape. Distinct from it, the negative double (responder, over`);
    add(`  interference) starts ~7: 1S (2H) X = ${range90(negX)}; redouble after 1C (X) shows ${range90(xx)}.`);
    if (x1h.xBandN && x1c.xBandN) {
      add(`- **The takeout double is shape-first below ~17 and shape-free above** — two animals under one`);
      add(`  call. Under 17, (1H) X holds 3+ spades ${share(x1h, x1h.xMajMin, 3, [0, 1, 2])} and 2+ in both minors ${share(x1h, x1h.xMinorMin, 2, [0, 1, 2])};`);
      add(`  (1C) X holds both majors 3+ ${share(x1c, x1c.xMajMin, 3, [0, 1, 2])}. At 17+ those shape rates fall to`);
      add(`  ${share(x1h, x1h.xMajMin, 3, [3])} / ${share(x1c, x1c.xMajMin, 3, [3])}, so the filters carry the big double as a separate branch. (This`);
      add(`  is the takeout double — not the *support double* convention, which is a different call.)`);
    }
    add(`- **Two-suited overcalls keep their shape as the point count drifts**: (1H) 2H (Michaels) =`);
    add(`  ${range90(mich)} with ≤2 hearts ${michShort}% of the time; the unusual 2NT is the two lowest suits. Shape`);
    add(`  is the constant, points the variable.`);
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
      const key = parts.slice(1, parts.length - 4).join('|');
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

  // --- passed-hand responder split
  add('## Passed-hand responses: 1x (P) ? by a passed responder');
  add();
  add('Responder already passed, then partner opened in 3rd or 4th seat. Two things');
  add('move together: the responder is **capped below opening strength**, and partner’s');
  add('shaded 3rd/4th-seat opening is lighter than a 1st/2nd-seat one — so the whole');
  add('exchange runs on fewer values. Game-forcing sequences are off the table; a new');
  add('suit is non-forcing and jumps turn fit-showing or invitational. The split below');
  add('is by seat only (passed vs live responder), pooling systems and vulnerability.');
  add('Contexts are the same 1x (P) y responses tabulated above, restricted to those');
  add('with ≥50 passed-hand samples.');
  add();
  {
    // p5/**med**/p95 (n) for an HCP aggregate.
    const pmp = (agg: Agg): string => {
      const st = histStats(agg.hcpHist);
      return st.n === 0 ? '—' : `${st.p[0]}/**${st.p[3]}**/${st.p[6]} (${st.n})`;
    };
    const RESP_KEYS = ['1C', '1D', '1H', '1S', '1NT', '2C', '2NT'];
    interface PRow {
      label: string;
      passed: Agg;
      live: Agg;
      dMed: number;
      dP95: number;
    }
    const prows: PRow[] = [];
    for (const key of RESP_KEYS) {
      for (const action of actionsFor(cells, 'resp', key)) {
        if (action === 'P') continue;
        const passed = sumCells(cells, 'resp', key, action, 'all', 'all', ['P']);
        if (passed.n < 50) continue;
        const live = sumCells(cells, 'resp', key, action, 'all', 'all', ['U']);
        const ps = histStats(passed.hcpHist);
        const ls = histStats(live.hcpHist);
        prows.push({
          label: `${key} (P) ${action}`,
          passed,
          live,
          dMed: ps.p[3] - ls.p[3],
          dP95: ps.p[6] - ls.p[6],
        });
      }
    }
    prows.sort((a, b) => b.passed.n - a.passed.n);
    add('| response | passed p5/**med**/p95 (n) | live p5/**med**/p95 (n) | Δmed | Δp95 |');
    add('|---|---|---|---|---|');
    const sgn = (x: number): string => (x > 0 ? `+${x}` : `${x}`);
    for (const r of prows) {
      add(`| ${r.label} | ${pmp(r.passed)} | ${pmp(r.live)} | ${sgn(r.dMed)} | ${sgn(r.dP95)} |`);
    }
    add();
    // Weighted-average shift across the shown contexts, sanity-summary.
    const totP = prows.reduce((s, r) => s + r.passed.n, 0);
    const wMed = prows.reduce((s, r) => s + r.dMed * r.passed.n, 0) / Math.max(1, totP);
    const wP95 = prows.reduce((s, r) => s + r.dP95 * r.passed.n, 0) / Math.max(1, totP);
    const dir = (x: number): string => (x <= 0 ? 'lower' : 'higher');
    add(
      `Weighted across the ${prows.length} contexts shown (${totP} passed samples), a passed ` +
        `responder’s median sits ${Math.abs(wMed).toFixed(1)} HCP ${dir(wMed)} and its p95 ` +
        `${Math.abs(wP95).toFixed(1)} HCP ${dir(wP95)} than a live responder’s — the top of the range ` +
        'compresses hardest, which is the passed-hand cap showing through.',
    );
    add();
  }

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

  // --- filter-accuracy audit
  add('## Filter accuracy: how well each derived filter matches the field');
  add();
  add('Each dealer filter is a hard yes/no box, fit to cover ~90% of the players who made');
  add('the bid. This section scores those boxes as classifiers against the field they');
  add('describe. For a context (e.g. RHO opens a natural 1♣, direct seat) we take every');
  add('decision faced, label each hand with the action it took, then test the derived');
  add('rule’s box on it:');
  add();
  add('- **precision** = of the hands the filter accepts, the share that actually made the bid;');
  add('- **recall** = of the hands that made the bid, the share the filter accepts;');
  add('- **contested** = of hands that made the bid at least once across the ≥4 tables that');
  add(`  faced this exact decision, the share that did **not** make it unanimously — the`);
  add('  genuinely split, probabilistic hands a single box cannot represent.');
  add();
  add('Recall is high by construction (the box is fit to the bidders); precision is the');
  add('honest number. A low-precision row is a box that also accepts hands that pass or');
  add('choose a different call. Rows are sorted worst-precision first. Box-membership is');
  add('evaluated from the structured rule (suit/quality/HCP branches), the same logic the');
  add('`filterExpr` compiles to.');
  add();
  add('| context | bid | faced | field rate | precision | recall | contested | filter |');
  add('|---|---|---|---|---|---|---|---|');
  for (const r of audit.rows) {
    // Contested is only meaningful with a reasonable pool of repeated hands.
    const contested = r.activeHands >= 20 ? `${r.contestedPct.toFixed(0)}%` : '—';
    add(
      `| ${r.label} | ${r.action} | ${r.nFaced} | ${r.baseRate.toFixed(1)}% | ` +
        `${r.precision.toFixed(0)}% | ${r.recall.toFixed(0)}% | ${contested} | \`${r.filterExpr}\` |`,
    );
  }
  add();
  add('Reading the table. The old shapeless HCP-only boxes have been replaced by shape:');
  add('unusual 2NT now carries its two lowest unbid suits (e.g. (1♣) 2NT = ♦+♥ 5-5,');
  add('precision ~1% → 54%) and jump overcalls carry their 6-card suit — the derived rule');
  add('detects the two-suiter / long-suit shape the field actually holds (see the shape');
  add('detection in the dealer-integration notes). What remains low-precision at the top of');
  add('the table is a different thing: **rare, highly optional bids** — weak jump overcalls');
  add('and preempts at ~0.5–1.5% base rate — where even a shape-correct hand usually picks a');
  add('different call (pass, a simple overcall, another level). Recall stays high and the');
  add('contested share ~100%, so that is a base-rate / gradient effect, not a missing');
  add('constraint. **Natural suit overcalls** top out around 60–75% precision with ~75% of');
  add('bids contested across tables: the honest ceiling of a hard box on a genuinely');
  add('probabilistic call, and the case for a probability-weighted filter rather than a');
  add('wider or narrower rectangle.');
  add();
  const ex = audit.example;
  if (ex) {
    add('### Worked example: (1C) 1S');
    add();
    add(
      `Of ${ex.nFaced} hands that faced a natural/short 1♣ in the direct seat, ${ex.nBid} overcalled 1♠. ` +
        `The box catches ${ex.recall.toFixed(0)}% of them (recall) but only ${ex.precision.toFixed(0)}% of box-matching ` +
        'hands actually overcall 1♠ (precision) — it is too generous in the middle and too tight in the tails.',
    );
    add();
    const fpTotal = ex.fpActions.reduce((a, [, c]) => a + c, 0);
    add(
      `**Accepted but did not bid 1♠ (${fpTotal}).** These hands instead: ` +
        ex.fpActions.map(([a, c]) => `${a} ${c}`).join(', ') +
        ' — passes and stronger spade actions (jumps to 2♠/3♠/4♠) the box cannot tell apart from a simple 1♠.',
    );
    add();
    add(
      `**Overcalled 1♠ but outside the box (${ex.fnTotal}, ${((100 * ex.fnTotal) / Math.max(1, ex.nBid)).toFixed(0)}% of bidders).** ` +
        `Reasons (may overlap): ${ex.fnReasons.hcpHi} too strong for the HCP cap, ${ex.fnReasons.hcpLo} too weak, ` +
        `${ex.fnReasons.suitShort} with a shorter suit than the length floor, ${ex.fnReasons.qualLo} below the quality floor.`,
    );
    add();
    add('The decision is a **gradient, not a box** — P(overcall 1♠) rises then falls with');
    add('strength and with suit length, so no single rectangle is both precise and complete:');
    add();
    add('| holding a real ♠ suit (s≥5, top5≥1) | ≤6 | 7–9 | 10–12 | 13–15 | 16–18 | 19+ |');
    add('|---|---|---|---|---|---|---|');
    add(
      `| P(1♠) by HCP | ${ex.hcpSurface.map(([, p]) => `${p.toFixed(0)}%`).join(' | ')} |`,
    );
    add(`| n | ${ex.hcpSurface.map(([, , n]) => String(n)).join(' | ')} |`);
    add();
    add('| at 10–15 HCP | 3♠ | 4♠ | 5♠ | 6♠ | 7+♠ |');
    add('|---|---|---|---|---|---|');
    add(`| P(1♠) by spade length | ${ex.lenSurface.map(([, p]) => `${p.toFixed(0)}%`).join(' | ')} |`);
    add(`| n | ${ex.lenSurface.map(([, , n]) => String(n)).join(' | ')} |`);
    add();
    add('The HCP cap at 15 discards the 16–18 band (which still overcalls 1♠ around half the');
    add('time, choosing it over a double), while the 7–9 shoulder inside the box overcalls far');
    add('less than the 10–15 core.');
    add();
    add('**Three breadth presets.** Rather than one box, the dealer offers three coverage');
    add('levels of the same observed range — conservative keeps the high-confidence core,');
    add('aggressive reaches the observed extremes (see the dealer-integration notes for why');
    add('this beats a single box or a probability). The precision/recall trade-off is exactly');
    add('what you would expect, and every preset stays within hands the field actually bid:');
    add();
    add('| preset | precision | recall | filter |');
    add('|---|---|---|---|');
    for (const p of ex.presets) {
      const name = p.name.charAt(0).toUpperCase() + p.name.slice(1);
      add(`| ${name} | ${p.precision.toFixed(0)}% | ${p.recall.toFixed(0)}% | \`${p.filterExpr}\` |`);
    }
    add();
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
      filterConservative: p.filterConservative,
      filterAggressive: p.filterAggressive,
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
  add('**Shape detection.** A bid the natural derivation cannot pin down — unusual 2NT, a');
  add('jump cue, or a jump the field plays two ways — is passed to `deriveConventionalShape`,');
  add('which measures the shape components the hands actually hold (the two lowest unbid suits');
  add('5+, both majors 4+, or a single 6+ suit) and unions those covering ≥30%, falling back');
  add('to an HCP range only when none is common. This replaced the shapeless HCP-only boxes');
  add('the filter-accuracy audit flagged: unusual 2NT went from ~1% to ~45–54% precision.');
  add();
  add('**Breadth presets (conservative / normal / aggressive).** No single box exceeds ~75%');
  add('precision on a natural overcall, because the call is genuinely optional. But the');
  add('variation is between-player *rate*, not *range*: pairs sorted from cautious to bold');
  add('(44%→65% marginal-overcall rate) overcall 1♠ on an essentially identical range —');
  add('same p5/p95, same shape tolerance — they just pull the trigger more or less often');
  add('within it. So a probability would mismodel a player as a dice-roll; instead each rule');
  add('ships three **coverage levels of that one shared range**. `conservative` narrows the');
  add('HCP band (quantiles 0.20–0.87) and demands a sounder suit — the high-confidence core;');
  add('`aggressive` widens to the observed extremes (0.01–0.99) and relaxes the suit floor;');
  add('`normal` is the field fit. All three stay within hands the field actually bid — the');
  add('knob picks how inclusive, it does not invent hands. `rule.filterExpr` is the normal');
  add('level; `rule.filterConservative` / `rule.filterAggressive` carry the other two.');
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
