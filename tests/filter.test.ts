import { describe, it, expect } from 'vitest';
import { compileFilter, runFilter, buildContext } from '../src/engine/filter';
import { parseHandString } from '../src/engine/parse';
import { generateDeals } from '../src/engine/dealer';
import type { Card } from '../src/engine/cards';

function hand(str: string): Card[] {
  const r = parseHandString(str);
  expect(r.errors).toEqual([]);
  expect(r.length).toBe(13);
  return r.cards;
}

describe('filter language — the two motivating examples', () => {
  const longSpadesGoodTop = hand('AKQ752 K9 Q83 J2'); // 6 spades, top6 = A,K,Q (3)
  const longSpadesWeakTop = hand('A87654 K9 Q83 J2'); // 6 spades, top6 = A only (1)

  it('"6+S with at least 3 of the top 6 spades"', () => {
    const src = 'spades >= 6 and top(spades, 6) >= 3';
    expect(runFilter(src, longSpadesGoodTop)).toBe(true);
    expect(runFilter(src, longSpadesWeakTop)).toBe(false);
  });

  it('"exclude 4+H, 4+S & 3-9 HCP"', () => {
    const src = 'not (hearts >= 4 and spades >= 4 and hcp in 3..9)';
    const weak4441ish = hand('Q543 Q432 J32 32'); // 4=4=3=2, 5 HCP → excluded
    const strong = hand('AK43 AQ32 J32 32'); // 4=4=3=2, 14 HCP → kept
    expect(runFilter(src, weak4441ish)).toBe(false);
    expect(runFilter(src, strong)).toBe(true);
  });
});

describe('filter language — building blocks', () => {
  const h = hand('AKQ52 K9 Q84 K76'); // S5 H2 D3 C3, 17 HCP

  it('suit lengths, short suit names, and arithmetic', () => {
    expect(runFilter('spades = 5', h)).toBe(true);
    expect(runFilter('s = 5 and h = 2', h)).toBe(true);
    expect(runFilter('spades + hearts >= 7', h)).toBe(true);
    expect(runFilter('spades + hearts >= 8', h)).toBe(false);
  });

  it('hcp ranges and comparisons', () => {
    expect(runFilter('hcp in 15..18', h)).toBe(true);
    expect(runFilter('hcp >= 18', h)).toBe(false);
    expect(runFilter('hcp = 17', h)).toBe(true);
    expect(runFilter('hcp != 17', h)).toBe(false);
  });

  it('top(suit, n) and has(suit, rank)', () => {
    expect(runFilter('top(spades, 3) = 3', h)).toBe(true); // A,K,Q
    expect(runFilter('top(spades, 3) >= 4', h)).toBe(false);
    expect(runFilter('has(spades, A) and has(clubs, K)', h)).toBe(true);
    expect(runFilter('has(diamonds, A)', h)).toBe(false);
    expect(runFilter('has(diamonds, Q)', h)).toBe(true);
  });

  it('controls and knr', () => {
    // controls: spades A+K (3) + hearts K (1) + clubs K (1) = 5
    expect(runFilter('controls >= 5', h)).toBe(true);
    expect(runFilter('controls >= 6', h)).toBe(false);
    expect(runFilter('knr >= 17', h)).toBe(true); // 17.35
    expect(runFilter('knr >= 18', h)).toBe(false);
  });

  it('boolean operators, symbols, and precedence', () => {
    expect(runFilter('spades >= 5 & hcp >= 15', h)).toBe(true);
    expect(runFilter('spades >= 6 | hearts = 2', h)).toBe(true);
    expect(runFilter('!(spades = 5)', h)).toBe(false);
    // and binds tighter than or
    expect(runFilter('spades = 6 or hearts = 2 and hcp = 17', h)).toBe(true);
  });

  it('empty source means no filter (always true)', () => {
    expect(runFilter('', h)).toBe(true);
    expect(runFilter('   ', h)).toBe(true);
  });
});

describe('filter language — error reporting', () => {
  const cases: Array<[string, RegExp]> = [
    ['spades >=', /Expected|Unexpected/i],
    ['spades and hearts', /yes\/no|condition/i],
    ['hcp + spades', /yes\/no|condition/i], // a number is not a valid filter on its own
    ['wibble > 3', /Unknown name/i],
    ['top(spades)', /Expected ","/i],
    ['has(spades, Z)', /rank/i],
    ['top(notasuit, 6) >= 1', /suit/i],
    ['spades >= 5 zzz', /extra input/i],
    ['3 @ 4', /Unexpected character/i],
  ];

  it.each(cases)('rejects %j', (src, re) => {
    const { error, filter } = compileFilter(src);
    expect(filter).toBeUndefined();
    expect(error).toBeTruthy();
    expect(error!).toMatch(re);
  });
});

describe('filter language — through the dealer', () => {
  it('every accepted deal satisfies a per-seat filter', () => {
    const src = 'spades >= 6 and top(spades, 6) >= 3';
    const { filter } = compileFilter(src);
    const result = generateDeals({
      constraints: { hands: { N: { filter: src } } },
      count: 15,
      seed: 2024,
      maxAttempts: 500_000,
    });
    expect(result.complete).toBe(true);
    for (const deal of result.deals) {
      expect(filter!.predicate(buildContext(deal.hands.N))).toBe(true);
    }
  });

  it('combines a filter with structured constraints on the same seat', () => {
    const result = generateDeals({
      constraints: { hands: { S: { hcp: { min: 12 }, filter: 'hearts >= 5' } } },
      count: 10,
      seed: 5,
      maxAttempts: 500_000,
    });
    expect(result.complete).toBe(true);
    for (const deal of result.deals) {
      const ctx = buildContext(deal.hands.S);
      expect(ctx.hcp).toBeGreaterThanOrEqual(12);
      expect(ctx.len[1]).toBeGreaterThanOrEqual(5); // hearts
    }
  });
});
