/** Render deals in a choice of layouts, from very compact to detailed. */

import { h } from './dom';
import { SUITS, SUIT_SYMBOLS, RANK_LABELS, rankOf, suitOf, type Card, type Suit } from '../engine/cards';
import { type Deal, type Seat, SEATS } from '../engine/deal';
import { analyzeHand, exactShape } from '../engine/hand';
import { knrPoints } from '../engine/knr';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

export type BoardFormat = 'compass-mini' | 'compass-text' | 'compass-detailed' | 'seat-lines';

export const BOARD_FORMATS: ReadonlyArray<{ value: BoardFormat; label: string }> = [
  { value: 'compass-mini', label: 'Compass — mini' },
  { value: 'compass-text', label: 'Compass — text' },
  { value: 'compass-detailed', label: 'Compass — detailed' },
  { value: 'seat-lines', label: 'Seat lines' },
];

export const DEFAULT_FORMAT: BoardFormat = 'compass-text';

const SUIT_LETTERS: Record<Suit, string> = { S: 'S', H: 'H', D: 'D', C: 'C' };

function redClass(s: Suit): string {
  return s === 'H' || s === 'D' ? ' red' : '';
}

function ranksOf(cards: Card[], suit: Suit): string {
  const ranks = cards
    .filter((c) => suitOf(c) === suit)
    .sort((a, b) => rankOf(b) - rankOf(a))
    .map((c) => RANK_LABELS[rankOf(c)])
    .join('');
  return ranks || '—';
}

function metaText(cards: Card[]): string {
  const a = analyzeHand(cards);
  return `${a.hcp} HCP · ${knrPoints(cards)} KnR · ${exactShape(a.lengths)}`;
}

/** Inline suit holdings on one line, e.g. ♠ AKQ52  ♥ K9  ♦ Q84  ♣ K76 */
function inlineSuits(cards: Card[]): HTMLElement {
  return h(
    'span',
    { class: 'inline-suits' },
    SUITS.flatMap((s) => [
      h('span', { class: 'suit-sym' + redClass(s) }, [SUIT_SYMBOLS[s]]),
      h('span', { class: 'ranks' }, [ranksOf(cards, s)]),
    ]),
  );
}

/** Suit holdings stacked one per line. */
function stackedSuits(cards: Card[]): HTMLElement[] {
  return SUITS.map((s) =>
    h('div', { class: 'suit-line' }, [
      h('span', { class: 'suit-sym' + redClass(s) }, [SUIT_SYMBOLS[s]]),
      h('span', { class: 'ranks' }, [ranksOf(cards, s)]),
    ]),
  );
}

// ---- Compass layouts -------------------------------------------------------

function compassSeat(deal: Deal, seat: Seat, locked: boolean, variant: 'compact' | 'detailed'): HTMLElement {
  const name = h('div', { class: 'seat-name' }, [SEAT_NAMES[seat]]);
  if (locked) name.append(h('span', { class: 'lock-badge', title: 'Given (locked) hand' }, ['🔒 given']));
  const children: HTMLElement[] = [name];
  if (variant === 'detailed') children.push(h('div', { class: 'hand-meta' }, [metaText(deal.hands[seat])]));
  children.push(...stackedSuits(deal.hands[seat]));
  return h('div', { class: `seat pos-${seat}` + (locked ? ' locked' : '') }, children);
}

/** Mini: each seat is a single line — abbreviation + inline holdings. */
function compassMiniSeat(deal: Deal, seat: Seat, locked: boolean): HTMLElement {
  return h('div', { class: `seat mini pos-${seat}` + (locked ? ' locked' : '') }, [
    h('span', { class: 'seat-abbr', title: SEAT_NAMES[seat] }, [locked ? `🔒${seat}` : seat]),
    inlineSuits(deal.hands[seat]),
  ]);
}

function compassBoard(
  deal: Deal,
  label: string,
  locked: Set<Seat>,
  variant: 'mini' | 'compact' | 'detailed',
): HTMLElement {
  const seats =
    variant === 'mini'
      ? SEATS.map((s) => compassMiniSeat(deal, s, locked.has(s)))
      : SEATS.map((s) => compassSeat(deal, s, locked.has(s), variant));
  return h('div', { class: `compass ${variant}` }, [
    ...seats,
    h('div', { class: 'compass-center' }, [label]),
  ]);
}

// ---- Text compass (monospace "S: AKQ" hand diagram) ------------------------

// Rendered as a real <pre> of the exact text the Copy button produces, so that
// selecting it on screen and pasting into Notepad/email keeps the alignment.
// Hearts/diamonds suit letters are tinted red without disturbing the text.
function compassTextBoard(deal: Deal): HTMLElement {
  const text = joinCompass(
    handLinesLetters(deal.hands.N),
    handLinesLetters(deal.hands.E),
    handLinesLetters(deal.hands.S),
    handLinesLetters(deal.hands.W),
  );
  const children: Array<Node | string> = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const part of line.split(/(H:|D:)/)) {
      if (part === 'H:' || part === 'D:') children.push(h('span', { class: 'red' }, [part]));
      else if (part !== '') children.push(part);
    }
    if (i < lines.length - 1) children.push('\n');
  });
  return h('pre', { class: 'compass-pre' }, children);
}

// ---- Seat-line layout ------------------------------------------------------

function seatLinesBoard(deal: Deal, locked: Set<Seat>): HTMLElement {
  return h(
    'div',
    { class: 'seat-lines' },
    SEATS.map((seat) =>
      h('div', { class: 'hand-line' }, [
        h('span', { class: 'seat-tag' + (locked.has(seat) ? ' locked' : '') }, [
          locked.has(seat) ? `🔒 ${seat}` : seat,
        ]),
        inlineSuits(deal.hands[seat]),
      ]),
    ),
  );
}

// ---- Public -----------------------------------------------------------------

export function boardElement(
  deal: Deal,
  index: number,
  lockedSeats: Seat[],
  format: BoardFormat,
): HTMLElement {
  const locked = new Set(lockedSeats);
  const label = String(index + 1);
  const head = h('div', { class: 'board-head' }, [`Board ${index + 1}`]);

  let body: HTMLElement;
  switch (format) {
    case 'compass-mini':
      body = compassBoard(deal, label, locked, 'mini');
      break;
    case 'compass-text':
      body = compassTextBoard(deal);
      break;
    case 'compass-detailed':
      body = compassBoard(deal, label, locked, 'detailed');
      break;
    case 'seat-lines':
      body = seatLinesBoard(deal, locked);
      break;
  }

  return h('article', { class: `board fmt-${format}` }, [head, body]);
}

// ---- Plain-text rendering (for the Copy button) ----------------------------

function inlineSuitsText(cards: Card[]): string {
  return SUITS.map((s) => `${SUIT_SYMBOLS[s]} ${ranksOf(cards, s)}`).join('  ');
}

function handLinesSymbols(cards: Card[], detailed: boolean): string[] {
  const lines: string[] = [];
  if (detailed) lines.push(metaText(cards));
  for (const s of SUITS) lines.push(`${SUIT_SYMBOLS[s]} ${ranksOf(cards, s)}`);
  return lines;
}

function handLinesLetters(cards: Card[]): string[] {
  return SUITS.map((s) => `${SUIT_LETTERS[s]}: ${ranksOf(cards, s)}`);
}

/** Arrange four per-hand line blocks into a compass: N top, W/E sides, S bottom. */
function joinCompass(n: string[], e: string[], s: string[], w: string[]): string {
  const wWidth = Math.max(0, ...w.map((l) => l.length));
  const indent = ' '.repeat(wWidth + 2);
  const eastCol = wWidth + 4;
  const out: string[] = [];
  for (const l of n) out.push((indent + l).replace(/\s+$/, ''));
  const rows = Math.max(w.length, e.length);
  for (let i = 0; i < rows; i++) {
    out.push(((w[i] ?? '').padEnd(eastCol) + (e[i] ?? '')).replace(/\s+$/, ''));
  }
  for (const l of s) out.push((indent + l).replace(/\s+$/, ''));
  return out.join('\n');
}

/** Mini compass: one line per hand, N top / W,E middle / S bottom. */
function joinCompassMini(deal: Deal): string {
  const line = (seat: Seat): string => `${seat} ${inlineSuitsText(deal.hands[seat])}`;
  const wl = line('W');
  const col = wl.length + 3;
  const indent = ' '.repeat(Math.floor(col / 2));
  return [
    (indent + line('N')).replace(/\s+$/, ''),
    (wl.padEnd(col) + line('E')).replace(/\s+$/, ''),
    (indent + line('S')).replace(/\s+$/, ''),
  ].join('\n');
}

function seatLinesText(deal: Deal, locked: Set<Seat>): string {
  return SEATS.map((seat) => {
    const tag = locked.has(seat) ? `🔒${seat}` : seat;
    return `${tag}  ${inlineSuitsText(deal.hands[seat])}`;
  }).join('\n');
}

/** One board rendered as plain text in the given layout. */
export function boardText(deal: Deal, index: number, lockedSeats: Seat[], format: BoardFormat): string {
  const locked = new Set(lockedSeats);
  const hands = deal.hands;
  let body: string;
  switch (format) {
    case 'compass-text':
      body = joinCompass(handLinesLetters(hands.N), handLinesLetters(hands.E), handLinesLetters(hands.S), handLinesLetters(hands.W));
      break;
    case 'compass-detailed':
      body = joinCompass(
        handLinesSymbols(hands.N, true), handLinesSymbols(hands.E, true),
        handLinesSymbols(hands.S, true), handLinesSymbols(hands.W, true),
      );
      break;
    case 'compass-mini':
      body = joinCompassMini(deal);
      break;
    case 'seat-lines':
      body = seatLinesText(deal, locked);
      break;
  }
  return `Board ${index + 1}\n${body}`;
}

/** All deals as plain text in the given layout (for the Copy button). */
export function dealsLayoutText(deals: Deal[], lockedSeats: Seat[], format: BoardFormat): string {
  return deals.map((d, i) => boardText(d, i, lockedSeats, format)).join('\n\n');
}
