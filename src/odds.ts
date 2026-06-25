import './styles.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { suitBreakOdds, type SuitSplit } from './engine/odds';

const pctStr = (p: number, dp = 2): string => `${(p * 100).toFixed(dp)}%`;
const splitLabel = (s: SuitSplit): string => `${s.a}-${s.b}`;

/** The odds table for one "missing" count, with a per-split "succeeds" total. */
function buildResults(missing: number): HTMLElement {
  const splits = suitBreakOdds(missing);
  const totalEl = h('strong', {}, ['0.00%']);
  const boxes: Array<{ cb: HTMLInputElement; p: number }> = [];
  const updateTotal = (): void => {
    totalEl.textContent = pctStr(boxes.reduce((acc, b) => acc + (b.cb.checked ? b.p : 0), 0));
  };

  const rows = splits.map((s) => {
    const cb = h('input', { type: 'checkbox', class: 'odds-check', onchange: updateTotal }) as HTMLInputElement;
    boxes.push({ cb, p: s.probability });
    return h('tr', {}, [
      h('td', { class: 'odds-split' }, [splitLabel(s)]),
      h('td', { class: 'odds-prob' }, [pctStr(s.probability)]),
      h('td', { class: 'odds-succ' }, [cb]),
    ]);
  });

  return h('div', {}, [
    h('table', { class: 'odds-table' }, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', {}, ['Split']),
          h('th', {}, ['Probability']),
          h('th', { title: 'Tick the splits your line of play copes with' }, ['Succeeds']),
        ]),
      ]),
      h('tbody', {}, rows),
    ]),
    h('p', { class: 'odds-total' }, ['Ticked splits succeed: ', totalEl]),
  ]);
}

const holdsInput = h('input', { type: 'number', min: 0, max: 13, value: '8', class: 'num odds-holds' }) as HTMLInputElement;
const missingLabel = h('span', { class: 'odds-missing' }, []);
const resultsWrap = h('div', { class: 'odds-results' }, []);

function update(): void {
  let holds = Number.parseInt(holdsInput.value, 10);
  if (Number.isNaN(holds)) holds = 8;
  holds = Math.max(0, Math.min(13, holds));
  const missing = 13 - holds;
  missingLabel.textContent = `Opponents hold ${missing} card${missing === 1 ? '' : 's'}`;
  resultsWrap.replaceChildren(buildResults(missing));
}
holdsInput.addEventListener('input', update);

const panel = h('section', { class: 'form odds-panel' }, [
  h('h2', {}, ['Your suit length']),
  h('div', { class: 'odds-controls' }, [
    h('label', {}, ['Cards your side holds ', holdsInput]),
    missingLabel,
  ]),
  resultsWrap,
]);

function referenceTable(): HTMLElement {
  const rows: HTMLElement[] = [];
  for (let missing = 2; missing <= 11; missing++) {
    const cells = suitBreakOdds(missing).map((s) => `${splitLabel(s)} ${pctStr(s.probability, 1)}`);
    rows.push(h('tr', {}, [h('th', {}, [String(missing)]), h('td', {}, [cells.join('   ·   ')])]));
  }
  return h('table', { class: 'odds-ref' }, [
    h('thead', {}, [h('tr', {}, [h('th', {}, ['Missing']), h('th', {}, ['Splits (a-priori odds)'])])]),
    h('tbody', {}, rows),
  ]);
}

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    siteNav('odds'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['Suit-break odds']),
      h('p', { class: 'tagline' }, ['How the missing cards are likely to divide — a-priori odds.']),
    ]),
    panel,
    h('details', { class: 'odds-reference' }, [
      h('summary', {}, ['Full reference table (2–11 missing)']),
      referenceTable(),
    ]),
  );
}

update();
