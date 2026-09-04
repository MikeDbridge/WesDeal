import { describe, it, expect } from 'vitest';
import { makeCard, type Card } from '../src/engine/cards';
import type { Deal } from '../src/engine/deal';
import {
  parseContract, contractString, cardCode, cardFromCode, playFromString, playToString,
  trickWinner, computePlay, legalPlays, sanitisePlays, ddPosition, declarerTotal,
  scoreDeclarer, resultLabel, missingCards, type Contract,
} from '../src/engine/play';
import { parsePbnDeal, checkDraft } from '../src/engine/importDeal';

// 4♠ by South (11 tricks DD: 6 spades, ♥A, ♦AK, ♣A, the long diamond).
const PBN = 'S:AKQJT9.A32.K2.32 87.KQJT.QJT9.KQJ 32.54.A8765.A654 654.9876.43.T987';

function dealFromPbn(pbn: string): Deal {
  const { hands, errors } = parsePbnDeal(pbn);
  expect(errors).toEqual([]);
  const check = checkDraft(hands);
  expect(check.ok).toBe(true);
  return check.deal!;
}

const FOUR_SPADES_S: Contract = { level: 4, strain: 0, declarer: 2, doubled: 0 };
const c = (code: string): Card => cardFromCode(code)!;

describe('contracts and card codes', () => {
  it('parses and formats contracts', () => {
    expect(parseContract('4S', 2)).toEqual(FOUR_SPADES_S);
    expect(parseContract('3nt', 0)).toEqual({ level: 3, strain: 4, declarer: 0, doubled: 0 });
    expect(parseContract('4Sx', 1)).toEqual({ level: 4, strain: 0, declarer: 1, doubled: 1 });
    expect(parseContract('7NTXX', 3)).toEqual({ level: 7, strain: 4, declarer: 3, doubled: 2 });
    expect(parseContract('8S', 0)).toBeNull();
    expect(parseContract('4S', 4)).toBeNull();
    expect(contractString({ level: 4, strain: 0, declarer: 1, doubled: 1 })).toBe('4Sx');
    expect(contractString({ level: 3, strain: 4, declarer: 0, doubled: 0 })).toBe('3NT');
  });

  it('round-trips card codes and play strings', () => {
    expect(cardCode(makeCard('S', 13))).toBe('SK');
    expect(cardCode(makeCard('H', 10))).toBe('HT');
    expect(cardFromCode('sk')).toBe(makeCard('S', 13));
    expect(cardFromCode('D10')).toBe(makeCard('D', 10));
    expect(cardFromCode('SX')).toBeNull();
    const plays = ['HK', 'H4', 'H6', 'HA'].map(c);
    expect(playFromString(playToString(plays))).toEqual(plays);
    expect(playFromString('SK1')).toBeNull();
  });
});

describe('trick mechanics', () => {
  it('finds the winner in no-trump and with trumps', () => {
    // NT: highest of the led suit wins; a discard never wins.
    expect(trickWinner([c('H5'), c('HK'), c('SA'), c('H6')], 0, 4)).toBe(1);
    // Trump beats the led suit; higher trump overruffs.
    expect(trickWinner([c('HK'), c('S2'), c('S3'), c('HA')], 0, 0)).toBe(2);
    // Everyone follows: highest of the suit.
    expect(trickWinner([c('D4'), c('DQ'), c('DK'), c('DA')], 1, 0)).toBe(0); // leader=1, DA at i=3 → seat 0
  });

  it('replays a trick: leader, follow-suit, winner leads next', () => {
    const deal = dealFromPbn(PBN);
    const view0 = computePlay(deal, FOUR_SPADES_S, []);
    expect(view0.current.leader).toBe(3); // W, declarer's LHO
    expect(view0.toPlay).toBe(3);

    const plays = ['HK', 'H4', 'H6', 'HA'].map(c);
    const view = computePlay(deal, FOUR_SPADES_S, plays);
    expect(view.tricks).toHaveLength(1);
    expect(view.tricks[0].winner).toBe(2); // ♥A by South
    expect(view.declarerTricks).toBe(1);
    expect(view.defenderTricks).toBe(0);
    expect(view.current.leader).toBe(2);
    expect(view.toPlay).toBe(2);
    expect(view.remaining.W).toHaveLength(12);
  });

  it('enforces following suit', () => {
    const deal = dealFromPbn(PBN);
    const afterLead = computePlay(deal, FOUR_SPADES_S, [c('HK')]);
    const legal = legalPlays(afterLead);
    expect(legal.sort()).toEqual([c('H4'), c('H5')].sort()); // North must follow hearts
    expect(() => computePlay(deal, FOUR_SPADES_S, [c('HK'), c('S2')])).toThrow(/follow suit/);
    expect(() => computePlay(deal, FOUR_SPADES_S, [c('SA')])).toThrow(/does not hold/);
  });

  it('sanitises an imported play to its longest legal prefix', () => {
    const deal = dealFromPbn(PBN);
    const good = ['HK', 'H4', 'H6', 'HA'].map(c);
    expect(sanitisePlays(deal, FOUR_SPADES_S, good)).toEqual({ plays: good, dropped: 0 });
    const bad = [...good, c('D3'), c('S2')]; // South won trick 1; D3 is East's card
    const fit = sanitisePlays(deal, FOUR_SPADES_S, bad);
    expect(fit.plays).toEqual(good);
    expect(fit.dropped).toBe(2);
  });

  it('builds the DDS position mid-trick (played cards removed)', () => {
    const deal = dealFromPbn(PBN);
    const pos = ddPosition(deal, FOUR_SPADES_S, [c('HK'), c('H4')])!;
    expect(pos.trump).toBe(0);
    expect(pos.first).toBe(3); // W led the trick
    expect(pos.currentTrickSuit).toEqual([1, 1, 0]);
    expect(pos.currentTrickRank).toEqual([13, 4, 0]);
    expect(pos.remainCards).toBe('N:32.5.A8765.A654 654.9876.43.T987 AKQJT9.A32.K2.32 87.QJT.QJT9.KQJ');
  });

  it('translates mover scores into declarer totals', () => {
    const deal = dealFromPbn(PBN);
    // After one declarer trick, South (declaring side) to move: 1 + future.
    const declView = computePlay(deal, FOUR_SPADES_S, ['HK', 'H4', 'H6', 'HA'].map(c));
    expect(declarerTotal(declView, FOUR_SPADES_S, 9)).toBe(10);
    // Fresh position, West (defender) to move with future 4 → declarer 9.
    const defView = computePlay(deal, FOUR_SPADES_S, []);
    expect(declarerTotal(defView, FOUR_SPADES_S, 4)).toBe(9);
  });

  it('lists the 13 missing cards for three known hands', () => {
    const deal = dealFromPbn(PBN);
    const missing = missingCards({ N: deal.hands.N, S: deal.hands.S, W: deal.hands.W });
    expect(missing.sort((a, b) => a - b)).toEqual([...deal.hands.E].sort((a, b) => a - b));
  });
});

describe('duplicate scoring with doubles', () => {
  const cases: Array<[number, number, 0 | 1 | 2, number, boolean, number]> = [
    [4, 0, 0, 10, false, 420], // 4S=
    [4, 0, 0, 10, true, 620],
    [4, 0, 0, 11, false, 450],
    [4, 0, 0, 9, false, -50],
    [4, 0, 0, 9, true, -100],
    [3, 4, 0, 10, true, 630], // 3NT+1 vul
    [6, 3, 0, 12, false, 920], // 6C=
    [7, 4, 0, 13, true, 2220], // 7NT= vul
    [2, 2, 0, 8, false, 90], // 2D=
    [4, 0, 1, 9, true, -200], // 4Sx-1 vul
    [4, 0, 1, 8, false, -300], // 4Sx-2
    [4, 0, 1, 7, false, -500], // 4Sx-3
    [4, 0, 1, 6, false, -800], // 4Sx-4
    [4, 0, 1, 7, true, -800], // 4Sx-3 vul
    [4, 0, 2, 8, true, -1000], // 4Sxx-2 vul
    [2, 0, 1, 8, false, 470], // 2Sx= — doubled into game
    [1, 4, 1, 7, false, 180], // 1NTx=
    [3, 4, 2, 9, false, 800], // 3NTxx=
    [2, 2, 1, 10, false, 380], // 2Dx+2
    [2, 2, 1, 10, true, 580], // 2Dx+2 vul
  ];
  it('matches the standard score table', () => {
    for (const [level, strain, doubled, tricks, vul, want] of cases) {
      expect(scoreDeclarer(level, strain, doubled, tricks, vul), `${level}/${strain}/${doubled}/${tricks}/${vul}`).toBe(want);
    }
  });

  it('labels results', () => {
    expect(resultLabel(4, 10)).toBe('=');
    expect(resultLabel(4, 12)).toBe('+2');
    expect(resultLabel(4, 8)).toBe('−2');
  });
});
