/**
 * Recreate Richard Pavlicek's "Opening Bid Comparisons" (rpbridge.net/9x00)
 * from our extracted championship bidding.
 *
 * Method (his): on a team board the same hand is played at two tables. Where a
 * seat opened DIFFERENTLY at the two tables (e.g. 1♥ vs Pass, or 1♣ vs 1♦),
 * attribute the board's IMP swing to whichever choice did better. Summed over
 * every such case, the higher IMP total is the "long-term winner".
 *
 * We pair the two rooms per board, read each table's opening by seat, score the
 * board ourselves (research/bidding/score.ts — some sources give only contract +
 * tricks), and aggregate by comparison × seat × sub-strain, filtered by the
 * acting hand's HCP where Pavlicek does.
 *
 * Output: research/opening-comparisons.md.  Run: npm run research:compare
 */

import { it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseCsv, csvColumns } from './bidding/lib';
import { nsScore, toImps } from './bidding/score';

const SCRAPE_DIR = path.join(
  import.meta.dirname,
  '..',
  'Bridge - World Championship data scrape',
  'data',
  '_all',
);
const OUT = path.join(import.meta.dirname, 'opening-comparisons.md');
const OUT_JSON = path.join(import.meta.dirname, 'opening-comparisons.json');

const STRAIN: Record<string, number> = { S: 0, H: 1, D: 2, C: 3, NT: 4 };
const SEAT_ORDER = ['N', 'E', 'S', 'W'];
const SUIT_SYM: Record<string, string> = { C: '♣', D: '♦', H: '♥', S: '♠', NT: 'NT' };

const HCP_CHAR: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
function hcpOf(hand: string): number {
  let h = 0;
  for (const ch of hand) h += HCP_CHAR[ch] ?? 0;
  return h;
}

interface Table {
  room: string;
  dealer: string;
  vul: string;
  calls: string[];
  level: number;
  strain: number;
  doubled: number;
  declarer: string;
  tricks: number;
}

/** One filled comparison cell: A vs B, summed IMPs each. */
interface Cell {
  cases: number;
  impA: number;
  impB: number;
}

/** A comparison category matched from a pair of opening actions. */
interface Match {
  cmp: string; // comparison id
  sub: string; // sub-strain label
  a: string; // action A (Pavlicek's "Table 1")
  b: string; // action B
  hcpMin: number;
  hcpMax: number;
}

const ONE_BIDS = new Set(['1C', '1D', '1H', '1S']);

/** Which comparison (if any) a pair of first-round actions belongs to. */
function categorize(x: string, y: string): Match | null {
  const has = (v: string): boolean => x === v || y === v;
  const other = (v: string): string => (x === v ? y : x);
  const ANY = { hcpMin: 0, hcpMax: 40 };

  // Open vs Pass — a one-level opening vs a pass.
  if (has('P')) {
    const bid = other('P');
    if (ONE_BIDS.has(bid) || bid === '1NT') return { cmp: 'openpass', sub: bid, a: bid, b: 'P', ...ANY };
    return null;
  }
  // 1♣ vs 1♦.
  if (has('1C') && has('1D')) return { cmp: '1cd', sub: '', a: '1C', b: '1D', ...ANY };
  // One-of-a-suit vs 1NT.
  if (has('1NT')) {
    const bid = other('1NT');
    if (ONE_BIDS.has(bid)) return { cmp: '1nt', sub: bid, a: bid, b: '1NT', ...ANY };
    return null;
  }
  // One-of-a-suit vs 2NT.
  if (has('2NT')) {
    const bid = other('2NT');
    if (ONE_BIDS.has(bid)) return { cmp: '2nt', sub: bid, a: bid, b: '2NT', ...ANY };
    return null;
  }
  // One-of-a-suit vs 2♣ — strong hands (big club vs standard).
  if (has('2C')) {
    const bid = other('2C');
    if (ONE_BIDS.has(bid)) return { cmp: '2c', sub: bid, a: bid, b: '2C', hcpMin: 16, hcpMax: 40 };
    return null;
  }
  // One vs Two of the same suit — 9-15 (open vs weak/intermediate two).
  for (const s of ['C', 'D', 'H', 'S']) {
    if (has(`1${s}`) && has(`2${s}`)) return { cmp: '1v2', sub: s, a: `1${s}`, b: `2${s}`, hcpMin: 9, hcpMax: 15 };
  }
  // One vs Four of the same major — slow vs preempt.
  for (const s of ['H', 'S']) {
    if (has(`1${s}`) && has(`4${s}`)) return { cmp: '1v4', sub: s, a: `1${s}`, b: `4${s}`, ...ANY };
  }
  return null;
}

function parseContract(raw: string): { level: number; strain: number; doubled: number } | null {
  const c = (raw || '').replace(/x+$/, '');
  const m = c.match(/^([1-7])(NT|[SHDC])$/);
  if (!m) return null;
  return {
    level: Number(m[1]),
    strain: STRAIN[m[2]],
    doubled: (raw.match(/x+$/)?.[0].length ?? 0),
  };
}

it('recreate opening-bid comparisons', () => {
  if (!existsSync(path.join(SCRAPE_DIR, 'contracts.csv'))) {
    throw new Error(`missing ${SCRAPE_DIR}/contracts.csv`);
  }
  const text = readFileSync(path.join(SCRAPE_DIR, 'contracts.csv'), 'utf8');
  const lines = text.split('\n');
  const col = csvColumns([parseCsv(lines[0] + '\n')[0]]);
  const idx = (n: string): number => col.get(n)!;
  const iTourn = idx('tournament'), iEvent = idx('event'), iStage = idx('stage');
  const iSeg = idx('segment'), iMatch = idx('matchid'), iBoard = idx('board');
  const iRoom = idx('room'), iDealer = idx('dealer'), iVul = idx('vul');
  const iContract = idx('contract'), iDoubled = idx('doubled'), iDeclarer = idx('declarer');
  const iAuction = idx('auction'), iTricks = idx('tricks'), iPbn = idx('pbn');

  // Group rows into boards (each should have an open + closed room).
  const boards = new Map<string, { pbn: string; tables: Table[] }>();
  let rows = 0;
  for (let li = 1; li < lines.length; li++) {
    if (lines[li].trim() === '') continue;
    const f = parseCsv(lines[li] + '\n')[0];
    const auction = f[iAuction];
    if (!auction || auction.trim() === '') continue;
    const con = parseContract(f[iContract]);
    if (!con) continue; // passed-out / unparseable — no score to compare
    rows++;
    const key = [f[iTourn], f[iEvent], f[iStage], f[iSeg], f[iMatch], f[iBoard]].join('|');
    let b = boards.get(key);
    if (!b) {
      b = { pbn: f[iPbn], tables: [] };
      boards.set(key, b);
    }
    b.tables.push({
      room: f[iRoom],
      dealer: f[iDealer],
      vul: f[iVul],
      calls: auction.trim().split(/\s+/),
      level: con.level,
      strain: con.strain,
      doubled: con.doubled,
      declarer: f[iDeclarer],
      tricks: Number(f[iTricks]),
    });
  }

  // cmp|sub|seat → Cell
  const cells = new Map<string, Cell>();
  let comparedBoards = 0;
  let impCheck = { n: 0, sum: 0 }; // sanity: average |IMP| per compared board

  for (const { pbn, tables } of boards.values()) {
    if (tables.length !== 2) continue; // need exactly the two rooms
    const open = tables.find((t) => t.room === 'open');
    const closed = tables.find((t) => t.room === 'closed');
    if (!open || !closed || open.dealer !== closed.dealer) continue;

    // Board IMPs from the open-room-NS team's view.
    const nsOpen = nsScore(open.level, open.strain, open.doubled, open.tricks, open.vul, open.declarer);
    const nsClosed = nsScore(closed.level, closed.strain, closed.doubled, closed.tricks, closed.vul, closed.declarer);
    const impHome = toImps(nsOpen - nsClosed);
    comparedBoards++;
    impCheck.n++;
    impCheck.sum += Math.abs(impHome);

    const dealerIdx = SEAT_ORDER.indexOf(open.dealer);
    const hands = pbn.startsWith('N:') ? pbn.slice(2).trim().split(/\s+/) : [];
    if (hands.length !== 4) continue;

    // Positions 1/2/3: earlier seats must have passed at BOTH tables.
    for (let pos = 1; pos <= 3; pos++) {
      let earlierAllPass = true;
      for (let e = 0; e < pos - 1; e++) {
        if (open.calls[e] !== 'P' || closed.calls[e] !== 'P') earlierAllPass = false;
      }
      if (!earlierAllPass) break;
      const ao = open.calls[pos - 1];
      const ac = closed.calls[pos - 1];
      if (ao === undefined || ac === undefined || ao === ac) continue;
      const m = categorize(ao, ac);
      if (!m) continue;
      const seatIdx = (dealerIdx + pos - 1) % 4;
      const hcp = hcpOf(hands[seatIdx]);
      if (hcp < m.hcpMin || hcp > m.hcpMax) continue;
      const seatNS = seatIdx === 0 || seatIdx === 2;
      const impActingOpen = seatNS ? impHome : -impHome; // IMPs the OPEN-table action scored
      const impA = ao === m.a ? impActingOpen : -impActingOpen;
      const key = `${m.cmp}|${m.sub}|${['', 'First', 'Second', 'Third'][pos]}`;
      let cell = cells.get(key);
      if (!cell) {
        cell = { cases: 0, impA: 0, impB: 0 };
        cells.set(key, cell);
      }
      cell.cases++;
      if (impA > 0) cell.impA += impA;
      else cell.impB += -impA;
    }
  }

  writeFileSync(OUT, buildReport(cells, boards.size, comparedBoards, rows, impCheck));
  writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        generated: '2026-08-19',
        rows,
        comparedBoards,
        avgSwing: Number((impCheck.sum / Math.max(1, impCheck.n)).toFixed(2)),
        comparisons: structured(cells),
      },
      null,
      1,
    ) + '\n',
  );
  console.log(
    `${rows} auction rows, ${comparedBoards} two-table boards compared, ${cells.size} cells → ${OUT}`,
  );
});

/** Structured rows per comparison — drives the WesComp page (src/comp.ts). */
function structured(cells: Map<string, Cell>): Array<{
  id: string;
  title: string;
  note: string;
  rows: Array<{
    seat: string; a: string; b: string; aLabel: string; bLabel: string;
    cases: number; aImps: number; bImps: number; aPct: number; bPct: number; winner: 'a' | 'b';
  }>;
}> {
  const out = [];
  for (const cmp of COMPARISONS) {
    const rows = [];
    for (const seat of ['First', 'Second', 'Third']) {
      for (const sub of cmp.subs) {
        const cell = cells.get(`${cmp.id}|${sub}|${seat}`);
        if (!cell || cell.cases < 5) continue;
        const total = cell.impA + cell.impB;
        const aPct = total > 0 ? (100 * cell.impA) / total : 50;
        const { a, b } = abFor(cmp.id, sub);
        rows.push({
          seat, a, b, aLabel: actionLabel(a), bLabel: actionLabel(b),
          cases: cell.cases, aImps: cell.impA, bImps: cell.impB,
          aPct: Number(aPct.toFixed(1)), bPct: Number((100 - aPct).toFixed(1)),
          winner: (aPct >= 50 ? 'a' : 'b') as 'a' | 'b',
        });
      }
    }
    if (rows.length) out.push({ id: cmp.id, title: cmp.title, note: cmp.note, rows });
  }
  return out;
}

// ---------------------------------------------------------------------------

const COMPARISONS: Array<{ id: string; title: string; subs: string[]; note: string }> = [
  { id: 'openpass', title: 'Open vs Pass', subs: ['1C', '1D', '1H', '1S', '1NT'], note: 'A light opening (Table 1) vs a pass (Table 2), by strain.' },
  { id: '1cd', title: 'One Club vs One Diamond', subs: [''], note: '1♣ vs 1♦ with the same hand.' },
  { id: '1nt', title: 'One of a Suit vs 1NT', subs: ['1C', '1D', '1H', '1S'], note: 'A one-of-a-suit opening vs 1NT (usually a 5-card suit inside a balanced hand).' },
  { id: '2nt', title: 'One of a Suit vs 2NT', subs: ['1C', '1D', '1H', '1S'], note: 'One of a suit vs 2NT.' },
  { id: '2c', title: 'One of a Suit vs 2♣ (16+ HCP)', subs: ['1C', '1D', '1H', '1S'], note: 'Strong hands opened naturally at the one level vs an artificial 2♣ (big-club vs standard).' },
  { id: '1v2', title: 'One vs Two of the Same Suit (9–15 HCP)', subs: ['C', 'D', 'H', 'S'], note: 'Opening at the one level vs a weak/intermediate two, same suit.' },
  { id: '1v4', title: 'One vs Four of the Same Major', subs: ['H', 'S'], note: 'Going slow (1M) vs preempting (4M).' },
];

function actionLabel(a: string): string {
  const m = a.match(/^([1-7])(NT|[SHDC])$/);
  if (!m) return a === 'P' ? 'Pass' : a;
  return m[1] + (SUIT_SYM[m[2]] ?? m[2]);
}

/** The A/B actions for a comparison id + sub (mirrors categorize). */
function abFor(cmpId: string, sub: string): { a: string; b: string } {
  switch (cmpId) {
    case 'openpass': return { a: sub, b: 'P' };
    case '1cd': return { a: '1C', b: '1D' };
    case '1nt': return { a: sub, b: '1NT' };
    case '2nt': return { a: sub, b: '2NT' };
    case '2c': return { a: sub, b: '2C' };
    case '1v2': return { a: `1${sub}`, b: `2${sub}` };
    case '1v4': return { a: `1${sub}`, b: `4${sub}` };
    default: return { a: sub, b: '?' };
  }
}

function buildReport(
  cells: Map<string, Cell>,
  totalBoards: number,
  compared: number,
  rows: number,
  impCheck: { n: number; sum: number },
): string {
  const L: string[] = [];
  const add = (s = ''): void => L.push(s);

  add('# Opening-bid comparisons — recreated from championship bidding');
  add();
  add('A recreation of Richard Pavlicek’s [Opening Bid Comparisons]');
  add('(https://www.rpbridge.net/9x00.htm) using the auctions we have extracted from');
  add('recent World & European championships and the top US team events (2023–2026).');
  add();
  add('**Method** (his, applied to our data): on a team board the identical hand is');
  add('played at two tables. Where a seat *opened differently* at the two tables — 1♥');
  add('at one, Pass at the other; 1♣ vs 1♦; and so on — the board’s IMP swing is');
  add('awarded to whichever choice did better. Summed over every such case, the higher');
  add('IMP total is the long-term winner (**bold**). Split by seat (First = dealer,');
  add('then the passed-out positions) and, where Pavlicek does, by the acting hand’s');
  add('HCP. The meaning of a bid is not judged — but paired choices almost always have');
  add('a like relationship (1♥/1NT ≈ balanced 5-card heart hand; 1♣/2♣ ≈ big-club vs');
  add('standard).');
  add();
  add(`**Data.** ${rows.toLocaleString('en-US')} contract-auctions; ${compared.toLocaleString('en-US')} boards had both tables`);
  add(`with a bid auction and were compared (average swing ${(impCheck.sum / Math.max(1, impCheck.n)).toFixed(2)} IMPs/board).`);
  add('We score every board ourselves from contract + tricks (validated 100% against');
  add('the events that publish scores), so US events with only hand records are included.');
  add('Small samples are noisy — treat sub-30-case rows as suggestive only.');
  add();
  add('Caveat vs Pavlicek: his study is 72 events 1996–2014 (40,069 deals); ours is a');
  add('different, more recent field, so exact percentages will differ — the interest is');
  add('whether the same directional verdicts hold.');
  add();

  for (const cmp of COMPARISONS) {
    // Does this comparison have any data?
    const anyRow = ['First', 'Second', 'Third'].some((seat) =>
      cmp.subs.some((sub) => cells.has(`${cmp.id}|${sub}|${seat}`)),
    );
    if (!anyRow) continue;
    add(`## ${cmp.title}`);
    add();
    add(cmp.note);
    add();
    add('| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |');
    add('|---|---|---:|---|---:|---:|---|---:|---:|---|');
    for (const seat of ['First', 'Second', 'Third']) {
      for (const sub of cmp.subs) {
        const cell = cells.get(`${cmp.id}|${sub}|${seat}`);
        if (!cell || cell.cases < 5) continue;
        const total = cell.impA + cell.impB;
        const pctA = total > 0 ? (100 * cell.impA) / total : 50;
        const pctB = 100 - pctA;
        const { a, b } = abFor(cmp.id, sub);
        const aWins = pctA >= pctB;
        const la = aWins ? `**${actionLabel(a)}**` : actionLabel(a);
        const lb = aWins ? actionLabel(b) : `**${actionLabel(b)}**`;
        add(
          `| ${seat} | ${actionLabel(a)} vs ${actionLabel(b)} | ${cell.cases} | ${la} | ${cell.impA} | ${pctA.toFixed(1)} | ${lb} | ${cell.impB} | ${pctB.toFixed(1)} | ${aWins ? actionLabel(a) : actionLabel(b)} |`,
        );
      }
    }
    add();
  }

  add('## Files');
  add();
  add('- Regenerate: `npm run research:compare` (reads the combined scrape).');
  add('- Scoring/IMPs: `research/bidding/score.ts`; analysis: `research/opening-compare.task.ts`.');
  add();
  return L.join('\n') + '\n';
}
