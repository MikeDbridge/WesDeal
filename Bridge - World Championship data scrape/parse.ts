/**
 * Pure parsers for the World Bridge Federation results microsites: raw HTML in,
 * structured data out, with no Node dependencies. Kept separate from scrape.ts
 * (the fetching / DD / orchestration side) so the parser unit tests can import
 * it without pulling Node globals into a typecheck.
 *
 * Captures everything the result pages expose: deals, teams, players by seat,
 * VP/IMP, and per table the contract, full auction, opening lead, tricks and
 * score. See scrape.ts for the page types and how these compose into a scrape.
 */

/** DD strain index: 0=♠ 1=♥ 2=♦ 3=♣ 4=NT (matches bridge-dds resTable). */
export const STRAIN_INDEX: Record<string, number> = { S: 0, H: 1, D: 2, C: 3, NT: 4 };
export const STRAIN_LABELS = ['S', 'H', 'D', 'C', 'NT'];
/** DD declarer index: 0=N 1=E 2=S 3=W. */
export const SEAT_INDEX: Record<string, number> = { N: 0, E: 1, S: 2, W: 3 };
export const SEATS = ['N', 'E', 'S', 'W'] as const;
export type Seat = (typeof SEATS)[number];

// ---- Small HTML helpers ----------------------------------------------------

function symbolize(html: string): string {
  return html
    .replace(/&spades;/gi, 'S')
    .replace(/&hearts;/gi, 'H')
    .replace(/&diams;/gi, 'D')
    .replace(/&clubs;/gi, 'C');
}
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
function decode(text: string): string {
  return text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}
/** Integer in a cell (blanks / "&nbsp;" → 0). */
function intOf(cellHtml: string): number {
  const n = Number(stripTags(cellHtml).replace(/[^\d-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// ---- Deals -----------------------------------------------------------------

export interface Deal {
  dealer: string; // N/E/S/W
  vul: string; // None / N-S / E-W / All
  /** PBN "N:♠.♥.♦.♣ ..." in N E S W order. */
  pbn: string;
}

function cleanRanks(s: string): string {
  return (s.match(/[AKQJT2-9]/g) ?? []).join('');
}

function parseHandCell(cellHtml: string): string {
  const flat = decode(stripTags(symbolize(cellHtml)));
  const holding: Record<string, string> = { S: '', H: '', D: '', C: '' };
  const re = /([SHDC])([^SHDC]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(flat)) !== null) holding[m[1]] = cleanRanks(m[2]);
  return `${holding.S}.${holding.H}.${holding.D}.${holding.C}`;
}

/**
 * Parse a handsacross / HandsAcrossKO page into board number → deal.
 *
 * Each board is a compass grid with no seat labels — position fixes the seat:
 * North on top (full width), West mid-left, East mid-right, South on the bottom.
 * The four hand cells therefore appear in document order N, W, E, S. (Confirmed
 * against the bidding: board 1's mid-right hand is the 15-HCP 1NT opener = East.)
 */
export function parseHands(html: string): Map<number, Deal> {
  const out = new Map<number, Deal>();
  const headerRe = /Brd\s+(\d+)\s*<br>\s*([NESW])\/([^<]+)</gi;
  const headers: { board: number; dealer: string; vul: string; at: number }[] = [];
  let hm: RegExpExecArray | null;
  while ((hm = headerRe.exec(html)) !== null) {
    headers.push({ board: Number(hm[1]), dealer: hm[2], vul: hm[3].trim(), at: hm.index });
  }
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].at;
    const end = i + 1 < headers.length ? headers[i + 1].at : html.length;
    const block = html.slice(start, end);
    const cells = [...block.matchAll(/class="BrdDispl"[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 4) continue;
    const [north, west, east, south] = cells.map(parseHandCell);
    const pbn = `N:${north} ${east} ${south} ${west}`; // PBN order N E S W
    out.set(headers[i].board, { dealer: headers[i].dealer, vul: headers[i].vul, pbn });
  }
  return out;
}

function normVul(s: string): string {
  const t = s.trim().toLowerCase();
  if (t.startsWith('none') || t === 'love' || t === '') return 'None';
  if (t.startsWith('all') || t.startsWith('both')) return 'All';
  if (t.includes('north') || (t.includes('n') && t.includes('s'))) return 'N-S';
  if (t.includes('east') || (t.includes('e') && t.includes('w'))) return 'E-W';
  return 'None';
}

/**
 * Parse a single-board BoardAcross page (used where there is no per-round
 * handsacross page, e.g. Marrakech 2023) into that board's deal. Cells: [0] is
 * the "Board N. Dealer X. Y Vulnerable." header; [1..4] are the hands in the
 * same compass order as handsacross (N, W, E, S).
 */
export function parseBoardAcrossDeal(html: string): { board: number; deal: Deal } | null {
  const cells = [...html.matchAll(/class="BrdDispl"[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
  if (cells.length < 5) return null;
  const header = decode(stripTags(cells[0]));
  const bm = header.match(/Board\s+(\d+)/i);
  const dm = header.match(/Dealer\s+(North|East|South|West)/i);
  const vm = header.match(/\.\s*([A-Za-z/\s-]+?)\s+Vulnerable/i);
  if (!bm || !dm) return null;
  const [north, west, east, south] = [cells[1], cells[2], cells[3], cells[4]].map(parseHandCell);
  return {
    board: Number(bm[1]),
    deal: { dealer: dm[1][0].toUpperCase(), vul: normVul(vm ? vm[1] : ''), pbn: `N:${north} ${east} ${south} ${west}` },
  };
}

/**
 * Map board number → BoardAcross `qboard` token, from a BoardDetails page. The
 * token stops at `&` or `"`, so a KO link (…qboard=001.01.QF.2354&qphase=QF")
 * yields just "001.01.QF.2354". Anchored on the BoardAcross href so the
 * PlayDetails links (which also carry a qboard param) are ignored.
 */
export function parseBoardQboards(html: string): Map<number, string> {
  const out = new Map<number, string>();
  for (const m of html.matchAll(/BoardAcross(?:KO)?\.asp\?qboard=([0-9A-Za-z.]+)[^>]*>\s*(\d+)/gi)) out.set(Number(m[2]), m[1]);
  return out;
}

// ---- Match / round index ---------------------------------------------------

/** Match ids on a RoundTeams (RR) or knockoutphase (KO) page, in order, unique. */
export function parseMatchIds(html: string): number[] {
  const seen = new Set<number>();
  for (const m of html.matchAll(/BoardDetails(?:KO)?\.asp\?qmatchid=(\d+)/gi)) seen.add(Number(m[1]));
  return [...seen];
}

/** The KO segment a BoardDetailsKO page belongs to (from its HandsAcrossKO link). */
export function parseKoSegment(html: string): number | null {
  const m = html.match(/HandsAcrossKO\.asp\?qtournid=\d+&qround=(\d+)/i);
  return m ? Number(m[1]) : null;
}

// ---- Match metadata: teams, players, VP/IMP --------------------------------

export interface NamedId {
  name: string;
  /** Team id (RR) or player id; null when the page doesn't expose one. */
  id: number | null;
}
export type Lineup = Record<Seat, NamedId | null>;

export interface MatchMeta {
  home: NamedId;
  away: NamedId;
  /** VP is round-robin only; null in the knockout (segments show IMP only). */
  vpHome: number | null;
  vpAway: number | null;
  impHome: number | null;
  impAway: number | null;
  /** Players by seat in each room. */
  open: Lineup;
  closed: Lineup;
}

const EMPTY_LINEUP = (): Lineup => ({ N: null, E: null, S: null, W: null });

/** The two team names/ids flanking the "vs" in the match header. */
function parseTeams(head: string): { home: NamedId; away: NamedId } {
  const ANCHOR = /<a\s+[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
  const ONE = /<a\s+[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i;
  const named = (m: RegExpMatchArray | undefined | null): NamedId => {
    if (!m) return { name: '', id: null };
    const idM = m[1].match(/qteamid=(\d+)/i);
    return { name: decode(m[2]).trim(), id: idM ? Number(idM[1]) : null };
  };
  const vsIdx = head.search(/>\s*vs\s*<\/font>/i);
  if (vsIdx >= 0) {
    const before = [...head.slice(0, vsIdx).matchAll(ANCHOR)];
    return { home: named(before[before.length - 1]), away: named(head.slice(vsIdx).match(ONE)) };
  }
  const all = [...head.matchAll(ANCHOR)];
  return { home: named(all[0]), away: named(all[1]) };
}

/**
 * Parse a BoardDetails / BoardDetailsKO header into teams, VP/IMP and the eight
 * players. Player anchors appear in a fixed template order:
 *   openN, closedN, openW, openE, closedW, closedE, openS, closedS
 */
export function parseMatchMeta(html: string): MatchMeta {
  const head = html.split(/<tr\s+height=6/i)[0];
  const { home, away } = parseTeams(head);

  const vp = head.match(/([\d.]+)\s*-\s*([\d.]+)\s*VP/i);
  const imp = head.match(/(-?\d+)\s*-\s*(-?\d+)\s*IMP/i);

  // Player name comes from the photo's alt text (2025, 2023 RR) or, when there is
  // no photo, the anchor text itself (2023 KO).
  const players = [...head.matchAll(/qryid=(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .slice(0, 8)
    .map((m): NamedId => {
      const alt = m[2].match(/alt="([^"]*)"/i);
      const name = alt ? alt[1] : decode(stripTags(m[2]));
      return { name: name.replace(/\s+/g, ' ').trim(), id: Number(m[1]) };
    });
  const at = (i: number): NamedId | null => players[i] ?? null;
  const open: Lineup = { N: at(0), W: at(2), E: at(3), S: at(6) };
  const closed: Lineup = { N: at(1), W: at(4), E: at(5), S: at(7) };

  return {
    home,
    away,
    vpHome: vp ? Number(vp[1]) : null,
    vpAway: vp ? Number(vp[2]) : null,
    impHome: imp ? Number(imp[1]) : null,
    impAway: imp ? Number(imp[2]) : null,
    open,
    closed,
  };
}

// ---- Per-table results: contract, auction, lead, tricks, score -------------

export interface Play {
  /** e.g. "3H", "4Sx", "3NT". */
  contract: string;
  level: number;
  strain: number; // DD strain index
  declarer: number; // DD declarer index
  doubled: 0 | 1 | 2;
  /** Opening lead as suit+rank, e.g. "CA", "HT"; "" if none recorded. */
  lead: string;
  /** Full auction, dealer first, as normalised calls: "P" "X" "XX" "1NT" "2D"… */
  auction: string[];
  tricks: number;
  /** Score to N-S / E-W in points (one is 0); the non-zero side scored. */
  nsPoints: number;
  ewPoints: number;
}

export interface BoardResult {
  open: Play | null;
  closed: Play | null;
  /** IMPs won on this board by the home / away team. */
  impHome: number;
  impAway: number;
}

function normCall(raw: string): string {
  const t = decode(stripTags(symbolize(raw))).replace(/\s+/g, '');
  if (t === '' || t === '-') return t;
  if (/^pass$/i.test(t)) return 'P';
  if (t === 'x') return 'X';
  if (t === 'xx') return 'XX';
  return t.toUpperCase(); // "1NT", "2D", "3H", …
}

/**
 * Parse the auction out of a contract cell's tooltip table. The table's first
 * four <td>s are the W/N/E/S header; the rest are calls in W-N-E-S order. Cells
 * before the dealer are "-" pads, so stripping leading pads yields a dealer-first
 * sequence. A truncated final cell (the site cuts the closing pass) is dropped.
 */
function parseAuction(spanInner: string): string[] {
  const tds = [...spanInner.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => normCall(m[1]));
  const calls = tds.slice(4); // drop the W/N/E/S header row
  let i = 0;
  while (i < calls.length && (calls[i] === '-' || calls[i] === '')) i++;
  const seq: string[] = [];
  for (; i < calls.length; i++) {
    if (calls[i] === '') break;
    seq.push(calls[i]);
  }
  return seq;
}

function parseContractCell(cellHtml: string): { level: number; strain: number; doubled: 0 | 1 | 2 } | null {
  const t = decode(stripTags(symbolize(cellHtml)))
    .replace(/ \d+ /g, '') // drop the span placeholder token (see parseResults)
    .replace(/\s+/g, '');
  const m = t.match(/^([1-7])(NT|S|H|D|C)(x{0,2})$/);
  if (!m) return null; // "Pass" (passed out) or empty
  return { level: Number(m[1]), strain: STRAIN_INDEX[m[2]], doubled: m[3].length as 0 | 1 | 2 };
}

/** One room's play, read from the six cells starting at `base`. */
function parsePlay(cells: string[], base: number, spans: string[]): Play | null {
  const contract = parseContractCell(cells[base]);
  const decl = stripTags(cells[base + 1]).trim().replace(/[^NESW]/g, '');
  const tricks = Number(stripTags(cells[base + 3]).replace(/[^\d]/g, ''));
  if (!contract || !(decl in SEAT_INDEX) || Number.isNaN(tricks)) return null;
  const label = `${contract.level}${STRAIN_LABELS[contract.strain]}${'x'.repeat(contract.doubled)}`;
  const lead = decode(stripTags(symbolize(cells[base + 2]))).replace(/\s+/g, '');
  const tok = cells[base].match(/ (\d+) /);
  const auction = tok ? parseAuction(spans[Number(tok[1])]) : [];
  return {
    contract: label,
    level: contract.level,
    strain: contract.strain,
    declarer: SEAT_INDEX[decl],
    doubled: contract.doubled,
    lead,
    auction,
    tricks,
    nsPoints: intOf(cells[base + 4]),
    ewPoints: intOf(cells[base + 5]),
  };
}

/** Parse a BoardDetails / BoardDetailsKO page into board number → both rooms. */
export function parseResults(html: string): Map<number, BoardResult> {
  const out = new Map<number, BoardResult>();
  // Pull tooltip bidding tables into `spans`, leaving a short token in place so
  // each board row still splits into 15 flat <td>s while the auction stays with
  // its own contract cell.
  const spans: string[] = [];
  const clean = html.replace(/<span>([\s\S]*?)<\/span>/gi, (_m, inner: string) => ` ${spans.push(inner) - 1} `);

  for (const rowM of clean.matchAll(/<tr\s+height=6[\s\S]*?<\/tr>/gi)) {
    const cells = [...rowM[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 13) continue;
    const board = Number(stripTags(cells[0]).replace(/[^\d]/g, ''));
    if (!board) continue;
    out.set(board, {
      open: parsePlay(cells, 1, spans),
      closed: parsePlay(cells, 7, spans),
      impHome: intOf(cells[13] ?? ''),
      impAway: intOf(cells[14] ?? ''),
    });
  }
  return out;
}

/** Parse a round spec like "1", "1-23", "1,3,5-7" into a list of round numbers. */
export function parseRoundSpec(spec: string): number[] {
  const rounds = new Set<number>();
  for (const part of spec.split(',')) {
    const range = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      for (let r = Number(range[1]); r <= Number(range[2]); r++) rounds.add(r);
    } else if (part.trim()) rounds.add(Number(part.trim()));
  }
  return [...rounds].sort((a, b) => a - b);
}
