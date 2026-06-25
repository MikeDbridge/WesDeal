import { describe, it, expect } from 'vitest';
import { suitBreakOdds, comb } from '../src/engine/odds';

const pct = (splits: { a: number; b: number; probability: number }[], a: number, b: number): number => {
  const s = splits.find((x) => x.a === a && x.b === b);
  if (!s) throw new Error(`no ${a}-${b}`);
  return s.probability * 100;
};

describe('suit-break odds', () => {
  it('combinations', () => {
    expect(comb(26, 13)).toBe(10_400_600);
    expect(comb(21, 10)).toBe(352_716);
    expect(comb(5, 3)).toBe(10);
    expect(comb(4, 0)).toBe(1);
  });

  it('matches the canonical a-priori percentages', () => {
    expect(pct(suitBreakOdds(2), 1, 1)).toBeCloseTo(52.0, 1);
    expect(pct(suitBreakOdds(2), 2, 0)).toBeCloseTo(48.0, 1);

    expect(pct(suitBreakOdds(3), 2, 1)).toBeCloseTo(78.0, 1);
    expect(pct(suitBreakOdds(3), 3, 0)).toBeCloseTo(22.0, 1);

    expect(pct(suitBreakOdds(4), 3, 1)).toBeCloseTo(49.74, 1);
    expect(pct(suitBreakOdds(4), 2, 2)).toBeCloseTo(40.7, 1);
    expect(pct(suitBreakOdds(4), 4, 0)).toBeCloseTo(9.57, 1);

    expect(pct(suitBreakOdds(5), 3, 2)).toBeCloseTo(67.83, 1);
    expect(pct(suitBreakOdds(5), 4, 1)).toBeCloseTo(28.26, 1);
    expect(pct(suitBreakOdds(5), 5, 0)).toBeCloseTo(3.91, 1);

    expect(pct(suitBreakOdds(6), 4, 2)).toBeCloseTo(48.45, 1);
    expect(pct(suitBreakOdds(6), 3, 3)).toBeCloseTo(35.53, 1);
    expect(pct(suitBreakOdds(6), 6, 0)).toBeCloseTo(1.49, 1);
  });

  it('orders splits most-even first and sums to 1', () => {
    const five = suitBreakOdds(5);
    expect(five.map((s) => `${s.a}-${s.b}`)).toEqual(['3-2', '4-1', '5-0']);
    for (const m of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const total = suitBreakOdds(m).reduce((sum, s) => sum + s.probability, 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });
});
