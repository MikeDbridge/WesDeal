/**
 * Ingest BBO vugraph LIN broadcasts (the strong US NABC knockouts — Vanderbilt,
 * Spingold, Soloway) into the same MatchRecord JSONL the WBF scraper emits.
 *
 * The BBO vugraph archive is searchable (POST vugraph_archives.php) and each hit
 * downloads a .lin via tools/vugraph_linfetch.php?id=N. A teams LIN carries both
 * rooms of one segment: `vg|title,seg,…,team1,sc,team2,sc|`, `pn|` 8 players
 * (open S,W,N,E then closed S,W,N,E), then per board `qx|o16`/`qx|c16`,
 * `md|<dealer><Shand,Whand,Nhand,Ehand>`, `sv|` vul, `mb|` the auction,
 * `pc|` the play. Deals are S/W/N/E order and dealer is a digit (1=S…4=E), so
 * we rotate to North-first PBN; the auction is already dealer-first.
 *
 * Contract/declarer/doubled are derived from the auction (so they always agree
 * with what the study validates); tricks come from the `mc|` claim when present,
 * else assume the contract made. DD is solved locally.
 *
 * Env:
 *   LIN_SEARCH  search string(s), ';'-separated (default "Vanderbilt 2025")
 *   LIN_TOURN   tournament key under data/<key> (default "nabc25")
 *
 * Run: npm run bridge:lin   then  WBF_TOURN=nabc25 npm run bridge:flatten
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadDds, Dds } from 'bridge-dds';
import type { Play } from './parse';
import type { MatchRecord, MatchBoard } from './scrape';

const FETCH_DELAY_MS = 200;
const STRAINS = ['S', 'H', 'D', 'C', 'NT'];
const ARCHIVE = 'https://www.bridgebase.com/vugraph_archives/vugraph_archives.php?v3b=';
const LINFETCH = 'https://www.bridgebase.com/tools/vugraph_linfetch.php?id=';

// ---- LIN parsing -----------------------------------------------------------

/** A LIN token stream → key/value pairs (pipe-delimited). */
function linPairs(lin: string): Array<[string, string]> {
  const parts = lin.replace(/\r/g, '').split('|');
  const out: Array<[string, string]> = [];
  for (let i = 0; i + 1 < parts.length; i += 2) out.push([parts[i].trim(), parts[i + 1]]);
  return out;
}

/** LIN hand "SAK96HK75DAKT7CQ6" → PBN "AK96.K75.AKT7.Q6". */
function linHandToPbn(h: string): string {
  const s = (h.match(/S([^HDC]*)/) || [, ''])[1] ?? '';
  const he = (h.match(/H([^SDC]*)/) || [, ''])[1] ?? '';
  const d = (h.match(/D([^SHC]*)/) || [, ''])[1] ?? '';
  const c = (h.match(/C([^SHD]*)/) || [, ''])[1] ?? '';
  return `${s}.${he}.${d}.${c}`;
}

const LIN_SEATS = ['S', 'W', 'N', 'E']; // md digit order & pn order

/** md value "<dealer>Shand,Whand,Nhand,Ehand" → {dealer letter, N-first PBN}. */
function parseDeal(md: string): { dealer: string; pbn: string } | null {
  const m = md.match(/^(\d)(.+)$/);
  if (!m) return null;
  const dealer = LIN_SEATS[Number(m[1]) - 1];
  if (!dealer) return null;
  const hands = m[2].split(',');
  if (hands.length < 3) return null;
  // Fill a missing 4th hand if BBO omitted it (rare) — leave as-is if 4 given.
  const bySeat: Record<string, string> = {};
  LIN_SEATS.forEach((seat, i) => (bySeat[seat] = hands[i] ? linHandToPbn(hands[i]) : ''));
  if (!bySeat.N || !bySeat.E || !bySeat.S || !bySeat.W) return null;
  return { dealer, pbn: `N:${bySeat.N} ${bySeat.E} ${bySeat.S} ${bySeat.W}` };
}

/** LIN call → the study's vocabulary, or null (alerts/junk). */
function normBid(b: string): string | null {
  const t = b.replace(/[!^].*$/, '').trim().toLowerCase(); // strip alert markers
  if (t === 'p' || t === 'pass') return 'P';
  if (t === 'd') return 'X';
  if (t === 'r') return 'XX';
  const m = t.match(/^([1-7])(n|nt|s|h|d|c)$/);
  if (m) return m[1] + (m[2].startsWith('n') ? 'NT' : m[2].toUpperCase());
  return null;
}

const LIN_VUL: Record<string, string> = { o: 'None', n: 'N-S', e: 'E-W', b: 'All' };
const STUDY_SEAT: Record<string, number> = { N: 0, E: 1, S: 2, W: 3 };

interface LinBoard {
  board: number;
  room: 'open' | 'closed';
  dealer: string;
  vul: string;
  pbn: string;
  auction: string[];
  claim: number | null;
}

interface LinFile {
  title: string;
  segment: string;
  team1: string;
  team2: string;
  players: string[]; // 8: open S,W,N,E then closed S,W,N,E
  boards: LinBoard[];
}

function parseLin(lin: string): LinFile {
  const pairs = linPairs(lin);
  const file: LinFile = { title: '', segment: '', team1: '', team2: '', players: [], boards: [] };
  let cur: LinBoard | null = null;
  for (const [k, v] of pairs) {
    switch (k) {
      case 'vg': {
        const f = v.split(',');
        file.title = f[0] ?? '';
        file.segment = f[1] ?? '';
        file.team1 = f[5] ?? '';
        file.team2 = f[7] ?? '';
        break;
      }
      case 'pn':
        if (file.players.length === 0) file.players = v.split(',');
        break;
      case 'qx': {
        if (cur) file.boards.push(cur);
        const room = v[0] === 'c' ? 'closed' : 'open';
        const board = Number(v.slice(1).replace(/[^0-9]/g, ''));
        cur = { board, room, dealer: 'N', vul: 'None', pbn: '', auction: [], claim: null };
        break;
      }
      case 'md': {
        if (!cur) break;
        const d = parseDeal(v);
        if (d) {
          cur.dealer = d.dealer;
          cur.pbn = d.pbn;
        }
        break;
      }
      case 'sv':
        if (cur) cur.vul = LIN_VUL[v.trim().toLowerCase()] ?? 'None';
        break;
      case 'mb': {
        if (!cur) break;
        const c = normBid(v);
        if (c) cur.auction.push(c);
        break;
      }
      case 'mc':
        if (cur) cur.claim = Number(v) || null;
        break;
    }
  }
  if (cur) file.boards.push(cur);
  return file;
}

// ---- Auction → contract/declarer -------------------------------------------

function bidRank(bid: string): number {
  const level = Number(bid[0]);
  return level * 5 + ['C', 'D', 'H', 'S', 'NT'].indexOf(bid.slice(1));
}

/** Derive contract/declarer/doubled/tricks from a dealer-first auction. */
function playFromAuction(dealer: string, auction: string[], claim: number | null): Play | null {
  const dealerIdx = STUDY_SEAT[dealer];
  let lastBid = '';
  let lastBidSeat = -1;
  let dbl = 0;
  const firstNamer = new Map<string, number>();
  auction.forEach((call, i) => {
    const seat = (dealerIdx + i) % 4;
    if (call === 'P') return;
    if (call === 'X') dbl = 1;
    else if (call === 'XX') dbl = 2;
    else {
      lastBid = call;
      lastBidSeat = seat;
      dbl = 0;
      const key = `${seat % 2}|${call.slice(1)}`;
      if (!firstNamer.has(key)) firstNamer.set(key, seat);
    }
  });
  if (lastBid === '') return null; // passed out
  const strain = STRAINS.indexOf(lastBid.slice(1));
  const level = Number(lastBid[0]);
  const declarer = firstNamer.get(`${lastBidSeat % 2}|${lastBid.slice(1)}`);
  if (declarer === undefined) return null;
  const tricks = claim !== null ? claim : level + 6;
  return {
    contract: lastBid + (dbl === 2 ? 'xx' : dbl === 1 ? 'x' : ''),
    level,
    strain,
    declarer,
    doubled: dbl,
    lead: '',
    auction,
    tricks,
    nsPoints: 0,
    ewPoints: 0,
  };
}

// ---- Match assembly --------------------------------------------------------

const named = (n: string): { name: string; id: number | null } => ({ name: (n || '').trim(), id: null });

function buildMatch(
  dds: Dds,
  memo: Map<string, number[][]>,
  file: LinFile,
  tournament: string,
  stage: string,
  segment: number,
  matchid: number,
): MatchRecord | null {
  const p = file.players;
  const openLine = { N: named(p[2] ?? ''), E: named(p[3] ?? ''), S: named(p[0] ?? ''), W: named(p[1] ?? '') };
  const closedLine = { N: named(p[6] ?? ''), E: named(p[7] ?? ''), S: named(p[4] ?? ''), W: named(p[5] ?? '') };
  const byBoard = new Map<number, MatchBoard>();
  for (const lb of file.boards) {
    if (!lb.pbn.startsWith('N:')) continue;
    let dd = memo.get(lb.pbn);
    if (!dd) {
      try {
        dd = dds.CalcDDTablePBN({ cards: lb.pbn }).resTable;
      } catch {
        continue;
      }
      memo.set(lb.pbn, dd);
    }
    let mb = byBoard.get(lb.board);
    if (!mb) {
      mb = { board: lb.board, dealer: lb.dealer, vul: lb.vul, pbn: lb.pbn, dd, open: null, closed: null, impHome: 0, impAway: 0 };
      byBoard.set(lb.board, mb);
    }
    const play = playFromAuction(lb.dealer, lb.auction, lb.claim);
    if (lb.room === 'open') mb.open = play;
    else mb.closed = play;
  }
  const boards = [...byBoard.values()].sort((a, b) => a.board - b.board);
  if (boards.length === 0) return null;
  return {
    tournament,
    event: 'OPEN',
    stage,
    segment,
    matchid,
    home: named(file.team1 || 'home'),
    away: named(file.team2 || 'away'),
    vpHome: null,
    vpAway: null,
    impHome: null,
    impAway: null,
    players: { open: openLine, closed: closedLine },
    boards,
  };
}

/** Classify a LIN vg segment string ("FN-4_4", "R32-2", "SF-1") into stage. */
function classifySegment(title: string, seg: string): { stage: string; segment: number } {
  const s = (seg + ' ' + title).toUpperCase();
  const num = (seg.match(/(\d+)(?!.*\d)/) || [, '1'])[1];
  const n = Number(num) || 1;
  if (/\bFN?\b|FINAL/.test(s)) return { stage: 'FF', segment: n };
  if (/\bSF\b|SEMI/.test(s)) return { stage: 'SF', segment: n };
  if (/\bQF\b|QUART/.test(s)) return { stage: 'QF', segment: n };
  if (/R16|ROUND ?OF ?16|\b16\b/.test(s)) return { stage: '16', segment: n };
  if (/R32|ROUND ?OF ?32|\b32\b/.test(s)) return { stage: '32', segment: n };
  return { stage: 'KO', segment: n };
}

// ---- Fetch (cached) --------------------------------------------------------

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function cacheDir(tourn: string): string {
  return path.join(import.meta.dirname, 'cache', tourn);
}

async function cachedGet(tourn: string, url: string, key: string): Promise<string> {
  const dir = cacheDir(tourn);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, key);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  writeFileSync(file, text);
  await sleep(FETCH_DELAY_MS);
  return text;
}

async function searchArchive(tourn: string, query: string): Promise<Array<{ id: string; title: string; seg: string }>> {
  const dir = cacheDir(tourn);
  mkdirSync(dir, { recursive: true });
  const key = `search_${query.replace(/[^a-z0-9]+/gi, '_')}.html`;
  const file = path.join(dir, key);
  let html: string;
  if (existsSync(file)) html = readFileSync(file, 'utf8');
  else {
    const res = await fetch(ARCHIVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `command=search&searchstring=${encodeURIComponent(query)}`,
    });
    html = await res.text();
    writeFileSync(file, html);
    await sleep(FETCH_DELAY_MS);
  }
  // Each result row: a title cell and a linfetch download link.
  const rows: Array<{ id: string; title: string; seg: string }> = [];
  const rowRe = /<tr[\s\S]*?<\/tr>/gi;
  for (const rm of html.match(rowRe) ?? []) {
    const idm = rm.match(/vugraph_linfetch\.php\?id=(\d+)/);
    if (!idm) continue;
    const cells = [...rm.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const title = cells.find((c) => /vander|spingold|soloway|USBC|final|semi|quarter|R\d/i.test(c)) ?? cells[0] ?? '';
    const seg = cells.find((c) => /[A-Z]{1,3}-?\d|final|semi|quart/i.test(c)) ?? '';
    rows.push({ id: idm[1], title, seg });
  }
  return rows;
}

export async function runLin(): Promise<void> {
  const queries = (process.env.LIN_SEARCH ?? 'Vanderbilt 2025').split(';').map((s) => s.trim()).filter(Boolean);
  const tourn = process.env.LIN_TOURN ?? 'nabc25';

  console.log(`\n===== ${tourn}: BBO vugraph LIN [${queries.join(' | ')}] =====`);
  const dds = new Dds(await loadDds());
  const memo = new Map<string, number[][]>();
  const dir = path.join(import.meta.dirname, 'data', tourn);
  mkdirSync(dir, { recursive: true });

  const byStage = new Map<string, MatchRecord[]>();
  let matchSeq = 0;
  for (const query of queries) {
    const rows = await searchArchive(tourn, query);
    console.log(`  "${query}": ${rows.length} LIN files`);
    for (const row of rows) {
      const lin = await cachedGet(tourn, LINFETCH + row.id, `lin_${row.id}.lin`);
      if (!/\bmb\|/.test(lin)) continue; // no auctions → skip
      const file = parseLin(lin);
      const { stage, segment } = classifySegment(file.title || row.title, file.segment || row.seg);
      const match = buildMatch(dds, memo, file, tourn, stage, segment, ++matchSeq);
      if (!match) continue;
      const key = `OPEN-${stage}`;
      if (!byStage.has(key)) byStage.set(key, []);
      byStage.get(key)!.push(match);
    }
  }

  for (const [key, matches] of byStage) {
    const contracts = matches.reduce((n, m) => n + m.boards.reduce((k, b) => k + (b.open ? 1 : 0) + (b.closed ? 1 : 0), 0), 0);
    writeFileSync(path.join(dir, `${key}.jsonl`), matches.map((m) => JSON.stringify(m)).join('\n') + '\n');
    console.log(`  ${key}: ${matches.length} matches, ${contracts} contracts → ${key}.jsonl`);
  }
  console.log(`done ${tourn} — ${memo.size} distinct deals solved`);
}
