import { describe, it, expect, beforeAll } from 'vitest';
import { loadDds, Dds } from 'bridge-dds';
import {
  expandFutureTricks,
  aggregateLeadGroups,
  avgDefenderScore,
  computeLeadGroups,
  groupTricks,
  scoreContract,
  declarerFor,
  tricksToSet,
  unbeatablePct,
} from '../src/engine/lead';
import { generateDeals } from '../src/engine/dealer';
import { dealToPBN } from '../src/engine/format';
import { parsePBN } from '../research/lib';
import { SEATS } from '../src/engine/deal';

describe('opening-lead engine', () => {
  it('derives declarer and set targets', () => {
    expect(declarerFor(3)).toBe(2); // West leads vs South
    expect(declarerFor(1)).toBe(0); // East leads vs North
    expect(tricksToSet(4)).toBe(4);
    expect(tricksToSet(3)).toBe(5);
  });

  it('scores contracts (declarer viewpoint, undoubled)', () => {
    expect(scoreContract(4, 0, 10, false)).toBe(420); // 4♠=
    expect(scoreContract(4, 0, 10, true)).toBe(620);
    expect(scoreContract(3, 4, 9, false)).toBe(400); // 3NT=
    expect(scoreContract(3, 4, 10, false)).toBe(430); // 3NT+1
    expect(scoreContract(2, 1, 9, false)).toBe(140); // 2♥+1
    expect(scoreContract(5, 2, 11, true)).toBe(600); // 5♦= vul
    expect(scoreContract(6, 0, 12, false)).toBe(980); // 6♠=
    expect(scoreContract(7, 3, 13, false)).toBe(1440); // 7♣=
    expect(scoreContract(7, 4, 13, true)).toBe(2220); // 7NT= vul
    expect(scoreContract(4, 0, 9, false)).toBe(-50); // down 1
    expect(scoreContract(3, 4, 6, true)).toBe(-300); // down 3 vul
  });

  it('pools touching cards into lead groups', () => {
    // ♠A K 4 3 2 → two runs: {A,K} and {4,3,2}. ♥Q J → {Q,J}. ♦7 alone.
    const groups = computeLeadGroups([
      { suit: 0, rank: 14 }, { suit: 0, rank: 13 }, { suit: 0, rank: 4 }, { suit: 0, rank: 3 }, { suit: 0, rank: 2 },
      { suit: 1, rank: 12 }, { suit: 1, rank: 11 },
      { suit: 2, rank: 7 },
    ]);
    expect(groups).toEqual([
      { suit: 0, ranks: [14, 13] },
      { suit: 0, ranks: [4, 3, 2] },
      { suit: 1, ranks: [12, 11] },
      { suit: 2, ranks: [7] },
    ]);
    // The 3 and 2 read the top-of-run (4)'s score.
    const deal = [
      { suit: 0, rank: 14, score: 6 }, { suit: 0, rank: 13, score: 6 },
      { suit: 0, rank: 4, score: 2 }, { suit: 0, rank: 3, score: 2 }, { suit: 0, rank: 2, score: 2 },
      { suit: 1, rank: 12, score: 3 }, { suit: 1, rank: 11, score: 3 },
      { suit: 2, rank: 7, score: 1 },
    ];
    expect(groupTricks(deal, groups)).toEqual([6, 2, 3, 1]);
  });

  it('aggregates per-group stats with trick distributions and scores', () => {
    // vs 3NT (need 5 to set). ♠A: 5 then 3 defensive tricks; ♥2: 4 then 4.
    const perDeal = [
      [
        { suit: 0, rank: 14, score: 5 },
        { suit: 1, rank: 2, score: 4 },
      ],
      [
        { suit: 0, rank: 14, score: 3 },
        { suit: 1, rank: 2, score: 4 },
      ],
    ];
    const groups = computeLeadGroups([{ suit: 0, rank: 14 }, { suit: 1, rank: 2 }]);
    const rows = aggregateLeadGroups(perDeal, groups, 3);
    const spadeA = rows.find((r) => r.suit === 0 && r.ranks[0] === 14)!;
    const heart2 = rows.find((r) => r.suit === 1 && r.ranks[0] === 2)!;
    expect(spadeA.label).toBe('A');
    expect(spadeA.avg).toBeCloseTo(4, 9);
    expect(spadeA.setPct).toBeCloseTo(0.5, 9);
    expect(spadeA.bestPct).toBeCloseTo(0.5, 9);
    expect(spadeA.avgCost).toBeCloseTo(0.5, 9);
    expect(spadeA.counts[5]).toBe(1);
    expect(spadeA.counts[3]).toBe(1);
    expect(heart2.setPct).toBeCloseTo(0, 9);
    expect(rows[0]).toBe(spadeA); // sorted by beat % first
    expect(unbeatablePct(perDeal, 3)).toBeCloseTo(0.5, 9);

    // ♠A defender scores, NV: def 5 → 3NT down 1 → +50; def 3 → 3NT+1 → −430.
    expect(avgDefenderScore(spadeA.counts, spadeA.n, 3, 4, false)).toBeCloseTo((50 - 430) / 2, 9);
    // Vulnerable: +100 and −630 → −265.
    expect(avgDefenderScore(spadeA.counts, spadeA.n, 3, 4, true)).toBeCloseTo((100 - 630) / 2, 9);
  });
});

describe('opening-lead solving (bridge-dds)', () => {
  let dds: Dds;
  beforeAll(async () => {
    dds = new Dds(await loadDds());
  });

  it('expands to the leader13 cards and agrees with CalcDDTable', () => {
    for (const seed of [3, 77]) {
      const deal = generateDeals({ constraints: {}, count: 1, seed }).deals[0];
      const pbn = dealToPBN(deal);
      const table = dds.CalcDDTablePBN({ cards: pbn }).resTable;
      for (const [strain, leader] of [
        [4, 3], // West leads vs 3NT by South
        [0, 1], // East leads vs spades by North
      ]) {
        const ft = dds.SolveBoardPBN(
          { trump: strain, first: leader, currentTrickSuit: [0, 0, 0], currentTrickRank: [0, 0, 0], remainCards: pbn },
          -1,
          3,
          1,
        );
        const cards = expandFutureTricks(ft);
        expect(cards.length).toBe(13);

        // The expanded cards are exactly the leader's hand.
        const hand = parsePBN(pbn)[SEATS[leader]];
        const have = new Set(hand.map((c) => `${(c / 13) | 0}-${(c % 13) + 2}`));
        for (const c of cards) expect(have.has(`${c.suit}-${c.rank}`)).toBe(true);

        // Best lead concedes exactly the table result to declarer.
        const best = Math.max(...cards.map((c) => c.score));
        expect(best).toBe(13 - table[strain][declarerFor(leader)]);
      }
    }
  });
});
