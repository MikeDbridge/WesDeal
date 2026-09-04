/**
 * Import a deal from almost any text, entirely client-side: PBN deal lines
 * ("N:AKQ2.54.T987.J32 …") and full PBN files, BBO LIN text and handviewer
 * URLs, and free-text hand diagrams (compass layouts, "AKQ52 K9 Q84 K76"
 * lines, dotted hands). `importDeal` sniffs the format and routes; the
 * sub-parsers are exported for tests.
 *
 * Parsing is deliberately forgiving: whatever can be read lands in a
 * `DraftDeal` of per-seat dotted holdings for the review grid, and
 * `checkDraft` reports exact per-hand and cross-hand problems so a bad
 * import is fixed in place rather than re-imported.
 */

import { type Card, type Suit, SUITS, SUIT_SYMBOLS, RANK_LABELS, rankOf, suitOf, cardLabel } from './cards';
import { SEATS, type Seat, type Deal } from './deal';
import { type Vulnerability, dealerOf, vulnerabilityOf } from './board';
import { parseSuitHolding } from './parse';
import { handToPBN } from './format';
import { missingCards } from './play';

export interface DraftDeal {
  /** Per-seat dotted holdings "AKQ2.54.T987.J32" (♠.♥.♦.♣); '' = unknown. */
  hands: Record<Seat, string>;
  dealer?: Seat;
  vul?: Vulnerability;
  /** e.g. "4S", "3NT", "4Sx" (no declarer). */
  contract?: string;
  declarer?: Seat;
  /** Cards played so far, concatenated codes "SKS3…". */
  play?: string;
}

export type ImportFormat = 'pbn' | 'pbn-file' | 'lin' | 'bbo-url' | 'text';

export interface ImportResult {
  deal: DraftDeal | null;
  format: ImportFormat | null;
  errors: string[];
  /** Non-fatal information ("file has 24 boards; imported board 1"). */
  notes: string[];
}

const emptyHands = (): Record<Seat, string> => ({ N: '', E: '', S: '', W: '' });

// ---- Small text helpers -----------------------------------------------------

const VOID_RE = /^[-–—.]$/;

/** Normalise one suit's ranks: uppercase, 10→T, spaces/commas out, dashes → void. */
function normHolding(raw: string): string {
  const t = raw.trim();
  if (t === '' || VOID_RE.test(t)) return '';
  return t.toUpperCase().replace(/10/g, 'T').replace(/[\s,]/g, '');
}

function seatFromText(raw: string | undefined): Seat | undefined {
  if (!raw) return undefined;
  const t = raw.trim().toUpperCase();
  if (t === 'N' || t === 'NORTH') return 'N';
  if (t === 'E' || t === 'EAST') return 'E';
  if (t === 'S' || t === 'SOUTH') return 'S';
  if (t === 'W' || t === 'WEST') return 'W';
  return undefined;
}

/** PBN words, LIN letters and common shorthand for vulnerability. */
function vulFromText(raw: string | undefined): Vulnerability | undefined {
  if (!raw) return undefined;
  const t = raw.trim().toUpperCase().replace(/[\s/]/g, '-');
  if (['NONE', 'LOVE', 'O', '-', 'NIL'].includes(t)) return 'None';
  if (['NS', 'N-S', 'N'].includes(t)) return 'NS';
  if (['EW', 'E-W', 'E'].includes(t)) return 'EW';
  if (['ALL', 'BOTH', 'B'].includes(t)) return 'Both';
  return undefined;
}

const CONTRACT_TAG_RE = /^\s*([1-7])\s*(NT|N|[SHDC])\s*(XX|X)?\s*$/i;

/** "4SX" / "3NT" → canonical "4Sx"; null for "Pass" or junk. */
function normContract(raw: string): string | undefined {
  const m = CONTRACT_TAG_RE.exec(raw);
  if (!m) return undefined;
  const strain = m[2].toUpperCase().startsWith('N') ? 'NT' : m[2].toUpperCase();
  return m[1] + strain + 'x'.repeat(m[3] ? m[3].length : 0);
}

// ---- PBN --------------------------------------------------------------------

/** A PBN Deal value: "N:AKQ2.54.T987.J32 … … …" (any first seat; "-" hidden). */
export function parsePbnDeal(value: string): { hands: Record<Seat, string>; errors: string[] } {
  const hands = emptyHands();
  const errors: string[] = [];
  const m = /^\s*([NESW])\s*:\s*(.*)$/i.exec(value.trim());
  if (!m) {
    errors.push('A PBN deal starts with the first seat, e.g. "N:…".');
    return { hands, errors };
  }
  const first = m[1].toUpperCase() as Seat;
  const tokens = m[2].trim().split(/\s+/).filter((t) => t !== '');
  if (tokens.length > 4) errors.push(`Expected at most 4 hands; got ${tokens.length}.`);
  let i = SEATS.indexOf(first);
  tokens.slice(0, 4).forEach((token, k) => {
    const seat = SEATS[(i + k) % 4];
    if (VOID_RE.test(token)) return; // hidden hand
    const parts = token.split('.');
    if (parts.length !== 4) {
      errors.push(`${seat}: "${token}" is not spades.hearts.diamonds.clubs.`);
      return;
    }
    hands[seat] = parts.map(normHolding).join('.');
  });
  return { hands, errors };
}

/** Tags of (the first game in) a PBN file. */
export function parsePbnFile(text: string): ImportResult {
  const notes: string[] = [];
  const dealCount = [...text.matchAll(/\[\s*Deal\s+"/gi)].length;
  let slice = text;
  if (dealCount > 1) {
    // Keep everything up to the second [Deal …] so later boards' tags don't bleed in.
    const second = /\[\s*Deal\s+"/gi;
    second.exec(slice);
    const m = second.exec(slice);
    if (m) slice = slice.slice(0, m.index);
    notes.push(`PBN file has ${dealCount} deals; imported the first.`);
  }

  const tags = new Map<string, string>();
  for (const m of slice.matchAll(/\[\s*(\w+)\s+"([^"]*)"\s*\]/g)) {
    const key = m[1].toLowerCase();
    if (!tags.has(key)) tags.set(key, m[2]);
  }
  const dealValue = tags.get('deal');
  if (dealValue === undefined) {
    return { deal: null, format: 'pbn-file', errors: ['No [Deal "…"] tag found.'], notes };
  }
  const { hands, errors } = parsePbnDeal(dealValue);

  const boardNo = Number.parseInt(tags.get('board') ?? '', 10);
  const deal: DraftDeal = { hands };
  deal.dealer = seatFromText(tags.get('dealer')) ?? (boardNo >= 1 ? dealerOf(boardNo) : undefined);
  deal.vul = vulFromText(tags.get('vulnerable')) ?? (boardNo >= 1 ? vulnerabilityOf(boardNo) : undefined);
  const contract = normContract(tags.get('contract') ?? '');
  const declarer = seatFromText(tags.get('declarer'));
  if (contract) deal.contract = contract;
  if (declarer) deal.declarer = declarer;
  return { deal, format: 'pbn-file', errors, notes };
}

// ---- LIN (BBO) --------------------------------------------------------------

/** LIN hand "SAK96HK75DAKT7CQ6" → dotted "AK96.K75.AKT7.Q6"; '' stays ''. */
export function linHandToDotted(hand: string): string {
  const t = hand.trim().toUpperCase().replace(/10/g, 'T');
  if (t === '') return '';
  const grab = (letter: string): string => {
    const m = new RegExp(`${letter}([^SHDC]*)`).exec(t);
    return m ? m[1] : '';
  };
  return [grab('S'), grab('H'), grab('D'), grab('C')].map(normHolding).join('.');
}

const LIN_SEATS: Seat[] = ['S', 'W', 'N', 'E']; // md digit order & hand order
const LIN_VUL: Record<string, Vulnerability> = { o: 'None', n: 'NS', e: 'EW', b: 'Both' };

/** LIN call → "P"/"X"/"XX"/"1S"…, or null for alerts and junk. */
function normBid(call: string): string | null {
  const t = call.replace(/[!^].*$/, '').trim().toLowerCase();
  if (t === 'p' || t === 'pass') return 'P';
  if (t === 'd') return 'X';
  if (t === 'r') return 'XX';
  const m = /^([1-7])(nt?|[shdc])$/.exec(t);
  if (m) return m[1] + (m[2].startsWith('n') ? 'NT' : m[2].toUpperCase());
  return null;
}

/**
 * Contract and declarer from a dealer-first auction (declarer = the first
 * player of the winning side to name the final strain).
 */
export function contractFromAuction(dealer: Seat, calls: string[]): { contract: string; declarer: Seat } | null {
  const dealerIdx = SEATS.indexOf(dealer);
  let lastBid = '';
  let lastBidSeat = -1;
  let dbl = 0;
  const firstNamer = new Map<string, number>();
  calls.forEach((call, i) => {
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
  const namer = firstNamer.get(`${lastBidSeat % 2}|${lastBid.slice(1)}`);
  if (namer === undefined) return null;
  return { contract: lastBid + 'x'.repeat(dbl), declarer: SEATS[namer] };
}

/** A LIN token stream (handviewer or vugraph); multi-board files → board 1. */
export function parseLin(lin: string): ImportResult {
  const parts = lin.replace(/\r/g, '').split('|');
  const errors: string[] = [];
  const notes: string[] = [];

  let boards = 0;
  let md = '';
  let sv = '';
  const calls: string[] = [];
  const playCodes: string[] = [];
  let claim: number | null = null;
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const key = parts[i].trim().toLowerCase();
    const value = parts[i + 1];
    if (key === 'qx') {
      boards++;
      if (boards > 1) break; // later boards of a vugraph file
      continue;
    }
    switch (key) {
      case 'md':
        if (md === '') md = value;
        break;
      case 'sv':
        sv = value.trim().toLowerCase();
        break;
      case 'mb': {
        const call = normBid(value);
        if (call) calls.push(call);
        break;
      }
      case 'pc': {
        const code = value.trim().toUpperCase().replace(/10/g, 'T').slice(0, 2);
        if (/^[SHDC][AKQJT98765432]$/.test(code)) playCodes.push(code);
        break;
      }
      case 'mc':
        claim = Number.parseInt(value, 10) || null;
        break;
    }
  }
  if (boards > 1) notes.push(`LIN has several boards; imported the first.`);
  if (md === '') {
    return { deal: null, format: 'lin', errors: ['No deal (md|…) found in the LIN data.'], notes };
  }

  const m = /^(\d)(.*)$/s.exec(md.trim());
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 4) {
    return { deal: null, format: 'lin', errors: [`Unrecognised LIN deal "${md.slice(0, 24)}…".`], notes };
  }
  const hands = emptyHands();
  const handTokens = m[2].split(',');
  LIN_SEATS.forEach((seat, i) => {
    hands[seat] = linHandToDotted(handTokens[i] ?? '');
  });
  fillFourthHand(hands, notes);

  const deal: DraftDeal = { hands, dealer: LIN_SEATS[Number(m[1]) - 1] };
  if (LIN_VUL[sv]) deal.vul = LIN_VUL[sv];

  const auction = contractFromAuction(deal.dealer!, calls);
  if (auction) {
    deal.contract = auction.contract;
    deal.declarer = auction.declarer;
    if (playCodes.length > 0) deal.play = playCodes.join('');
  } else if (playCodes.length > 0) {
    notes.push('Play ignored — no auction to derive the contract from.');
  }
  if (claim !== null) notes.push(`Result was claimed (${claim} tricks); play imported up to the claim.`);
  return { deal, format: 'lin', errors, notes };
}

/** When exactly one hand is missing and the others hold 13 each, deduce it. */
function fillFourthHand(hands: Record<Seat, string>, notes: string[]): void {
  const empty = SEATS.filter((s) => hands[s] === '' || hands[s] === '...');
  if (empty.length !== 1) return;
  const known: Partial<Record<Seat, Card[]>> = {};
  for (const seat of SEATS) {
    if (seat === empty[0]) continue;
    const { cards, errors } = parseDotted(hands[seat]);
    if (errors.length > 0 || cards.length !== 13) return;
    known[seat] = cards;
  }
  hands[empty[0]] = handToPBN(missingCards(known));
  notes.push(`${empty[0]} was missing; filled in from the other three hands.`);
}

// ---- BBO handviewer URLs ----------------------------------------------------

/** A URL (or bare query) with lin=… or the n=/e=/s=/w= handviewer params. */
export function parseBboUrl(text: string): ImportResult {
  const linMatch = /[?&#]lin=([^&#\s]+)/i.exec(text) ?? /^\s*lin=([^&#\s]+)/i.exec(text);
  if (linMatch) {
    let lin = safeDecode(linMatch[1]);
    if (!lin.includes('|') && lin.includes('%7C')) lin = safeDecode(lin); // double-encoded
    const result = parseLin(lin);
    return { ...result, format: 'bbo-url' };
  }

  // Individual-hand params: n= e= s= w= (LIN hand syntax), d= dealer, v= vul, b= board.
  const query = text.slice(text.indexOf('?') + 1).replace(/#/g, '&');
  const params = new URLSearchParams(query);
  const hands = emptyHands();
  let found = 0;
  for (const seat of SEATS) {
    const value = params.get(seat.toLowerCase());
    if (value) {
      hands[seat] = linHandToDotted(value);
      found++;
    }
  }
  if (found === 0) {
    return { deal: null, format: 'bbo-url', errors: ['No lin= or hand parameters found in the URL.'], notes: [] };
  }
  const notes: string[] = [];
  fillFourthHand(hands, notes);
  const deal: DraftDeal = { hands };

  const d = params.get('d')?.trim();
  if (d && /^[1-4]$/.test(d)) deal.dealer = LIN_SEATS[Number(d) - 1];
  else deal.dealer = seatFromText(d ?? undefined);
  const v = params.get('v')?.trim().toLowerCase();
  if (v && LIN_VUL[v]) deal.vul = LIN_VUL[v];
  const board = Number.parseInt(params.get('b') ?? '', 10);
  if (board >= 1) {
    deal.dealer = deal.dealer ?? dealerOf(board);
    deal.vul = deal.vul ?? vulnerabilityOf(board);
  }
  return { deal, format: 'bbo-url', errors: [], notes };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ---- Free text --------------------------------------------------------------

const SEAT_LABEL_RE = /^\s*(?:🔒\s*)?(North|East|South|West|[NESW])\b\s*[:.\-]?\s*/i;
const SUIT_BY_SYMBOL: Record<string, Suit> = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' };

interface SuitMark {
  suit: Suit;
  /** Start of the marker in the line (for left/right column split). */
  index: number;
  holding: string;
}

/** All "S: AKQ2" / "♠ AKQ2" fragments in one line, with their columns. */
function suitMarks(line: string): SuitMark[] {
  // The lookbehind keeps "HANDS:" or "CARDS:" from reading as a spade line.
  const re = /(?<![A-Za-z])([SHDC])\s*:|([♠♥♦♣])/g;
  const found: Array<{ suit: Suit; index: number; end: number }> = [];
  for (let m = re.exec(line); m; m = re.exec(line)) {
    const suit = m[1] ? (m[1].toUpperCase() as Suit) : SUIT_BY_SYMBOL[m[2]];
    found.push({ suit, index: m.index, end: m.index + m[0].length });
  }
  return found.map((f, i) => ({
    suit: f.suit,
    index: f.index,
    holding: normHolding(line.slice(f.end, i + 1 < found.length ? found[i + 1].index : undefined)),
  }));
}

/** Free text: compass diagrams, labeled hands, 4-token or dotted hand lines. */
export function parseFreeText(text: string): ImportResult {
  const errors: string[] = [];
  const notes: string[] = [];
  const hands = emptyHands();
  const assigned = new Set<Seat>();
  /** Seats named by the user (a label or header) — never second-guessed. */
  const explicit = new Set<Seat>();

  const deal: DraftDeal = { hands };
  const lines = text.split(/\r?\n/);

  // Metadata anywhere in the text.
  const dealerM = /\b(?:dealer|dlr)\b\s*[:=]?\s*(North|East|South|West|[NESW])\b/i.exec(text);
  if (dealerM) deal.dealer = seatFromText(dealerM[1]);
  const vulM = /\bvul(?:n|nerable)?\b\s*[:=]?\s*([\w/-]+)/i.exec(text);
  if (vulM) deal.vul = vulFromText(vulM[1]);
  const boardM = /\bboard\b\s*[:#]?\s*(\d+)/i.exec(text);
  if (boardM) {
    const board = Number(boardM[1]);
    deal.dealer = deal.dealer ?? dealerOf(board);
    deal.vul = deal.vul ?? vulnerabilityOf(board);
  }
  const contractM = /\b([1-7])\s*(NT|[SHDC♠♥♦♣])\s*(XX|X)?\s+by\s+(North|East|South|West|[NESW])\b/i.exec(text);
  if (contractM) {
    const strain = SUIT_BY_SYMBOL[contractM[2]] ?? contractM[2];
    deal.contract = normContract(contractM[1] + strain + (contractM[3] ?? ''));
    deal.declarer = seatFromText(contractM[4]);
  }

  const takeSeat = (wanted: Seat | undefined): Seat | undefined => {
    if (wanted) {
      if (assigned.has(wanted)) return undefined; // labeled seat already filled — skip
      assigned.add(wanted);
      explicit.add(wanted);
      return wanted;
    }
    const free = SEATS.find((s) => !assigned.has(s));
    if (free) assigned.add(free);
    return free;
  };

  // "S:" at the start of a line is ambiguous — spades in a compass diagram,
  // South before a whole hand. It reads as SOUTH when what follows is several
  // rank tokens or a dotted hand ("S: T863 A87 AKQ 965"), and as SPADES when
  // it is a single holding ("S: AKQ2").
  const rankToken = (t: string): boolean => /^(?:[AKQJTakqjt0-9x]+|[-–—.])$/.test(t);
  const seatHandLine = (line: string): boolean => {
    const m = /^\s*(?:🔒\s*)?S\s*[:.\-]\s*(.*)$/.exec(line);
    if (!m) return false;
    const toks = m[1].trim().split(/\s+/).filter((t) => t !== '');
    if (toks.length === 1) return toks[0].split('.').length === 4;
    return toks.length >= 2 && toks.every(rankToken);
  };
  const seatLabelOf = (line: string): { seat: Seat | undefined; length: number } => {
    const m = SEAT_LABEL_RE.exec(line);
    if (!m || /^\s*(?:🔒\s*)?S\s*:/.test(line)) return { seat: undefined, length: 0 };
    return { seat: seatFromText(m[1]), length: m[0].length };
  };

  // Pass 1: suit-marked lines (compass diagrams, "♠ AKQ52 ♥ K9 …" seat lines).
  let currentHeader: Seat | undefined;
  let sawColumns = false;
  let usedMarks = false;
  for (const line of lines) {
    const headerM = /^\s*(?:🔒\s*)?(North|East|West|South|[NESW])\s*:?\s*$/i.exec(line);
    if (headerM) {
      currentHeader = seatFromText(headerM[1]);
      continue;
    }
    if (seatHandLine(line)) continue; // "S: T863 A87 AKQ 965" — pass 2's job
    const label = seatLabelOf(line);
    const marks = suitMarks(label.seat ? line.slice(label.length) : line);
    if (marks.length === 0) continue;
    usedMarks = true;

    const put = (seat: Seat | undefined, ms: SuitMark[]): void => {
      if (!seat) return;
      const suits: Record<Suit, string> = { S: '', H: '', D: '', C: '' };
      const existing = hands[seat] === '' ? [] : hands[seat].split('.');
      SUITS.forEach((s, i) => (suits[s] = existing[i] ?? ''));
      for (const mk of ms) suits[mk.suit] = mk.holding;
      hands[seat] = SUITS.map((s) => suits[s]).join('.');
    };

    if (marks.length >= 4) {
      // One whole hand on the line ("♠ AKQ52 ♥ K9 ♦ Q84 ♣ K76"), maybe labeled.
      put(takeSeat(label.seat), marks.slice(0, 4));
      currentHeader = undefined;
    } else if (marks.length === 2 && marks[0].suit === marks[1].suit) {
      // West/East columns of a compass diagram (same suit twice on the line).
      if (!sawColumns) {
        sawColumns = true;
        assigned.add('W');
        assigned.add('E');
      }
      put('W', [marks[0]]);
      put('E', [marks[1]]);
      currentHeader = undefined;
    } else {
      // One suit per line: a labeled block, or North above / South below columns.
      const seat = currentHeader ?? (sawColumns ? 'S' : 'N');
      if (currentHeader) explicit.add(seat);
      assigned.add(seat);
      put(seat, marks);
    }
  }

  // Pass 2 (only when no suit markers did the work): token lines.
  if (!usedMarks) {
    for (const line of lines) {
      const labelM = SEAT_LABEL_RE.exec(line);
      const rest = (labelM ? line.slice(labelM[0].length) : line).trim();
      if (rest === '') continue;
      const tokens = rest.split(/\s+/);
      const allDotted = tokens.length <= 4 && tokens.every((t) => t.split('.').length === 4);
      if (allDotted) {
        if (tokens.length > 1) {
          // Several whole hands on one line, N E S W order.
          for (const token of tokens) {
            const seat = takeSeat(undefined);
            if (seat) hands[seat] = token.split('.').map(normHolding).join('.');
          }
        } else {
          const seat = takeSeat(seatFromText(labelM?.[1]));
          if (seat) hands[seat] = tokens[0].split('.').map(normHolding).join('.');
        }
        continue;
      }
      if (tokens.length === 4 && tokens.every((t) => /^(?:[AKQJTakqjt0-9x]+|[-–—.])$/.test(t))) {
        const seat = takeSeat(seatFromText(labelM?.[1]));
        if (seat) hands[seat] = tokens.map(normHolding).join('.');
      }
    }
  }

  const found = SEATS.filter((s) => hands[s] !== '');
  if (found.length === 0) {
    return { deal: null, format: 'text', errors: ['Could not find any hands in the text.'], notes };
  }
  if (found.length === 1 && found[0] === 'N' && !explicit.has('N')) {
    // A single pasted hand is usually "my hand" — put it in South.
    hands.S = hands.N;
    hands.N = '';
    notes.push('Single hand placed in South — fill in or edit the rest below.');
  } else if (found.length < 4) {
    notes.push(`Found ${found.length} hand${found.length === 1 ? '' : 's'} — complete the rest below.`);
  }
  fillFourthHand(hands, notes);
  return { deal, format: 'text', errors, notes };
}

// ---- Detection --------------------------------------------------------------

/** Sniff the format and parse. The one entry point the import panel needs. */
export function importDeal(text: string): ImportResult {
  const trimmed = text.trim();
  if (trimmed === '') return { deal: null, format: null, errors: ['Nothing to import.'], notes: [] };

  if (/\[\s*Deal\s+"/i.test(trimmed)) return parsePbnFile(trimmed);
  if (/https?:\/\//i.test(trimmed) || /(?:^|[?&#\s])lin=/i.test(trimmed)) return parseBboUrl(trimmed);
  // A PBN deal value: the first hand token holds a dot (or is "-" for hidden).
  if (/^[NESW]\s*:\s*(?:[^\s|]*\.|[-–—](?:\s|$))/i.test(trimmed)) {
    const { hands, errors } = parsePbnDeal(trimmed);
    return { deal: { hands }, format: 'pbn', errors, notes: [] };
  }
  if (/(?:^|\|)\s*(?:md|qx|pn|st|sv|mb|pc)\s*\|/i.test(trimmed)) return parseLin(trimmed);
  return parseFreeText(trimmed);
}

// ---- Validation for the review grid ----------------------------------------

export interface SeatCheck {
  cards: Card[];
  count: number;
  errors: string[];
}

export interface DealCheck {
  seats: Record<Seat, SeatCheck>;
  /** Cards claimed by two seats, e.g. "♠K is in both N and E". */
  crossErrors: string[];
  /** Cards in no hand (useful while a deal is partial). */
  missing: Card[];
  ok: boolean;
  deal: Deal | null;
}

/** Parse one dotted holding into cards + errors (no length check). */
function parseDotted(dotted: string): { cards: Card[]; errors: string[] } {
  const parts = dotted.split('.');
  const errors: string[] = [];
  if (parts.length > 4) errors.push(`Too many suits — use ♠.♥.♦.♣ with 3 dots.`);
  const cards: Card[] = [];
  SUITS.forEach((suit, i) => {
    const r = parseSuitHolding(suit, parts[i] ?? '');
    cards.push(...r.cards);
    errors.push(...r.errors);
  });
  return { cards, errors };
}

/** Validate the whole grid: 13 per hand, 52 unique cards, per-seat messages. */
export function checkDraft(hands: Record<Seat, string>): DealCheck {
  const seats = {} as Record<Seat, SeatCheck>;
  const owner = new Map<Card, Seat>();
  const crossErrors: string[] = [];

  for (const seat of SEATS) {
    const { cards, errors } = parseDotted(hands[seat]);
    if (cards.length !== 13 && (cards.length > 0 || hands[seat] !== '')) {
      errors.push(`${cards.length} card${cards.length === 1 ? '' : 's'} — a hand needs 13.`);
    } else if (hands[seat] === '') {
      errors.push('Hand is empty.');
    }
    for (const card of cards) {
      const other = owner.get(card);
      if (other !== undefined) crossErrors.push(`${cardLabel(card)} is in both ${other} and ${seat}.`);
      else owner.set(card, seat);
    }
    seats[seat] = { cards, count: cards.length, errors };
  }

  const missing: Card[] = [];
  for (let c = 0; c < 52; c++) if (!owner.has(c)) missing.push(c);

  const ok = crossErrors.length === 0 && SEATS.every((s) => seats[s].errors.length === 0 && seats[s].count === 13);
  const deal = ok
    ? { hands: { N: seats.N.cards, E: seats.E.cards, S: seats.S.cards, W: seats.W.cards } }
    : null;
  return { seats, crossErrors, missing, ok, deal };
}

/** "♠5 ♠2 ♥7" — compact list of missing cards for the grid's helper line. */
export function missingLabel(missing: Card[]): string {
  const bySuit = new Map<Suit, string[]>();
  for (const card of missing) {
    const suit = suitOf(card);
    if (!bySuit.has(suit)) bySuit.set(suit, []);
    bySuit.get(suit)!.push(RANK_LABELS[rankOf(card)]);
  }
  return SUITS.filter((s) => bySuit.has(s))
    .map((s) => `${SUIT_SYMBOLS[s]}${bySuit.get(s)!.sort((a, b) => rankValue(b) - rankValue(a)).join('')}`)
    .join(' ');
}

function rankValue(label: string): number {
  return 'AKQJT98765432'.length - 'AKQJT98765432'.indexOf(label);
}
