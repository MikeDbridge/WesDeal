/**
 * WesPlay end-to-end: import a deal three ways (PBN paste, BBO handviewer
 * URL, free text), then play each contract to the last card using the same
 * logic the page uses — solve the position (SolveBoardPBN via ddPosition),
 * take the best card, repeat. At every single card the double-dummy
 * prediction must stay constant (both sides playing optimally), and the
 * final trick count must equal the CalcDDTable value — which exercises the
 * whole chain: importer → validation → play engine → mid-trick DDS calls.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { loadDds, Dds } from 'bridge-dds';
import { rankOf, suitOf, SUIT_SYMBOLS, RANK_LABELS, type Card } from '../src/engine/cards';
import { SEATS, type Deal } from '../src/engine/deal';
import { importDeal, checkDraft, type DraftDeal } from '../src/engine/importDeal';
import {
  computePlay, legalPlays, ddPosition, declarerTotal, parseContract, sanitisePlays,
  playFromString, cardFromDds, scoreDeclarer, resultLabel, scoreLabel, type Contract, type PlayView,
} from '../src/engine/play';
import { expandFutureTricks, type LeadCardScore } from '../src/engine/lead';
import { dealToPBN } from '../src/engine/format';
import { sideVulnerable } from '../src/engine/analyzeState';

let dds: Dds;
beforeAll(async () => {
  dds = new Dds(await loadDds());
});

function importToDeal(text: string): { deal: Deal; draft: DraftDeal } {
  const result = importDeal(text);
  expect(result.deal, result.errors.join('; ')).not.toBeNull();
  const check = checkDraft(result.deal!.hands);
  expect(check.ok, JSON.stringify(check)).toBe(true);
  return { deal: check.deal!, draft: result.deal! };
}

function solvePosition(deal: Deal, contract: Contract, plays: Card[]): LeadCardScore[] | null {
  const pos = ddPosition(deal, contract, plays);
  if (!pos) return null;
  return expandFutureTricks(dds.SolveBoardPBN(pos, -1, 3, 1));
}

/** The page's stepper: highest score, lowest card among equals. */
function bestCard(view: PlayView, scores: LeadCardScore[]): Card | null {
  const legal = new Set(legalPlays(view));
  let best: Card | null = null;
  let bestScore = -1;
  for (const s of scores) {
    const card = cardFromDds(s.suit, s.rank);
    if (!legal.has(card)) continue;
    if (s.score > bestScore || (s.score === bestScore && best !== null && rankOf(card) < rankOf(best))) {
      best = card;
      bestScore = s.score;
    }
  }
  return best;
}

const cardText = (c: Card): string => SUIT_SYMBOLS[suitOf(c)] + RANK_LABELS[rankOf(c)];

/** Play optimally to the end; assert the DD prediction never moves. */
function playOut(deal: Deal, contract: Contract, plays: Card[], label: string): PlayView {
  const first = solvePosition(deal, contract, plays);
  expect(first).not.toBeNull();
  const view0 = computePlay(deal, contract, plays);
  const expected = declarerTotal(view0, contract, Math.max(...first!.map((s) => s.score)));

  for (;;) {
    const view = computePlay(deal, contract, plays);
    if (view.toPlay === null) {
      expect(view.complete).toBe(true);
      expect(view.declarerTricks, `${label}: final tricks`).toBe(expected);
      const lines = view.tricks.map((t, i) => {
        const cards = t.cards.map((c, k) => `${SEATS[(t.leader + k) % 4]}${cardText(c)}`).join(' ');
        return `  T${String(i + 1).padStart(2)} ${cards}  → ${SEATS[t.winner]}`;
      });
      console.log(`${label}: declarer takes ${view.declarerTricks}\n${lines.join('\n')}`);
      return view;
    }
    const scores = solvePosition(deal, contract, plays)!;
    const max = Math.max(...scores.map((s) => s.score));
    // Optimal play by both sides: the double-dummy total never moves.
    expect(declarerTotal(view, contract, max), `${label}: play ${plays.length}`).toBe(expected);
    const card = bestCard(view, scores);
    expect(card).not.toBeNull();
    expect(legalPlays(view)).toContain(card!);
    plays.push(card!);
  }
}

function contractOf(draft: DraftDeal): Contract {
  const c = parseContract(draft.contract!, SEATS.indexOf(draft.declarer!));
  expect(c).not.toBeNull();
  return c!;
}

// The demo deal: 4♠ by South has 11 tricks double dummy (6 spades, ♥A, ♦AK,
// ♣A, and dummy's fifth diamond once ♦QJT9 is ruffed out).
const PBN_PASTE = [
  '[Board "1"]',
  '[Dealer "S"]',
  '[Vulnerable "None"]',
  '[Deal "S:AKQJT9.A32.K2.32 87.KQJT.QJT9.KQJ 32.54.A8765.A654 654.9876.43.T987"]',
  '[Contract "4S"]',
  '[Declarer "S"]',
].join('\n');

const LIN =
  'st||md|1SAKQJT9HA32DK2C32,S87HKQJTDQJT9CKQJ,S32H54DA8765CA654,|rh||ah|Board 1|sv|o' +
  '|mb|1S|mb|p|mb|2S|mb|p|mb|4S|mb|p|mb|p|mb|p|pc|HK|pc|H4|pc|H6|pc|HA|';
const BBO_URL = 'https://www.bridgebase.com/tools/handviewer.html?lin=' + encodeURIComponent(LIN);

const FREE_TEXT = [
  'Board 1 · Dealer N · Vul None',
  'N: AKQ2 54 T987 J32',
  'E: J97 KQJ9 62 T874',
  'S: T863 A87 AKQ 965',
  'W: 54 T632 J543 AKQ',
].join('\n');

describe('WesPlay end-to-end (real DDS)', () => {
  it('PBN paste → 4S by S played out to exactly the table value', () => {
    const { deal, draft } = importToDeal(PBN_PASTE);
    expect(draft.dealer).toBe('S');
    expect(draft.vul).toBe('None');
    const contract = contractOf(draft);

    const table = dds.CalcDDTablePBN({ cards: dealToPBN(deal) }).resTable;
    expect(table[contract.strain][contract.declarer]).toBe(11);

    const view = playOut(deal, contract, [], 'PBN 4S-S');
    expect(view.declarerTricks).toBe(11);
    const vul = sideVulnerable(draft.vul!, draft.declarer!);
    const score = scoreDeclarer(contract.level, contract.strain, contract.doubled, view.declarerTricks, vul);
    console.log(`  result 4S${resultLabel(contract.level, view.declarerTricks)} ${scoreLabel(score)}`);
    expect(score).toBe(450);
  }, 120000);

  it('BBO handviewer URL → deal, auction and played cards, then finished optimally', () => {
    const { deal, draft } = importToDeal(BBO_URL);
    const contract = contractOf(draft);
    expect(contract).toEqual({ level: 4, strain: 0, declarer: 2, doubled: 0 });

    // The link carries the first trick: ♥K led, won by South's ace.
    const imported = playFromString(draft.play!)!;
    const fit = sanitisePlays(deal, contract, imported);
    expect(fit.dropped).toBe(0);
    const resumed = computePlay(deal, contract, fit.plays);
    expect(resumed.tricks).toHaveLength(1);
    expect(resumed.declarerTricks).toBe(1);

    const view = playOut(deal, contract, fit.plays, 'BBO 4S-S (after ♥K lead)');
    expect(view.declarerTricks).toBe(11);
  }, 120000);

  it('free text → makeable table, then the top NT contract played out', () => {
    const { deal, draft } = importToDeal(FREE_TEXT);
    expect(draft.dealer).toBe('N');
    const table = dds.CalcDDTablePBN({ cards: dealToPBN(deal) }).resTable;

    // Play NT by whichever declarer takes the most tricks there.
    const declarer = [0, 1, 2, 3].reduce((a, b) => (table[4][b] > table[4][a] ? b : a));
    const tricks = table[4][declarer];
    const level = Math.max(1, tricks - 6);
    const contract: Contract = { level, strain: 4, declarer, doubled: 0 };

    const view = playOut(deal, contract, [], `text ${level}NT-${SEATS[declarer]}`);
    expect(view.declarerTricks).toBe(tricks);
    expect(view.tricks).toHaveLength(13);
  }, 120000);
});
