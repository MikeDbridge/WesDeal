/**
 * WesPlay (analyze.html): import a deal from almost any format, arrange it by
 * dragging cards between hands, then tap a contract in the makeable table to
 * play the hand out card by card with double-dummy guidance.
 *
 * Setup is a card-layout editor (engine/layout.ts): all 52 cards live either
 * in a hand or in the unassigned pool, so duplicates are impossible and the
 * only validation left is "13 per hand" — short/over hands are shaded until
 * the counts come right, at which point the contract table appears.
 *
 * The whole position lives in the URL hash (#d=…, analyzeState.ts): the
 * import panel just fills it, the editor and play-out mutate it, and Copy
 * link shares it. All solving happens in the DD worker (ddClient.ts); the UI
 * thread never blocks.
 */

import './styles.css';
import './ui/analyze.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { SUITS, SUIT_SYMBOLS, RANK_LABELS, rankOf, suitOf, type Card, type Suit } from './engine/cards';
import { SEATS, type Seat, type Deal } from './engine/deal';
import { type Vulnerability, vulnerabilityLabel } from './engine/board';
import { dealToPBN } from './engine/format';
import { importDeal } from './engine/importDeal';
import {
  type Layout, type Zone, emptyLayout, layoutFromHands, handsFromLayout, poolOf, zoneOf,
  moveCard, layoutComplete, dealFromLayout, poolFillTarget,
} from './engine/layout';
import {
  encodeAnalyzeState, decodeAnalyzeState, sideVulnerable, ddsVulnerability, type AnalyzeState,
} from './engine/analyzeState';
import {
  type Contract, parseContract, contractString, computePlay, legalPlays, sanitisePlays,
  ddPosition, declarerTotal, scoreDeclarer, scoreLabel, resultLabel,
  playFromString, playToString, cardFromDds, STRAIN_LETTERS, type PlayView,
} from './engine/play';
import type { LeadCardScore } from './engine/lead';
import { DDClient, type DDTableResult } from './worker/ddClient';

// ---- Page state -------------------------------------------------------------

const client = new DDClient();

interface PageState {
  dealer: Seat;
  vul: Vulnerability;
  contract: Contract | null;
  plays: Card[];
  redo: Card[];
}

const state: PageState = { dealer: 'N', vul: 'None', contract: null, plays: [], redo: [] };

/** The setup editor's card placement (source of truth for the hands). */
let layout: Layout = emptyLayout();
let selectedCard: Card | null = null;

let mode: 'setup' | 'play' = 'setup';
let deal: Deal | null = null;
/** PBN of the deal being played — resume is offered while the layout matches. */
let playPbn = '';
/** Contract/play read from an import, offered as a one-tap start. */
let importedContract: Contract | null = null;
let importedPlay: string | null = null;

let tableRes: DDTableResult | null = null;
let tableKey = '';
let scores: LeadCardScore[] | null = null;
let solveSeq = 0;
let finishing = false;
let pickerOpen = false;
let rotateView = true; // declarer at the bottom of the compass
let lastHash = '';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };
const seatIdx = (s: Seat): number => SEATS.indexOf(s);
const redSuit = (s: Suit): boolean => s === 'H' || s === 'D';

// ---- URL hash ---------------------------------------------------------------

function pushHash(): void {
  const st: AnalyzeState = { v: 1, hands: handsFromLayout(layout), dealer: state.dealer, vul: state.vul };
  if (state.contract) {
    st.contract = contractString(state.contract);
    st.declarer = SEATS[state.contract.declarer];
    if (state.plays.length > 0) st.play = playToString(state.plays);
  }
  lastHash = '#d=' + encodeAnalyzeState(st);
  history.replaceState(null, '', location.pathname + location.search + lastHash);
}

function applyState(st: AnalyzeState): void {
  layout = layoutFromHands(st.hands).layout;
  selectedCard = null;
  state.dealer = st.dealer;
  state.vul = st.vul;
  syncMetaControls();
  importedContract = st.contract && st.declarer ? parseContract(st.contract, seatIdx(st.declarer)) : null;
  importedPlay = st.play ?? null;
  if (importedContract && layoutComplete(layout)) {
    startPlay(importedContract, { importedPlayString: importedPlay });
    return;
  }
  mode = 'setup';
  updateModeVisibility();
  renderSetup();
  maybeSolveTable();
}

// ---- Import panel -----------------------------------------------------------

const importText = h('textarea', {
  class: 'ap-import-text',
  placeholder:
    'Paste a deal in any format — PBN, a BBO handviewer link, LIN, or plain hands…\n' +
    'e.g.  N:AKQ2.54.T987.J32 J97.KQJ9.62.T874 T863.A87.AKQ.965 54.T632.J543.AKQ',
  autocapitalize: 'off', autocorrect: 'off', spellcheck: false, rows: 4,
}) as HTMLTextAreaElement;

const feedback = h('div', { class: 'ap-feedback' }, []);
const noteBox = h('div', {}, []);

const dealerSel = h('select', { class: 'ap-select' }, SEATS.map((s) =>
  h('option', { value: s }, [SEAT_NAMES[s]]),
)) as HTMLSelectElement;
const vulSel = h('select', { class: 'ap-select' }, (['None', 'NS', 'EW', 'Both'] as Vulnerability[]).map((v) =>
  h('option', { value: v }, [vulnerabilityLabel(v)]),
)) as HTMLSelectElement;

function syncMetaControls(): void {
  dealerSel.value = state.dealer;
  vulSel.value = state.vul;
}

dealerSel.addEventListener('change', () => {
  state.dealer = dealerSel.value as Seat;
  pushHash();
  maybeSolveTable();
  renderSetup();
});
vulSel.addEventListener('change', () => {
  state.vul = vulSel.value as Vulnerability;
  pushHash();
  maybeSolveTable();
  renderSetup();
});

let importTimer = 0;
importText.addEventListener('input', () => {
  window.clearTimeout(importTimer);
  importTimer = window.setTimeout(() => runImport(importText.value), 200);
});

function runImport(text: string): void {
  if (text.trim() === '') {
    feedback.replaceChildren();
    noteBox.replaceChildren();
    return;
  }
  const result = importDeal(text);
  const label: Record<string, string> = {
    pbn: 'PBN deal', 'pbn-file': 'PBN file', lin: 'BBO LIN', 'bbo-url': 'BBO link', text: 'hand text',
  };
  if (!result.deal) {
    feedback.replaceChildren(h('span', { class: 'bad' }, [result.errors[0] ?? 'Could not read that.']));
    noteBox.replaceChildren();
    return;
  }
  const converted = layoutFromHands(result.deal.hands);
  layout = converted.layout;
  selectedCard = null;
  if (result.deal.dealer) state.dealer = result.deal.dealer;
  if (result.deal.vul) state.vul = result.deal.vul;
  syncMetaControls();
  importedContract = result.deal.contract && result.deal.declarer
    ? parseContract(result.deal.contract, seatIdx(result.deal.declarer))
    : null;
  importedPlay = result.deal.play ?? null;
  pushHash();
  renderSetup();
  maybeSolveTable();

  const complete = layoutComplete(layout);
  const status = complete
    ? h('span', { class: 'ok' }, ['all 52 cards ✓'])
    : h('span', { class: 'bad' }, ['arrange the rest below']);
  const extras: string[] = [];
  if (importedContract) extras.push(prettyContractText(importedContract));
  if (importedPlay) extras.push(`${importedPlay.length / 2} cards played`);
  feedback.replaceChildren(
    `Detected ${label[result.format ?? 'text']}: `, status,
    ...(extras.length > 0 ? [` · ${extras.join(' · ')}`] : []),
  );
  noteBox.replaceChildren(
    ...[...result.errors, ...result.notes, ...converted.dropped].map((n) => h('p', { class: 'ap-note' }, [n])),
  );
}

// File pick and drag/drop (images are the phase-2 extractDeal seam).
const fileInput = h('input', { type: 'file', accept: '.pbn,.lin,.txt,text/plain', style: 'display:none' }) as HTMLInputElement;
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void readDealFile(file);
  fileInput.value = '';
});

async function readDealFile(file: File): Promise<void> {
  if (file.type.startsWith('image/')) {
    feedback.replaceChildren(h('span', { class: 'bad' }, ['Photo import is coming in a later update.']));
    return;
  }
  const text = await file.text();
  importText.value = text;
  runImport(text);
}

function wireDrop(zone: HTMLElement): void {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) void readDealFile(file);
    else {
      const text = e.dataTransfer?.getData('text');
      if (text) {
        importText.value = text;
        runImport(text);
      }
    }
  });
}

// ---- Examples ---------------------------------------------------------------

const EXAMPLE_PBN = [
  '[Board "1"]',
  '[Dealer "S"]',
  '[Vulnerable "None"]',
  '[Deal "S:AKQJT9.A32.K2.32 87.KQJT.QJT9.KQJ 32.54.A8765.A654 654.9876.43.T987"]',
  '[Contract "4S"]',
  '[Declarer "S"]',
].join('\n');

const EXAMPLE_LIN =
  'st||md|1SAKQJT9HA32DK2C32,S87HKQJTDQJT9CKQJ,S32H54DA8765CA654,|rh||ah|Board 1|sv|o' +
  '|mb|1S|mb|p|mb|2S|mb|p|mb|4S|mb|p|mb|p|mb|p|pc|HK|pc|H4|pc|H6|pc|HA|';
const EXAMPLE_URL = 'https://www.bridgebase.com/tools/handviewer.html?lin=' + encodeURIComponent(EXAMPLE_LIN);

const EXAMPLE_TEXT = [
  'Board 1 · Dealer S · Vul None',
  'N: 32 54 A8765 A654',
  'E: 654 9876 43 T987',
  'S: AKQJT9 A32 K2 32',
  'W: 87 KQJT QJT9 KQJ',
].join('\n');

function exampleButton(label: string, text: string): HTMLElement {
  return h('button', {
    class: 'ap-btn small',
    onclick: () => {
      importText.value = text;
      runImport(text);
    },
  }, [label]);
}

// ---- Setup: the card-layout editor ------------------------------------------

const setupBoard = h('section', { class: 'form ap-board' }, []);

function afterLayoutMutation(): void {
  selectedCard = null;
  pushHash();
  renderSetup();
  maybeSolveTable();
}

function moveSelected(zone: Zone): void {
  if (selectedCard === null) return;
  moveCard(layout, selectedCard, zone);
  afterLayoutMutation();
}

// Dragging: pointer events (HTML5 drag-and-drop is useless on touch). A press
// that moves more than a few pixels lifts a ghost chip; drop lands on the
// zone under the pointer. A plain tap falls through to the click handler,
// which toggles selection for the tap-then-"⤵ here" alternative.
interface DragOp {
  card: Card;
  src: HTMLElement;
  startX: number;
  startY: number;
  active: boolean;
  ghost: HTMLElement | null;
  over: HTMLElement | null;
}
let drag: DragOp | null = null;
let suppressClick = false;

function zoneAt(x: number, y: number): { zone: Zone; el: HTMLElement } | null {
  const hit = document.elementFromPoint(x, y);
  const el = hit?.closest<HTMLElement>('[data-zone]') ?? null;
  if (!el) return null;
  return { zone: el.dataset.zone as Zone, el };
}

function dragStart(e: PointerEvent, card: Card): void {
  if (mode !== 'setup' || drag !== null) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const src = e.currentTarget as HTMLElement;
  try {
    src.setPointerCapture(e.pointerId);
  } catch {
    // jsdom and very old browsers — tap-to-select still works.
  }
  drag = { card, src, startX: e.clientX, startY: e.clientY, active: false, ghost: null, over: null };
}

function dragMove(e: PointerEvent): void {
  if (!drag || e.currentTarget !== drag.src) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (!drag.active) {
    if (dx * dx + dy * dy < 64) return; // an 8px slop keeps taps as taps
    drag.active = true;
    const suit = suitOf(drag.card);
    drag.ghost = h('span', { class: 'ap-ghost' + (redSuit(suit) ? ' red' : '') }, [
      SUIT_SYMBOLS[suit], RANK_LABELS[rankOf(drag.card)],
    ]);
    document.body.append(drag.ghost);
    drag.src.classList.add('drag-src');
  }
  drag.ghost!.style.left = `${e.clientX - 18}px`;
  drag.ghost!.style.top = `${e.clientY - 48}px`;
  const target = zoneAt(e.clientX, e.clientY);
  const el = target && target.zone !== zoneOf(layout, drag.card) ? target.el : null;
  if (drag.over !== el) {
    drag.over?.classList.remove('droptarget');
    drag.over = el;
    drag.over?.classList.add('droptarget');
  }
}

function dragEnd(e: PointerEvent): void {
  if (!drag || e.currentTarget !== drag.src) return;
  const op = drag;
  drag = null;
  op.ghost?.remove();
  op.src.classList.remove('drag-src');
  op.over?.classList.remove('droptarget');
  if (!op.active) return; // a tap — the click handler selects
  suppressClick = true;
  window.setTimeout(() => (suppressClick = false), 0);
  const target = zoneAt(e.clientX, e.clientY);
  if (target && moveCard(layout, op.card, target.zone)) afterLayoutMutation();
}

function dragCancel(): void {
  if (!drag) return;
  drag.ghost?.remove();
  drag.src.classList.remove('drag-src');
  drag.over?.classList.remove('droptarget');
  drag = null;
}

function setupChip(card: Card): HTMLElement {
  const suit = suitOf(card);
  return h('button', {
    class: 'ap-card grab' + (redSuit(suit) ? ' red' : '') + (selectedCard === card ? ' sel' : ''),
    onclick: () => {
      if (suppressClick) return;
      selectedCard = selectedCard === card ? null : card;
      renderSetup();
    },
    onpointerdown: (e: Event) => dragStart(e as PointerEvent, card),
    onpointermove: (e: Event) => dragMove(e as PointerEvent),
    onpointerup: (e: Event) => dragEnd(e as PointerEvent),
    onpointercancel: () => dragCancel(),
  }, [RANK_LABELS[rankOf(card)]]);
}

function suitRow(suit: Suit, cards: Card[], chip: (c: Card) => HTMLElement): HTMLElement {
  const sorted = cards.filter((c) => suitOf(c) === suit).sort((a, b) => rankOf(b) - rankOf(a));
  return h('div', { class: 'ap-suitrow' }, [
    h('span', { class: 'sym' + (redSuit(suit) ? ' red' : '') }, [SUIT_SYMBOLS[suit]]),
    ...sorted.map(chip),
  ]);
}

function movePill(zone: Zone): HTMLElement | null {
  if (selectedCard === null || zoneOf(layout, selectedCard) === zone) return null;
  return h('button', { class: 'ap-move-pill', title: 'Move the selected card here', onclick: () => moveSelected(zone) }, ['⤵ here']);
}

function seatZone(seat: Seat): HTMLElement {
  const cards = layout[seat];
  const count = cards.length;
  const shade = count === 13 ? ' ok' : count < 13 ? ' short' : ' over';
  const pill = movePill(seat);
  return h('div', { class: `ap-zone ap-pos-${seat.toLowerCase()}${shade}`, 'data-zone': seat }, [
    h('div', { class: 'ap-zone-head' }, [
      h('span', { class: 'ap-hand-name' }, [SEAT_NAMES[seat]]),
      h('span', { class: 'ap-zcount' + (count === 13 ? ' ok' : ' bad') }, [`${count}`, h('small', {}, ['/13'])]),
      ...(pill ? [pill] : []),
    ]),
    ...SUITS.map((suit) => suitRow(suit, cards, setupChip)),
  ]);
}

function poolZone(pool: Card[]): HTMLElement {
  const pill = movePill('pool');
  const fillTarget = poolFillTarget(layout);
  return h('div', { class: 'ap-zone ap-pool' + (pool.length === 0 ? ' empty' : ''), 'data-zone': 'pool' }, [
    h('div', { class: 'ap-zone-head' }, [
      h('span', { class: 'ap-hand-name' }, ['Unassigned']),
      h('span', { class: 'ap-zcount' + (pool.length === 0 ? ' ok' : '') }, [String(pool.length)]),
      ...(pill ? [pill] : []),
      ...(fillTarget
        ? [h('button', { class: 'ap-move-pill', onclick: () => {
            for (const card of poolOf(layout)) moveCard(layout, card, fillTarget);
            afterLayoutMutation();
          } }, [`all → ${fillTarget}`])]
        : []),
    ]),
    pool.length === 0
      ? h('p', { class: 'ap-pool-hint' }, ['Drag a card here to unassign it.'])
      : h('div', {}, SUITS.map((suit) => suitRow(suit, pool, setupChip))),
  ]);
}

function launcher(complete: boolean): HTMLElement {
  if (!complete) {
    return h('p', { class: 'hint ap-launch-hint' }, [
      'Give every hand 13 cards — drag a card between hands, or tap it and then tap “⤵ here” where it goes.',
    ]);
  }
  const kids: Array<Node | string> = [h('h2', {}, ['Play a contract'])];
  const currentPbn = dealToPBN(dealFromLayout(layout));
  if (state.contract && state.plays.length > 0 && playPbn === currentPbn) {
    kids.push(h('button', { class: 'ap-btn primary', onclick: () => startPlay(state.contract!, { resume: true }) }, [
      `Resume ${prettyContractText(state.contract)} — ${state.plays.length} card${state.plays.length === 1 ? '' : 's'} played`,
    ]));
  }
  if (importedContract) {
    kids.push(h('button', {
      class: 'ap-btn primary',
      onclick: () => startPlay(importedContract!, { importedPlayString: importedPlay }),
    }, ['Play ', ...prettyContract(importedContract), ' (imported)']));
  }
  if (tableRes) {
    kids.push(makeableTable((c) => startPlay(c)));
    kids.push(parLine()!);
    kids.push(h('p', { class: 'hint' }, ['Tricks each declarer can take, double dummy. Tap a contract to play it out card by card.']));
  } else {
    kids.push(h('p', { class: 'ap-dd-line' }, ['Solving all 20 contracts…']));
  }
  return h('div', { class: 'ap-launcher' }, kids);
}

function renderSetup(): void {
  if (mode !== 'setup') return;
  if (drag?.active) return; // a re-render would replace the captured chip mid-drag
  const pool = poolOf(layout);
  const complete = layoutComplete(layout);

  const centerBits: Array<Node | string> = complete
    ? [h('span', { class: 'ok' }, ['✓ 52 placed'])]
    : [`${pool.length} unassigned`];
  if (selectedCard !== null) {
    const suit = suitOf(selectedCard);
    centerBits.push(h('div', { class: 'ap-center-sel' }, [
      h('span', { class: redSuit(suit) ? 'red' : '' }, [SUIT_SYMBOLS[suit]]),
      `${RANK_LABELS[rankOf(selectedCard)]} selected`,
    ]));
  }

  setupBoard.replaceChildren(
    h('h2', {}, ['Set up the board']),
    h('div', { class: 'ap-compass ap-setup' }, [
      ...SEATS.map(seatZone),
      h('div', { class: 'ap-center ap-pos-c' }, [h('span', { class: 'ap-tc-mid' }, centerBits)]),
    ]),
    poolZone(pool),
    h('div', { class: 'ap-meta' }, [
      h('label', {}, ['Dealer ', dealerSel]),
      h('label', {}, ['Vul ', vulSel]),
    ]),
    launcher(complete),
  );
}

/** Kick a table solve whenever the layout is complete (keyed, so cheap). */
function maybeSolveTable(): void {
  if (!layoutComplete(layout)) return;
  void refreshTable(dealFromLayout(layout));
}

// ---- Entering and leaving play ----------------------------------------------

function startPlay(c: Contract, opts?: { resume?: boolean; importedPlayString?: string | null }): void {
  if (!layoutComplete(layout)) return;
  deal = dealFromLayout(layout);
  playPbn = dealToPBN(deal);
  finishing = false;
  pickerOpen = false;
  if (opts?.resume && state.contract) {
    state.plays = sanitisePlays(deal, state.contract, state.plays).plays;
  } else {
    state.contract = c;
    const raw = opts?.importedPlayString ? playFromString(opts.importedPlayString) ?? [] : [];
    state.plays = sanitisePlays(deal, c, raw).plays;
  }
  state.redo = [];
  importedContract = null;
  importedPlay = null;
  mode = 'play';
  updateModeVisibility();
  pushHash();
  void refreshTable(deal);
  renderAnalysis();
  void refreshScores();
}

function backToSetup(): void {
  mode = 'setup';
  finishing = false;
  selectedCard = null;
  updateModeVisibility();
  renderSetup();
  maybeSolveTable();
}

// ---- Solving ----------------------------------------------------------------

async function refreshTable(forDeal: Deal): Promise<void> {
  const pbn = dealToPBN(forDeal);
  const key = `${pbn}|${state.dealer}|${state.vul}`;
  if (tableKey === key && tableRes) return;
  tableKey = key;
  tableRes = null;
  renderCurrent();
  try {
    const res = await client.solveTable(pbn, seatIdx(state.dealer), ddsVulnerability(state.vul));
    if (tableKey !== key) return;
    tableRes = res;
    renderCurrent();
  } catch {
    if (tableKey === key) tableRes = null;
  }
}

function renderCurrent(): void {
  if (mode === 'setup') renderSetup();
  else renderAnalysis();
}

async function refreshScores(): Promise<void> {
  scores = null;
  if (!deal || !state.contract) return;
  const pos = ddPosition(deal, state.contract, state.plays);
  if (!pos) {
    scores = [];
    renderAnalysis();
    return;
  }
  const seq = ++solveSeq;
  try {
    const res = await client.solvePlay(pos);
    if (seq !== solveSeq) return;
    scores = res;
    renderAnalysis();
  } catch {
    if (seq === solveSeq) scores = [];
  }
}

// ---- Play actions -----------------------------------------------------------

function playCard(card: Card): void {
  if (!deal || !state.contract) return;
  const view = computePlay(deal, state.contract, state.plays);
  if (view.toPlay === null || !legalPlays(view).includes(card)) return;
  finishing = false;
  state.plays.push(card);
  state.redo = [];
  afterPlayMutation();
}

function undo(): void {
  if (state.plays.length === 0) return;
  finishing = false;
  state.redo.push(state.plays.pop()!);
  afterPlayMutation();
}

function redoOne(): void {
  if (state.redo.length === 0) return;
  finishing = false;
  state.plays.push(state.redo.pop()!);
  afterPlayMutation();
}

function rewindTo(playCount: number): void {
  if (playCount >= state.plays.length) return;
  finishing = false;
  const tail = state.plays.splice(playCount);
  // Redo is a stack (pop = next card), so the tail goes on top in reverse.
  state.redo = [...state.redo, ...tail.reverse()];
  afterPlayMutation();
}

function afterPlayMutation(): void {
  pushHash();
  renderAnalysis();
  void refreshScores();
}

function bestCard(view: PlayView): Card | null {
  if (!scores || scores.length === 0) return null;
  const legal = new Set(legalPlays(view));
  let best: Card | null = null;
  let bestScore = -1;
  for (const s of scores) {
    const card = cardFromDds(s.suit, s.rank);
    if (!legal.has(card)) continue;
    // Highest score wins; among equals prefer the lowest card (normal play).
    if (s.score > bestScore || (s.score === bestScore && best !== null && rankOf(card) < rankOf(best))) {
      best = card;
      bestScore = s.score;
    }
  }
  return best;
}

function stepBest(): void {
  if (!deal || !state.contract) return;
  const view = computePlay(deal, state.contract, state.plays);
  const card = bestCard(view);
  if (card !== null) playCard(card);
}

async function finishBest(): Promise<void> {
  if (!deal || !state.contract || finishing) return;
  finishing = true;
  while (finishing) {
    const view = computePlay(deal, state.contract, state.plays);
    if (view.toPlay === null) break;
    const pos = ddPosition(deal, state.contract, state.plays);
    if (!pos) break;
    let cards: LeadCardScore[];
    try {
      cards = await client.solvePlay(pos);
    } catch {
      break;
    }
    if (!finishing) break;
    scores = cards;
    const card = bestCard(view);
    if (card === null) break;
    state.plays.push(card);
    state.redo = [];
    renderAnalysis();
  }
  finishing = false;
  pushHash();
  renderAnalysis();
  void refreshScores();
}

function setContract(c: Contract): void {
  finishing = false;
  state.contract = c;
  state.plays = [];
  state.redo = [];
  pushHash();
  renderAnalysis();
  void refreshScores();
}

// ---- Shared: makeable table + par -------------------------------------------

function makeableTable(onPick: (c: Contract) => void): HTMLElement {
  const strains = [0, 1, 2, 3, 4];
  const declOrder = [0, 2, 1, 3]; // N, S, E, W — partnerships together
  const headRow = h('tr', {}, [
    h('th', {}, []),
    ...strains.map((s) => h('th', { class: s === 1 || s === 2 ? 'red' : '' }, [s === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[s]]])),
  ]);
  const rows = declOrder.map((d) =>
    h('tr', {}, [
      h('th', {}, [SEATS[d]]),
      ...strains.map((s) => {
        const tricks = tableRes!.table[s][d];
        const sel = mode === 'play' && state.contract && state.contract.strain === s && state.contract.declarer === d;
        const level = Math.max(1, tricks - 6);
        return h('td', {
          class: (tricks >= 7 ? 'make' : '') + (sel ? ' sel' : ''),
          title: `Play ${level}${s === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[s]]} by ${SEATS[d]}`,
          onclick: () => onPick({ level, strain: s, declarer: d, doubled: 0 }),
        }, [String(tricks)]);
      }),
    ]),
  );
  return h('table', { class: 'ap-dd-table' }, [h('thead', {}, [headRow]), h('tbody', {}, [...rows])]);
}

function parLine(): HTMLElement | null {
  if (!tableRes) return null;
  const bits: Array<Node | string> = ['Par ', h('b', {}, [scoreLabel(tableRes.parScore)]), ' for NS'];
  const pretty = tableRes.parContracts.map(prettyParContract).filter((s) => s !== '');
  if (pretty.length > 0) bits.push(`: ${pretty.join(', ')}`);
  return h('p', { class: 'ap-par' }, bits);
}

function prettyParContract(s: string): string {
  const m = /([1-7])(NT|N|[SHDC])(x{0,2})[^-]*-\s*(NS|EW|[NESW])/i.exec(s);
  if (!m) return '';
  const strain = m[2].toUpperCase().startsWith('N') ? 'NT' : SUIT_SYMBOLS[m[2].toUpperCase() as Suit];
  return `${m[1]}${strain}${m[3]} by ${m[4].toUpperCase().split('').join('/')}`;
}

// ---- Rendering: play view ---------------------------------------------------

const analysisBox = h('section', { class: 'form ap-analysis' }, []);

function prettyContract(c: Contract): Array<Node | string> {
  const sym = c.strain === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[c.strain]];
  return [
    String(c.level),
    h('span', { class: c.strain === 1 || c.strain === 2 ? 'red' : '' }, [sym]),
    'x'.repeat(c.doubled),
    ` by ${SEATS[c.declarer]}`,
  ];
}

function prettyContractText(c: Contract): string {
  return `${c.level}${STRAIN_LETTERS[c.strain]}${'x'.repeat(c.doubled)} by ${SEATS[c.declarer]}`;
}

/** Screen slot (n/e/s/w area) for a seat, honouring the rotation toggle. */
function slotOf(seat: number): string {
  const anchor = rotateView && state.contract ? state.contract.declarer : 2; // South at the bottom by default
  return ['n', 'e', 's', 'w'][(seat - anchor + 2 + 4) % 4];
}

function renderAnalysis(): void {
  if (mode !== 'play' || !deal) return;
  const contract = state.contract;
  const view = contract ? computePlay(deal, contract, state.plays) : null;

  // Per-card DD lookup for the seat to move.
  const scoreByCard = new Map<Card, number>();
  let maxScore = -1;
  if (scores) {
    for (const s of scores) {
      scoreByCard.set(cardFromDds(s.suit, s.rank), s.score);
      if (s.score > maxScore) maxScore = s.score;
    }
  }

  // ---- Header row
  const contractChip = h('button', {
    class: 'ap-contract-chip',
    title: 'Change the contract',
    onclick: () => {
      pickerOpen = !pickerOpen;
      renderAnalysis();
    },
  }, contract ? prettyContract(contract) : ['Pick a contract…']);

  const head = h('div', { class: 'ap-board-head' }, [
    contractChip,
    h('span', { class: 'ap-board-info' }, [`Dealer ${state.dealer} · Vul ${vulnerabilityLabel(state.vul)}`]),
    h('span', { class: 'spacer', style: 'flex:1' }, []),
    h('button', { class: 'ap-btn small', onclick: () => { rotateView = !rotateView; renderAnalysis(); } },
      [rotateView ? 'N to top' : 'Declarer down']),
    h('button', { class: 'ap-btn small', onclick: () => backToSetup() }, ['Edit deal']),
  ]);

  // ---- Result / DD line
  const resultBits: Array<Node | string> = [];
  if (contract && view) {
    resultBits.push(h('span', { class: 'ap-tricks' }, [`Declarer ${view.declarerTricks} · Defence ${view.defenderTricks}`]));
    const vul = sideVulnerable(state.vul, SEATS[contract.declarer]);
    if (view.complete) {
      const score = scoreDeclarer(contract.level, contract.strain, contract.doubled, view.declarerTricks, vul);
      resultBits.push(h('span', { class: 'ap-result-final' }, [
        ` — ${contract.level}${contract.strain === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[contract.strain]]}${'x'.repeat(contract.doubled)}${resultLabel(contract.level, view.declarerTricks)} `,
        h('span', { class: 'score' }, [`${scoreLabel(score)}`]),
        ` for ${contract.declarer % 2 === 0 ? 'NS' : 'EW'}`,
      ]));
    } else if (scores && maxScore >= 0) {
      const total = declarerTotal(view, contract, maxScore);
      const score = scoreDeclarer(contract.level, contract.strain, contract.doubled, total, vul);
      resultBits.push(h('span', { class: 'ap-dd-line' }, [
        ' · DD: declarer takes ',
        h('b', {}, [String(total)]),
        ` (${contract.level}${contract.strain === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[contract.strain]]}${resultLabel(contract.level, total)}, ${scoreLabel(score)})`,
      ]));
    } else {
      resultBits.push(h('span', { class: 'ap-dd-line' }, [' · DD: …']));
    }
  }

  // ---- Compass
  const handBlocks = SEATS.map((seat, si) => {
    const isTurn = view !== null && view.toPlay === si;
    const legal = isTurn && view ? new Set(legalPlays(view)) : new Set<Card>();
    const dummy = contract && (contract.declarer + 2) % 4 === si;
    const suitRows = SUITS.map((suit) => {
      const cards = (view ? view.remaining[seat] : deal!.hands[seat])
        .filter((c) => suitOf(c) === suit)
        .sort((a, b) => rankOf(b) - rankOf(a));
      const chips = cards.map((card) => {
        const isLegal = legal.has(card);
        const s = isLegal ? scoreByCard.get(card) : undefined;
        const classes = ['ap-card'];
        if (redSuit(suit)) classes.push('red');
        if (s !== undefined && maxScore >= 0) {
          const cost = maxScore - s;
          classes.push(cost === 0 ? 'best' : cost === 1 ? 'cost1' : 'cost2');
        }
        return h('button', {
          class: classes.join(' '),
          disabled: !isTurn || !isLegal,
          onclick: () => playCard(card),
        }, [
          RANK_LABELS[rankOf(card)],
          ...(s !== undefined ? [h('span', { class: 'dd' }, [String(s)])] : []),
        ]);
      });
      return h('div', { class: 'ap-suitrow' }, [
        h('span', { class: 'sym' + (redSuit(suit) ? ' red' : '') }, [SUIT_SYMBOLS[suit]]),
        ...chips,
      ]);
    });
    const roleBits: Array<Node | string> = [SEAT_NAMES[seat]];
    if (contract && contract.declarer === si) roleBits.push(' · declarer');
    if (dummy) roleBits.push(' · dummy');
    if (isTurn) roleBits.push(h('span', { class: 'dot', title: 'to play' }, []));
    return h('div', { class: `ap-hand ap-pos-${slotOf(si)}` + (isTurn ? ' turn' : '') }, [
      h('div', { class: 'ap-hand-name' }, roleBits),
      ...suitRows,
    ]);
  });

  // The trick in the middle: the current one, or — between tricks — the one
  // just completed, dimmed with its winner ringed, so the ending stays visible.
  const centerKids: HTMLElement[] = [];
  if (view) {
    const prev = view.current.cards.length === 0 && view.tricks.length > 0
      ? view.tricks[view.tricks.length - 1]
      : null;
    const shown = prev ?? view.current;
    const bySeat = new Map<number, Card>();
    shown.cards.forEach((c, i) => bySeat.set((shown.leader + i) % 4, c));
    for (let si = 0; si < 4; si++) {
      const card = bySeat.get(si);
      const slot = slotOf(si);
      if (card !== undefined) {
        const suit = suitOf(card);
        const won = prev !== null && si === prev.winner;
        centerKids.push(h('span', {
          class: `ap-tc ap-tc-${slot}` + (si === shown.leader ? ' led' : '') + (prev ? ' prev' : '') + (won ? ' won' : ''),
          title: `${SEAT_NAMES[SEATS[si]]}${si === shown.leader ? ' (led)' : ''}${won ? ' — won the trick' : ''}`,
        }, [
          h('span', { class: redSuit(suit) ? 'red' : '' }, [SUIT_SYMBOLS[suit]]),
          RANK_LABELS[rankOf(card)],
        ]));
      } else {
        centerKids.push(h('span', { class: `ap-tc empty ap-tc-${slot}` }, [SEATS[si]]));
      }
    }
    if (view.current.cards.length === 0 && !view.complete) {
      centerKids.push(h('span', { class: 'ap-tc-mid' }, [`${SEATS[view.current.leader]} leads`]));
    }
  } else {
    centerKids.push(h('span', { class: 'ap-tc-mid' }, ['Pick a', h('br', {}, []), 'contract']));
  }
  const compass = h('div', { class: 'ap-compass' }, [
    ...handBlocks,
    h('div', { class: 'ap-center ap-pos-c' }, centerKids),
  ]);

  // ---- Controls
  const canStep = view !== null && !view.complete && scores !== null && scores.length > 0;
  const controls = h('div', { class: 'ap-controls' }, [
    h('button', { class: 'ap-btn', disabled: state.plays.length === 0, onclick: () => undo() }, ['↩ Undo']),
    h('button', { class: 'ap-btn', disabled: state.redo.length === 0, onclick: () => redoOne() }, ['Redo ↪']),
    h('button', { class: 'ap-btn', disabled: !canStep || finishing, onclick: () => stepBest() }, ['▶ Best card']),
    h('button', {
      class: 'ap-btn', disabled: view === null || view.complete || finishing,
      onclick: () => void finishBest(),
    }, [finishing ? 'Playing…' : '⏩ Play it out']),
    h('span', { class: 'spacer' }, []),
    copyLinkButton(),
  ]);

  // ---- Trick history
  const historyKids: HTMLElement[] = [];
  if (view && view.tricks.length > 0) {
    let playCount = 0;
    view.tricks.forEach((t, ti) => {
      const start = playCount;
      playCount += 4;
      const lines = t.cards.map((c, i) => {
        const si = (t.leader + i) % 4;
        const suit = suitOf(c);
        return h('div', { class: si === t.winner ? 'win' + (contract && si % 2 === contract.declarer % 2 ? ' decl' : '') : '' }, [
          `${SEATS[si]} `,
          h('span', { class: redSuit(suit) ? 'red' : '' }, [SUIT_SYMBOLS[suit]]),
          RANK_LABELS[rankOf(c)],
        ]);
      });
      historyKids.push(h('button', {
        class: 'ap-trick', title: 'Rewind to the start of this trick',
        onclick: () => rewindTo(start),
      }, [h('div', { class: 'tno' }, [`T${ti + 1} · ${SEATS[t.winner]} won`]), ...lines]));
    });
  }
  const history = historyKids.length > 0 ? h('div', { class: 'ap-history' }, historyKids) : null;

  // ---- Makeable table + par
  const tableKids: Array<Node | string> = [];
  if (tableRes) {
    tableKids.push(makeableTable((c) => setContract(c)));
    tableKids.push(parLine()!);
    tableKids.push(h('p', { class: 'hint' }, ['Tricks each declarer can take, double dummy. Tap a cell to play that contract.']));
  } else {
    tableKids.push(h('p', { class: 'ap-dd-line' }, ['Solving all 20 contracts…']));
  }
  const makeable = h('details', { class: 'tool-panel' }, [
    h('summary', {}, ['Makeable contracts & par']),
    h('div', { class: 'tool-panel-body' }, tableKids),
  ]);

  const kids: HTMLElement[] = [head];
  if (pickerOpen || !contract) kids.push(contractPicker());
  kids.push(h('div', {}, resultBits));
  kids.push(compass);
  kids.push(controls);
  if (history) kids.push(h('div', {}, [history]));
  kids.push(makeable);
  kids.push(h('p', { class: 'ap-hintline' }, [
    'Card numbers show the tricks that side can still take, double dummy — green keeps the maximum, amber/red costs tricks. Tap any highlighted card to play it.',
  ]));
  analysisBox.replaceChildren(...kids);
  if (history) history.scrollLeft = history.scrollWidth; // keep the newest trick in view
}

function copyLinkButton(): HTMLElement {
  const btn = h('button', { class: 'ap-btn' }, ['🔗 Copy link']) as HTMLButtonElement;
  btn.addEventListener('click', async () => {
    pushHash();
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = 'Copied!';
    } catch {
      btn.textContent = 'Copy failed';
    }
    window.setTimeout(() => (btn.textContent = '🔗 Copy link'), 1200);
  });
  return btn;
}

function contractPicker(): HTMLElement {
  const current = state.contract ?? { level: 3, strain: 4, declarer: 2, doubled: 0 as const };
  const pick = (label: string, sel: boolean, red: boolean, onclick: () => void): HTMLElement =>
    h('button', { class: 'ap-pick' + (sel ? ' sel' : '') + (red ? ' red' : ''), onclick }, [label]);
  const set = (patch: Partial<Contract>): void => setContract({ ...current, ...patch });

  return h('div', { class: 'ap-picker' }, [
    h('div', { class: 'ap-picker-row' }, [
      h('span', { class: 'ap-picker-label' }, ['Level']),
      ...[1, 2, 3, 4, 5, 6, 7].map((l) => pick(String(l), l === current.level && !!state.contract, false, () => set({ level: l }))),
    ]),
    h('div', { class: 'ap-picker-row' }, [
      h('span', { class: 'ap-picker-label' }, ['Strain']),
      ...[0, 1, 2, 3, 4].map((s) =>
        pick(s === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[s]], s === current.strain && !!state.contract, s === 1 || s === 2, () => set({ strain: s }))),
    ]),
    h('div', { class: 'ap-picker-row' }, [
      h('span', { class: 'ap-picker-label' }, ['Declarer']),
      ...SEATS.map((seat, d) => pick(seat, d === current.declarer && !!state.contract, false, () => set({ declarer: d }))),
    ]),
    h('div', { class: 'ap-picker-row' }, [
      h('span', { class: 'ap-picker-label' }, ['Doubled']),
      ...([0, 1, 2] as const).map((x) =>
        pick(x === 0 ? '–' : 'x'.repeat(x), x === current.doubled && !!state.contract, false, () => set({ doubled: x }))),
      h('span', { style: 'flex:1' }, []),
      h('button', { class: 'ap-btn small', onclick: () => { pickerOpen = false; renderAnalysis(); } }, ['Close']),
    ]),
  ]);
}

// ---- Page assembly ----------------------------------------------------------

const importSection = h('section', { class: 'form ap-import' }, [
  h('h2', {}, ['Import a deal']),
  importText,
  h('div', { class: 'ap-import-row' }, [
    h('button', { class: 'ap-btn', onclick: () => fileInput.click() }, ['Open .pbn / .lin file…']),
    h('span', { class: 'ap-examples' }, [
      h('span', { class: 'ap-examples-label' }, ['Try:']),
      exampleButton('PBN', EXAMPLE_PBN),
      exampleButton('BBO link', EXAMPLE_URL),
      exampleButton('Plain text', EXAMPLE_TEXT),
    ]),
  ]),
  feedback,
  noteBox,
  fileInput,
]);
wireDrop(importSection);

const setupWrap = h('div', {}, [importSection, setupBoard]);

function updateModeVisibility(): void {
  setupWrap.hidden = mode !== 'setup';
  analysisBox.hidden = mode !== 'play';
}

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    siteNav('play'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesPlay']),
      h('p', { class: 'tagline' }, ['Import any deal and play it out, double dummy.']),
    ]),
    setupWrap,
    analysisBox,
  );
}

// A shared link (#d=…) reopens the exact position.
(function loadFromHash(): void {
  updateModeVisibility();
  syncMetaControls();
  renderSetup();
  const m = /[#&]d=([^&]+)/.exec(location.hash);
  if (m) {
    const st = decodeAnalyzeState(m[1]);
    if (st) applyState(st);
  }
})();

window.addEventListener('hashchange', () => {
  if (location.hash === lastHash) return;
  const m = /[#&]d=([^&]+)/.exec(location.hash);
  if (!m) return;
  const st = decodeAnalyzeState(m[1]);
  if (st) applyState(st);
});
