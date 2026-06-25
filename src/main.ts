import './styles.css';
import { h } from './ui/dom';
import { buildForm } from './ui/form';
import { boardElement, dealsLayoutText, ddResultElement, ddSummaryElement, BOARD_FORMATS, DEFAULT_FORMAT, type BoardFormat } from './ui/render';
import { dealToPBN } from './engine/format';
import { isEmptyConstraintSet } from './engine/constraints';
import { type Deal, type Seat } from './engine/deal';
import type { DDCell } from './engine/dd';
import type { GenerateRequest, WorkerResponse } from './worker/protocol';
import { DDPool } from './worker/ddPool';

const worker = new Worker(new URL('./worker/dealer.worker.ts', import.meta.url), {
  type: 'module',
});

const form = buildForm();
const status = h('div', { class: 'status' }, ['Set conditions and generate a deal.']);
const results = h('div', { class: 'results' });

const generateBtn = h('button', { class: 'primary', type: 'button' }, ['Generate']) as HTMLButtonElement;
const copyPbnBtn = h('button', { type: 'button', disabled: true }, ['Copy PBN']) as HTMLButtonElement;
const copyTextBtn = h('button', { type: 'button', disabled: true, title: 'Copy the deals as text in the selected layout' }, ['Copy layout']) as HTMLButtonElement;
const solveDDBtn = h('button', { type: 'button', disabled: true, title: 'Solve the ticked strain × declarer cells for each deal' }, ['Solve double dummy']) as HTMLButtonElement;
const summaryBtn = h('button', { type: 'button', disabled: true, title: 'Distribution summary of the double-dummy results' }, ['Summary']) as HTMLButtonElement;
const summaryEl = h('div', { class: 'dd-summary-panel', hidden: true });

const formatSelect = h(
  'select',
  { class: 'format-select', title: 'Output layout' },
  BOARD_FORMATS.map((f) => h('option', { value: f.value }, [f.label])),
) as HTMLSelectElement;
formatSelect.value = DEFAULT_FORMAT;
formatSelect.addEventListener('change', renderResults);

let lastDeals: Deal[] = [];
let lastLockedSeats: Seat[] = [];
let lastDDCells: DDCell[] = [];
let ddResults: Array<number[] | undefined> = [];
let boardEls: HTMLElement[] = [];
let searchStart = 0;
let ddStart = 0;

/** Elapsed seconds since `start`, to 2 decimals. */
const secsSince = (start: number): string => ((performance.now() - start) / 1000).toFixed(2);

function renderResults(): void {
  const format = formatSelect.value as BoardFormat;
  boardEls = lastDeals.map((deal, i) => {
    const el = boardElement(deal, i, lastLockedSeats, format);
    const tricks = ddResults[i];
    if (tricks) el.append(ddResultElement(lastDDCells, tricks));
    return el;
  });
  results.replaceChildren(...boardEls);
}

function setBusy(busy: boolean): void {
  generateBtn.disabled = busy;
  generateBtn.textContent = busy ? 'Generating…' : 'Generate';
}

function dealsToPBN(deals: Deal[]): string {
  return deals
    .map((deal, i) => `[Board "${i + 1}"]\n[Deal "${dealToPBN(deal)}"]`)
    .join('\n\n');
}

async function copyToClipboard(text: string, button: HTMLButtonElement): Promise<void> {
  const label = button.textContent ?? '';
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied!';
  } catch {
    button.textContent = 'Copy failed';
  }
  window.setTimeout(() => (button.textContent = label), 1200);
}

function generate(): void {
  const { constraints, errors: constraintErrors } = form.readConstraints();
  const options = form.readOptions();
  const { given, lockedSeats, errors: givenErrors } = form.readGiven();

  const errors = [...constraintErrors, ...givenErrors];
  if (errors.length) {
    status.textContent = `Fix the conditions: ${errors.join(' ')}`;
    return;
  }

  lastLockedSeats = lockedSeats;
  const request: GenerateRequest = { constraints, given, ...options };

  results.replaceChildren();
  copyPbnBtn.disabled = true;
  copyTextBtn.disabled = true;
  setBusy(true);

  const searching = !isEmptyConstraintSet(constraints);
  const around = lockedSeats.length ? ` around the locked hand${lockedSeats.length > 1 ? 's' : ''}` : '';
  status.textContent = searching
    ? `Searching for matching deals${around}…`
    : `Generating random deals${around}…`;

  searchStart = performance.now();
  worker.postMessage(request);
}

worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
  const msg = event.data;
  setBusy(false);

  if (msg.type === 'error') {
    status.textContent = `Error: ${msg.message}`;
    return;
  }

  const { deals, attempts, accepted, complete, seed } = msg.result;
  lastDeals = deals;
  ddResults = new Array(deals.length); // fresh deals → drop any old DD results
  lastDDCells = [];
  summaryBtn.disabled = true;
  summaryBtn.textContent = 'Summary';
  summaryEl.hidden = true;
  summaryEl.replaceChildren();

  const requested = form.readOptions().count;
  const secs = secsSince(searchStart);
  const rate = accepted > 0 ? ` · ~${Math.round(attempts / accepted)} tried per match` : '';
  if (accepted === 0) {
    status.textContent = `No matching deal found in ${attempts.toLocaleString()} attempts (${secs} s). The constraints may be too tight — raise max attempts or relax a condition. (seed ${seed})`;
  } else if (!complete) {
    status.textContent = `Found ${accepted} of ${requested} in ${secs} s · ${attempts.toLocaleString()} attempts — constraints are very tight.${rate} (seed ${seed})`;
  } else {
    status.textContent = `Found ${accepted} deal${accepted === 1 ? '' : 's'} in ${secs} s · ${attempts.toLocaleString()} attempts.${rate} (seed ${seed})`;
  }

  renderResults();

  const hasDeals = deals.length > 0;
  copyPbnBtn.disabled = !hasDeals;
  copyTextBtn.disabled = !hasDeals;
  solveDDBtn.disabled = !hasDeals;

  if (hasDeals && form.autoSolveDD() && form.readDD().length > 0) solveDD();
});

worker.addEventListener('error', (event) => {
  setBusy(false);
  status.textContent = `Worker error: ${event.message}`;
});

generateBtn.addEventListener('click', generate);
copyPbnBtn.addEventListener('click', () => copyToClipboard(dealsToPBN(lastDeals), copyPbnBtn));
copyTextBtn.addEventListener('click', () =>
  copyToClipboard(dealsLayoutText(lastDeals, lastLockedSeats, formatSelect.value as BoardFormat), copyTextBtn),
);

// ---- Double dummy (solved across a worker pool) ----------------------------
const ddPool = new DDPool();

function solveDD(): void {
  if (lastDeals.length === 0) {
    status.textContent = 'Generate some deals first.';
    return;
  }
  const cells = form.readDD();
  if (cells.length === 0) {
    status.textContent = 'Tick at least one double-dummy cell first.';
    return;
  }
  lastDDCells = cells;
  ddResults = new Array(lastDeals.length);
  renderResults(); // clear any previous DD output before re-solving
  solveDDBtn.disabled = true;
  solveDDBtn.textContent = 'Solving…';
  const total = lastDeals.length;
  status.textContent = `Solving double dummy… 0/${total}`;
  ddStart = performance.now();

  ddPool.solve(lastDeals.map((d) => dealToPBN(d)), cells, {
    onResult(index, tricks) {
      ddResults[index] = tricks;
      const el = boardEls[index];
      if (el) {
        el.querySelector('.dd-result')?.remove();
        el.append(ddResultElement(lastDDCells, tricks));
      }
    },
    onProgress(done) {
      status.textContent = `Solving double dummy… ${done}/${total}`;
    },
    onDone() {
      solveDDBtn.disabled = false;
      solveDDBtn.textContent = 'Solve double dummy';
      summaryBtn.disabled = false;
      if (!summaryEl.hidden) renderSummary();
      status.textContent = `Double dummy solved for ${total} deal${total === 1 ? '' : 's'} in ${secsSince(ddStart)} s.`;
    },
    onError(message) {
      status.textContent = `Double-dummy error: ${message}`;
    },
  });
}

solveDDBtn.addEventListener('click', solveDD);

function renderSummary(): void {
  const perDeal = ddResults.filter((r): r is number[] => r !== undefined);
  if (lastDDCells.length === 0 || perDeal.length === 0) {
    summaryEl.replaceChildren(h('p', { class: 'hint' }, ['No double-dummy results to summarise yet.']));
    return;
  }
  summaryEl.replaceChildren(ddSummaryElement(lastDDCells, perDeal));
}

function toggleSummary(): void {
  summaryEl.hidden = !summaryEl.hidden;
  summaryBtn.textContent = summaryEl.hidden ? 'Summary' : 'Hide summary';
  if (!summaryEl.hidden) renderSummary();
}
summaryBtn.addEventListener('click', toggleSummary);

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesDeal']),
      h('p', { class: 'tagline' }, ['Generating random bridge deals to justify your overbidding.']),
    ]),
    form.element,
    h('div', { class: 'actions' }, [
      generateBtn,
      solveDDBtn,
      summaryBtn,
      copyPbnBtn,
      copyTextBtn,
      h('label', { class: 'format-label' }, ['Layout ', formatSelect]),
    ]),
    status,
    summaryEl,
    results,
  );
}
