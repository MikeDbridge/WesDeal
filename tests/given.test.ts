import { describe, it, expect } from 'vitest';
import {
  validateGivenHands,
  dealWithGiven,
  validateGivenSpecs,
  dealWithGivenSpecs,
  givenSeats,
  hasGivenHands,
  hasGivenSpecs,
  mulberry32,
  SEATS,
  type GivenHands,
  type GivenSpecs,
} from '../src/engine/deal';
import { parseHandHoldings, parseHandSpec } from '../src/engine/parse';
import { generateDeals } from '../src/engine/dealer';
import { analyzeHand } from '../src/engine/hand';
import { DECK_SIZE, suitOf, rankOf } from '../src/engine/cards';

function hand(s: string, h: string, d: string, c: string) {
  const r = parseHandHoldings({ S: s, H: h, D: d, C: c });
  expect(r.errors).toEqual([]);
  expect(r.length).toBe(13);
  return r.cards;
}

function spec(str: string) {
  const r = parseHandSpec(str);
  expect(r.errors).toEqual([]);
  return r.spec;
}

const north = hand('AK52', 'K93', 'Q84', 'K76'); // 15 HCP
const south = hand('QJT', 'AQ', 'AKJ', 'AQJ95'); // strong

describe('validateGivenHands', () => {
  it('accepts 0, 1 or 2 valid hands', () => {
    expect(validateGivenHands({})).toEqual([]);
    expect(validateGivenHands({ N: north })).toEqual([]);
    expect(validateGivenHands({ N: north, S: south })).toEqual([]);
  });

  it('rejects more than 2 locked hands', () => {
    const third = hand('9876', '8765', '97', '432');
    const errors = validateGivenHands({ N: north, S: south, E: third });
    expect(errors.some((e) => e.includes('At most 2'))).toBe(true);
  });

  it('rejects a hand without exactly 13 cards', () => {
    const short = parseHandHoldings({ S: 'AKQ' }).cards; // 3 cards
    const errors = validateGivenHands({ N: short });
    expect(errors.some((e) => e.includes('13'))).toBe(true);
  });

  it('rejects a card claimed by two seats', () => {
    const errors = validateGivenHands({ N: north, S: north });
    expect(errors.some((e) => e.includes("can't be in both"))).toBe(true);
  });
});

describe('givenSeats / hasGivenHands', () => {
  it('lists the locked seats', () => {
    expect(givenSeats({ N: north, S: south })).toEqual(['N', 'S']);
    expect(hasGivenHands({})).toBe(false);
    expect(hasGivenHands({ N: north })).toBe(true);
  });
});

describe('dealWithGiven', () => {
  it('keeps locked hands exactly and deals the rest to other seats', () => {
    const given: GivenHands = { N: north, S: south };
    const deal = dealWithGiven(given, mulberry32(3));
    expect(deal.hands.N).toBe(north);
    expect(deal.hands.S).toBe(south);
    expect(deal.hands.E.length).toBe(13);
    expect(deal.hands.W.length).toBe(13);

    const all = SEATS.flatMap((s) => deal.hands[s]);
    expect(all.length).toBe(DECK_SIZE);
    expect(new Set(all).size).toBe(DECK_SIZE); // every card once, no overlap
  });

  it('produces different fill for different seeds but the same locked hand', () => {
    const given: GivenHands = { N: north };
    const a = dealWithGiven(given, mulberry32(1));
    const b = dealWithGiven(given, mulberry32(2));
    expect(a.hands.N).toEqual(north);
    expect(b.hands.N).toEqual(north);
    expect(a.hands.E).not.toEqual(b.hands.E);
  });
});

describe('given specs with x small cards', () => {
  it('validateGivenSpecs accepts a valid spec and reports wrong length', () => {
    expect(validateGivenSpecs({ N: spec('AKxxx Kx Qxx Axx') })).toEqual([]); // 5+2+3+3=13
    const errors = validateGivenSpecs({ N: spec('AKx Kx Qxx Axx') }); // 3+2+3+3=11
    expect(errors.some((e) => e.includes('13'))).toBe(true);
  });

  it('rejects a suit asking for more small cards than exist', () => {
    // 7 x's in spades is impossible (only 2..7 = 6 small cards available).
    const errors = validateGivenSpecs({ N: spec('xxxxxxx Kx Qx Ax') });
    expect(errors.some((e) => e.includes('small'))).toBe(true);
  });

  it('hasGivenSpecs detects locked seats', () => {
    expect(hasGivenSpecs({})).toBe(false);
    expect(hasGivenSpecs({ N: spec('AKxxx Kx Qxx Axx') })).toBe(true);
  });

  it('dealWithGivenSpecs honours fixed honors and fills x with small cards (<=7)', () => {
    const deal = dealWithGivenSpecs({ N: spec('AKxxx Kx Qxx Axx') }, mulberry32(5));
    const n = deal.hands.N;
    expect(n.length).toBe(13);
    // The five spades include A and K; the other three are small (<=7).
    const spades = n.filter((c) => suitOf(c) === 'S').map(rankOf).sort((a, b) => b - a);
    expect(spades.length).toBe(5);
    expect(spades[0]).toBe(14); // A
    expect(spades[1]).toBe(13); // K
    expect(spades.slice(2).every((r) => r <= 7)).toBe(true);

    // Whole deal is a legal 52-card partition.
    const all = SEATS.flatMap((s) => deal.hands[s]);
    expect(new Set(all).size).toBe(DECK_SIZE);
  });

  it('varies the x cards across seeds', () => {
    const a = dealWithGivenSpecs({ N: spec('AKxxx Kx Qxx Axx') }, mulberry32(1));
    const b = dealWithGivenSpecs({ N: spec('AKxxx Kx Qxx Axx') }, mulberry32(2));
    const small = (cards: number[]) => cards.filter((c) => suitOf(c) === 'S').map(rankOf).sort().join(',');
    expect(small(a.hands.N)).not.toBe(small(b.hands.N));
  });
});

describe('generateDeals with given specs', () => {
  const northSpec: GivenSpecs = { N: spec('AK52 K93 Q84 K76') };

  it('every deal contains the locked hand and satisfies constraints on free seats', () => {
    const result = generateDeals({
      constraints: { hands: { S: { hcp: { min: 12 } } } },
      given: northSpec,
      count: 10,
      seed: 42,
      maxAttempts: 200_000,
    });
    expect(result.complete).toBe(true);
    for (const deal of result.deals) {
      expect(new Set(deal.hands.N)).toEqual(new Set(north));
      expect(analyzeHand(deal.hands.N).hcp).toBe(15);
      expect(analyzeHand(deal.hands.S).hcp).toBeGreaterThanOrEqual(12);
    }
  });

  it('throws if the given specs are invalid', () => {
    const dup = spec('AK52 K93 Q84 K76');
    expect(() => generateDeals({ constraints: {}, given: { N: dup, S: dup } })).toThrow();
  });
});
