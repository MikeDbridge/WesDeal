/**
 * WesLead — double-dummy opening lead analyser.
 *
 * Lock YOUR hand (the opening leader's) in the conditions form, filter the
 * unseen hands to match the bidding, eyeball a few sample layouts, then
 * analyse: the page deals N constraint-consistent boards and scores every
 * card in your hand as an opening lead against the chosen contract, double
 * dummy, across the worker pool.
 *
 * The opening leader is always declarer's LHO, so declarer is derived from
 * the locked seat (your RHO) rather than chosen.
 */

import './styles.css';
import './lead.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { buildForm } from './ui/form';
import { boardElement } from './ui/render';
import { SUIT_SYMBOLS, SUITS, RANK_LABELS, type Rank } from './engine/cards';
import { SEATS, type Seat, type Deal } from './engine/deal';
import { dealToPBN } from './engine/format';
import { DD_STRAIN_LABELS } from './engine/dd';
import { aggregateLeads, declarerFor, tricksToSet, unbeatablePct, type LeadCardScore } from './engine/lead';
import { DDPool } from './worker/ddPool';
import type { GenerateRequest, WorkerResponse } from './worker/protocol';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

const form = buildForm();

// ---- Contract & run controls -------------------------------------------------

const levelSelect = h('select', { class: 'lead-select' },
  [1, 2, 3, 4, 5, 6, 7].map((l) => h('option', { value: l }, [String(l)])),
) as HTMLSelectElement;
levelSelect.value = '4';

const strainSelect = h('select', { class: 'lead-select' },
  DD_STRAIN_LABELS.map((label, i) => h('option', { value: i }, [label])),
) as HTMLSelectElement;
strainSelect.value = '0';

const countInput = h('input', { type: 'number', min: 10, max: 20000, value: '1000', class: 'num lead-count' }) as HTMLInputElement;

const declarerLabel = h('span', { class: 'lead-declarer' }, ['Lock your (the leader’s) hand above — declarer is your RHO.']);
const sampleBtn = h('button', { type: 'button' }, ['Generate sample']) as HTMLButtonElement;
const analyseBtn = h('button', { class: 'primary', type: 'button' }, ['Analyse leads']) as HTMLButtonElement;
const stopBtn = h('button', { type: 'button', disabled: true }, ['Stop']) as HTMLButtonElement;
const progress = h('div', { class: 'lead-progress' }, ['Set your hand and the opponents’ conditions, then analyse.']);
const samplesEl = h('div', { class: 'lead-samples' }, []);
const resultsEl = h('div', { class: 'lead-results' }, []);

// ---- Validation ---------------------------------------------------------------

interface Setup {
  constraints: ReturnType<typeof form.readConstraints>['constraints'];
  given: ReturnType<typeof form.readGiven>['given'];
  leaderSeat: Seat;
  leader: number;
  errors: string[];
}

function readSetup(requireExact: boolean): Setup {
  const { constraints, errors: cErr } = form.readConstraints();
  const { given, lockedSeats, errors: gErr } = form.readGiven();
  const errors = [...cErr, ...gErr];
  let leaderSeat: Seat = 'W';
  if (lockedSeats.length !== 1) {
    errors.push('Lock exactly one seat — the opening leader’s hand.');
  } else {
    leaderSeat = lockedSeats[0];
    const spec = given[leaderSeat];
    if (spec) {
      const xs = SUITS.reduce((acc, s) => acc + spec[s].x, 0);
      const len = SUITS.reduce((acc, s) => acc + spec[s].ranks.length, 0) + xs;
      if (len !== 13) errors.push('The leader’s hand must have 13 cards.');
      if (requireExact && xs > 0) {
        errors.push('The leader’s hand must be exact for lead analysis — replace the x’s with real cards.');
      }
    }
  }
  return { constraints, given, leaderSeat, leader: SEATS.indexOf(leaderSeat), errors };
}

// ---- Deal generation (existing constrained dealer, in its worker) -------------

const dealerWorker = new Worker(new URL('./worker/dealer.worker.ts', import.meta.url), { type: 'module' });
let dealerCallback: ((msg: WorkerResponse) => void) | null = null;
dealerWorker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
  dealerCallback?.(e.data);
});

function generate(request: GenerateRequest, cb: (msg: WorkerResponse) => void): void {
  dealerCallback = cb;
  dealerWorker.postMessage(request);
}

// ---- Sample hands ---------------------------------------------------------------

function generateSample(): void {
  const setup = readSetup(false);
  if (setup.errors.length) {
    progress.textContent = `Fix the conditions: ${setup.errors.join(' ')}`;
    return;
  }
  const opts = form.readOptions();
  progress.textContent = 'Generating sample hands…';
  sampleBtn.disabled = true;
  generate({ constraints: setup.constraints, given: setup.given, count: 4, maxAttempts: opts.maxAttempts, seed: opts.seed }, (msg) => {
    sampleBtn.disabled = false;
    if (msg.type === 'error') {
      progress.textContent = `Error: ${msg.message}`;
      return;
    }
    const { deals, attempts, seed } = msg.result;
    if (deals.length === 0) {
      progress.textContent = `No matching deal found in ${attempts.toLocaleString()} attempts — relax the conditions.`;
      return;
    }
    progress.textContent = `Sample of ${deals.length} (seed ${seed}) — happy? Then analyse.`;
    samplesEl.replaceChildren(...deals.map((deal, i) => boardElement(deal, i, [setup.leaderSeat], 'compass-text')));
  });
}

// ---- Lead analysis ----------------------------------------------------------------

const pool = new DDPool();
let runToken = 0;
let curScores: Array<LeadCardScore[] | undefined> = [];
let runStart = 0;

function renderResults(level: number, strain: number, leader: number, nRequested: number, seed: number, finished: boolean): void {
  const perDeal = curScores.filter((s): s is LeadCardScore[] => s !== undefined);
  if (perDeal.length === 0) {
    resultsEl.replaceChildren(h('p', { class: 'lead-note' }, ['No solved deals yet.']));
    return;
  }
  const rows = aggregateLeads(perDeal, level);
  const need = tricksToSet(level);
  const unbeatable = unbeatablePct(perDeal, level);
  const declarer = SEAT_NAMES[SEATS[declarerFor(leader)]];

  const table = h('table', { class: 'lead-table' }, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, ['Lead']),
        h('th', { title: 'Average double-dummy tricks for the defense' }, ['Avg tricks']),
        h('th', { title: `Defense takes ${need}+ tricks` }, ['Sets %']),
        h('th', { title: 'Ties count — several leads can be jointly best' }, ['Best lead %']),
        h('th', { title: 'Average tricks conceded versus the best lead on the same deal' }, ['Avg cost']),
      ]),
    ]),
    h('tbody', {}, rows.map((r) => {
      const red = r.suit === 1 || r.suit === 2;
      return h('tr', {}, [
        h('td', {}, [h('span', { class: 'lead-card' + (red ? ' red' : '') }, [SUIT_SYMBOLS[SUITS[r.suit]]]), h('span', { class: 'lead-card' }, [RANK_LABELS[r.rank as Rank]])]),
        h('td', {}, [r.avg.toFixed(2)]),
        h('td', {}, [`${(r.setPct * 100).toFixed(1)}%`]),
        h('td', {}, [`${(r.bestPct * 100).toFixed(1)}%`]),
        h('td', {}, [r.avgCost.toFixed(2)]),
      ]);
    })),
  ]);

  resultsEl.replaceChildren(
    h('h2', {}, [finished ? 'Lead analysis' : 'Lead analysis (partial)']),
    h('p', { class: 'lead-note' }, [
      `${levelSelect.value}${DD_STRAIN_LABELS[strain]} by ${declarer} · ${perDeal.length.toLocaleString()} deal${perDeal.length === 1 ? '' : 's'}` +
        (perDeal.length < nRequested ? ` of ${nRequested.toLocaleString()} requested` : '') +
        ` · seed ${seed} · double dummy (all hands open — treat percentages as comparative).`,
    ]),
    h('p', { class: 'lead-note' }, [
      `Best defense sets the contract on ${((1 - unbeatable) * 100).toFixed(1)}% of these deals; declarer is unbeatable on ${(unbeatable * 100).toFixed(1)}%.`,
    ]),
    table,
  );
}

function analyse(): void {
  const setup = readSetup(true);
  if (setup.errors.length) {
    progress.textContent = `Fix the conditions: ${setup.errors.join(' ')}`;
    return;
  }
  const level = Number.parseInt(levelSelect.value, 10);
  const strain = Number.parseInt(strainSelect.value, 10);
  let n = Number.parseInt(countInput.value, 10);
  if (Number.isNaN(n)) n = 1000;
  n = Math.max(10, Math.min(20000, n));
  const opts = form.readOptions();

  runToken++;
  const token = runToken;
  analyseBtn.disabled = true;
  stopBtn.disabled = false;
  progress.textContent = `Dealing ${n.toLocaleString()} boards consistent with the conditions…`;

  const request: GenerateRequest = {
    constraints: setup.constraints,
    given: setup.given,
    count: n,
    maxAttempts: Math.max(opts.maxAttempts, n * 5000),
    seed: opts.seed,
  };
  generate(request, (msg) => {
    if (token !== runToken) return;
    if (msg.type === 'error') {
      progress.textContent = `Error: ${msg.message}`;
      analyseBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }
    const { deals, seed, accepted } = msg.result;
    if (accepted === 0) {
      progress.textContent = 'No matching deals — relax the conditions.';
      analyseBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }
    const pbns = deals.map((d: Deal) => dealToPBN(d));
    curScores = new Array(pbns.length);
    runStart = performance.now();
    const shortfall = accepted < n ? ` (only ${accepted.toLocaleString()} matched)` : '';
    progress.textContent = `Solving leads 0/${pbns.length}${shortfall}…`;

    pool.solveLeads(pbns, strain, setup.leader, {
      onLeads(index, cards) {
        if (token !== runToken) return;
        curScores[index] = cards;
      },
      onProgress(done, total) {
        if (token !== runToken) return;
        if (done % 20 !== 0 && done !== total) return;
        const secs = (performance.now() - runStart) / 1000;
        const rate = done / Math.max(secs, 0.001);
        const eta = rate > 0 ? Math.ceil((total - done) / rate) : 0;
        progress.textContent = `Solving leads ${done}/${total} · ${rate.toFixed(1)} deals/s · ETA ${eta} s (keep this tab open)`;
      },
      onDone() {
        if (token !== runToken) return;
        analyseBtn.disabled = false;
        stopBtn.disabled = true;
        const secs = (performance.now() - runStart) / 1000;
        progress.textContent = `Analysed ${pbns.length.toLocaleString()} deals in ${secs.toFixed(1)} s.`;
        renderResults(level, strain, setup.leader, n, seed, true);
      },
      onError(message) {
        if (token !== runToken) return;
        progress.textContent = `Solver error: ${message}`;
      },
    });
  });
}

function stop(): void {
  runToken++;
  pool.solveLeads([], 0, 0, { onProgress() {}, onDone() {}, onError() {} });
  analyseBtn.disabled = false;
  stopBtn.disabled = true;
  const solved = curScores.filter((s) => s !== undefined).length;
  progress.textContent = `Stopped — ${solved.toLocaleString()} deals were solved.`;
  renderResults(Number.parseInt(levelSelect.value, 10), Number.parseInt(strainSelect.value, 10), readSetup(false).leader, solved, 0, false);
}

sampleBtn.addEventListener('click', generateSample);
analyseBtn.addEventListener('click', analyse);
stopBtn.addEventListener('click', stop);

// ---- Page -------------------------------------------------------------------------

const analysePanel = h('section', { class: 'form' }, [
  h('h2', {}, ['Contract & analysis']),
  h('div', { class: 'lead-controls' }, [
    h('div', { class: 'lead-field' }, [h('div', { class: 'lead-field-title' }, ['Level']), levelSelect]),
    h('div', { class: 'lead-field' }, [h('div', { class: 'lead-field-title' }, ['Strain']), strainSelect]),
    h('div', { class: 'lead-field' }, [h('div', { class: 'lead-field-title' }, ['Deals']), countInput]),
    declarerLabel,
  ]),
  h('div', { class: 'lead-controls', style: 'margin-top:10px' }, [sampleBtn, analyseBtn, stopBtn]),
  progress,
]);

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.classList.add('lead-page');
  app.append(
    siteNav('lead'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesLead']),
      h('p', { class: 'tagline' }, ['Every opening lead, scored double dummy against the field of hands the bidding allows.']),
    ]),
    form.element,
    analysePanel,
    samplesEl,
    resultsEl,
  );
}
