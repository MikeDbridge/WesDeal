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
import { compileFilter } from '../engine/filter';
import { DD_STRAIN_LABELS, DD_DECLARER_LABELS, type DDCell } from '../engine/dd';
import type { ConstraintSet, HandConstraint, Range } from '../engine/constraints';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

// Example placeholders chosen to showcase every points-filter form
// (range / min / max / exact / decimals) just by scanning the rows.
const VALUE_EG: Record<Seat, { hcp: string; knr: string }> = {
  N: { hcp: '12-14', knr: '13.5+' },
  E: { hcp: '3-9', knr: '18-' },
  S: { hcp: '0-4', knr: '8-12' },
  W: { hcp: '17', knr: '15.5+' },
};

/** Bridge convention: honors are upper-case, small cards are a lower-case "x". */
function normalizeHand(el: HTMLInputElement): void {
  const norm = el.value.toUpperCase().replace(/X/g, 'x');
  if (norm !== el.value) {
    const pos = el.selectionStart;
    el.value = norm;
    if (pos !== null) el.setSelectionRange(pos, pos);
  }
}

interface SeatInputs {
  hcp: HTMLInputElement;
  knr: HTMLInputElement;
  suit: Record<Suit, HTMLInputElement>;
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
  filterRow: HTMLElement;
  filterToggle: HTMLButtonElement;
  filterInput: HTMLInputElement;
  filterStatus: HTMLElement;
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
  /** Which strain × declarer cells to double-dummy solve (empty = none). */
  readDD(): DDCell[];
  /** Whether to run the DD solve automatically after each generate. */
  autoSolveDD(): boolean;
}

function redClass(s: Suit): string {
  return s === 'H' || s === 'D' ? ' red' : '';
}

const POINTS_HELP = 'Points filter — examples: 12 (exactly), 10+ (min), 11- (max), 12-14 (range)';

function exprInput(placeholder = '12-14'): HTMLInputElement {
  return h('input', {
    type: 'text',
    class: 'points-expr',
    placeholder,
    title: POINTS_HELP,
    list: 'pts-presets',
    spellcheck: false,
    autocomplete: 'off',
  }) as HTMLInputElement;
}

const LEN_HELP = 'Suit length — e.g. 4 (exactly), 4+ (min), 2- (max), 2-3 (range)';

/** A compact length field: typeable, with a dropdown of common presets. */
function lenInput(suit: Suit): HTMLInputElement {
  return h('input', {
    type: 'text',
    class: 'len-expr',
    placeholder: '–',
    title: `${SUIT_SYMBOLS[suit]} ${LEN_HELP}`,
    list: 'len-presets',
    spellcheck: false,
    autocomplete: 'off',
  }) as HTMLInputElement;
}

export function buildForm(): FormController {
  const seatRows = {} as Record<Seat, SeatRow>;

  // The "Custom filter syntax" panel (assigned below); opening a ƒ(x) box
  // pops it open and flashes it so attention is drawn to the syntax.
  let filterHelp: HTMLDetailsElement | undefined;
  const revealFilterHelp = (): void => {
    if (!filterHelp) return;
    filterHelp.open = true;
    filterHelp.classList.remove('flash');
    void filterHelp.offsetWidth; // restart the highlight animation
    filterHelp.classList.add('flash');
    filterHelp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const updateLockState = (): void => {
    const lockedCount = SEATS.filter((s) => seatRows[s].toggle.checked).length;
    for (const seat of SEATS) {
      const sr = seatRows[seat];
      const locked = sr.toggle.checked;

      sr.toggle.disabled = !locked && lockedCount >= 2;
      sr.row.classList.toggle('locked', locked);
      for (const cell of sr.conditionCells) cell.hidden = locked;
      sr.handCell.hidden = !locked;
      if (locked) sr.filterRow.hidden = true; // locked hands ignore filters

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
          sr.status.textContent = `${e.hcp} HCP · ${knr} KnR · ${exactShape(e.lengths)}`;
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

  const updateFilterState = (seat: Seat): void => {
    const sr = seatRows[seat];
    const text = sr.filterInput.value.trim();
    sr.filterToggle.classList.toggle('active', text !== '');
    if (text === '') {
      sr.filterStatus.textContent = '';
      sr.filterStatus.className = 'filter-status';
      return;
    }
    const { error } = compileFilter(text);
    sr.filterStatus.textContent = error ?? '✓';
    sr.filterStatus.className = 'filter-status ' + (error ? 'bad' : 'ok');
  };

  const buildSeatRow = (seat: Seat): SeatRow => {
    const toggle = h('input', { type: 'checkbox', onchange: updateLockState, title: 'Lock this hand' }) as HTMLInputElement;

    const hcp = exprInput(VALUE_EG[seat].hcp);
    const knr = exprInput(VALUE_EG[seat].knr);
    const hcpCell = h('td', { 'data-label': 'HCP' }, [hcp]);
    const knrCell = h('td', { 'data-label': 'KnR' }, [knr]);

    const suit = {} as SeatInputs['suit'];
    const suitCells = SUITS.map((s) => {
      const field = lenInput(s);
      suit[s] = field;
      // Symbol lives in the column header (and the mobile row label) only.
      return h('td', { class: 'len-cell', 'data-label': SUIT_SYMBOLS[s] }, [field]);
    });

    const balanced = h('select', {
      class: 'shape-select',
      title: 'Semi-bal (NT): balanced, a 6-card minor (6-3-2-2), or 4-4-4-1 with an A/K/Q singleton in a minor',
    }, [
      h('option', { value: 'any' }, ['Any']),
      h('option', { value: 'balanced' }, ['Balanced']),
      h('option', { value: 'unbalanced' }, ['Unbalanced']),
      h('option', { value: 'semiNT' }, ['Semi-bal (NT)']),
    ]) as HTMLSelectElement;
    const shapeCell = h('td', { 'data-label': 'Shape' }, [balanced]);

    const filterToggle = h('button', {
      type: 'button',
      class: 'filter-toggle',
      title: 'Custom filter',
      onclick: () => {
        const fr = seatRows[seat].filterRow;
        fr.hidden = !fr.hidden;
        if (!fr.hidden) {
          seatRows[seat].filterInput.focus();
          revealFilterHelp();
        }
      },
    }, ['ƒ(x)']) as HTMLButtonElement;
    const filterToggleCell = h('td', { class: 'filter-toggle-cell', 'data-label': 'Filter' }, [filterToggle]);

    const conditionCells = [hcpCell, knrCell, ...suitCells, shapeCell, filterToggleCell];

    const handInput = h('input', {
      type: 'text',
      class: 'hand-input',
      placeholder: 'AKxxx Kx Qxx Axx',
      title: '♠ ♥ ♦ ♣ separated by spaces · x = small card · - = void',
      oninput: () => {
        normalizeHand(handInput);
        updateLockState();
      },
      spellcheck: false,
      autocomplete: 'off',
    }) as HTMLInputElement;
    const status = h('span', { class: 'hand-status' }, []);
    const handCell = h('td', { colspan: '8', class: 'hand-cell', hidden: true }, [
      h('div', { class: 'hand-entry' }, [handInput, status]),
    ]);

    const row = h('tr', { class: 'seat-row' }, [
      h('th', { class: 'seat-label' }, [h('label', { class: 'lock-toggle' }, [toggle, SEAT_NAMES[seat]])]),
      ...conditionCells,
      handCell,
    ]);

    const filterInput = h('input', {
      type: 'text',
      class: 'filter-input',
      placeholder: 'e.g. spades >= 6 and top(spades, 6) >= 3',
      oninput: () => updateFilterState(seat),
      spellcheck: false,
      autocomplete: 'off',
    }) as HTMLInputElement;
    const filterStatus = h('span', { class: 'filter-status' }, []);
    const filterRow = h('tr', { class: 'filter-row', hidden: true }, [
      h('td', {}, []),
      h('td', { colspan: '8' }, [
        h('div', { class: 'filter-entry' }, [
          h('span', { class: 'filter-label', title: 'This hand must satisfy:' }, ['ƒ(x)']),
          filterInput,
          filterStatus,
        ]),
      ]),
    ]);

    return {
      row, inputs: { hcp, knr, suit, balanced }, toggle, conditionCells, handCell, handInput, status,
      filterRow, filterToggle, filterInput, filterStatus,
    };
  };

  const rows: HTMLElement[] = [];
  for (const seat of SEATS) {
    const sr = buildSeatRow(seat);
    seatRows[seat] = sr;
    rows.push(sr.row, sr.filterRow);
  }

  const groupRow = h('tr', { class: 'group-head' }, [
    h('th', {}, []),
    h('th', { colspan: '2' }, ['Values']),
    h('th', { colspan: '4' }, ['Suit lengths']),
    h('th', {}, []),
    h('th', {}, []),
  ]);
  const headerCells = [
    h('th', { class: 'lock-col', title: 'Tick a seat to type its exact hand instead of setting conditions' }, ['✓ set hand']),
    h('th', {}, ['HCP']),
    h('th', {}, ['KnR']),
    ...SUITS.map((s) => h('th', { class: 'suit-head' + redClass(s) }, [SUIT_SYMBOLS[s]])),
    h('th', {}, ['Shape']),
    h('th', { class: 'filter-col', title: 'Custom filter' }, ['ƒ']),
  ];

  const conditionsTable = h('div', { class: 'table-scroll' }, [
    h('table', { class: 'constraint-table' }, [
      h('thead', {}, [groupRow, h('tr', {}, headerCells)]),
      h('tbody', {}, rows),
    ]),
  ]);

  const codeLine = (s: string): HTMLElement => h('code', { class: 'filter-code' }, [s]);
  filterHelp = h('details', { class: 'filter-help' }, [
    h('summary', {}, ['Custom filter syntax (ƒx)']),
    h('div', { class: 'filter-help-body' }, [
      h('p', {}, ['A filter is a yes/no condition the hand must satisfy. Vocabulary:']),
      h('ul', {}, [
        h('li', {}, ['Suit length: ', codeLine('spades hearts diamonds clubs'), ' (or ', codeLine('s h d c'), ')']),
        h('li', {}, ['Points: ', codeLine('hcp'), ', ', codeLine('knr'), ', ', codeLine('controls'), ' (A=2, K=1)']),
        h('li', {}, [codeLine('top(suit, n)'), ' — how many of the top n ranks are held']),
        h('li', {}, [codeLine('has(suit, rank)'), ' — holds a card, rank ', codeLine('A K Q J T'), ' or ', codeLine('2..10')]),
        h('li', {}, ['Compare ', codeLine('>= <= > < = !='), ', range ', codeLine('x in lo..hi'), ', maths ', codeLine('+ -')]),
        h('li', {}, ['Combine ', codeLine('and or not'), ' (or ', codeLine('& | !'), '), group with ', codeLine('( )')]),
      ]),
      h('p', {}, ['Examples:']),
      h('ul', {}, [
        h('li', {}, [codeLine('spades >= 6 and top(spades, 6) >= 3')]),
        h('li', {}, [codeLine('not (hearts >= 4 and spades >= 4 and hcp in 3..9)')]),
        h('li', {}, [codeLine('spades + hearts >= 9 and hcp in 10..15')]),
      ]),
    ]),
  ]);

  // ---- Partnership ---------------------------------------------------------
  const nsHcp = exprInput('25+');
  const nsKnr = exprInput('27+');
  const ewHcp = exprInput('17-');
  const ewKnr = exprInput('18-');
  const partnerGroup = (title: string, hcpIn: HTMLInputElement, knrIn: HTMLInputElement): HTMLElement =>
    h('div', { class: 'partner-group' }, [
      h('div', { class: 'partner-title' }, [title]),
      h('div', { class: 'partner-pair' }, [
        h('label', {}, ['HCP ', hcpIn]),
        h('label', {}, ['KnR ', knrIn]),
      ]),
    ]);
  const partnership = h('div', { class: 'partnership' }, [
    h('span', { class: 'group-label' }, ['Partnership']),
    h('div', { class: 'partner-groups' }, [
      partnerGroup('N+S', nsHcp, nsKnr),
      partnerGroup('E+W', ewHcp, ewKnr),
    ]),
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

  // ---- Double-dummy selection (strain × declarer grid) ---------------------
  const ddChecks: HTMLInputElement[][] = [[], [], [], [], []]; // [strain][declarer]
  const setAllDD = (v: boolean): void => {
    for (const row of ddChecks) for (const cb of row) cb.checked = v;
  };
  const toggleDDRow = (s: number): void => {
    const all = ddChecks[s].every((cb) => cb.checked);
    for (const cb of ddChecks[s]) cb.checked = !all;
  };
  const toggleDDCol = (d: number): void => {
    const all = ddChecks.every((row) => row[d].checked);
    for (const row of ddChecks) row[d].checked = !all;
  };
  const ddHeader = h('tr', {}, [
    h('th', {}, []),
    ...DD_DECLARER_LABELS.map((d, di) =>
      h('th', { class: 'dd-head-cell', title: `Toggle ${d} for every strain`, onclick: () => toggleDDCol(di) }, [d]),
    ),
  ]);
  const ddBody = DD_STRAIN_LABELS.map((label, si) =>
    h('tr', {}, [
      h(
        'th',
        {
          class: 'dd-head-cell dd-strain' + (si === 1 || si === 2 ? ' red' : ''),
          title: `Toggle ${label} for every declarer`,
          onclick: () => toggleDDRow(si),
        },
        [label],
      ),
      ...DD_DECLARER_LABELS.map((_, di) => {
        const cb = h('input', { type: 'checkbox', class: 'dd-check' }) as HTMLInputElement;
        ddChecks[si][di] = cb;
        return h('td', {}, [cb]);
      }),
    ]),
  );
  const ddAuto = h('input', { type: 'checkbox' }) as HTMLInputElement;
  const ddSection = h('div', { class: 'dd-section' }, [
    h('div', { class: 'dd-bar' }, [
      h('span', { class: 'group-label' }, ['Double dummy']),
      h('button', { type: 'button', class: 'dd-btn', onclick: () => setAllDD(true) }, ['Full table']),
      h('button', { type: 'button', class: 'dd-btn', onclick: () => setAllDD(false) }, ['Clear']),
      h('label', { class: 'dd-auto', title: 'Solve the ticked cells automatically after each generate' }, [ddAuto, ' solve on generate']),
    ]),
    h('table', { class: 'dd-table' }, [h('thead', {}, [ddHeader]), h('tbody', {}, ddBody)]),
    h('p', { class: 'hint' }, [
      'Tick which strain × declarer to solve for each deal (one cell is fastest). Click a ♠/N label to toggle a whole row/column.',
    ]),
  ]);
  const readDD = (): DDCell[] => {
    const cells: DDCell[] = [];
    for (let s = 0; s < 5; s++) for (let d = 0; d < 4; d++) if (ddChecks[s][d].checked) cells.push({ strain: s, declarer: d });
    return cells;
  };

  // Dropdown presets shared by the compact fields (typeable comboboxes).
  const datalist = (id: string, values: string[]): HTMLElement =>
    h('datalist', { id }, values.map((v) => h('option', { value: v })));
  const presets = h('div', { hidden: true }, [
    datalist('len-presets', ['4+', '5+', '6+', '2-3', '3-4', '4-5', '0-1', '2-', '0']),
    datalist('pts-presets', ['10+', '11+', '12+', '8-', '0-7', '12-14', '15-17', '20+']),
  ]);

  const element = h('section', { class: 'form' }, [
    h('h2', {}, ['Conditions']),
    conditionsTable,
    filterHelp,
    partnership,
    options,
    ddSection,
    presets,
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
      const knr = exprToRange(inp.knr, `${name} KnR`, errors);
      if (knr) c.knr = knr;
      const suitRanges: Partial<Record<Suit, Range>> = {};
      for (const s of SUITS) {
        const r = exprToRange(inp.suit[s], `${name} ${SUIT_SYMBOLS[s]} length`, errors);
        if (r) suitRanges[s] = r;
      }
      if (Object.keys(suitRanges).length) c.suit = suitRanges;
      if (inp.balanced.value === 'balanced') c.balanced = true;
      else if (inp.balanced.value === 'unbalanced') c.balanced = false;
      else if (inp.balanced.value === 'semiNT') c.semiBalancedNT = true;
      const filterText = seatRows[seat].filterInput.value.trim();
      if (filterText) {
        const { error } = compileFilter(filterText);
        if (error) errors.push(`${name} filter: ${error}`);
        else c.filter = filterText;
      }
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

  return { element, readConstraints, readOptions, readGiven, readDD, autoSolveDD: () => ddAuto.checked };
}
