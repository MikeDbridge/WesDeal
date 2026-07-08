/**
 * Scraper for the World Bridge Federation results microsites — the full record
 * of real ("single-dummy") tournament play, paired with double-dummy ground
 * truth for each deal.
 *
 * Default source: the Herning 2025 (47th World Team Championships) microsite.
 * A different championship is scraped by passing a Tournament config (see
 * TOURNAMENTS / marrakech.23). Each championship has a round-robin phase and a
 * knockout phase, with two page types joined by board number:
 *
 *   Round-robin (per event):
 *     RoundTeams.asp?qtournid=T&qroundno=R   → match ids of round R
 *     handsacross.asp?qtournid=T&qround=R     → the deals of round R
 *     BoardDetails.asp?qmatchid=M             → both rooms: teams, players,
 *                                               contract, auction, lead, tricks, score
 *   Knockout (per event, phase QF/SF/FF):
 *     knockoutphase.asp?qtournid=T&qphase=P   → match-segment ids
 *     HandsAcrossKO.asp?qtournid=T&qround=S&qphase=P → deals of segment S
 *     BoardDetailsKO.asp?qmatchid=M&qphase=P  → both rooms (as above)
 *
 * All tables sharing a (stage, segment) play the SAME deals, so each deal's DD
 * table is solved once (memoised by PBN, since the events reuse deals).
 *
 * Output: one JSONL line per MATCH under ./data/<tourn>/<event>-<stage>.jsonl —
 * a full MatchRecord (meta + players + boards). Per-file granularity makes the
 * scrape resumable (an existing file is skipped) and raw HTML is cached under
 * ./cache/<tourn>/ so a re-run never re-hits the server.
 *
 * Env knobs:
 *   WBF_TOURN      tournament key (default "herning25"). See TOURNAMENTS.
 *   WBF_EVENTS     comma list of event codes (default all in the tournament).
 *   WBF_RR_ROUNDS  RR round spec, e.g. "1-23" (default) or "" to skip RR.
 *   WBF_KO_PHASES  KO phases, e.g. "QF,SF,FF" (default) or "" to skip KO.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadDds, Dds } from 'bridge-dds';
import {
  parseBoardAcrossDeal,
  parseBoardQboards,
  parseHands,
  parseKoSegment,
  parseMatchIds,
  parseMatchMeta,
  parseResults,
  parseRoundSpec,
  type Deal,
  type Lineup,
  type NamedId,
  type Play,
} from './parse';

const FETCH_DELAY_MS = 300;

export interface WbfEvent {
  code: string;
  name: string;
  rrTournid: number;
  koTournid: number;
}

export interface Tournament {
  key: string;
  name: string;
  /** Microsite base, up to and including ".../Asp". */
  base: string;
  events: WbfEvent[];
  koPhases: string[];
  /**
   * Where the round-robin deals come from:
   *  'handsacross' — one page per round (Herning 2025).
   *  'boardacross' — one page per board (Marrakech 2023).
   *  'auto'        — try handsacross, fall back to boardacross per round/segment.
   *                  Use for new tournaments so only base URL + IDs are needed.
   */
  dealSource: 'handsacross' | 'boardacross' | 'auto';
}

export const TOURNAMENTS: Record<string, Tournament> = {
  herning25: {
    key: 'herning25',
    name: '47th World Team Championships (Herning 2025)',
    base: 'https://db.worldbridge.org/Repository/tourn/herning.25/Microsite/Asp',
    events: [
      { code: 'BB', name: 'Bermuda Bowl', rrTournid: 2550, koTournid: 2554 },
      { code: 'VC', name: 'Venice Cup', rrTournid: 2551, koTournid: 2555 },
      { code: 'DOT', name: "d'Orsi Trophy", rrTournid: 2552, koTournid: 2556 },
      { code: 'WUC', name: 'Wuhan Cup', rrTournid: 2553, koTournid: 2557 },
    ],
    koPhases: ['QF', 'SF', 'FF'],
    dealSource: 'handsacross',
  },
  marrakech23: {
    key: 'marrakech23',
    name: '46th World Team Championships (Marrakech 2023)',
    base: 'https://db.worldbridge.org/repository/tourn/marrakech.23/microsite/Asp',
    events: [
      { code: 'BB', name: 'Bermuda Bowl', rrTournid: 2350, koTournid: 2354 },
      { code: 'VC', name: 'Venice Cup', rrTournid: 2351, koTournid: 2355 },
      { code: 'DOT', name: "d'Orsi Trophy", rrTournid: 2352, koTournid: 2356 },
      { code: 'WUC', name: 'Wuhan Cup', rrTournid: 2353, koTournid: 2357 },
    ],
    // 2023 round-robin pages carry no bidding and deals are per-board
    // (BoardAcross). The knockout DOES have bidding; its deals come from
    // per-board BoardAcrossKO, with the segment encoded in the qboard.
    koPhases: ['QF', 'SF', 'FF'],
    dealSource: 'boardacross',
  },

  // ---- World Transnational Open Teams — the huge open field runs a Swiss
  //      qualifier (weak/mixed strength, excluded) then a knockout from the
  //      Round of 16 onward (world-class). We scrape only the knockout: the
  //      transnational KO tournid is the team Bermuda-Bowl KO id + 7, phase
  //      "16"/"32" for the earlier rounds. rrTournid 0 skips the Swiss. ----
  herning25tn: {
    key: 'herning25tn',
    name: '14th World Transnational Open Teams (Herning 2025)',
    base: 'https://db.worldbridge.org/Repository/tourn/herning.25/Microsite/Asp',
    events: [{ code: 'TNOT', name: 'Transnational Open Teams', rrTournid: 0, koTournid: 2561 }],
    koPhases: ['16', 'QF', 'SF', 'FF'],
    dealSource: 'auto',
  },
  marrakech23tn: {
    key: 'marrakech23tn',
    name: '13th World Transnational Open Teams (Marrakech 2023)',
    base: 'https://db.worldbridge.org/repository/tourn/marrakech.23/microsite/Asp',
    events: [{ code: 'TNOT', name: 'Transnational Open Teams', rrTournid: 0, koTournid: 2361 }],
    koPhases: ['16', 'QF', 'SF', 'FF'],
    dealSource: 'auto',
  },

  // ---- World Team Championships (older) — dealSource 'auto' resolves the deal
  //      page per round; KO tournid = RR + 3 (Lyon, 3 events) or + 4 (rest). ----
  lyon17: {
    key: 'lyon17',
    name: '43rd World Team Championships (Lyon 2017)',
    base: 'https://db.worldbridge.org/repository/tourn/lyon.17/microsite/Asp',
    events: [
      { code: 'BB', name: 'Bermuda Bowl', rrTournid: 1440, koTournid: 1443 },
      { code: 'VC', name: 'Venice Cup', rrTournid: 1441, koTournid: 1444 },
      { code: 'DOT', name: "d'Orsi Trophy", rrTournid: 1442, koTournid: 1445 },
    ], // no Mixed event in 2017
    koPhases: ['QF', 'SF', 'FF'],
    dealSource: 'auto',
  },
  wuhan19: {
    key: 'wuhan19',
    name: '44th World Team Championships (Wuhan 2019)',
    base: 'https://db.worldbridge.org/repository/tourn/wuhan.19/microsite/Asp',
    events: [
      { code: 'BB', name: 'Bermuda Bowl', rrTournid: 1640, koTournid: 1644 },
      { code: 'VC', name: 'Venice Cup', rrTournid: 1641, koTournid: 1645 },
      { code: 'DOT', name: "d'Orsi Trophy", rrTournid: 1642, koTournid: 1646 },
      { code: 'WUC', name: 'Wuhan Cup', rrTournid: 1643, koTournid: 1647 },
    ],
    koPhases: ['QF', 'SF', 'FF'],
    dealSource: 'auto',
  },
  salso22: {
    key: 'salso22',
    name: '45th World Team Championships (Salsomaggiore 2022)',
    base: 'https://db.worldbridge.org/Repository/tourn/salsomaggiore.22/microSite/Asp',
    events: [
      { code: 'BB', name: 'Bermuda Bowl', rrTournid: 2200, koTournid: 2204 },
      { code: 'VC', name: 'Venice Cup', rrTournid: 2201, koTournid: 2205 },
      { code: 'DOT', name: "d'Orsi Trophy", rrTournid: 2202, koTournid: 2206 },
      { code: 'WUC', name: 'Wuhan Cup', rrTournid: 2203, koTournid: 2207 },
    ],
    koPhases: ['QF', 'SF', 'FF'],
    dealSource: 'auto',
  },

  // ---- European National Team Championships — round-robin only (no KO), with
  //      long, per-event-variable round counts (auto-detected). ----
  ostend18: {
    key: 'ostend18',
    name: '54th European Team Championships (Ostend 2018)',
    base: 'https://db.eurobridge.org/repository/competitions/18Ostend/microsite/Asp',
    events: [
      { code: 'OPEN', name: 'Open Teams', rrTournid: 1500, koTournid: 0 },
      { code: 'WOMEN', name: 'Women Teams', rrTournid: 1501, koTournid: 0 },
      { code: 'SEN', name: 'Senior Teams', rrTournid: 1502, koTournid: 0 },
    ], // no Mixed event in 2018
    koPhases: [],
    dealSource: 'auto',
  },
  madeira22: {
    key: 'madeira22',
    name: '55th European Team Championships (Madeira 2022)',
    base: 'https://db.eurobridge.org/repository/competitions/22Madeira/microsite/Asp',
    events: [
      { code: 'OPEN', name: 'Open Teams', rrTournid: 2220, koTournid: 0 },
      { code: 'WOMEN', name: 'Women Teams', rrTournid: 2221, koTournid: 0 },
      { code: 'SEN', name: 'Senior Teams', rrTournid: 2222, koTournid: 0 },
      { code: 'MIX', name: 'Mixed Teams', rrTournid: 2223, koTournid: 0 },
    ],
    koPhases: [],
    dealSource: 'auto',
  },
  euchamp24: {
    key: 'euchamp24',
    name: 'European Team Championships (Herning 2024)',
    base: 'https://db.eurobridge.org/repository/competitions/24Herning/microsite/Asp',
    events: [
      { code: 'OPEN', name: 'Open Teams', rrTournid: 2410, koTournid: 0 },
      { code: 'WOMEN', name: 'Women Teams', rrTournid: 2411, koTournid: 0 },
      { code: 'SEN', name: 'Senior Teams', rrTournid: 2412, koTournid: 0 },
      { code: 'MIX', name: 'Mixed Teams', rrTournid: 2413, koTournid: 0 },
    ],
    koPhases: [],
    dealSource: 'auto',
  },
  riga26: {
    key: 'riga26',
    name: 'European Team Championships (Riga 2026)',
    base: 'https://db.eurobridge.org/repository/competitions/26riga/microsite/Asp',
    events: [
      { code: 'OPEN', name: 'Open Teams', rrTournid: 2620, koTournid: 0 },
      { code: 'WOMEN', name: 'Women Teams', rrTournid: 2621, koTournid: 0 },
      { code: 'SEN', name: 'Senior Teams', rrTournid: 2622, koTournid: 0 },
      { code: 'MIX', name: 'Mixed Teams', rrTournid: 2623, koTournid: 0 },
    ],
    koPhases: [],
    dealSource: 'auto',
  },
};

// ---- Record shape ----------------------------------------------------------

export interface MatchBoard {
  board: number;
  dealer: string;
  vul: string;
  pbn: string;
  /** dd[strain][declarer], from CalcDDTablePBN. */
  dd: number[][];
  open: Play | null;
  closed: Play | null;
  impHome: number;
  impAway: number;
}

export interface MatchRecord {
  tournament: string;
  event: string;
  /** "RR" for round-robin, else the KO phase ("QF" | "SF" | "FF"). */
  stage: string;
  /** RR round number, or KO segment number. */
  segment: number;
  matchid: number;
  home: NamedId;
  away: NamedId;
  vpHome: number | null;
  vpAway: number | null;
  impHome: number | null;
  impAway: number | null;
  players: { open: Lineup; closed: Lineup };
  boards: MatchBoard[];
}

// ---- Fetching (cached) -----------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cacheDir(tourn: string): string {
  return path.join(import.meta.dirname, 'cache', tourn);
}
function dataDir(tourn: string): string {
  return path.join(import.meta.dirname, 'data', tourn);
}

async function fetchCached(tourn: string, url: string): Promise<string> {
  const dir = cacheDir(tourn);
  mkdirSync(dir, { recursive: true });
  const key = url.replace(/[^a-z0-9]+/gi, '_').slice(-180) + '.html';
  const file = path.join(dir, key);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  writeFileSync(file, html);
  await sleep(FETCH_DELAY_MS); // be polite to the server
  return html;
}

/** Like fetchCached, but returns null on a missing page (for deal-source auto-detection). */
async function fetchOrNull(tourn: string, url: string): Promise<string | null> {
  try {
    return await fetchCached(tourn, url);
  } catch {
    return null;
  }
}

// ---- Orchestration ---------------------------------------------------------

/** DD table for a deal, solved once per distinct PBN across the whole run. */
function ddFor(dds: Dds, memo: Map<string, number[][]>, pbn: string): number[][] {
  let dd = memo.get(pbn);
  if (!dd) {
    dd = dds.CalcDDTablePBN({ cards: pbn }).resTable;
    memo.set(pbn, dd);
  }
  return dd;
}

/** Build one match's record from its result page HTML and the segment's deals. */
function buildMatch(
  dds: Dds,
  memo: Map<string, number[][]>,
  t: Tournament,
  ev: WbfEvent,
  stage: string,
  segment: number,
  matchid: number,
  hands: Map<number, Deal>,
  html: string,
): MatchRecord {
  const meta = parseMatchMeta(html);
  const results = parseResults(html);
  const boards: MatchBoard[] = [];
  for (const [board, deal] of hands) {
    const r = results.get(board);
    if (!r) continue;
    boards.push({
      board,
      dealer: deal.dealer,
      vul: deal.vul,
      pbn: deal.pbn,
      dd: ddFor(dds, memo, deal.pbn),
      open: r.open,
      closed: r.closed,
      impHome: r.impHome,
      impAway: r.impAway,
    });
  }
  boards.sort((a, b) => a.board - b.board);
  return {
    tournament: t.key,
    event: ev.code,
    stage,
    segment,
    matchid,
    home: meta.home,
    away: meta.away,
    vpHome: meta.vpHome,
    vpAway: meta.vpAway,
    impHome: meta.impHome,
    impAway: meta.impAway,
    players: { open: meta.open, closed: meta.closed },
    boards,
  };
}

/** The round's deals, from either the per-round handsacross page or, when the
 *  microsite has none, one BoardAcross page per board (referenced by a match). */
async function roundDeals(t: Tournament, ev: WbfEvent, round: number, aMatchHtml: string): Promise<Map<number, Deal>> {
  if (t.dealSource !== 'boardacross') {
    const html = await fetchOrNull(t.key, `${t.base}/handsacross.asp?qtournid=${ev.rrTournid}&qround=${round}`);
    const h = html ? parseHands(html) : new Map<number, Deal>();
    if (h.size > 0 || t.dealSource === 'handsacross') return h; // 'auto' with no hands falls through
  }
  const hands = new Map<number, Deal>();
  for (const [board, qboard] of parseBoardQboards(aMatchHtml)) {
    const parsed = parseBoardAcrossDeal(await fetchCached(t.key, `${t.base}/BoardAcross.asp?qboard=${qboard}`));
    if (parsed) hands.set(board, parsed.deal);
  }
  return hands;
}

/** Scrape one round-robin round → one MatchRecord per match. */
async function scrapeRRRound(dds: Dds, memo: Map<string, number[][]>, t: Tournament, ev: WbfEvent, round: number): Promise<MatchRecord[]> {
  const matchIds = parseMatchIds(await fetchCached(t.key, `${t.base}/RoundTeams.asp?qtournid=${ev.rrTournid}&qroundno=${round}`));
  if (matchIds.length === 0) return [];
  const firstHtml = await fetchCached(t.key, `${t.base}/BoardDetails.asp?qmatchid=${matchIds[0]}`);
  const hands = await roundDeals(t, ev, round, firstHtml);
  if (hands.size === 0) return [];
  const out: MatchRecord[] = [];
  for (const matchid of matchIds) {
    const html = matchid === matchIds[0] ? firstHtml : await fetchCached(t.key, `${t.base}/BoardDetails.asp?qmatchid=${matchid}`);
    out.push(buildMatch(dds, memo, t, ev, 'RR', round, matchid, hands, html));
  }
  return out;
}

/** The KO segment a match-segment page belongs to (cheap: no deal fetches). */
function koSegmentNumber(t: Tournament, html: string): number | null {
  if (t.dealSource !== 'boardacross') {
    const s = parseKoSegment(html);
    if (s !== null || t.dealSource === 'handsacross') return s;
  }
  // boardacross: the segment is the qboard's second field, e.g. "001.01.QF.2354" → 1.
  const first = parseBoardQboards(html).values().next().value as string | undefined;
  return first ? Number(first.split('.')[1]) : null;
}

/** The deals of one KO segment (shared by every match in it). */
async function koDeals(t: Tournament, ev: WbfEvent, phase: string, segment: number, html: string): Promise<Map<number, Deal>> {
  if (t.dealSource !== 'boardacross') {
    const pad = String(segment).padStart(2, '0');
    const hb = await fetchOrNull(t.key, `${t.base}/HandsAcrossKO.asp?qtournid=${ev.koTournid}&qround=${pad}&qphase=${phase}`);
    const h = hb ? parseHands(hb) : new Map<number, Deal>();
    if (h.size > 0 || t.dealSource === 'handsacross') return h;
  }
  const hands = new Map<number, Deal>();
  for (const [board, qboard] of parseBoardQboards(html)) {
    const parsed = parseBoardAcrossDeal(await fetchCached(t.key, `${t.base}/BoardAcrossKO.asp?qboard=${qboard}`));
    if (parsed) hands.set(board, parsed.deal);
  }
  return hands;
}

/** Scrape a whole KO phase → one MatchRecord per match-segment. */
async function scrapeKoPhase(dds: Dds, memo: Map<string, number[][]>, t: Tournament, ev: WbfEvent, phase: string): Promise<MatchRecord[]> {
  const matchIds = parseMatchIds(await fetchCached(t.key, `${t.base}/knockoutphase.asp?qtournid=${ev.koTournid}&qphase=${phase}`));
  if (matchIds.length === 0) return [];
  const segHands = new Map<number, Map<number, Deal>>();
  const out: MatchRecord[] = [];
  for (const matchid of matchIds) {
    const html = await fetchCached(t.key, `${t.base}/BoardDetailsKO.asp?qmatchid=${matchid}&qphase=${phase}`);
    const segment = koSegmentNumber(t, html);
    if (segment === null) continue;
    if (!segHands.has(segment)) segHands.set(segment, await koDeals(t, ev, phase, segment, html));
    out.push(buildMatch(dds, memo, t, ev, phase, segment, matchid, segHands.get(segment)!, html));
  }
  return out;
}

function writeStage(file: string, matches: MatchRecord[], label: string): void {
  if (matches.length === 0) {
    console.log(`${label}: no data — skipping`);
    return;
  }
  writeFileSync(file, matches.map((m) => JSON.stringify(m)).join('\n') + '\n');
  const contracts = matches.reduce((n, m) => n + m.boards.reduce((k, b) => k + (b.open ? 1 : 0) + (b.closed ? 1 : 0), 0), 0);
  console.log(`${label}: ${matches.length} matches, ${contracts} contracts → ${path.basename(file)}`);
}

const MAX_ROUNDS = 60; // safety cap when auto-detecting round count

/** Resolve WBF_TOURN into a list: a key, comma-list of keys, or a group. */
function resolveTournaments(): Tournament[] {
  const spec = (process.env.WBF_TOURN ?? 'herning25').trim();
  const all = Object.values(TOURNAMENTS);
  const low = spec.toLowerCase();
  if (low === 'all') return all;
  if (low === 'worlds') return all.filter((t) => t.base.includes('worldbridge'));
  if (low === 'euros') return all.filter((t) => t.base.includes('eurobridge'));
  const found = spec.split(',').map((s) => TOURNAMENTS[s.trim()]).filter(Boolean);
  if (found.length === 0) {
    throw new Error(`unknown WBF_TOURN=${spec} — keys: ${Object.keys(TOURNAMENTS).join(', ')} | groups: all, worlds, euros`);
  }
  return found;
}

/** Scrape every event (all RR rounds + KO phases) of one tournament. */
async function scrapeTournament(
  t: Tournament,
  dds: Dds,
  memo: Map<string, number[][]>,
  roundsOverride: number[] | null,
  phasesOverride: string[] | null,
  eventCodes: string[] | null,
): Promise<void> {
  const events = eventCodes ? t.events.filter((e) => eventCodes.includes(e.code)) : t.events;
  const dir = dataDir(t.key);
  mkdirSync(dir, { recursive: true });

  for (const ev of events) {
    // Round-robin: use an explicit spec if given, else auto-detect the last
    // round (round counts vary by event, especially in the Euros). rrTournid 0
    // means the event has no round-robin we want (e.g. a knockout-only
    // transnational whose Swiss qualifier is deliberately skipped).
    const rounds =
      ev.rrTournid === 0 ? [] : (roundsOverride ?? Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1));
    let emptyStreak = 0;
    for (const round of rounds) {
      const out = path.join(dir, `${ev.code}-RR-r${round}.jsonl`);
      const label = `${t.key} ${ev.code} RR r${round}`;
      if (existsSync(out)) {
        emptyStreak = 0;
        continue;
      }
      const matches = await scrapeRRRound(dds, memo, t, ev, round);
      if (matches.length === 0) {
        if (!roundsOverride && ++emptyStreak >= 2) break; // two empty rounds ⇒ past the end
        continue;
      }
      emptyStreak = 0;
      writeStage(out, matches, label);
    }
    // Knockout phases (none for the Euros).
    for (const phase of phasesOverride ?? t.koPhases) {
      const out = path.join(dir, `${ev.code}-${phase}.jsonl`);
      const label = `${t.key} ${ev.code} ${phase}`;
      if (existsSync(out)) {
        console.log(`${label}: exists — skipping`);
        continue;
      }
      writeStage(out, await scrapeKoPhase(dds, memo, t, ev, phase), label);
    }
  }
}

export async function runScrape(): Promise<void> {
  const tournaments = resolveTournaments();
  const eventCodes = process.env.WBF_EVENTS ? process.env.WBF_EVENTS.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : null;
  const roundsOverride = process.env.WBF_RR_ROUNDS ? parseRoundSpec(process.env.WBF_RR_ROUNDS) : null;
  const phasesOverride = process.env.WBF_KO_PHASES != null ? process.env.WBF_KO_PHASES.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : null;

  const dds = new Dds(await loadDds());
  const memo = new Map<string, number[][]>();
  for (const t of tournaments) {
    console.log(`\n===== ${t.key}: ${t.name} =====`);
    await scrapeTournament(t, dds, memo, roundsOverride, phasesOverride, eventCodes);
    console.log(`done ${t.key} — ${memo.size} distinct deals solved so far`);
  }
}
