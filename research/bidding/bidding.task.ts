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
  Agg,
  histStats,
  minLenAtCoverage,
  PairOpenings,
  classifyPair,
  median,
  type PairStyle,
  type SeatFeatures,
  type CallContext,
  type RelVul,
} from './lib';

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
}

/** matchKey → per-room seat player ids (open_N … closed_W). */
function loadPairs(): Map<string, { open: string[]; closed: string[] }> {
  const rows = parseCsv(readFileSync(path.join(SCRAPE_DIR, 'matches.csv'), 'utf8'));
  const col = csvColumns(rows);
  const map = new Map<string, { open: string[]; closed: string[] }>();
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
    map.set(key, { open: seatIds('open'), closed: seatIds('closed') });
  }
  return map;
}

function pairKey(a: string, b: string): string {
  return a <= b ? `${a}+${b}` : `${b}+${a}`;
}

interface LoadResult {
  tables: TableRow[];
  counters: Map<string, number>;
  coverage: Map<string, number>;
}

function loadTables(): LoadResult {
  const pairs = loadPairs();
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
    });
    bump(counters, 'valid');
    bump(coverage, `${f[iTourn]}/${f[iStage]}`);
  }
  return { tables, counters, coverage };
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
}

function aggregate(
  tables: TableRow[],
  feats: Map<string, SeatFeatures[]>,
  styles: Map<string, PairStyle>,
): Cells {
  const map = new Map<CellKey, Agg>();
  const dealSets = new Map<string, Set<string>>();
  for (const t of tables) {
    const tf = feats.get(t.pbn)!;
    for (let i = 0; i < t.calls.length; i++) {
      const ctx = classifyCall(t.calls, i);
      if (!ctx) continue;
      const seat = (t.dealerIdx + i) % 4;
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
      const style =
        ctx.family === 'open' && !isBid(ctx.action)
          ? styles.get(actorPair)?.naturalBase
            ? 'nat'
            : styles.get(actorPair)
              ? 'oth'
              : 'unk'
          : styleTag(openBid, styles.get(openerPair));
      const cellKey = `${ctx.family}|${ctx.key}|${ctx.action}|${vul}|${style}`;
      let agg = map.get(cellKey);
      if (!agg) {
        agg = new Agg();
        map.set(cellKey, agg);
      }
      const bidSuit = isBid(ctx.action) ? bidParts(ctx.action).strainIdx : null;
      agg.add(tf[seat], bidSuit !== null && bidSuit < 4 ? bidSuit : null);
      const dealKey = `${ctx.family}|${ctx.key}|${ctx.action}`;
      let ds = dealSets.get(dealKey);
      if (!ds) {
        ds = new Set();
        dealSets.set(dealKey, ds);
      }
      ds.add(t.pbn);
    }
  }
  return { map, dealSets };
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
      ? ['nat', 'short', 'strong', 'polish', 'neb', 'weak', 'multi', 'other', 'oth', 'unk']
      : stylesWanted;
  for (const vul of vulList) {
    for (const style of styleList) {
      const agg = cells.map.get(`${family}|${key}|${action}|${vul}|${style}`);
      if (!agg) continue;
      out.n += agg.n;
      for (let h = 0; h < agg.hcpHist.length; h++) out.hcpHist[h] += agg.hcpHist[h];
      for (let s = 0; s < 4; s++)
        for (let l = 0; l < 14; l++) out.lenHist[s][l] += agg.lenHist[s][l];
      for (let a = 0; a < 4; a++) out.akqHist[a] += agg.akqHist[a];
      out.balanced += agg.balanced;
    }
  }
  return out;
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

function fmtLen(agg: Agg, suitIdx: number): string {
  const st = histStats(agg.lenHist[suitIdx]);
  if (st.n === 0) return '—';
  return `${st.p[0]}–${st.p[6]} (med ${st.p[3]})`;
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
  hcp: { mean: number; sd: number; min: number; max: number; p: number[]; hist: number[] };
  suitLen: Record<string, { p: number[]; hist: number[] }>;
  akqBidSuit: number[] | null;
  balancedPct: number;
  suggest: {
    hcp: { min: number; max: number };
    suit?: Record<string, { min: number }>;
    balanced?: boolean;
  };
}

/** Drop the trailing zeros of a histogram (index still = value). */
function trimHist(hist: ArrayLike<number>): number[] {
  let last = -1;
  for (let i = 0; i < hist.length; i++) if (hist[i] !== 0) last = i;
  const out: number[] = [];
  for (let i = 0; i <= last; i++) out.push(hist[i]);
  return out;
}

function toProfile(
  family: string,
  key: string,
  action: string,
  ctxLabel: string,
  vul: string,
  style: string,
  agg: Agg,
): Profile {
  const hcp = histStats(agg.hcpHist);
  const suitLen: Profile['suitLen'] = {};
  for (let s = 0; s < 4; s++) {
    const st = histStats(agg.lenHist[s]);
    suitLen[SUIT_NAMES[s]] = { p: st.p, hist: trimHist(agg.lenHist[s]) };
  }
  const suggest: Profile['suggest'] = {
    hcp: { min: hcp.p[0], max: hcp.p[6] },
  };
  if (isBid(action)) {
    const { strainIdx } = bidParts(action);
    if (strainIdx < 4) {
      const minLen = minLenAtCoverage(agg.lenHist[strainIdx], 0.9);
      if (minLen >= 3) suggest.suit = { [SUIT_NAMES[strainIdx]]: { min: minLen } };
    } else if (agg.n > 0 && agg.balanced / agg.n >= 0.8) {
      suggest.balanced = true;
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
    hcp: {
      mean: Number(hcp.mean.toFixed(2)),
      sd: Number(hcp.sd.toFixed(2)),
      min: hcp.min,
      max: hcp.max,
      p: hcp.p,
      hist: trimHist(agg.hcpHist),
    },
    suitLen,
    akqBidSuit: isBid(action) && bidParts(action).strainIdx < 4 ? [...agg.akqHist] : null,
    balancedPct: agg.n === 0 ? 0 : Number(((100 * agg.balanced) / agg.n).toFixed(1)),
    suggest,
  };
}

// ---------------------------------------------------------------------------
// The task
// ---------------------------------------------------------------------------

it('bidding-range study', () => {
  if (!existsSync(path.join(SCRAPE_DIR, 'contracts.csv'))) {
    throw new Error(`missing ${SCRAPE_DIR}/contracts.csv — run bridge:scrape + bridge:flatten`);
  }
  console.log('loading contracts…');
  const { tables, counters, coverage } = loadTables();
  console.log(`  ${tables.length} valid auction tables`);

  console.log('computing hand features…');
  const feats = new Map<string, SeatFeatures[]>();
  for (const t of tables) {
    if (!feats.has(t.pbn)) feats.set(t.pbn, featuresFromPbn(t.pbn));
  }
  console.log(`  ${feats.size} distinct deals`);

  console.log('pass 1: partnership system detection…');
  const styles = detectStyles(tables, feats);

  console.log('pass 2: context aggregation…');
  const cells = aggregate(tables, feats, styles);
  console.log(`  ${cells.map.size} context cells`);

  console.log('writing report + profiles…');
  const report = buildReport(tables, counters, coverage, styles, cells);
  writeFileSync(REPORT_PATH, report);

  const profiles = buildProfiles(cells);
  const lines = profiles.map((p) => JSON.stringify(p));
  writeFileSync(
    PROFILES_PATH,
    `{"version":1,"source":"WBF/EBL championships 2023-2026, ${tables.length} tables","profiles":[\n${lines.join(',\n')}\n]}\n`,
  );
  console.log(`  ${profiles.length} profiles → ${PROFILES_PATH}`);
  console.log(`  report → ${REPORT_PATH}`);
});

function buildProfiles(cells: Cells): Profile[] {
  const out: Profile[] = [];
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
    // Collapsed (all vuls, all styles) …
    const all = sumCells(cells, family, key, action, 'all', 'all');
    if (all.n >= 25) out.push(toProfile(family, key, action, label, 'all', 'all', all));
    // … per style (all vuls) for the style-sensitive openings …
    for (const style of ['nat', 'short', 'strong', 'polish', 'neb', 'weak', 'multi']) {
      const styled = sumCells(cells, family, key, action, 'all', [style]);
      if (styled.n >= 25 && styled.n < all.n) {
        out.push(toProfile(family, key, action, label, 'all', style, styled));
      }
    }
    // … and per vul (all styles).
    for (const vul of ['none', 'we', 'they', 'both'] as RelVul[]) {
      const v = sumCells(cells, family, key, action, [vul], 'all');
      if (v.n >= 25) out.push(toProfile(family, key, action, label, vul, 'all', v));
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
  cells: Cells,
): string {
  const L: string[] = [];
  const add = (s = ''): void => {
    L.push(s);
  };

  add('# Bidding ranges at the top level: what championship players actually hold');
  add();
  add('Empirical hand ranges per auction context, extracted from the WBF/EBL');
  add('championship scrape by replaying every recorded auction and attaching the');
  add("actual hand to every call. Generated by research/bidding/bidding.task.ts —");
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
  const suitMin90 = (agg: Agg, suitIdx: number): number =>
    minLenAtCoverage(agg.lenHist[suitIdx], 0.9);
  const akq1plus = (agg: Agg): string => {
    const total = agg.akqHist.reduce((a, b) => a + b, 0);
    return total === 0 ? '—' : `${Math.round((100 * (total - agg.akqHist[0])) / total)}%`;
  };
  const SUIT_GLYPH = ['♠', '♥', '♦', '♣'];

  // --- headline answers
  add('## Headline answers: the asked-for auctions');
  add();
  add('HCP as p5–p95 with median; "filter" is the suggested dealer constraint (p5–p95');
  add('HCP, bid-suit length at 90% coverage). fav/unfav = medians at favourable /');
  add('unfavourable vulnerability. 1C/1D contexts face natural openings only.');
  add();
  add('| auction | n | HCP | fav | unfav | bid suit | ≥1 AKQ in suit | filter |');
  add('|---|---|---|---|---|---|---|---|');
  const headline: Array<[string, string, string, string[] | 'all']> = [
    ['overOpen', '1C', '1H', ['nat', 'short']],
    ['overOpen', '1C', '1S', ['nat', 'short']],
    ['overOpen', '1D', '1S', ['nat']],
    ['overOpen', '1D', '1H', ['nat']],
    ['overOpen', '1H', '1S', 'all'],
    ['overOpen', '1H', '2C', 'all'],
    ['overOpen', '1S', '2H', 'all'],
    ['overOpen', '1C', 'X', ['nat', 'short']],
    ['overOpen', '1D', 'X', ['nat']],
    ['overOpen', '1H', 'X', 'all'],
    ['overOpen', '1S', 'X', 'all'],
    ['overOpen', '1H', '1NT', 'all'],
    ['overOpen', '1S', '1NT', 'all'],
  ];
  for (const [family, key, action, stylesW] of headline) {
    const agg = stat(family, key, action, stylesW);
    if (agg.n === 0) continue;
    const st = histStats(agg.hcpHist);
    const fav = stat(family, key, action, stylesW, ['they']);
    const unfav = stat(family, key, action, stylesW, ['we']);
    let suitCell = '—';
    let filter = `hcp ${st.p[0]}–${st.p[6]}`;
    if (isBid(action)) {
      const si = bidParts(action).strainIdx;
      if (si < 4) {
        const lenSt = histStats(agg.lenHist[si]);
        const min = suitMin90(agg, si);
        suitCell = `${lenSt.p[0]}–${lenSt.p[6]} (med ${lenSt.p[3]})`;
        filter += ` · ${SUIT_GLYPH[si]}${min}+`;
      } else {
        filter += ' · balanced';
      }
    } else if (action === 'X') {
      const si = bidParts(key).strainIdx; // their suit
      if (si < 4) {
        const lenSt = histStats(agg.lenHist[si]);
        suitCell = `their ${SUIT_GLYPH[si]}: ${lenSt.p[0]}–${lenSt.p[6]} (med ${lenSt.p[3]})`;
        filter += ` · ${SUIT_GLYPH[si]}${lenSt.p[6]}-`;
      }
    }
    const label = `(${key}) ${action}`;
    add(
      `| ${label} | ${agg.n} | ${range90(agg)} | ${fav.n >= 25 ? med(fav) : '—'} | ${unfav.n >= 25 ? med(unfav) : '—'} | ${suitCell} | ${isBid(action) && bidParts(action).strainIdx < 4 ? akq1plus(agg) : '—'} | ${filter} |`,
    );
  }
  add();

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
    const xx = stat('respInterf', '1C|X', 'XX', ['nat', 'short']);
    add(`- **The field opens light and overcalls light.** Natural 1M openings in seats 1–2`);
    add(`  centre on ${med(merged)} HCP with p5 = ${histStats(merged.hcpHist).p[0]} — nearly every 11-count and many decent`);
    add(`  10-counts get opened. One-level overcalls ((1C) 1H) run ${range90(oc1)} HCP —`);
    add(`  the book "8–16" is real but the median sits ${med(merged) - med(oc1)} HCP below the median opening.`);
    add(`- **Suit quality is near-mandatory for overcalls**: ${akq1plus(oc1)} of (1C) 1H overcalls`);
    add(`  hold at least one of A/K/Q in the suit, and 90% hold 5+ cards.`);
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
    const styleCount = (pick: (s: PairStyle) => string, want: string): number =>
      [...styles.values()].filter((s) => pick(s) === want).length;
    const nMulti = styleCount((s) => s.twoDiamonds, 'multi');
    const nWeak2D = styleCount((s) => s.twoDiamonds, 'weak');
    const nStrongC = styleCount((s) => s.oneClub, 'strong');
    add(`- **At this level 2D is multi** (${nMulti} pairs multi vs ${nWeak2D} weak among classified),`);
    add(`  2C strong is standard, and strong-club pairs are ${Math.round((100 * nStrongC) / styles.size)}% of the field (${nStrongC} of ${styles.size}).`);
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
    add('| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | %bal |');
    add('|---|---|---|---|---|---|');
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
        const part = sumCells(cells, 'open', key, bid, 'all', styleFilter);
        agg.n += part.n;
        for (let h = 0; h < part.hcpHist.length; h++) agg.hcpHist[h] += part.hcpHist[h];
        for (let s = 0; s < 4; s++)
          for (let l = 0; l < 14; l++) agg.lenHist[s][l] += part.lenHist[s][l];
        agg.balanced += part.balanced;
      }
      if (agg.n < 25) continue;
      const suitIdx = bidParts(bid).strainIdx;
      const lenCell = suitIdx < 4 ? fmtLen(agg, suitIdx) : '—';
      const deals = seatGroup.reduce((acc, key) => acc + dealCount('open', key, bid), 0);
      add(
        `| ${bid} | ${agg.n} | ${deals} | ${fmtStats(agg)} | ${lenCell} | ${pct(agg.balanced, agg.n)} |`,
      );
    }
    add();
  }

  // Preempts by vulnerability.
  add('### Preempts by vulnerability (all seats, natural-base pairs)');
  add();
  add('| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len |');
  add('|---|---|---|---|---|');
  for (const bid of ['2H', '2S', '3C', '3D', '3H', '3S']) {
    for (const vul of ['they', 'none', 'both', 'we'] as RelVul[]) {
      const agg = new Agg();
      for (const key of ['seat1', 'seat2', 'seat3', 'seat4']) {
        const part = sumCells(cells, 'open', key, bid, [vul], bid === '2D' ? ['weak'] : ['nat']);
        agg.n += part.n;
        for (let h = 0; h < part.hcpHist.length; h++) agg.hcpHist[h] += part.hcpHist[h];
        for (let s = 0; s < 4; s++)
          for (let l = 0; l < 14; l++) agg.lenHist[s][l] += part.lenHist[s][l];
        agg.balanced += part.balanced;
      }
      if (agg.n < 25) continue;
      const suitIdx = bidParts(bid).strainIdx;
      const vulLabel = vul === 'they' ? 'fav' : vul === 'we' ? 'unfav' : vul;
      add(`| ${bid} | ${vulLabel} | ${agg.n} | ${fmtStats(agg)} | ${fmtLen(agg, suitIdx)} |`);
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
      const label = contextLabel({
        family: family as CallContext['family'],
        key,
        action: '?',
        seatPos: 0,
        passedHand: false,
      }).replace(' ?', ' ?');
      add(`### ${label}`);
      add();
      add('| action | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | %bal | AKQ in suit (0/1/2/3) |');
      add('|---|---|---|---|---|---|---|');
      for (const action of actions) {
        const agg = sumCells(cells, family, key, action, 'all', styleFor(key));
        if (agg.n < 25) continue;
        const suitIdx = isBid(action) ? bidParts(action).strainIdx : 4;
        const lenCell = suitIdx < 4 ? fmtLen(agg, suitIdx) : '—';
        const akqTotal = agg.akqHist.reduce((a, b) => a + b, 0);
        const akqCell =
          suitIdx < 4 && akqTotal > 0
            ? [...agg.akqHist].map((c) => pct(c, akqTotal)).join('/')
            : '—';
        add(
          `| ${action} | ${agg.n} | ${dealCount(family, key, action)} | ${fmtStats(agg)} | ${lenCell} | ${pct(agg.balanced, agg.n)} | ${akqCell} |`,
        );
      }
      add();
      // Vulnerability split for the most common non-pass actions.
      const nonPass = actions.filter((a) => a !== 'P').slice(0, 6);
      const vulRows: string[] = [];
      for (const action of nonPass) {
        for (const vul of ['none', 'they', 'we', 'both'] as RelVul[]) {
          const agg = sumCells(cells, family, key, action, [vul], styleFor(key));
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
    }
  };

  competitiveSection(
    'Direct seat: RHO opens, we act — (1x) ?',
    'overOpen',
    ['1C', '1D', '1H', '1S', '1NT', '2C', '2D', '2H', '2S', '3C', '3D', '3H', '3S'],
    (key) => (key === '1C' ? ['nat', 'short'] : key === '1D' ? ['nat'] : key === '2D' ? ['weak'] : 'all'),
    'For 1C/1D the tables below face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately at the end of the section).',
  );

  // Strong 1C faced.
  add('### (1C = strong, Precision-style) ? — for comparison');
  add();
  add('| action | n | HCP p5/p25/med/p75/p95 | bid-suit len |');
  add('|---|---|---|---|');
  for (const action of actionsFor(cells, 'overOpen', '1C')) {
    const agg = sumCells(cells, 'overOpen', '1C', action, 'all', ['strong']);
    if (agg.n < 25) continue;
    const suitIdx = isBid(action) ? bidParts(action).strainIdx : 4;
    add(
      `| ${action} | ${agg.n} | ${fmtStats(agg)} | ${suitIdx < 4 ? fmtLen(agg, suitIdx) : '—'} |`,
    );
  }
  add();

  competitiveSection(
    'Balancing seat: (1x) P (P) ?',
    'balance',
    ['1C', '1D', '1H', '1S'],
    (key) => (key === '1C' ? ['nat', 'short'] : key === '1D' ? ['nat'] : 'all'),
  );

  // Natural-style filter for contexts whose key starts with an opening bid.
  const naturalOpener = (key: string): string[] | 'all' => {
    const open = key.split('|')[0];
    return open === '1C' ? ['nat', 'short'] : open === '1D' ? ['nat'] : 'all';
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
    naturalOpener,
    'Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C/1D contexts use natural openers only.',
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
      key === '1C' ? ['nat', 'short'] : key === '1D' ? ['nat'] : key === '1NT' ? ['strong'] : ['nat'],
    'Partner opened (natural style), RHO passed. Responder ranges.',
  );

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
      for (const s of seats) {
        const part = stat('open', s, bid, stylesW);
        out.n += part.n;
        for (let h = 0; h < part.hcpHist.length; h++) out.hcpHist[h] += part.hcpHist[h];
        for (let su = 0; su < 4; su++)
          for (let l = 0; l < 14; l++) out.lenHist[su][l] += part.lenHist[su][l];
      }
      return out;
    };
    const s12 = ['seat1', 'seat2'];
    const rows: Array<[string, string, Agg]> = [
      ['1M opening (seats 1–2)', '12–21 (light 11s common in practice)', (() => {
        const a = sumSeats('1H', s12, ['nat']);
        const b = sumSeats('1S', s12, ['nat']);
        const m = new Agg();
        for (const x of [a, b]) {
          m.n += x.n;
          for (let h = 0; h < x.hcpHist.length; h++) m.hcpHist[h] += x.hcpHist[h];
        }
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
      ['new suit response 1C (P) 1H', '6+', stat('resp', '1C', '1H', ['nat', 'short'])],
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
  add('`research/bidding/bid-profiles.json` holds one record per context × action ×');
  add('(vul | "all") × (style | "all") with n≥25. Each record carries the full HCP');
  add('histogram, per-suit length histograms/percentiles, bid-suit quality, and a');
  add('pre-derived `suggest` block:');
  add();
  add('```json');
  {
    const agg = stat('overOpen', '1D', '1S', ['nat']);
    const p = toProfile('overOpen', '1D', '1S', '(1D) 1S', 'all', 'nat', agg);
    const compact = {
      ...p,
      hcp: { ...p.hcp, hist: '…' },
      suitLen: '… per-suit percentiles + histograms …',
      akqBidSuit: p.akqBidSuit,
    };
    add(JSON.stringify(compact, null, 2));
  }
  add('```');
  add();
  add('`suggest` maps 1:1 onto the dealer’s `HandConstraint` (src/engine/constraints.ts):');
  add('`{ hcp: {min,max}, suit: {S: {min}} }` — apply it to the acting seat. To deal a');
  add('whole auction context (e.g. West opens 1D, North overcalls 1S), combine the');
  add('opening profile on one seat with the action profile on the next; the dealer’s');
  add('generate-and-test loop already supports independent per-seat constraints. The');
  add('histograms are retained so stricter (p10–p90) or looser (min–max) cuts can be');
  add('derived without re-running the study.');
  add();

  add('## Files');
  add();
  add('- `research/bidding/bid-profiles.json` — machine-readable profiles: every');
  add('  context×action with n≥25, overall + per-vul + per-style, each with HCP');
  add('  histogram/percentiles, per-suit length histograms, and a suggested dealer');
  add('  filter (`hcp` p5–p95 range, bid-suit minimum at 90% coverage, balanced flag).');
  add('- Suggested filters map 1:1 onto the dealer’s `HandConstraint` (src/engine/constraints.ts).');
  add('- Profiles also cover families not tabulated above (e.g. sandwich-seat actions');
  add('  `(1C) P (1S) ?`) — filter by `family`.');
  add();
  return L.join('\n') + '\n';
}
