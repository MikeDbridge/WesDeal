import './styles.css';
import { h } from './ui/dom';
import { buildForm } from './ui/form';
import { boardElement, dealsLayoutText, BOARD_FORMATS, DEFAULT_FORMAT, type BoardFormat } from './ui/render';
import { dealToPBN } from './engine/format';
import { isEmptyConstraintSet } from './engine/constraints';
import { type Deal, type Seat } from './engine/deal';
import type { GenerateRequest, WorkerResponse } from './worker/protocol';

const worker = new Worker(new URL('./worker/dealer.worker.ts', import.meta.url), {
  type: 'module',
});

const form = buildForm();
const status = h('div', { class: 'status' }, ['Set conditions and generate a deal.']);
const results = h('div', { class: 'results' });

const generateBtn = h('button', { class: 'primary', type: 'button' }, ['Generate']) as HTMLButtonElement;
const copyPbnBtn = h('button', { type: 'button', disabled: true }, ['Copy PBN']) as HTMLButtonElement;
const copyTextBtn = h('button', { type: 'button', disabled: true, title: 'Copy the deals as text in the selected layout' }, ['Copy layout']) as HTMLButtonElement;

const formatSelect = h(
  'select',
  { class: 'format-select', title: 'Output layout' },
  BOARD_FORMATS.map((f) => h('option', { value: f.value }, [f.label])),
) as HTMLSelectElement;
formatSelect.value = DEFAULT_FORMAT;
formatSelect.addEventListener('change', renderResults);

let lastDeals: Deal[] = [];
let lastLockedSeats: Seat[] = [];

function renderResults(): void {
  const format = formatSelect.value as BoardFormat;
  results.replaceChildren(...lastDeals.map((deal, i) => boardElement(deal, i, lastLockedSeats, format)));
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

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesDeal']),
      h('p', { class: 'tagline' }, ['Random bridge deals that fit your conditions.']),
    ]),
    form.element,
    h('div', { class: 'actions' }, [
      generateBtn,
      copyPbnBtn,
      copyTextBtn,
      h('label', { class: 'format-label' }, ['Layout ', formatSelect]),
    ]),
    status,
    results,
  );
}
