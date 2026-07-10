/**
 * Opening-lead analyser panel for the deal page (an expandable tab).
 *
 * Uses the page's conditions as-is: lock the opening leader's hand (exactly one
 * seat, 13 cards — any "x" placeholders are fixed to that suit's lowest free
 * cards so the hand is constant), filter the unseen hands to match the bidding,
 * then analyse: deal N constraint-consistent boards and score every lead in the
 * leader's hand double dummy against the chosen contract. The opening leader is
 * always declarer's LHO, so declarer is derived (the locked seat's RHO).
 *
 * Touching cards of the fixed hand are pooled into one lead (leading either is
 * identical double dummy). Each result row expands (click) into a trick-frequency
 * chart; several can be open at once to compare contenders. Vulnerability only
 * affects the score column, so toggling it re-renders without re-solving.
 */

import './leadPanel.css';
import { h } from './dom';
import type { FormController } from './form';
import { SUIT_SYMBOLS, SUITS } from '../engine/cards';
import { SEATS, type Seat, type Deal } from '../engine/deal';
import { dealToPBN } from '../engine/format';
import type { HandSpec } from '../engine/parse';
import { boardElement } from './render';
import { DD_STRAIN_LABELS } from '../engine/dd';
import {
  aggregateLeadGroups,
  avgDefenderScore,
  computeLeadGroups,
  declarerFor,
  groupLabel,
  groupTricks,
  tricksToSet,
  unbeatablePct,
  type LeadCardScore,
  type LeadGroup,
  type LeadRow,
} from '../engine/lead';
import { DDPool } from '../worker/ddPool';
import type { GenerateRequest, WorkerResponse } from '../worker/protocol';
import { encodeState, type FormState, type LeadState, type ShareState } from '../engine/shareState';
import { describeConditions, leadSummaryText, type LeadSummaryInput } from '../engine/leadExport';
import { drawLeadSummary } from './leadImage';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

/** Fix a hand spec's "x" placeholders to the lowest free cards in each suit. */
function resolveLowest(spec: HandSpec): HandSpec {
  const out = {} as HandSpec;
  for (const suit of SUITS) {
    const ranks = [...spec[suit].ranks];
    const named = new Set(ranks);
    let need = spec[suit].x;
    for (let rank = 2; rank <= 14 && need > 0; rank++) {
      if (!named.has(rank)) {
        ranks.push(rank);
        named.add(rank);
        need--;
      }
    }
    out[suit] = { ranks, x: 0 };
  }
  return out;
}

/** List a fully-resolved spec's cards as {suit index, rank}. */
function specCards(spec: HandSpec): Array<{ suit: number; rank: number }> {
  const cards: Array<{ suit: number; rank: number }> = [];
  SUITS.forEach((suit, si) => {
    for (const rank of spec[suit].ranks) cards.push({ suit: si, rank });
  });
  return cards;
}

export interface LeadPanel {
  element: HTMLDetailsElement;
  /** Restore the analyser controls from a shared link and open the panel. */
  applyParams(lead: LeadState | undefined): void;
}

export function buildLeadPanel(form: FormController): LeadPanel {
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
  const sampleEl = h('div', { class: 'lead-sample' }, []);

  const copyLinkBtn = h('button', { type: 'button', class: 'lead-export-btn', title: 'Copy a link that reopens this page with these conditions and settings (seed preserved)' }, ['Copy link']) as HTMLButtonElement;
  const copyTextBtn = h('button', { type: 'button', class: 'lead-export-btn', title: 'Copy a text summary of the conditions and results' }, ['Copy summary']) as HTMLButtonElement;
  const copyImgBtn = h('button', { type: 'button', class: 'lead-export-btn', title: 'Copy an image of the summary (falls back to a download if the browser blocks it)' }, ['Copy image']) as HTMLButtonElement;
  const saveImgBtn = h('button', { type: 'button', class: 'lead-export-btn', title: 'Download the summary image as a PNG' }, ['Save image']) as HTMLButtonElement;
  const exportBar = h('div', { class: 'lead-export', hidden: true }, [
    h('span', { class: 'lead-export-label' }, ['Export']),
    copyLinkBtn,
    copyTextBtn,
    copyImgBtn,
    saveImgBtn,
  ]);

  // ---- Run state ------------------------------------------------------------
  const pool = new DDPool();
  const dealerWorker = new Worker(new URL('../worker/dealer.worker.ts', import.meta.url), { type: 'module' });
  let dealerCallback: ((msg: WorkerResponse) => void) | null = null;
  dealerWorker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => dealerCallback?.(e.data));

  let runToken = 0;
  let scores: Array<LeadCardScore[] | undefined> = [];
  let runStart = 0;
  // The fixed leader's lead groups and a sample of solved boards, for the
  // "first 10 deals" panel. Guarded by runToken like the other run state.
  let leadGroups: LeadGroup[] = [];
  let sampleDeals: Deal[] = [];

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
  // Form snapshot taken when Analyse is pressed, so exports match the results
  // shown even if the conditions are edited afterwards.
  let lastFormState: FormState | null = null;
  const openCharts = new Set<string>();

  const rowKey = (r: LeadRow): string => `${r.suit}-${r.ranks[0]}`;

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
      exportBar.hidden = true;
      resultsEl.replaceChildren();
      return;
    }
    exportBar.hidden = false;
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
          h('span', { class: 'lead-card' }, [r.label]),
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
      h('p', { class: 'lead-note' }, [
        'Double dummy: every hand is open, so treat the percentages as comparative. ',
        h('span', { class: 'lead-seed' }, [`seed ${lastSeed}`]),
      ]),
    );
  }

  /** The first 10 tested deals, each with its per-lead DD tricks (best bolded). */
  function renderSample(): void {
    if (sampleDeals.length === 0 || leadGroups.length === 0) {
      sampleEl.replaceChildren();
      return;
    }
    const boards = sampleDeals.map((deal, i) => {
      const board = boardElement(deal, i, [SEATS[lastLeader]], 'compass-mini', false);
      const perCard = scores[i];
      if (perCard) board.append(leadsLine(perCard));
      return board;
    });
    sampleEl.replaceChildren(
      h('h3', { class: 'lead-sample-head' }, ['First 10 deals tested']),
      h('p', { class: 'lead-note' }, ['Double-dummy defensive tricks for each lead — the best lead(s) for the board are in bold.']),
      h('div', { class: 'lead-sample-grid' }, boards),
    );
  }

  /** One board's leads with DD tricks, in hand order, best-scoring in bold. */
  function leadsLine(perCard: LeadCardScore[]): HTMLElement {
    const tricks = groupTricks(perCard, leadGroups);
    let max = 0;
    for (const t of tricks) if (t > max) max = t;
    const order = leadGroups
      .map((_, i) => i)
      .sort((a, b) => leadGroups[a].suit - leadGroups[b].suit || leadGroups[b].ranks[0] - leadGroups[a].ranks[0]);
    const chips = order.map((gi) => {
      const g = leadGroups[gi];
      const red = g.suit === 1 || g.suit === 2;
      return h('span', { class: 'lead-chip' + (tricks[gi] === max ? ' best' : '') }, [
        h('span', { class: 'lead-card' + (red ? ' red' : '') }, [SUIT_SYMBOLS[SUITS[g.suit]]]),
        h('span', { class: 'lead-card' }, [groupLabel(g)]),
        h('span', { class: 'lead-chip-t' }, [String(tricks[gi])]),
      ]);
    });
    return h('div', { class: 'lead-board-leads' }, chips);
  }

  // ---- Analysis --------------------------------------------------------------

  interface Setup {
    ok: boolean;
    message?: string;
    constraints: ReturnType<FormController['readConstraints']>['constraints'];
    given: ReturnType<FormController['readGiven']>['given'];
    leaderSeat: Seat;
    leaderCards: Array<{ suit: number; rank: number }>;
  }

  function readSetup(): Setup {
    const { constraints, errors: cErr } = form.readConstraints();
    const { given, lockedSeats, errors: gErr } = form.readGiven();
    const errors = [...cErr, ...gErr];
    let leaderSeat: Seat = 'W';
    let leaderCards: Array<{ suit: number; rank: number }> = [];
    if (lockedSeats.length !== 1) {
      errors.push('Lock exactly one seat — the opening leader’s hand.');
    } else {
      leaderSeat = lockedSeats[0];
      const spec = given[leaderSeat];
      if (spec) {
        const len = SUITS.reduce((acc, s) => acc + spec[s].ranks.length + spec[s].x, 0);
        if (len !== 13) {
          errors.push('The leader’s hand must have 13 cards.');
        } else {
          // "x" cards become the lowest free cards so the hand is fixed.
          const resolved = resolveLowest(spec);
          given[leaderSeat] = resolved;
          leaderCards = specCards(resolved);
        }
      }
    }
    return { ok: errors.length === 0, message: errors.join(' '), constraints, given, leaderSeat, leaderCards };
  }

  function analyse(): void {
    const setup = readSetup();
    if (!setup.ok) {
      progress.textContent = `Fix the conditions: ${setup.message}`;
      return;
    }
    lastFormState = form.serialize();
    const level = Number.parseInt(levelSelect.value, 10);
    const strain = Number.parseInt(strainSelect.value, 10);
    let n = Number.parseInt(countInput.value, 10);
    if (Number.isNaN(n)) n = 1000;
    n = Math.max(10, Math.min(20000, n));
    const opts = form.readOptions();
    const leader = SEATS.indexOf(setup.leaderSeat);
    leadGroups = computeLeadGroups(setup.leaderCards);
    sampleDeals = [];
    sampleEl.replaceChildren();

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
      sampleDeals = deals.slice(0, 10);
      scores = new Array(pbns.length);
      runStart = performance.now();
      progress.textContent = `Solving leads 0/${pbns.length}…`;

      const finish = (finished: boolean): void => {
        const perDeal = scores.filter((s): s is LeadCardScore[] => s !== undefined);
        lastRows = aggregateLeadGroups(perDeal, leadGroups, level);
        lastLevel = level;
        lastStrain = strain;
        lastLeader = leader;
        lastSeed = seed;
        lastRequested = n;
        lastSolved = perDeal.length;
        lastUnbeatable = unbeatablePct(perDeal, level);
        lastFinished = finished;
        renderResults();
        renderSample();
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

  // ---- Exports ---------------------------------------------------------------

  /** Gather the finished analysis for the text/image exporters (null if none). */
  function currentSummaryInput(): LeadSummaryInput | null {
    if (!lastFormState || lastRows.length === 0) return null;
    return {
      level: lastLevel,
      strain: lastStrain,
      leader: lastLeader,
      deals: lastSolved,
      requested: lastRequested,
      seed: lastSeed,
      vul: vulCheck.checked,
      beatsPct: 1 - lastUnbeatable,
      rows: lastRows,
      openKeys: [...openCharts],
      conditions: describeConditions(lastFormState, SEATS[lastLeader]),
    };
  }

  /** The shareable state — the seed is pinned to the run so a reload reproduces it. */
  function buildShareState(): ShareState {
    const base = lastFormState ?? form.serialize();
    const formState: FormState = { ...base, options: { ...base.options, seed: String(lastSeed) } };
    const lead: LeadState = {
      level: String(lastLevel),
      strain: String(lastStrain),
      deals: String(lastRequested || countInput.value),
      vul: vulCheck.checked,
    };
    return { v: 1, form: formState, lead };
  }

  const shareUrl = (): string => `${location.origin}${location.pathname}#s=${encodeState(buildShareState())}`;

  const STRAIN_CODES = ['S', 'H', 'D', 'C', 'NT'];
  const exportName = (ext: string): string => `wesdeal-leads-${lastLevel}${STRAIN_CODES[lastStrain]}-seed${lastSeed}.${ext}`;

  const toBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));

  async function copyImageToClipboard(blob: Blob): Promise<boolean> {
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch {
      return false;
    }
  }

  function downloadBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name }) as HTMLAnchorElement;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function feedback(btn: HTMLButtonElement, ok: string, action: () => Promise<void> | void): Promise<void> {
    const label = btn.textContent ?? '';
    try {
      await action();
      btn.textContent = ok;
    } catch {
      btn.textContent = 'Failed';
    }
    setTimeout(() => (btn.textContent = label), 1400);
  }

  copyLinkBtn.addEventListener('click', () =>
    feedback(copyLinkBtn, 'Link copied!', () => navigator.clipboard.writeText(shareUrl())),
  );
  copyTextBtn.addEventListener('click', () =>
    feedback(copyTextBtn, 'Copied!', () => {
      const input = currentSummaryInput();
      if (!input) throw new Error('no results');
      return navigator.clipboard.writeText(leadSummaryText(input));
    }),
  );
  copyImgBtn.addEventListener('click', async () => {
    const input = currentSummaryInput();
    if (!input) return;
    const label = copyImgBtn.textContent ?? '';
    try {
      const blob = await toBlob(drawLeadSummary(input));
      if (await copyImageToClipboard(blob)) copyImgBtn.textContent = 'Copied!';
      else {
        downloadBlob(blob, exportName('png'));
        copyImgBtn.textContent = 'Saved PNG';
      }
    } catch {
      copyImgBtn.textContent = 'Failed';
    }
    setTimeout(() => (copyImgBtn.textContent = label), 1400);
  });
  saveImgBtn.addEventListener('click', () =>
    feedback(saveImgBtn, 'Saved PNG', async () => {
      const input = currentSummaryInput();
      if (!input) throw new Error('no results');
      downloadBlob(await toBlob(drawLeadSummary(input)), exportName('png'));
    }),
  );

  // ---- Panel -----------------------------------------------------------------

  const details = h('details', { class: 'form tool-panel lead-panel' }, [
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
        'Uses the conditions above: lock the opening leader’s hand (13 cards; x’s become the lowest cards), constrain the others to match the bidding. ',
        'Declarer is the leader’s right-hand opponent.',
      ]),
      progress,
      exportBar,
      resultsEl,
      sampleEl,
    ]),
  ]);

  function applyParams(lead: LeadState | undefined): void {
    if (lead) {
      if (lead.level) levelSelect.value = lead.level;
      if (lead.strain) strainSelect.value = lead.strain;
      if (lead.deals) countInput.value = lead.deals;
      vulCheck.checked = !!lead.vul;
    }
    details.open = true;
    progress.textContent = 'Loaded a shared setup — press “Analyse leads” to reproduce it (the seed is preserved).';
  }

  return { element: details, applyParams };
}
