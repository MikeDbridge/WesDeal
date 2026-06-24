/**
 * The conditions form.
 *
 * Each seat is one table row with both an HCP and a Kaplan-Rubens (K&R) points
 * filter (available at once), per-suit length ranges, and a shape selector.
 * Points filters use a compact expression: "12", "10+", "11-", or "12-14".
 *
 * Ticking a row's checkbox "locks" the seat: the condition cells are replaced by
 * a single hand field where you type the 13 cards as four space-separated
 * holdings (♠ ♥ ♦ ♣), e.g. "AKxxx Kx Qxx Axx" — use "x" for a small card (≤7)
 * and "-" for a void. 0, 1, or 2 seats may be locked; the dealer deals the rest
 * around them, choosing the "x" cards afresh for each board.
 */

import { h, numberInput, intOrUndefined } from './dom';
import { parseRangeExpr } from './range';
import { SUITS, SUIT_SYMBOLS, type Suit } from '../engine/cards';
import { SEATS, type Seat, type GivenSpecs, validateGivenSpecs } from '../engine/deal';
import { parseHandSpec } from '../engine/parse';
import { evaluateSpec } from '../engine/evaluate';
import { exactShape } from '../engine/hand';
import type { ConstraintSet, HandConstraint, Range } from '../engine/constraints';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

interface SeatInputs {
  hcp: HTMLInputElement;
  knr: HTMLInputElement;
  suit: Record<Suit, { min: HTMLInputElement; max: HTMLInputElement }>;
  balanced: HTMLSelectElement;
}

interface SeatRow {
  row: HTMLElement;
  inputs: SeatInputs;
  toggle: HTMLInputElement;
  conditionCells: HTMLElement[];
  handCell: HTMLElement;
  handInput: HTMLInputElement;
  status: HTMLElement;
}

export interface RunOptions {
  count: number;
  maxAttempts: number;
  seed?: number;
}

export interface ConstraintResult {
  constraints: ConstraintSet;
  errors: string[];
}

export interface GivenResult {
  given: GivenSpecs;
  lockedSeats: Seat[];
  errors: string[];
}

export interface FormController {
  element: HTMLElement;
  readConstraints(): ConstraintResult;
  readOptions(): RunOptions;
  readGiven(): GivenResult;
}

function redClass(s: Suit): string {
  return s === 'H' || s === 'D' ? ' red' : '';
}

function exprInput(): HTMLInputElement {
  return h('input', {
    type: 'text',
    class: 'points-expr',
    placeholder: '12-14',
    spellcheck: false,
    autocomplete: 'off',
  }) as HTMLInputElement;
}

function rangeFrom(min: HTMLInputElement, max: HTMLInputElement): Range | undefined {
  const lo = intOrUndefined(min);
  const hi = intOrUndefined(max);
  if (lo === undefined && hi === undefined) return undefined;
  const r: Range = {};
  if (lo !== undefined) r.min = lo;
  if (hi !== undefined) r.max = hi;
  return r;
}

export function buildForm(): FormController {
  const seatRows = {} as Record<Seat, SeatRow>;

  const updateLockState = (): void => {
    const lockedCount = SEATS.filter((s) => seatRows[s].toggle.checked).length;
    for (const seat of SEATS) {
      const sr = seatRows[seat];
      const locked = sr.toggle.checked;

      sr.toggle.disabled = !locked && lockedCount >= 2;
      sr.row.classList.toggle('locked', locked);
      for (const cell of sr.conditionCells) cell.hidden = locked;
      sr.handCell.hidden = !locked;

      if (!locked) {
        sr.status.textContent = '';
        sr.status.className = 'hand-status';
        sr.status.title = '';
      } else {
        const r = parseHandSpec(sr.handInput.value);
        const ok = r.length === 13 && r.errors.length === 0;
        if (ok) {
          const e = evaluateSpec(r.spec);
          const knr = e.knr === null ? '—' : e.knr.toFixed(2);
          sr.status.textContent = `${e.hcp} HCP · ${knr} K&R · ${exactShape(e.lengths)}`;
          sr.status.className = 'hand-status ok';
          sr.status.title = '';
        } else {
          sr.status.textContent = `${r.length}/13`;
          sr.status.className = 'hand-status bad';
          sr.status.title = r.errors.join('\n');
        }
      }
    }
  };

  const buildSeatRow = (seat: Seat): SeatRow => {
    const toggle = h('input', { type: 'checkbox', onchange: updateLockState, title: 'Lock this hand' }) as HTMLInputElement;

    const hcp = exprInput();
    const knr = exprInput();
    const hcpCell = h('td', {}, [hcp]);
    const knrCell = h('td', {}, [knr]);

    const suit = {} as SeatInputs['suit'];
    const suitCells = SUITS.map((s) => {
      const min = numberInput('–', 0, 13);
      const max = numberInput('–', 0, 13);
      suit[s] = { min, max };
      return h('td', {}, [
        h('div', { class: 'pair' }, [
          h('span', { class: 'suit-sym' + redClass(s) }, [SUIT_SYMBOLS[s]]),
          min,
          h('span', { class: 'dash' }, ['–']),
          max,
        ]),
      ]);
    });

    const balanced = h('select', { class: 'shape-select' }, [
      h('option', { value: 'any' }, ['Any']),
      h('option', { value: 'balanced' }, ['Balanced']),
      h('option', { value: 'unbalanced' }, ['Unbalanced']),
    ]) as HTMLSelectElement;
    const shapeCell = h('td', {}, [balanced]);

    const conditionCells = [hcpCell, knrCell, ...suitCells, shapeCell];

    const handInput = h('input', {
      type: 'text',
      class: 'hand-input',
      placeholder: 'AKxxx Kx Qxx Axx',
      oninput: updateLockState,
      spellcheck: false,
      autocomplete: 'off',
    }) as HTMLInputElement;
    const status = h('span', { class: 'hand-status' }, []);
    const handCell = h('td', { colspan: '7', class: 'hand-cell', hidden: true }, [
      h('div', { class: 'hand-entry' }, [handInput, status]),
    ]);

    const row = h('tr', {}, [
      h('th', { class: 'seat-label' }, [h('label', { class: 'lock-toggle' }, [toggle, SEAT_NAMES[seat]])]),
      ...conditionCells,
      handCell,
    ]);

    return { row, inputs: { hcp, knr, suit, balanced }, toggle, conditionCells, handCell, handInput, status };
  };

  const rows: HTMLElement[] = [];
  for (const seat of SEATS) {
    const sr = buildSeatRow(seat);
    seatRows[seat] = sr;
    rows.push(sr.row);
  }

  const headerCells = [
    h('th', {}, ['']),
    h('th', {}, ['HCP']),
    h('th', {}, ['K&R']),
    ...SUITS.map((s) => h('th', { class: redClass(s).trim() }, [SUIT_SYMBOLS[s]])),
    h('th', {}, ['Shape']),
  ];

  const conditionsTable = h('div', { class: 'table-scroll' }, [
    h('table', { class: 'constraint-table' }, [
      h('thead', {}, [h('tr', {}, headerCells)]),
      h('tbody', {}, rows),
    ]),
  ]);

  const hint = h('p', { class: 'hint' }, [
    'Points filters: 12, 10+, 11-, or 12-14. Tick a seat to lock its hand — type ♠ ♥ ♦ ♣ separated by spaces (x = small card, - = void).',
  ]);

  // ---- Partnership ---------------------------------------------------------
  const nsHcp = exprInput();
  const nsKnr = exprInput();
  const ewHcp = exprInput();
  const ewKnr = exprInput();
  const partnership = h('div', { class: 'partnership' }, [
    h('span', { class: 'group-label' }, ['Partnership']),
    h('label', {}, ['N+S HCP ', nsHcp]),
    h('label', {}, ['K&R ', nsKnr]),
    h('label', {}, ['E+W HCP ', ewHcp]),
    h('label', {}, ['K&R ', ewKnr]),
  ]);

  // ---- Run options ---------------------------------------------------------
  const count = numberInput('1', 1, 1000);
  count.value = '1';
  const maxAttempts = numberInput('100000', 1, 100_000_000);
  maxAttempts.value = '100000';
  const seed = numberInput('random', 0, 2_147_483_647);
  const options = h('div', { class: 'run-options' }, [
    h('label', {}, ['Deals ', count]),
    h('label', {}, ['Max attempts ', maxAttempts]),
    h('label', {}, ['Seed ', seed]),
  ]);

  const element = h('section', { class: 'form' }, [
    h('h2', {}, ['Conditions']),
    conditionsTable,
    hint,
    partnership,
    options,
  ]);

  const exprToRange = (input: HTMLInputElement, label: string, errors: string[]): Range | undefined => {
    const res = parseRangeExpr(input.value);
    if (res.error) {
      errors.push(`${label}: ${res.error}`);
      return undefined;
    }
    return res.range;
  };

  const readConstraints = (): ConstraintResult => {
    const errors: string[] = [];
    const hands: Partial<Record<Seat, HandConstraint>> = {};
    for (const seat of SEATS) {
      if (seatRows[seat].toggle.checked) continue; // locked hand: conditions ignored
      const inp = seatRows[seat].inputs;
      const name = SEAT_NAMES[seat];
      const c: HandConstraint = {};
      const hcp = exprToRange(inp.hcp, `${name} HCP`, errors);
      if (hcp) c.hcp = hcp;
      const knr = exprToRange(inp.knr, `${name} K&R`, errors);
      if (knr) c.knr = knr;
      const suitRanges: Partial<Record<Suit, Range>> = {};
      for (const s of SUITS) {
        const r = rangeFrom(inp.suit[s].min, inp.suit[s].max);
        if (r) suitRanges[s] = r;
      }
      if (Object.keys(suitRanges).length) c.suit = suitRanges;
      if (inp.balanced.value === 'balanced') c.balanced = true;
      else if (inp.balanced.value === 'unbalanced') c.balanced = false;
      if (Object.keys(c).length) hands[seat] = c;
    }

    const set: ConstraintSet = {};
    if (Object.keys(hands).length) set.hands = hands;

    const nsH = exprToRange(nsHcp, 'N+S HCP', errors);
    const nsK = exprToRange(nsKnr, 'N+S K&R', errors);
    const ewH = exprToRange(ewHcp, 'E+W HCP', errors);
    const ewK = exprToRange(ewKnr, 'E+W K&R', errors);
    if (nsH || nsK || ewH || ewK) {
      set.partnership = {};
      if (nsH || nsK) set.partnership.NS = { ...(nsH && { hcp: nsH }), ...(nsK && { knr: nsK }) };
      if (ewH || ewK) set.partnership.EW = { ...(ewH && { hcp: ewH }), ...(ewK && { knr: ewK }) };
    }

    return { constraints: set, errors };
  };

  const readOptions = (): RunOptions => ({
    count: Math.max(1, intOrUndefined(count) ?? 1),
    maxAttempts: Math.max(1, intOrUndefined(maxAttempts) ?? 100_000),
    seed: intOrUndefined(seed),
  });

  const readGiven = (): GivenResult => {
    const given: GivenSpecs = {};
    const lockedSeats: Seat[] = [];
    const errors: string[] = [];
    for (const seat of SEATS) {
      if (!seatRows[seat].toggle.checked) continue;
      lockedSeats.push(seat);
      const r = parseHandSpec(seatRows[seat].handInput.value);
      for (const e of r.errors) errors.push(`${SEAT_NAMES[seat]}: ${e}`);
      given[seat] = r.spec;
    }
    errors.push(...validateGivenSpecs(given));
    return { given, lockedSeats, errors };
  };

  return { element, readConstraints, readOptions, readGiven };
}
