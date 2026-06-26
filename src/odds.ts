import './styles.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { suitBreakOdds, type SuitSplit } from './engine/odds';
import { parseHolding, cardLieOdds } from './engine/cardSplit';

const pctStr = (p: number, dp = 2): string => `${(p * 100).toFixed(dp)}%`;
const splitLabel = (s: SuitSplit): string => `${s.a}-${s.b}`;

const clampVacant = (input: HTMLSelectElement): number => {
  const n = Number.parseInt(input.value, 10);
  return Number.isNaN(n) ? 13 : n;
};

/** Vacant-spaces chooser: a dropdown from 13 (a-priori) down to 5. */
const VACANT_OPTIONS = [13, 12, 11, 10, 9, 8, 7, 6, 5];
const vacantInput = (): HTMLSelectElement => {
  const sel = h('select', { class: 'odds-vacant' }, VACANT_OPTIONS.map((n) => h('option', { value: n }, [String(n)]))) as HTMLSelectElement;
  sel.value = '13';
  return sel;
};

/** A collapsible explanation, hidden until clicked. */
const explain = (...body: Array<Node | string>): HTMLElement =>
  h('details', { class: 'odds-explain' }, [h('summary', {}, ['How this works']), h('p', {}, body)]);

// --- Shared results table with A/B/C "line of play" columns ----------------

const LINE_LABELS = ['A', 'B', 'C'];

interface OddsRow {
  /** Leading <td> cells (split/lie labels, probability). */
  lead: HTMLElement[];
  probability: number;
}

/**
 * A results table whose rows each carry three "Lines" checkboxes (A/B/C). Tick the
 * splits a candidate line of play copes with and each line shows its own success %.
 */
function oddsTable(leadHeads: HTMLElement[], rows: OddsRow[]): HTMLElement {
  const totals = LINE_LABELS.map(() => h('strong', {}, ['0.00%']));
  const boxesByLine: Array<Array<{ cb: HTMLInputElement; p: number }>> = LINE_LABELS.map(() => []);
  const update = (): void => {
    boxesByLine.forEach((boxes, i) => {
      totals[i].textContent = pctStr(boxes.reduce((acc, b) => acc + (b.cb.checked ? b.p : 0), 0));
    });
  };

  for (const th of leadHeads) th.setAttribute('rowspan', '2');

  // Running totals sit at the top, so they stay in view above a long table.
  const sumRow = h('tr', { class: 'odds-sum' }, [
    h('td', { class: 'odds-sum-label', colspan: leadHeads.length }, ['Success % :']),
    ...totals.map((t) => h('td', { class: 'odds-succ' }, [t])),
  ]);

  const bodyRows = rows.map((r) => {
    const lineCells = LINE_LABELS.map((_, i) => {
      const cb = h('input', { type: 'checkbox', class: 'odds-check', onchange: update }) as HTMLInputElement;
      boxesByLine[i].push({ cb, p: r.probability });
      return h('td', { class: 'odds-succ' }, [cb]);
    });
    return h('tr', {}, [...r.lead, ...lineCells]);
  });

  return h('table', { class: 'odds-table' }, [
    h('thead', {}, [
      h('tr', {}, [...leadHeads, h('th', { class: 'odds-lines-head', colspan: LINE_LABELS.length }, ['Lines'])]),
      h('tr', {}, LINE_LABELS.map((l) => h('th', { class: 'odds-succ', title: 'Tick the splits this line of play copes with' }, [l]))),
    ]),
    h('tbody', {}, [sumRow, ...bodyRows]),
  ]);
}

// --- Distribution of specific cards (top) ----------------------------------

const holdingInput = h('input', { type: 'text', value: 'KJxxx', class: 'odds-holding', placeholder: 'e.g. KJxxx', autocapitalize: 'none', autocorrect: 'off', spellcheck: false }) as HTMLInputElement;
const lieVacantE = vacantInput();
const lieVacantW = vacantInput();
const orderByLength = h('input', { type: 'checkbox', class: 'odds-check' }) as HTMLInputElement;
const lieStatus = h('span', { class: 'odds-missing' }, []);
const lieResults = h('div', { class: 'odds-results' }, []);

function buildLieResults(): HTMLElement {
  const holding = parseHolding(holdingInput.value);
  if (holding.error) {
    lieStatus.textContent = holding.error;
    return h('p', { class: 'odds-error' }, [holding.error]);
  }
  const vE = clampVacant(lieVacantE);
  const vW = clampVacant(lieVacantW);
  lieStatus.textContent = `${holding.cards} card${holding.cards === 1 ? '' : 's'} missing`;
  if (holding.cards === 0) {
    return h('p', { class: 'odds-missing' }, ['Enter the cards the opponents hold above.']);
  }
  if (holding.cards > vE + vW) {
    return h('p', { class: 'odds-error' }, [`Only ${vE + vW} vacant spaces for ${holding.cards} cards — increase the vacant spaces.`]);
  }

  const order = orderByLength.checked ? 'westLength' : 'probability';
  const rows = cardLieOdds(holding, vE, vW, order).map((l) => ({
    lead: [
      h('td', { class: 'odds-split' }, [l.west]),
      h('td', { class: 'odds-split' }, [l.east]),
      h('td', { class: 'odds-prob' }, [pctStr(l.probability)]),
    ],
    probability: l.probability,
  }));
  return oddsTable([h('th', {}, ['West']), h('th', {}, ['East']), h('th', {}, ['Probability'])], rows);
}

function updateLies(): void {
  lieResults.replaceChildren(buildLieResults());
}
holdingInput.addEventListener('input', updateLies);
for (const el of [lieVacantE, lieVacantW, orderByLength]) el.addEventListener('change', updateLies);

const liePanel = h('section', { class: 'form odds-panel' }, [
  h('h2', {}, ['Distribution of specific cards']),
  explain(
    'Characters are just labels: cards written with the same character are interchangeable — e.g. ',
    h('code', {}, ['HHxxx']),
    '. Use ',
    h('code', {}, ['ccccdddd']),
    ' to combine breaks in two suits. Lower the vacant spaces once the shape of the opponents’ hands becomes known.',
  ),
  h('div', { class: 'odds-controls' }, [
    h('label', {}, ['Opponents hold ', holdingInput]),
    h('label', {}, ['West vacant ', lieVacantW]),
    h('label', {}, ['East vacant ', lieVacantE]),
    h('label', { title: 'Sort by the number of cards West holds instead of by probability' }, [orderByLength, ' Order by length']),
    lieStatus,
  ]),
  lieResults,
]);

// --- Basic suit probabilities (bottom) -------------------------------------

const holdsInput = h('input', { type: 'number', min: 0, max: 13, value: '8', class: 'num odds-holds' }) as HTMLInputElement;
const basicVacantE = vacantInput();
const basicVacantW = vacantInput();
const missingLabel = h('span', { class: 'odds-missing' }, []);
const basicResults = h('div', { class: 'odds-results' }, []);

function buildBasicResults(): HTMLElement {
  let holds = Number.parseInt(holdsInput.value, 10);
  if (Number.isNaN(holds)) holds = 8;
  holds = Math.max(0, Math.min(13, holds));
  const missing = 13 - holds;
  const vE = clampVacant(basicVacantE);
  const vW = clampVacant(basicVacantW);
  missingLabel.textContent = `Opponents hold ${missing} card${missing === 1 ? '' : 's'}`;
  if (missing > vE + vW) {
    return h('p', { class: 'odds-error' }, [`Only ${vE + vW} vacant spaces for ${missing} cards — increase the vacant spaces.`]);
  }

  const rows = suitBreakOdds(missing, vE, vW).map((s) => ({
    lead: [
      h('td', { class: 'odds-split' }, [splitLabel(s)]),
      h('td', { class: 'odds-prob' }, [pctStr(s.probability)]),
    ],
    probability: s.probability,
  }));
  return oddsTable([h('th', {}, ['Split']), h('th', {}, ['Probability'])], rows);
}

function updateBasic(): void {
  basicResults.replaceChildren(buildBasicResults());
}
holdsInput.addEventListener('input', updateBasic);
for (const el of [basicVacantE, basicVacantW]) el.addEventListener('change', updateBasic);

const basicPanel = h('section', { class: 'form odds-panel' }, [
  h('h2', {}, ['Basic suit probabilities']),
  explain(
    'Enter how many cards your side holds; the opponents hold the rest. Each row is a way the missing cards can divide. Lower the vacant spaces once the shape of the opponents’ hands becomes known.',
  ),
  h('div', { class: 'odds-controls' }, [
    h('label', {}, ['Cards your side holds ', holdsInput]),
    h('label', {}, ['West vacant ', basicVacantW]),
    h('label', {}, ['East vacant ', basicVacantE]),
    missingLabel,
  ]),
  basicResults,
]);

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    siteNav('odds'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesOdds']),
      h('p', { class: 'tagline' }, ['How the missing cards are likely to divide.']),
    ]),
    liePanel,
    basicPanel,
  );
}

updateLies();
updateBasic();
