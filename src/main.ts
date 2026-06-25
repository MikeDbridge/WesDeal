import './styles.css';
import { h } from './ui/dom';
import { buildForm } from './ui/form';
import { boardElement, dealsLayoutText, ddLineElement, BOARD_FORMATS, DEFAULT_FORMAT, type BoardFormat } from './ui/render';
import { dealToPBN } from './engine/format';
import { isEmptyConstraintSet } from './engine/constraints';
import { type Deal, type Seat } from './engine/deal';
import type { DDCell } from './engine/dd';
import type { GenerateRequest, WorkerResponse } from './worker/protocol';
import type { DDSolveRequest, DDWorkerMessage } from './worker/dd.protocol';

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

function renderResults(): void {
  const format = formatSelect.value as BoardFormat;
  boardEls = lastDeals.map((deal, i) => {
    const el = boardElement(deal, i, lastLockedSeats, format);
    const tricks = ddResults[i];
    if (tricks) el.append(ddLineElement(lastDDCells, tricks));
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

  const requested = form.readOptions().count;
  const rate = accepted > 0 ? ` · ~${Math.round(attempts / accepted)} tried per match` : '';
  if (accepted === 0) {
    status.textContent = `No matching deal found in ${attempts.toLocaleString()} attempts. The constraints may be too tight — raise max attempts or relax a condition. (seed ${seed})`;
  } else if (!complete) {
    status.textContent = `Found ${accepted} of ${requested} within ${attempts.toLocaleString()} attempts — constraints are very tight.${rate} (seed ${seed})`;
  } else {
    status.textContent = `Found ${accepted} deal${accepted === 1 ? '' : 's'} in ${attempts.toLocaleString()} attempts.${rate} (seed ${seed})`;
  }

  renderResults();

  const hasDeals = deals.length > 0;
  copyPbnBtn.disabled = !hasDeals;
  copyTextBtn.disabled = !hasDeals;
  solveDDBtn.disabled = !hasDeals;
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

// ---- Double dummy ----------------------------------------------------------
let ddWorker: Worker | null = null;
let ddProgress = 0;

function ensureDDWorker(): Worker {
  if (ddWorker) return ddWorker;
  ddWorker = new Worker(new URL('./worker/dd.worker.ts', import.meta.url), { type: 'module' });
  ddWorker.addEventListener('message', (e: MessageEvent<DDWorkerMessage>) => {
    const msg = e.data;
    if (msg.type === 'result') {
      ddResults[msg.index] = msg.tricks;
      const el = boardEls[msg.index];
      if (el) {
        el.querySelector('.dd-line')?.remove();
        el.append(ddLineElement(lastDDCells, msg.tricks));
      }
      ddProgress++;
      status.textContent = `Solving double dummy… ${ddProgress}/${lastDeals.length}`;
    } else if (msg.type === 'done') {
      solveDDBtn.disabled = false;
      solveDDBtn.textContent = 'Solve double dummy';
      status.textContent = `Double dummy solved for ${lastDeals.length} deal${lastDeals.length === 1 ? '' : 's'}.`;
    } else if (msg.type === 'error') {
      solveDDBtn.disabled = false;
      solveDDBtn.textContent = 'Solve double dummy';
      status.textContent = `Double-dummy error: ${msg.message}`;
    }
  });
  return ddWorker;
}

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
  ddProgress = 0;
  renderResults(); // clear any previous DD lines before re-solving
  solveDDBtn.disabled = true;
  solveDDBtn.textContent = 'Solving…';
  status.textContent = 'Loading double-dummy solver…';
  const req: DDSolveRequest = { type: 'solve', deals: lastDeals.map((d) => dealToPBN(d)), cells };
  ensureDDWorker().postMessage(req);
}

solveDDBtn.addEventListener('click', solveDD);

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
      copyPbnBtn,
      copyTextBtn,
      h('label', { class: 'format-label' }, ['Layout ', formatSelect]),
    ]),
    status,
    results,
  );
}
