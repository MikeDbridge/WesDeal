import { describe, it, expect, beforeAll } from 'vitest';
import { loadDds, Dds } from 'bridge-dds';
import { expandFutureTricks, aggregateLeads, declarerFor, tricksToSet, unbeatablePct } from '../src/engine/lead';
import { generateDeals } from '../src/engine/dealer';
import { dealToPBN } from '../src/engine/format';
import { parsePBN } from '../research/lib';
import { SEATS } from '../src/engine/deal';

describe('opening-lead engine', () => {
  it('derives declarer and set targets', () => {
    expect(declarerFor(3)).toBe(2); // West leads vs South
    expect(declarerFor(1)).toBe(0); // East leads vs North
    expect(tricksToSet(4)).toBe(4); // 4M: four defensive tricks beat it
    expect(tricksToSet(3)).toBe(5); // 3NT: five
  });

  it('aggregates per-card stats', () => {
    // Two deals, two cards. Card A (♠A): scores 5 then 3; card B (♥2): 4 then 4.
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
    const rows = aggregateLeads(perDeal, 3); // need 5 to set
    const spadeA = rows.find((r) => r.suit === 0 && r.rank === 14)!;
    const heart2 = rows.find((r) => r.suit === 1 && r.rank === 2)!;
    expect(spadeA.avg).toBeCloseTo(4, 9);
    expect(spadeA.setPct).toBeCloseTo(0.5, 9);
    expect(spadeA.bestPct).toBeCloseTo(0.5, 9); // best on deal 1 only
    expect(spadeA.avgCost).toBeCloseTo(0.5, 9); // 0 then 1
    expect(heart2.setPct).toBeCloseTo(0, 9);
    expect(heart2.bestPct).toBeCloseTo(0.5, 9); // best on deal 2 only
    expect(unbeatablePct(perDeal, 3)).toBeCloseTo(0.5, 9); // deal 2 is unbeatable
    expect(rows[0]).toBe(spadeA); // sorted by set% first
  });
});

describe('opening-lead solving (bridge-dds)', () => {
  let dds: Dds;
  beforeAll(async () => {
    dds = new Dds(await loadDds());
  });

  it('expands to exactly the leader13 cards and agrees with CalcDDTable', () => {
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
