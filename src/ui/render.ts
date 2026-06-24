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

function textHand(cards: Card[]): HTMLElement {
  return h(
    'div',
    { class: 'text-hand' },
    SUITS.map((s) =>
      h('div', { class: 'text-suit' }, [
        h('span', { class: 'suit-letter' + redClass(s) }, [SUIT_LETTERS[s]]),
        `: ${ranksOf(cards, s)}`,
      ]),
    ),
  );
}

function textSeat(deal: Deal, seat: Seat, locked: boolean): HTMLElement {
  const children: HTMLElement[] = [];
  if (locked) children.push(h('div', { class: 'lock-badge', title: SEAT_NAMES[seat] }, [`🔒 ${seat}`]));
  children.push(textHand(deal.hands[seat]));
  return h('div', { class: `text-seat pos-${seat}` }, children);
}

function compassTextBoard(deal: Deal, locked: Set<Seat>): HTMLElement {
  return h('div', { class: 'compass-text' }, SEATS.map((s) => textSeat(deal, s, locked.has(s))));
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
      body = compassTextBoard(deal, locked);
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
