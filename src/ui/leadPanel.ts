/**
 * Opening-lead analyser panel for the deal page (an expandable tab).
 *
 * Uses the page's conditions as-is: lock the opening leader's hand (exactly one
 * seat, 13 real cards — no x's), filter the unseen hands to match the bidding,
 * then analyse: deal N constraint-consistent boards and score every card in the
 * leader's hand double dummy against the chosen contract. The opening leader is
 * always declarer's LHO, so declarer is derived (the locked seat's RHO).
 *
 * Each result row expands (click) into a trick-frequency chart; several can be
 * open at once to compare contenders. Vulnerability only affects the score
 * column, so toggling it re-renders from stored results without re-solving.
 */

import './leadPanel.css';
import { h } from './dom';
import type { FormController } from './form';
import { SUIT_SYMBOLS, SUITS, RANK_LABELS, type Rank } from '../engine/cards';
import { SEATS, type Seat, type Deal } from '../engine/deal';
import { dealToPBN } from '../engine/format';
import { DD_STRAIN_LABELS } from '../engine/dd';
import {
  aggregateLeads,
  avgDefenderScore,
  declarerFor,
  tricksToSet,
  unbeatablePct,
  type LeadCardScore,
  type LeadRow,
} from '../engine/lead';
import { DDPool } from '../worker/ddPool';
import type { GenerateRequest, WorkerResponse } from '../worker/protocol';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

export function buildLeadPanel(form: FormController): HTMLElement {
  // ---- Controls -------------------------------------------------------------
  const levelSelect = h('select', { class: 'lead-select' },
    [1, 2, 3, 4, 5, 6, 7].map((l) => h('option', { value: l }, [String(l)])),
  ) as HTMLSelectElement;
  levelSelect.value = '4';
  const strainSelect = h('select', { class: 'lead-select' },
    DD_STRAIN_LABELS.map((label, i) => h('option', { value: i }, [label])),
  ) as HTMLSelectElement;
  strainSelect.value = '0';
  const countInput = h('input', { type: 'number', min: 10, max: 20000, value: '1000', class: 'num lead-count' }) as HTMLInputElement;
  const vulCheck = h('input', { type: 'checkbox' }) as HTMLInputElement;

  const analyseBtn = h('button', { class: 'primary', type: 'button' }, ['Analyse leads']) as HTMLButtonElement;
  const stopBtn = h('button', { type: 'button', disabled: true }, ['Stop']) as HTMLButtonElement;
  const progress = h('div', { class: 'lead-progress' }, ['Lock the leader’s hand in the conditions above, then analyse.']);
  const resultsEl = h('div', { class: 'lead-results' }, []);

  // ---- Run state ------------------------------------------------------------
  const pool = new DDPool();
  const dealerWorker = new Worker(new URL('../worker/dealer.worker.ts', import.meta.url), { type: 'module' });
  let dealerCallback: ((msg: WorkerResponse) => void) | null = null;
  dealerWorker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => dealerCallback?.(e.data));

  let runToken = 0;
  let scores: Array<LeadCardScore[] | undefined> = [];
  let runStart = 0;

  // Stored for re-rendering (vul toggle, chart toggles) without re-solving.
  let lastRows: LeadRow[] = [];
  let lastLevel = 4;
  let lastStrain = 0;
  let lastLeader = 3;
  let lastSeed = 0;
  let lastRequested = 0;
  let lastSolved = 0;
  let lastUnbeatable = 0;
  let lastFinished = true;
  const openCharts = new Set<string>();

  const rowKey = (r: LeadRow): string => `${r.suit}-${r.rank}`;

  // ---- Rendering ------------------------------------------------------------

  function chartRow(row: LeadRow, minT: number, maxT: number, need: number): HTMLElement {
    let maxShare = 0;
    for (let t = minT; t <= maxT; t++) maxShare = Math.max(maxShare, row.counts[t] / row.n);
    const cols: HTMLElement[] = [];
    for (let t = minT; t <= maxT; t++) {
      const share = row.counts[t] / row.n;
      const height = share === 0 ? 2 : Math.max(3, Math.round((share / maxShare) * 58));
      cols.push(
        h('div', { class: 'lead-chart-col' }, [
          h('div', { class: 'lead-bar-pct' }, [share >= 0.005 ? `${Math.round(share * 100)}%` : '']),
          h('div', {
            class: 'lead-bar' + (t >= need ? ' set' : ''),
            style: `height:${height}px` + (share === 0 ? ';background:transparent' : ''),
            title: `${t} defensive tricks on ${(share * 100).toFixed(1)}% of deals (${row.counts[t]} of ${row.n})`,
          }, []),
          h('div', { class: 'lead-x' }, [String(t)]),
        ]),
      );
    }
    return h('tr', { class: 'lead-chart-row' }, [h('td', { colspan: '6' }, [h('div', { class: 'lead-chart' }, cols)])]);
  }

  function renderResults(): void {
    if (lastRows.length === 0) {
      resultsEl.replaceChildren();
      return;
    }
    const need = tricksToSet(lastLevel);
    const vul = vulCheck.checked;
    const declarer = SEAT_NAMES[SEATS[declarerFor(lastLeader)]];
    let minT = 13;
    let maxT = 0;
    for (const r of lastRows) {
      for (let t = 0; t <= 13; t++) {
        if (r.counts[t] > 0) {
          if (t < minT) minT = t;
          if (t > maxT) maxT = t;
        }
      }
    }
    if (minT > maxT) {
      minT = 0;
      maxT = 0;
    }

    const bodyRows: HTMLElement[] = [];
    for (const r of lastRows) {
      const key = rowKey(r);
      const red = r.suit === 1 || r.suit === 2;
      const tr = h('tr', {
        class: 'lead-row',
        title: 'Click to show the trick distribution',
        onclick: () => {
          if (openCharts.has(key)) openCharts.delete(key);
          else openCharts.add(key);
          renderResults();
        },
      }, [
        h('td', {}, [
          h('span', { class: 'lead-caret' }, [openCharts.has(key) ? '▾' : '▸']),
          h('span', { class: 'lead-card' + (red ? ' red' : '') }, [SUIT_SYMBOLS[SUITS[r.suit]]]),
          h('span', { class: 'lead-card' }, [RANK_LABELS[r.rank as Rank]]),
        ]),
        h('td', {}, [r.avg.toFixed(2)]),
        h('td', {}, [`${(r.setPct * 100).toFixed(1)}%`]),
        h('td', {}, [avgDefenderScore(r.counts, r.n, lastLevel, lastStrain, vul).toFixed(0)]),
        h('td', {}, [`${(r.bestPct * 100).toFixed(1)}%`]),
        h('td', {}, [r.avgCost.toFixed(2)]),
      ]);
      bodyRows.push(tr);
      if (openCharts.has(key)) bodyRows.push(chartRow(r, minT, maxT, need));
    }

    const table = h('table', { class: 'lead-table' }, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', {}, ['Lead']),
          h('th', { title: 'Average double-dummy tricks for the defense' }, ['Avg tricks']),
          h('th', { title: `The defense takes ${need}+ tricks and defeats the contract` }, ['Beats %']),
          h('th', { title: `Average duplicate score from the defenders' side, declarer ${vul ? 'vulnerable' : 'not vulnerable'}` }, [`Avg score (${vul ? 'vul' : 'NV'})`]),
          h('th', { title: 'Share of deals where this is a (tied-)best lead double dummy' }, ['Best lead %']),
          h('th', { title: 'Average tricks this lead throws away versus the best lead for that exact deal — 0 means never wrong' }, ['Avg cost']),
        ]),
      ]),
      h('tbody', {}, bodyRows),
    ]);

    resultsEl.replaceChildren(
      h('h2', {}, [lastFinished ? 'Lead analysis' : 'Lead analysis (partial)']),
      h('p', { class: 'lead-note' }, [
        `${lastLevel}${DD_STRAIN_LABELS[lastStrain]} by ${declarer} · ${lastSolved.toLocaleString()} deal${lastSolved === 1 ? '' : 's'}` +
          (lastSolved < lastRequested ? ` of ${lastRequested.toLocaleString()} requested` : '') +
          ' · click a lead for its trick distribution.',
      ]),
      h('p', { class: 'lead-beats' }, [
        `Double-dummy opening lead & defence beats the contract on ${((1 - lastUnbeatable) * 100).toFixed(1)}% of these deals` +
          ` (declarer unbeatable on ${(lastUnbeatable * 100).toFixed(1)}%).`,
      ]),
      table,
      h('p', { class: 'lead-note' }, [`Double dummy: every hand is open, so treat the percentages as comparative. Seed ${lastSeed}.`]),
    );
  }

  // ---- Analysis --------------------------------------------------------------

  interface Setup {
    ok: boolean;
    message?: string;
    constraints: ReturnType<FormController['readConstraints']>['constraints'];
    given: ReturnType<FormController['readGiven']>['given'];
    leaderSeat: Seat;
  }

  function readSetup(): Setup {
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
        if (xs > 0) errors.push('The leader’s hand must be exact — replace the x’s with real cards.');
      }
    }
    return { ok: errors.length === 0, message: errors.join(' '), constraints, given, leaderSeat };
  }

  function analyse(): void {
    const setup = readSetup();
    if (!setup.ok) {
      progress.textContent = `Fix the conditions: ${setup.message}`;
      return;
    }
    const level = Number.parseInt(levelSelect.value, 10);
    const strain = Number.parseInt(strainSelect.value, 10);
    let n = Number.parseInt(countInput.value, 10);
    if (Number.isNaN(n)) n = 1000;
    n = Math.max(10, Math.min(20000, n));
    const opts = form.readOptions();
    const leader = SEATS.indexOf(setup.leaderSeat);

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
    dealerCallback = (msg) => {
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
      scores = new Array(pbns.length);
      runStart = performance.now();
      progress.textContent = `Solving leads 0/${pbns.length}…`;

      const finish = (finished: boolean): void => {
        const perDeal = scores.filter((s): s is LeadCardScore[] => s !== undefined);
        lastRows = aggregateLeads(perDeal, level);
        lastLevel = level;
        lastStrain = strain;
        lastLeader = leader;
        lastSeed = seed;
        lastRequested = n;
        lastSolved = perDeal.length;
        lastUnbeatable = unbeatablePct(perDeal, level);
        lastFinished = finished;
        renderResults();
      };
      stopBtn.onclick = () => {
        runToken++;
        pool.solveLeads([], 0, 0, { onProgress() {}, onDone() {}, onError() {} });
        analyseBtn.disabled = false;
        stopBtn.disabled = true;
        progress.textContent = `Stopped — ${scores.filter((s) => s !== undefined).length.toLocaleString()} deals were solved.`;
        finish(false);
      };

      pool.solveLeads(pbns, strain, leader, {
        onLeads(index, cards) {
          if (token !== runToken) return;
          scores[index] = cards;
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
          finish(true);
        },
        onError(message) {
          if (token !== runToken) return;
          progress.textContent = `Solver error: ${message}`;
        },
      });
    };
    dealerWorker.postMessage(request);
  }

  analyseBtn.addEventListener('click', analyse);
  vulCheck.addEventListener('change', renderResults);

  // ---- Panel -----------------------------------------------------------------

  return h('details', { class: 'form tool-panel lead-panel' }, [
    h('summary', {}, ['Opening lead analyser']),
    h('div', { class: 'tool-panel-body' }, [
      h('div', { class: 'lead-controls' }, [
        h('div', { class: 'lead-field' }, [h('div', { class: 'lead-field-title' }, ['Level']), levelSelect]),
        h('div', { class: 'lead-field' }, [h('div', { class: 'lead-field-title' }, ['Strain']), strainSelect]),
        h('div', { class: 'lead-field' }, [h('div', { class: 'lead-field-title' }, ['Deals']), countInput]),
        h('label', { class: 'lead-vul' }, [vulCheck, ' Declarer vul']),
        analyseBtn,
        stopBtn,
      ]),
      h('p', { class: 'lead-hintline' }, [
        'Uses the conditions above: lock the opening leader’s hand (13 exact cards), constrain the others to match the bidding. ',
        'Declarer is the leader’s right-hand opponent.',
      ]),
      progress,
      resultsEl,
    ]),
  ]);
}
