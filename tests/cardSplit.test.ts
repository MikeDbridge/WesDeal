import { describe, it, expect } from 'vitest';
import { parseHolding, cardLieOdds, type CardLie } from '../src/engine/cardSplit';
import { suitBreakOdds } from '../src/engine/odds';

const find = (lies: CardLie[], east: string, west: string): CardLie => {
  const l = lies.find((x) => x.east === east && x.west === west);
  if (!l) throw new Error(`no lie ${east} / ${west}`);
  return l;
};

describe('parseHolding', () => {
  it('groups like characters, preserving first-appearance order', () => {
    expect(parseHolding('KQxxx')).toEqual({
      groups: [{ token: 'K', count: 1 }, { token: 'Q', count: 1 }, { token: 'x', count: 3 }],
      cards: 5,
    });
    expect(parseHolding('')).toEqual({ groups: [], cards: 0 });
  });

  it('treats different characters as separate groups (multi-suit)', () => {
    // four clubs to the queen + five diamonds to the jack
    expect(parseHolding('QcccJdddd')).toEqual({
      groups: [{ token: 'Q', count: 1 }, { token: 'c', count: 3 }, { token: 'J', count: 1 }, { token: 'd', count: 4 }],
      cards: 9,
    });
    expect(parseHolding('hhhhhhcccccc').groups).toEqual([{ token: 'h', count: 6 }, { token: 'c', count: 6 }]);
  });

  it('reads "10" as a single token and ignores whitespace', () => {
    expect(parseHolding('A 10 x x').groups).toEqual([{ token: 'A', count: 1 }, { token: 'T', count: 1 }, { token: 'x', count: 2 }]);
  });

  it('does not care about meaning: repeated characters just stack', () => {
    expect(parseHolding('QQ').groups).toEqual([{ token: 'Q', count: 2 }]);
  });

  it('rejects more than 26 cards', () => {
    expect(parseHolding('x'.repeat(27)).error).toMatch(/26/);
  });
});

describe('cardLieOdds', () => {
  it('probabilities sum to 1 (a-priori)', () => {
    for (const src of ['KQxxx', 'AKQ', 'xxxxxx', 'AKQJT', 'hhhccc', 'QcccJdddd']) {
      const total = cardLieOdds(parseHolding(src)).reduce((s, l) => s + l.probability, 0);
      expect(total).toBeCloseTo(1, 9);
    }
  });

  it('collapses to a-priori suit breaks when all cards are alike', () => {
    const lies = cardLieOdds(parseHolding('xxxxx')); // 5 missing
    const threeTwo = lies
      .filter((l) => (l.eastCount === 3 && l.westCount === 2) || (l.eastCount === 2 && l.westCount === 3))
      .reduce((s, l) => s + l.probability, 0);
    const ref = suitBreakOdds(5).find((s) => s.a === 3 && s.b === 2)!.probability;
    expect(threeTwo).toBeCloseTo(ref, 9);
  });

  it('a single missing card is equally likely either way', () => {
    const lies = cardLieOdds(parseHolding('K'));
    expect(find(lies, 'K', '—').probability).toBeCloseTo(0.5, 9);
    expect(find(lies, '—', 'K').probability).toBeCloseTo(0.5, 9);
  });

  it('onside odds shift with vacant spaces', () => {
    // East has many more vacant spaces, so a lone missing card sits there more often.
    const lies = cardLieOdds(parseHolding('K'), 11, 2);
    expect(find(lies, 'K', '—').probability).toBeCloseTo(11 / 13, 9);
  });

  it('separate groups split independently and labels keep input order', () => {
    const lies = cardLieOdds(parseHolding('QcccJdddd'));
    expect(lies.reduce((s, l) => s + l.probability, 0)).toBeCloseTo(1, 9);
    // every card East: label is the holding in input order
    expect(find(lies, 'QcccJdddd', '—').probability).toBeGreaterThan(0);
    // a mixed lie: queen + two clubs + jack + one diamond with East
    expect(find(lies, 'QccJd', 'cddd').probability).toBeGreaterThan(0);
  });

  it('orders by West length (descending) when asked', () => {
    const lies = cardLieOdds(parseHolding('KJxxx'), 13, 13, 'westLength');
    const west = lies.map((l) => l.westCount);
    expect(west).toEqual([...west].sort((a, b) => b - a)); // non-increasing
    expect(west[0]).toBe(5); // West holding all five first
  });
});
