/** Render deals in a choice of layouts, from very compact to detailed. */

import { h } from './dom';
import { SUITS, SUIT_SYMBOLS, RANK_LABELS, rankOf, suitOf, type Card, type Suit } from '../engine/cards';
import { type Deal, type Seat, SEATS } from '../engine/deal';
import { analyzeHand, exactShape } from '../engine/hand';
import { knrPoints } from '../engine/knr';
import { DD_STRAIN_LABELS, DD_DECLARER_LABELS, cellKey, type DDCell } from '../engine/dd';

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
  const width = (lines: string[]): number => Math.max(0, ...lines.map((l) => l.length));
  const gap = 4;
  const eastCol = width(w) + gap; // column where the East block begins
  const fullWidth = eastCol + width(e);
  // Centre North/South over the whole figure, not just the West column.
  const nsWidth = Math.max(width(n), width(s));
  const nsIndent = ' '.repeat(Math.max(0, Math.round((fullWidth - nsWidth) / 2)));

  const out: string[] = [];
  const trimEnd = (line: string): string => line.replace(/\s+$/, '');
  for (const l of n) out.push(trimEnd(nsIndent + l));
  const rows = Math.max(w.length, e.length);
  for (let i = 0; i < rows; i++) {
    out.push(trimEnd((w[i] ?? '').padEnd(eastCol) + (e[i] ?? '')));
  }
  for (const l of s) out.push(trimEnd(nsIndent + l));
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

// ---- Double-dummy results --------------------------------------------------

/** Concise one-liner for a single cell, e.g. "♥ S 10". */
function ddLineElement(cells: DDCell[], tricks: number[]): HTMLElement {
  const parts: Array<Node | string> = [];
  cells.forEach((c, i) => {
    if (i > 0) parts.push(' · ');
    const red = c.strain === 1 || c.strain === 2;
    parts.push(h('span', { class: 'dd-strain' + (red ? ' red' : '') }, [DD_STRAIN_LABELS[c.strain]]));
    parts.push(` ${DD_DECLARER_LABELS[c.declarer]} ${tricks[i]}`);
  });
  return h('div', { class: 'dd-line dd-result' }, parts);
}

// Declarer rows grouped by partnership: N, S, then E, W.
const DD_ROW_ORDER = [0, 2, 1, 3];

/** Compact strain × declarer table for several cells ("–" where not solved). */
function ddTableElement(cells: DDCell[], tricks: number[]): HTMLElement {
  const value = new Map<string, number>();
  cells.forEach((c, i) => value.set(cellKey(c.strain, c.declarer), tricks[i]));
  const strains = [...new Set(cells.map((c) => c.strain))].sort((a, b) => a - b);
  const declarers = DD_ROW_ORDER.filter((d) => cells.some((c) => c.declarer === d));

  const header = h('tr', {}, [
    h('th', {}, []),
    ...strains.map((s) =>
      h('th', { class: 'dd-th' + (s === 1 || s === 2 ? ' red' : '') }, [DD_STRAIN_LABELS[s]]),
    ),
  ]);
  const rows = declarers.map((d) =>
    h('tr', {}, [
      h('th', { class: 'dd-th' }, [DD_DECLARER_LABELS[d]]),
      ...strains.map((s) => {
        const v = value.get(cellKey(s, d));
        return h('td', { class: v === undefined ? 'dd-empty' : '' }, [v === undefined ? '–' : String(v)]);
      }),
    ]),
  );
  return h('table', { class: 'dd-result dd-result-table' }, [h('thead', {}, [header]), h('tbody', {}, rows)]);
}

/** Per-board DD output: one line for a single cell, a small table for several. */
export function ddResultElement(cells: DDCell[], tricks: number[]): HTMLElement {
  return cells.length > 1 ? ddTableElement(cells, tricks) : ddLineElement(cells, tricks);
}

// ---- Double-dummy summary (distribution comparison) ------------------------

const DD_PALETTE = ['#1d6f42', '#c0392b', '#2c6fb0', '#b8860b', '#7d3c98', '#138d90', '#d35400', '#566573'];

function cellLabelText(c: DDCell): string {
  return `${DD_STRAIN_LABELS[c.strain]}${DD_DECLARER_LABELS[c.declarer]}`;
}
function cellLabelNodes(c: DDCell): Array<Node | string> {
  const red = c.strain === 1 || c.strain === 2;
  return [h('span', { class: red ? 'red' : '' }, [DD_STRAIN_LABELS[c.strain]]), DD_DECLARER_LABELS[c.declarer]];
}
function swatch(ci: number): HTMLElement {
  return h('span', { class: 'dd-swatch', style: `background:${DD_PALETTE[ci % DD_PALETTE.length]}` }, []);
}

/**
 * A summary across all solved deals: a grouped histogram of how many deals make
 * each number of tricks (one colour per selected cell, for direct comparison),
 * plus an average/range table. `perDeal[i]` holds the tricks for each cell.
 */
export function ddSummaryElement(cells: DDCell[], perDeal: number[][]): HTMLElement {
  const n = perDeal.length;
  const series = cells.map((_, ci) => perDeal.map((r) => r[ci]));

  let xMin = 13;
  let xMax = 0;
  for (const vals of series) for (const v of vals) {
    if (v < xMin) xMin = v;
    if (v > xMax) xMax = v;
  }
  if (xMin > xMax) {
    xMin = 0;
    xMax = 0;
  }

  const counts = series.map((vals) => {
    const arr = new Array<number>(xMax - xMin + 1).fill(0);
    for (const v of vals) arr[v - xMin]++;
    return arr;
  });
  let yMax = 1;
  for (const arr of counts) for (const c of arr) if (c > yMax) yMax = c;

  const barW = cells.length <= 4 ? 13 : cells.length <= 8 ? 7 : 4;
  const plotH = 120;

  const legend = h('div', { class: 'dd-legend' },
    cells.map((c, ci) => h('span', { class: 'dd-legend-item' }, [swatch(ci), ...cellLabelNodes(c)])),
  );

  const columns: HTMLElement[] = [];
  for (let x = xMin; x <= xMax; x++) {
    const bars = counts.map((arr, ci) => {
      const cnt = arr[x - xMin];
      const hpx = cnt === 0 ? 0 : Math.max(2, Math.round((cnt / yMax) * plotH));
      return h('div', {
        class: 'dd-bar',
        style: `height:${hpx}px;width:${barW}px;background:${DD_PALETTE[ci % DD_PALETTE.length]}`,
        title: `${cellLabelText(cells[ci])}: ${cnt} of ${n} make ${x}`,
      }, []);
    });
    columns.push(
      h('div', { class: 'dd-col2' }, [
        h('div', { class: 'dd-bars', style: `height:${plotH}px` }, bars),
        h('div', { class: 'dd-xlabel' }, [String(x)]),
      ]),
    );
  }
  const chart = h('div', { class: 'dd-chart' }, [
    h('div', { class: 'dd-yaxis' }, [h('span', {}, [String(yMax)]), h('span', {}, ['0'])]),
    h('div', { class: 'dd-plot' }, columns),
  ]);

  const statRows = cells.map((c, ci) => {
    const vals = series[ci];
    const mean = (vals.reduce((a, b) => a + b, 0) / n).toFixed(2);
    return h('tr', {}, [
      h('th', {}, [swatch(ci), ...cellLabelNodes(c)]),
      h('td', {}, [mean]),
      h('td', {}, [`${Math.min(...vals)}–${Math.max(...vals)}`]),
    ]);
  });
  const stats = h('table', { class: 'dd-stats' }, [
    h('thead', {}, [h('tr', {}, [h('th', {}, ['Cell']), h('th', {}, ['Avg']), h('th', {}, ['Range'])])]),
    h('tbody', {}, statRows),
  ]);

  return h('div', { class: 'dd-summary' }, [
    h('div', { class: 'dd-summary-head' }, [`Double-dummy summary · ${n} deal${n === 1 ? '' : 's'}`]),
    legend,
    chart,
    h('p', { class: 'hint' }, ['Bars: how many deals make each number of tricks (double dummy), per selected cell.']),
    stats,
  ]);
}
