/**
 * Ingest USBF US Bridge Championship (USBC) results into the same MatchRecord
 * JSONL the WBF scraper emits, so the existing flatten step and the bidding
 * study consume US data unchanged.
 *
 * Source: the USBF posts LoveBridge PBN files — one per round / knockout
 * segment — under usbf.org/<year>-usbcs/links-to-complete-bidding-and-play-
 * records. Each file is standard PBN with full [Deal], [Auction], [Play],
 * per-seat player names, and [Room]/[Table] tags (inherited between boards).
 * A "match" is a (Round|segment, Table) with an Open and a Closed room; the
 * two rooms give the four pairs the study needs for system detection.
 *
 * Unlike the WBF pages the PBN has no double-dummy, so we solve it here
 * (bridge-dds, memoised by PBN). Team names aren't in the file, so home/away
 * are labelled from the open-room pairs (non-authoritative — the study keys on
 * player-name pairs, not team names).
 *
 * Env:
 *   USBF_PAGE   the bidding-records page URL (default: 2026 open+all events)
 *   USBF_TOURN  tournament key written under data/<key> (default "usbc26")
 *   USBF_EVENTS comma list of event dir-tokens to keep (default "open")
 *
 * Run: npm run bridge:usbf   then  WBF_TOURN=usbc26 npm run bridge:flatten
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadDds, Dds } from 'bridge-dds';
import type { Play } from './parse';
import type { MatchRecord, MatchBoard } from './scrape';

const FETCH_DELAY_MS = 150;
const STRAINS = ['S', 'H', 'D', 'C', 'NT'];
const SEATS = ['N', 'E', 'S', 'W'] as const;

// ---- PBN parsing -----------------------------------------------------------

interface PbnGame {
  tags: Record<string, string>;
  auction: string[]; // normalised, dealer-first
  lead: string; // opening lead card, e.g. "D7"
}

/** Normalise a raw auction token to the study's call vocabulary, or null. */
function normCall(tok: string): string | null {
  const t = tok.trim();
  if (/^(pass|p)$/i.test(t)) return 'P';
  if (/^(x|dbl|double)$/i.test(t)) return 'X';
  if (/^(xx|redbl|redouble)$/i.test(t)) return 'XX';
  const m = t.match(/^([1-7])(NT|S|H|D|C)$/i);
  if (m) return m[1] + m[2].toUpperCase();
  return null; // note refs (=1=), alerts, junk
}

/**
 * Split PBN text into games with inherited tags. In PBN, tag values carry
 * forward until re-declared; Event/Round/Table/Room especially are only
 * repeated when they change, so a game inherits the running values.
 */
function parseGames(text: string): PbnGame[] {
  const blocks = text.split(/\r?\n\s*\r?\n/);
  const inherit = ['Event', 'Site', 'Date', 'Round', 'Table', 'Room'];
  const running: Record<string, string> = {};
  const games: PbnGame[] = [];
  for (const block of blocks) {
    if (!/\[(Board|Deal)\s/.test(block)) continue;
    const tags: Record<string, string> = { ...running };
    for (const m of block.matchAll(/\[(\w+)\s+"([^"]*)"\]/g)) tags[m[1]] = m[2];
    for (const k of inherit) if (tags[k] !== undefined) running[k] = tags[k];

    // Auction: lines after [Auction "x"] up to the next [Tag] or "*".
    const auction: string[] = [];
    const am = block.match(/\[Auction\s+"[^"]*"\]\s*\n([\s\S]*?)(?:\n\[|\n\*|$)/);
    if (am) {
      for (const tok of am[1].split(/\s+/)) {
        const c = normCall(tok);
        if (c) auction.push(c);
      }
    }
    // Opening lead: first token of the [Play] section.
    let lead = '';
    const pm = block.match(/\[Play\s+"[^"]*"\]\s*\n\s*([SHDC](?:10|[2-9TJQKA]))/i);
    if (pm) lead = pm[1].toUpperCase().replace('10', 'T');
    games.push({ tags, auction, lead });
  }
  return games;
}

/** Parse a PBN contract ("6S", "4SX", "3NTXX", "Pass") into parts, or null. */
function parseContract(raw: string): { level: number; strain: number; doubled: number } | null {
  const c = (raw || '').trim();
  if (c === '' || /^pass$/i.test(c)) return null;
  const m = c.match(/^([1-7])(NT|S|H|D|C)(XX|X)?$/i);
  if (!m) return null;
  const strain = STRAINS.indexOf(m[2].toUpperCase());
  return { level: Number(m[1]), strain, doubled: m[3] ? (m[3].toUpperCase() === 'XX' ? 2 : 1) : 0 };
}

const SEAT_IDX: Record<string, number> = { N: 0, E: 1, S: 2, W: 3 };

/** Build a Play from a game's tags (null for passed-out / no contract). */
function buildPlay(g: PbnGame): Play | null {
  const parts = parseContract(g.tags.Contract);
  if (!parts) return null;
  const declarer = SEAT_IDX[(g.tags.Declarer || '').toUpperCase()];
  if (declarer === undefined) return null;
  const tricks = Number(g.tags.Result);
  if (!Number.isFinite(tricks)) return null;
  // Score "NS 620" / "NS -50" → raw points for each side (study doesn't use
  // these, but flatten needs them for its score column).
  let nsPoints = 0;
  let ewPoints = 0;
  const sm = (g.tags.Score || '').match(/(NS|EW)\s+(-?\d+)/i);
  if (sm) {
    const v = Number(sm[2]);
    const ns = sm[1].toUpperCase() === 'NS' ? v : -v;
    if (ns >= 0) nsPoints = ns;
    else ewPoints = -ns;
  }
  return {
    contract: parts.level + STRAINS[parts.strain] + (parts.doubled === 2 ? 'xx' : parts.doubled === 1 ? 'x' : ''),
    level: parts.level,
    strain: parts.strain,
    declarer,
    doubled: parts.doubled,
    lead: g.lead,
    auction: g.auction,
    tricks,
    nsPoints,
    ewPoints,
  };
}

// ---- Match assembly --------------------------------------------------------

const surname = (name: string): string => (name || '').trim().split(/\s+/).slice(-1)[0] || '?';

/**
 * PBN [Deal] tags start from a rotating seat ("N:…", "E:…", "S:…", "W:…"), the
 * four hands running clockwise from it. The scraper and study assume North-first,
 * so rotate to "N:hN hE hS hW".
 */
function toNorthFirst(deal: string): string {
  const m = (deal || '').match(/^([NESW]):(.+)$/);
  if (!m) return deal;
  const hands = m[2].trim().split(/\s+/);
  if (hands.length !== 4) return deal;
  const order = ['N', 'E', 'S', 'W'];
  const start = order.indexOf(m[1]);
  const bySeat: Record<string, string> = {};
  for (let i = 0; i < 4; i++) bySeat[order[(start + i) % 4]] = hands[i];
  return `N:${bySeat.N} ${bySeat.E} ${bySeat.S} ${bySeat.W}`;
}

/** Group a file's games into MatchRecords by (segment, table), pairing rooms. */
function buildMatches(
  dds: Dds,
  memo: Map<string, number[][]>,
  games: PbnGame[],
  tournament: string,
  event: string,
  stage: string,
  segment: number,
): MatchRecord[] {
  // table → room → board → game
  const byTable = new Map<string, Map<string, Map<number, PbnGame>>>();
  for (const g of games) {
    const table = g.tags.Table || '1';
    const room = (g.tags.Room || 'Open') === 'Open' ? 'open' : 'closed';
    const board = Number(g.tags.Board);
    if (!Number.isFinite(board)) continue;
    if (!byTable.has(table)) byTable.set(table, new Map());
    const rooms = byTable.get(table)!;
    if (!rooms.has(room)) rooms.set(room, new Map());
    rooms.get(room)!.set(board, g);
  }

  const out: MatchRecord[] = [];
  for (const [table, rooms] of byTable) {
    const openGames = rooms.get('open') ?? new Map<number, PbnGame>();
    const closedGames = rooms.get('closed') ?? new Map<number, PbnGame>();
    const anyOpen = openGames.values().next().value as PbnGame | undefined;
    const anyClosed = closedGames.values().next().value as PbnGame | undefined;
    const lineup = (g: PbnGame | undefined): Record<string, { name: string; id: number | null }> => {
      const l: Record<string, { name: string; id: number | null }> = {};
      for (const s of SEATS) l[s] = { name: g?.tags[{ N: 'North', E: 'East', S: 'South', W: 'West' }[s]] ?? '', id: null };
      return l;
    };
    const boards: MatchBoard[] = [];
    const allBoards = new Set<number>([...openGames.keys(), ...closedGames.keys()]);
    for (const board of [...allBoards].sort((a, b) => a - b)) {
      const src = openGames.get(board) ?? closedGames.get(board)!;
      const pbn = toNorthFirst(src.tags.Deal || '');
      if (!pbn.startsWith('N:')) continue;
      let dd = memo.get(pbn);
      if (!dd) {
        dd = dds.CalcDDTablePBN({ cards: pbn }).resTable;
        memo.set(pbn, dd);
      }
      boards.push({
        board,
        dealer: src.tags.Dealer || 'N',
        vul: normVul(src.tags.Vulnerable),
        pbn,
        dd,
        open: openGames.has(board) ? buildPlay(openGames.get(board)!) : null,
        closed: closedGames.has(board) ? buildPlay(closedGames.get(board)!) : null,
        impHome: 0,
        impAway: 0,
      });
    }
    if (boards.length === 0) continue;
    const home = `${surname(anyOpen?.tags.North ?? '')}-${surname(anyOpen?.tags.South ?? '')}`;
    const away = `${surname(anyOpen?.tags.East ?? '')}-${surname(anyOpen?.tags.West ?? '')}`;
    out.push({
      tournament,
      event,
      stage,
      segment,
      matchid: Number(table) || out.length + 1,
      home: { name: home || 'home', id: null },
      away: { name: away || 'away', id: null },
      vpHome: null,
      vpAway: null,
      impHome: null,
      impAway: null,
      players: { open: lineup(anyOpen), closed: lineup(anyClosed) },
      boards,
    });
  }
  return out;
}

/** PBN vulnerability → the scraper's vocabulary. */
function normVul(v: string | undefined): string {
  switch ((v || 'None').trim()) {
    case 'NS':
      return 'N-S';
    case 'EW':
      return 'E-W';
    case 'All':
    case 'Both':
      return 'All';
    default:
      return 'None';
  }
}

// ---- Stage/segment from the LoveBridge file path ---------------------------

/** Map a LoveBridge dir/file token to (event, stage, segment). */
function classifyFile(href: string): { event: string; stage: string; segment: number } | null {
  const file = decodeURIComponent(href).toLowerCase();
  const ev = file.match(/2026_?(open|women|senior|seniors|mixed|juniors?|mind|kids)_/);
  const event = ev ? ev[1].replace('seniors', 'senior').toUpperCase().slice(0, 6) : 'OPEN';
  const seg = (re: RegExp): number => {
    const m = file.match(re);
    return m ? Number(m[1]) : 1;
  };
  if (/_rr_/.test(file) || /round%20robin|round robin/.test(file)) {
    return { event, stage: 'RR', segment: seg(/_r(\d+)[_-]/) || seg(/match%20?(\d+)/) };
  }
  if (/_qf|quarterfinal/.test(file)) return { event, stage: 'QF', segment: seg(/_q(\d+)/) };
  if (/_sf|semifinal/.test(file)) return { event, stage: 'SF', segment: seg(/_s(\d+)/) };
  if (/_f[_/]|final/.test(file)) return { event, stage: 'FF', segment: seg(/_f_?(\d+)/) };
  return null;
}

// ---- Fetch + orchestrate ---------------------------------------------------

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function cacheDir(tourn: string): string {
  return path.join(import.meta.dirname, 'cache', tourn);
}

async function fetchCached(tourn: string, url: string): Promise<string> {
  const dir = cacheDir(tourn);
  mkdirSync(dir, { recursive: true });
  const key = url.replace(/[^a-z0-9]+/gi, '_').slice(-180) + '.txt';
  const file = path.join(dir, key);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  writeFileSync(file, text);
  await sleep(FETCH_DELAY_MS);
  return text;
}

export async function runUsbf(): Promise<void> {
  const page = process.env.USBF_PAGE ?? 'https://usbf.org/2026-usbcs/links-to-complete-bidding-and-play-records';
  const tourn = process.env.USBF_TOURN ?? 'usbc26';
  const events = (process.env.USBF_EVENTS ?? 'open').split(',').map((s) => s.trim().toLowerCase());
  const origin = new URL(page).origin;

  console.log(`\n===== ${tourn}: USBF ${page} =====`);
  const indexHtml = await fetchCached(tourn, page);
  const hrefs = [...indexHtml.matchAll(/href="([^"]+\.pbn)"/gi)]
    .map((m) => m[1])
    .filter((h) => events.some((e) => decodeURIComponent(h).toLowerCase().includes(`_${e}_`) || decodeURIComponent(h).toLowerCase().includes(`/2026${e}`) || decodeURIComponent(h).toLowerCase().includes(`_${e}`)));
  console.log(`  ${hrefs.length} PBN files for events [${events.join(',')}]`);

  const dds = new Dds(await loadDds());
  const memo = new Map<string, number[][]>();
  const dir = path.join(import.meta.dirname, 'data', tourn);
  mkdirSync(dir, { recursive: true });

  // Accumulate all matches per (event,stage) so one JSONL per stage file.
  const byStage = new Map<string, MatchRecord[]>();
  for (const href of hrefs) {
    const cls = classifyFile(href);
    if (!cls) {
      console.log(`  ? skip (unclassified): ${href}`);
      continue;
    }
    if (!events.includes(cls.event.toLowerCase())) continue;
    const url = href.startsWith('http') ? href : origin + href;
    const text = await fetchCached(tourn, url);
    const games = parseGames(text);
    const matches = buildMatches(dds, memo, games, tourn, cls.event, cls.stage, cls.segment);
    const key = `${cls.event}-${cls.stage}`;
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(...matches);
    const contracts = matches.reduce((n, m) => n + m.boards.reduce((k, b) => k + (b.open ? 1 : 0) + (b.closed ? 1 : 0), 0), 0);
    console.log(`  ${cls.event} ${cls.stage} seg ${cls.segment}: ${matches.length} matches, ${contracts} contracts`);
  }

  for (const [key, matches] of byStage) {
    const file = path.join(dir, `${key}.jsonl`);
    writeFileSync(file, matches.map((m) => JSON.stringify(m)).join('\n') + '\n');
    console.log(`  wrote ${matches.length} matches → ${key}.jsonl`);
  }
  console.log(`done ${tourn} — ${memo.size} distinct deals solved`);
}
