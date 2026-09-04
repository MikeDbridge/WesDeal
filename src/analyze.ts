/**
 * WesPlay (analyze.html): import a deal from almost any format, see the
 * makeable-contracts table and par, then play the hand out card by card with
 * double-dummy guidance — every legal card scored before each play, optimal
 * cards highlighted, undo/redo, and an auto-play stepper.
 *
 * The whole position lives in the URL hash (#d=…, analyzeState.ts): the
 * import panel just fills it, the play-out mutates it, and Copy link shares
 * it. All solving happens in the DD worker (ddClient.ts); the UI thread never
 * blocks.
 */

import './styles.css';
import './ui/analyze.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { SUITS, SUIT_SYMBOLS, RANK_LABELS, rankOf, suitOf, type Card, type Suit } from './engine/cards';
import { SEATS, type Seat, type Deal } from './engine/deal';
import { type Vulnerability, vulnerabilityLabel } from './engine/board';
import { dealToPBN } from './engine/format';
import { importDeal, checkDraft, missingLabel } from './engine/importDeal';
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
  hands: Record<Seat, string>;
  dealer: Seat;
  vul: Vulnerability;
  contract: Contract | null;
  plays: Card[];
  redo: Card[];
}

const state: PageState = {
  hands: { N: '', E: '', S: '', W: '' },
  dealer: 'N',
  vul: 'None',
  contract: null,
  plays: [],
  redo: [],
};

let mode: 'import' | 'analyse' = 'import';
let deal: Deal | null = null;
/** Contract/play read from an import, applied when Analyse is pressed. */
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
  const st: AnalyzeState = { v: 1, hands: { ...state.hands }, dealer: state.dealer, vul: state.vul };
  if (state.contract) {
    st.contract = contractString(state.contract);
    st.declarer = SEATS[state.contract.declarer];
    if (state.plays.length > 0) st.play = playToString(state.plays);
  }
  lastHash = '#d=' + encodeAnalyzeState(st);
  history.replaceState(null, '', location.pathname + location.search + lastHash);
}

function applyState(st: AnalyzeState): void {
  state.hands = { ...st.hands };
  state.dealer = st.dealer;
  state.vul = st.vul;
  importedContract = st.contract && st.declarer ? parseContract(st.contract, seatIdx(st.declarer)) : null;
  importedPlay = st.play ?? null;
  fillGridFromState();
  refreshValidation();
  if (checkDraft(state.hands).ok) analyse();
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
const gridInputs = {} as Record<Seat, HTMLInputElement[]>;
const gridRows = {} as Record<Seat, HTMLTableRowElement>;
const gridCounts = {} as Record<Seat, HTMLElement>;
const errorBox = h('div', { class: 'ap-errors' }, []);
const missingBox = h('div', { class: 'ap-missing' }, []);
const analyseBtn = h('button', { class: 'ap-btn primary', onclick: () => analyse() }, ['Analyse']) as HTMLButtonElement;

const dealerSel = h('select', { class: 'ap-select' }, SEATS.map((s) =>
  h('option', { value: s }, [SEAT_NAMES[s]]),
)) as HTMLSelectElement;
const vulSel = h('select', { class: 'ap-select' }, (['None', 'NS', 'EW', 'Both'] as Vulnerability[]).map((v) =>
  h('option', { value: v }, [vulnerabilityLabel(v)]),
)) as HTMLSelectElement;

dealerSel.addEventListener('change', () => {
  state.dealer = dealerSel.value as Seat;
  pushHash();
});
vulSel.addEventListener('change', () => {
  state.vul = vulSel.value as Vulnerability;
  pushHash();
});

function buildGrid(): HTMLElement {
  const head = h('tr', {}, [
    h('th', {}, []),
    ...SUITS.map((s) => h('th', { class: redSuit(s) ? 'red' : '' }, [`${SUIT_SYMBOLS[s]} ${SUIT_NAMES_SHORT[s]}`])),
    h('th', {}, []),
  ]);
  const rows = SEATS.map((seat) => {
    gridInputs[seat] = SUITS.map((suit) =>
      h('input', {
        autocapitalize: 'off', autocorrect: 'off', spellcheck: false,
        inputmode: 'text', 'aria-label': `${SEAT_NAMES[seat]} ${SUIT_NAMES_SHORT[suit]}`,
        oninput: () => {
          readGridIntoState();
          refreshValidation();
          pushHash();
        },
      }) as HTMLInputElement,
    );
    gridCounts[seat] = h('td', { class: 'ap-count' }, []);
    const row = h('tr', {}, [
      h('td', { class: 'ap-seat' }, [seat]),
      ...gridInputs[seat].map((inp) => h('td', {}, [inp])),
      gridCounts[seat],
    ]);
    gridRows[seat] = row;
    return row;
  });
  return h('div', { class: 'ap-grid-scroll' }, [
    h('table', { class: 'ap-grid' }, [h('thead', {}, [head]), h('tbody', {}, rows)]),
  ]);
}

const SUIT_NAMES_SHORT: Record<Suit, string> = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };

function readGridIntoState(): void {
  for (const seat of SEATS) {
    const dotted = gridInputs[seat].map((inp) => inp.value.trim()).join('.');
    state.hands[seat] = dotted === '...' ? '' : dotted;
  }
}

function fillGridFromState(): void {
  for (const seat of SEATS) {
    const parts = state.hands[seat].split('.');
    gridInputs[seat].forEach((inp, i) => (inp.value = parts[i] ?? ''));
  }
  dealerSel.value = state.dealer;
  vulSel.value = state.vul;
}

function refreshValidation(): void {
  const check = checkDraft(state.hands);
  for (const seat of SEATS) {
    const c = check.seats[seat];
    const bad = c.errors.length > 0;
    gridRows[seat].className = bad && state.hands[seat] !== '' ? 'bad' : '';
    gridCounts[seat].textContent = `${c.count}/13`;
    gridCounts[seat].className = 'ap-count ' + (c.count === 13 && !bad ? 'ok' : 'bad');
  }
  const messages: string[] = [];
  for (const seat of SEATS) {
    for (const err of check.seats[seat].errors) {
      if (state.hands[seat] !== '' || err !== 'Hand is empty.') messages.push(`${seat}: ${err}`);
    }
  }
  messages.push(...check.crossErrors);
  errorBox.replaceChildren(...messages.slice(0, 8).map((m) => h('div', {}, [m])));
  missingBox.replaceChildren(
    ...(check.missing.length > 0 && check.missing.length < 52
      ? ['Still missing: ', h('b', {}, [missingLabel(check.missing)])]
      : []),
  );
  analyseBtn.disabled = !check.ok;
}

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
  state.hands = { ...result.deal.hands };
  if (result.deal.dealer) state.dealer = result.deal.dealer;
  if (result.deal.vul) state.vul = result.deal.vul;
  importedContract = result.deal.contract && result.deal.declarer
    ? parseContract(result.deal.contract, seatIdx(result.deal.declarer))
    : null;
  importedPlay = result.deal.play ?? null;
  fillGridFromState();
  refreshValidation();
  pushHash();

  const check = checkDraft(state.hands);
  const status = check.ok
    ? h('span', { class: 'ok' }, ['all 52 cards ✓'])
    : h('span', { class: 'bad' }, ['needs fixing below']);
  const extras: string[] = [];
  if (importedContract) extras.push(`${prettyContractText(importedContract)}`);
  if (importedPlay) extras.push(`${importedPlay.length / 2} cards played`);
  feedback.replaceChildren(
    `Detected ${label[result.format ?? 'text']}: `, status,
    ...(extras.length > 0 ? [` · ${extras.join(' · ')}`] : []),
  );
  noteBox.replaceChildren(...[...result.errors, ...result.notes].map((n) => h('p', { class: 'ap-note' }, [n])));
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

// ---- Analyse ----------------------------------------------------------------

function analyse(): void {
  const check = checkDraft(state.hands);
  if (!check.ok || !check.deal) return;
  deal = check.deal;
  if (importedContract) {
    state.contract = importedContract;
    importedContract = null;
    state.plays = [];
    state.redo = [];
  }
  if (state.contract) {
    // Re-fit any pending or existing play to the (possibly edited) deal.
    const raw = importedPlay ? playFromString(importedPlay) ?? [] : state.plays;
    importedPlay = null;
    const fit = sanitisePlays(deal, state.contract, raw);
    state.plays = fit.plays;
    state.redo = [];
  }
  mode = 'analyse';
  updateModeVisibility();
  pushHash();
  void refreshTable();
  renderAnalysis();
  void refreshScores();
}

function backToImport(): void {
  mode = 'import';
  finishing = false;
  updateModeVisibility();
  refreshValidation();
}

async function refreshTable(): Promise<void> {
  if (!deal) return;
  const pbn = dealToPBN(deal);
  const key = `${pbn}|${state.dealer}|${state.vul}`;
  if (tableKey === key && tableRes) return;
  tableKey = key;
  tableRes = null;
  renderAnalysis();
  try {
    const res = await client.solveTable(pbn, seatIdx(state.dealer), ddsVulnerability(state.vul));
    if (tableKey !== key) return;
    tableRes = res;
    if (!state.contract) defaultContractFromPar();
    renderAnalysis();
    void refreshScores();
  } catch {
    if (tableKey === key) tableRes = null;
  }
}

/** "2C-EW" / "4Sx-NS" / "1N-W" → a Contract (pair declarers → more tricks). */
function contractFromParString(s: string): Contract | null {
  const m = /([1-7])(NT|N|[SHDC])(x{0,2})[^-]*-\s*(NS|EW|[NESW])/i.exec(s);
  if (!m || !tableRes) return null;
  const strain = m[2].toUpperCase().startsWith('N') ? 4 : 'SHDC'.indexOf(m[2].toUpperCase());
  const pair = m[4].toUpperCase();
  let declarer: number;
  if (pair === 'NS' || pair === 'EW') {
    const [a, b] = pair === 'NS' ? [0, 2] : [1, 3];
    declarer = tableRes.table[strain][a] >= tableRes.table[strain][b] ? a : b;
  } else {
    declarer = seatIdx(pair as Seat);
  }
  return { level: Number(m[1]), strain, declarer, doubled: (m[3] ? m[3].length : 0) as 0 | 1 | 2 };
}

function defaultContractFromPar(): void {
  if (!tableRes) return;
  for (const s of tableRes.parContracts) {
    const c = contractFromParString(s);
    if (c) {
      state.contract = { ...c, doubled: 0 }; // play the par spot undoubled by default
      state.plays = [];
      state.redo = [];
      pushHash();
      return;
    }
  }
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

// ---- Rendering: analysis view ----------------------------------------------

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

function cardChipLabel(card: Card): string {
  return RANK_LABELS[rankOf(card)];
}

/** Screen slot (n/e/s/w area) for a seat, honouring the rotation toggle. */
function slotOf(seat: number): string {
  const anchor = rotateView && state.contract ? state.contract.declarer : 2; // South at the bottom by default
  return ['n', 'e', 's', 'w'][(seat - anchor + 2 + 4) % 4];
}

function renderAnalysis(): void {
  if (mode !== 'analyse' || !deal) return;
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
    h('button', { class: 'ap-btn small', onclick: () => backToImport() }, ['Edit deal']),
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
          cardChipLabel(card),
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
          const sel = contract && contract.strain === s && contract.declarer === d;
          const level = Math.max(1, tricks - 6);
          return h('td', {
            class: (tricks >= 7 ? 'make' : '') + (sel ? ' sel' : ''),
            title: `Play ${level}${s === 4 ? 'NT' : SUIT_SYMBOLS[SUITS[s]]} by ${SEATS[d]}`,
            onclick: () => setContract({ level, strain: s, declarer: d, doubled: 0 }),
          }, [String(tricks)]);
        }),
      ]),
    );
    tableKids.push(h('table', { class: 'ap-dd-table' }, [h('thead', {}, [headRow]), h('tbody', {}, [...rows])]));
    const parBits: Array<Node | string> = ['Par ', h('b', {}, [scoreLabel(tableRes.parScore)]), ' for NS'];
    const pretty = tableRes.parContracts.map(prettyParContract).filter((s) => s !== '');
    if (pretty.length > 0) parBits.push(`: ${pretty.join(', ')}`);
    tableKids.push(h('p', { class: 'ap-par' }, parBits));
    tableKids.push(h('p', { class: 'hint' }, ['Tricks each declarer can take, double dummy. Tap a cell to play that contract.']));
  } else {
    tableKids.push(h('p', { class: 'ap-dd-line' }, ['Solving all 20 contracts…']));
  }
  const makeable = h('details', { class: 'tool-panel', open: true }, [
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

function prettyParContract(s: string): string {
  const m = /([1-7])(NT|N|[SHDC])(x{0,2})[^-]*-\s*(NS|EW|[NESW])/i.exec(s);
  if (!m) return '';
  const strain = m[2].toUpperCase().startsWith('N') ? 'NT' : SUIT_SYMBOLS[m[2].toUpperCase() as Suit];
  return `${m[1]}${strain}${m[3]} by ${m[4].toUpperCase().split('').join('/')}`;
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
  buildGrid(),
  errorBox,
  missingBox,
  h('div', { class: 'ap-meta' }, [
    h('label', {}, ['Dealer ', dealerSel]),
    h('label', {}, ['Vul ', vulSel]),
    h('span', { style: 'flex:1' }, []),
    analyseBtn,
  ]),
  fileInput,
]);
wireDrop(importSection);

function updateModeVisibility(): void {
  importSection.hidden = mode !== 'import';
  analysisBox.hidden = mode !== 'analyse';
}

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.append(
    siteNav('play'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesPlay']),
      h('p', { class: 'tagline' }, ['Import any deal and play it out, double dummy.']),
    ]),
    importSection,
    analysisBox,
  );
}

// A shared link (#d=…) reopens the exact position.
(function loadFromHash(): void {
  updateModeVisibility();
  refreshValidation();
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
