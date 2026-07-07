/**
 * WesLab — run double-dummy studies in the browser.
 *
 * Pick a population and a deal count, tick the strain × declarer cells to
 * solve, and the page deals, solves across the worker pool, and summarises —
 * with exports that round-trip into the research pipeline (research/data/):
 * the JSONL download uses the exact { pbn, dd } format the CLI produces.
 */

import './styles.css';
import './lab.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { ddSummaryElement } from './ui/render';
import { DD_STRAIN_LABELS, DD_DECLARER_LABELS, type DDCell } from './engine/dd';
import { mulberry32, randomDeal, type Deal } from './engine/deal';
import { dealToPBN } from './engine/format';
import { ntEligible } from './engine/study';
import { DDPool } from './worker/ddPool';

const STRAIN_ASCII = ['S', 'H', 'D', 'C', 'NT'];

// ---- Setup controls ---------------------------------------------------------

const population = h('select', { class: 'lab-select' }, [
  h('option', { value: 'any' }, ['Any random deals']),
  h('option', { value: 'study' }, ['Balanced/semi-bal pairs (study)']),
]) as HTMLSelectElement;
population.value = 'study';

const countInput = h('input', { type: 'number', min: 1, max: 50000, value: '1000', class: 'num lab-count' }) as HTMLInputElement;

// Strain × declarer grid (same conventions as the deal page).
const cellChecks: HTMLInputElement[][] = [[], [], [], [], []];
const setAll = (v: boolean): void => {
  for (const row of cellChecks) for (const cb of row) cb.checked = v;
};
const gridHeader = h('tr', {}, [
  h('th', {}, []),
  ...DD_DECLARER_LABELS.map((d, di) =>
    h('th', { class: 'dd-head-cell', title: `Toggle ${d} for every strain`, onclick: () => {
      const all = cellChecks.every((row) => row[di].checked);
      for (const row of cellChecks) row[di].checked = !all;
    } }, [d]),
  ),
]);
const gridBody = DD_STRAIN_LABELS.map((label, si) =>
  h('tr', {}, [
    h('th', {
      class: 'dd-head-cell dd-strain' + (si === 1 || si === 2 ? ' red' : ''),
      title: `Toggle ${label} for every declarer`,
      onclick: () => {
        const all = cellChecks[si].every((cb) => cb.checked);
        for (const cb of cellChecks[si]) cb.checked = !all;
      },
    }, [label]),
    ...DD_DECLARER_LABELS.map((_, di) => {
      const cb = h('input', { type: 'checkbox', class: 'dd-check' }) as HTMLInputElement;
      cellChecks[si][di] = cb;
      return h('td', {}, [cb]);
    }),
  ]),
);
// Default selection: 3NT by North and South.
cellChecks[4][0].checked = true;
cellChecks[4][2].checked = true;

const readCells = (): DDCell[] => {
  const cells: DDCell[] = [];
  for (let s = 0; s < 5; s++) for (let d = 0; d < 4; d++) if (cellChecks[s][d].checked) cells.push({ strain: s, declarer: d });
  return cells;
};

const runBtn = h('button', { class: 'primary', type: 'button' }, ['Run study']) as HTMLButtonElement;
const stopBtn = h('button', { type: 'button', disabled: true }, ['Stop']) as HTMLButtonElement;
const progress = h('div', { class: 'lab-progress' }, ['Set up a study and hit Run.']);
const resultsEl = h('div', { class: 'lab-results' }, []);

// ---- Running ------------------------------------------------------------------

interface Solved {
  pbn: string;
  tricks: number[];
}

const pool = new DDPool();
let runToken = 0;
let curCells: DDCell[] = [];
let curPbns: string[] = [];
let curResults: Array<number[] | undefined> = [];
let runStart = 0;

function makeAt(strain: number): number {
  return strain === 4 ? 9 : 10; // game: 3NT = 9 tricks, 4M/5m = 10 (11 for minors is stricter; 10 keeps majors comparable)
}

function solvedRows(): Solved[] {
  const out: Solved[] = [];
  curResults.forEach((tricks, i) => {
    if (tricks) out.push({ pbn: curPbns[i], tricks });
  });
  return out;
}

function renderResults(finished: boolean): void {
  const rows = solvedRows();
  if (rows.length === 0) {
    resultsEl.replaceChildren(h('p', { class: 'lab-hint' }, ['No solved deals yet.']));
    return;
  }
  const statRows = curCells.map((c, i) => {
    const vals = rows.map((r) => r.tricks[i]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sdv = Math.sqrt(vals.reduce((a, v) => a + (v - avg) * (v - avg), 0) / vals.length);
    const need = makeAt(c.strain);
    const made = vals.filter((v) => v >= need).length;
    return h('tr', {}, [
      h('th', {}, [`${STRAIN_ASCII[c.strain]}-${DD_DECLARER_LABELS[c.declarer]}`]),
      h('td', {}, [avg.toFixed(2)]),
      h('td', {}, [sdv.toFixed(2)]),
      h('td', {}, [`${((made / vals.length) * 100).toFixed(1)}%`]),
    ]);
  });
  const stats = h('table', { class: 'lab-stats' }, [
    h('thead', {}, [h('tr', {}, [h('th', {}, ['cell']), h('th', {}, ['avg tricks']), h('th', {}, ['sd']), h('th', {}, [`P(make game)`])])]),
    h('tbody', {}, statRows),
  ]);

  const exportRow = h('div', { class: 'lab-exports' }, [
    h('button', { type: 'button', onclick: () => downloadCSV(rows) }, ['Download CSV']),
    ...(curCells.length === 20
      ? [h('button', { type: 'button', title: 'Exact research dataset format — drop into research/data/', onclick: () => downloadJSONL(rows) }, ['Download JSONL (research format)'])]
      : [h('span', { class: 'lab-hint' }, ['(select the full table to enable research-format JSONL export)'])]),
  ]);

  resultsEl.replaceChildren(
    h('h2', {}, [finished ? 'Results' : 'Results (partial)']),
    stats,
    ddSummaryElement(curCells, rows.map((r) => r.tricks)),
    exportRow,
  );
}

function startRun(): void {
  const cells = readCells();
  if (cells.length === 0) {
    progress.textContent = 'Tick at least one strain × declarer cell first.';
    return;
  }
  let count = Number.parseInt(countInput.value, 10);
  if (Number.isNaN(count)) count = 1000;
  count = Math.max(1, Math.min(50000, count));
  const study = population.value === 'study';

  runToken++;
  const token = runToken;
  curCells = cells;
  progress.textContent = 'Dealing…';

  // Dealing is microseconds per board — generate synchronously, then solve.
  const seed = (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;
  const rng = mulberry32(seed);
  const pbns: string[] = [];
  let dealt = 0;
  while (pbns.length < count) {
    const deal: Deal = randomDeal(rng);
    dealt++;
    if (study && !(ntEligible(deal.hands.N) && ntEligible(deal.hands.S))) continue;
    pbns.push(dealToPBN(deal));
  }
  curPbns = pbns;
  curResults = new Array(count);
  runStart = performance.now();
  runBtn.disabled = true;
  stopBtn.disabled = false;
  const kept = study ? ` (kept ${count} of ${dealt} dealt)` : '';
  progress.textContent = `Dealt ${count} boards${kept} · solving 0/${count}…`;

  pool.solve(pbns, cells, {
    onResult(index, tricks) {
      if (token !== runToken) return;
      curResults[index] = tricks;
    },
    onProgress(done, total) {
      if (token !== runToken) return;
      if (done % 25 !== 0 && done !== total) return;
      const secs = (performance.now() - runStart) / 1000;
      const rate = done / Math.max(secs, 0.001);
      const eta = rate > 0 ? (total - done) / rate : 0;
      progress.textContent =
        `Solving ${done}/${total} · ${rate.toFixed(1)} deals/s · ETA ${Math.ceil(eta)} s (seed ${seed} — keep this tab open)`;
    },
    onDone() {
      if (token !== runToken) return;
      runBtn.disabled = false;
      stopBtn.disabled = true;
      const secs = (performance.now() - runStart) / 1000;
      progress.textContent =
        `Solved ${count} deals × ${cells.length} cell${cells.length === 1 ? '' : 's'} in ${secs.toFixed(1)} s ` +
        `(${(count / Math.max(secs, 0.001)).toFixed(1)} deals/s · seed ${seed}).`;
      renderResults(true);
    },
    onError(message) {
      if (token !== runToken) return;
      runBtn.disabled = false;
      stopBtn.disabled = true;
      progress.textContent = `Solver error: ${message}`;
    },
  });
}

function stopRun(): void {
  runToken++;
  // Supersede the in-flight job so idle workers stop pulling new deals.
  pool.solve([], [], { onResult() {}, onProgress() {}, onDone() {}, onError() {} });
  runBtn.disabled = false;
  stopBtn.disabled = true;
  progress.textContent = `Stopped — ${solvedRows().length} deals were solved.`;
  renderResults(false);
}

runBtn.addEventListener('click', startRun);
stopBtn.addEventListener('click', stopRun);

// ---- Exports ------------------------------------------------------------------

function download(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: name }, []);
  a.click();
  URL.revokeObjectURL(url);
}

/** Research-format JSONL: requires the full 20-cell table per deal. */
function downloadJSONL(rows: Solved[]): void {
  const lines = rows.map((r) => {
    const dd: number[][] = Array.from({ length: 5 }, () => new Array<number>(4).fill(0));
    curCells.forEach((c, i) => {
      dd[c.strain][c.declarer] = r.tricks[i];
    });
    return JSON.stringify({ pbn: r.pbn, dd });
  });
  download(`weslab-${rows.length}-deals.jsonl`, lines.join('\n') + '\n', 'application/x-ndjson');
}

function downloadCSV(rows: Solved[]): void {
  const head = ['pbn', ...curCells.map((c) => `${STRAIN_ASCII[c.strain]}-${DD_DECLARER_LABELS[c.declarer]}`)].join(',');
  const body = rows.map((r) => [`"${r.pbn}"`, ...r.tricks].join(','));
  download(`weslab-${rows.length}-deals.csv`, [head, ...body].join('\n') + '\n', 'text/csv');
}

// ---- Page ----------------------------------------------------------------------

const setup = h('section', { class: 'form' }, [
  h('h2', {}, ['Study setup']),
  h('div', { class: 'lab-controls' }, [
    h('div', { class: 'lab-field' }, [h('div', { class: 'lab-field-title' }, ['Population']), population]),
    h('div', { class: 'lab-field' }, [h('div', { class: 'lab-field-title' }, ['Deals']), countInput]),
    h('div', { class: 'lab-field' }, [
      h('div', { class: 'lab-field-title' }, ['Double dummy cells']),
      h('table', { class: 'dd-table' }, [h('thead', {}, [gridHeader]), h('tbody', {}, gridBody)]),
      h('div', { class: 'dd-bar' }, [
        h('button', { type: 'button', class: 'dd-btn', onclick: () => setAll(true) }, ['Full table']),
        h('button', { type: 'button', class: 'dd-btn', onclick: () => setAll(false) }, ['Clear']),
      ]),
    ]),
  ]),
  h('p', { class: 'lab-hint' }, [
    'Guide: a full table runs ~20-25 deals/s on 8 cores; a single cell is ~8-9× faster. ',
    'The study population (balanced/semi-balanced pairs, ≈39% of random deals) matches the research pipeline. ',
    'The tab must stay open while a run is going.',
  ]),
  h('div', { class: 'lab-run-bar' }, [runBtn, stopBtn]),
  progress,
]);

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    siteNav('lab'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesLab']),
      h('p', { class: 'tagline' }, ['Deal in bulk, solve double dummy, export the evidence.']),
    ]),
    setup,
    resultsEl,
  );
}
