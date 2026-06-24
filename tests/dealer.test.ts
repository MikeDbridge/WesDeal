import { describe, it, expect } from 'vitest';
import { generateDeals } from '../src/engine/dealer';
import { matchesDeal, type ConstraintSet } from '../src/engine/constraints';
import { analyzeHand } from '../src/engine/hand';

describe('generateDeals', () => {
  it('returns the requested number of unconstrained deals quickly', () => {
    const result = generateDeals({ constraints: {}, count: 5, seed: 1 });
    expect(result.accepted).toBe(5);
    expect(result.complete).toBe(true);
    expect(result.attempts).toBe(5); // every deal matches an empty constraint set
  });

  it('is reproducible for a fixed seed', () => {
    const a = generateDeals({ constraints: {}, count: 3, seed: 99 });
    const b = generateDeals({ constraints: {}, count: 3, seed: 99 });
    expect(a.deals.map((d) => d.hands.N)).toEqual(b.deals.map((d) => d.hands.N));
  });

  it('every accepted deal actually satisfies the constraints', () => {
    const constraints: ConstraintSet = {
      hands: {
        S: { hcp: { min: 15, max: 17 }, balanced: true },
      },
    };
    const result = generateDeals({ constraints, count: 20, seed: 2024, maxAttempts: 500_000 });
    expect(result.complete).toBe(true);
    for (const deal of result.deals) {
      expect(matchesDeal(deal, constraints)).toBe(true);
      const south = analyzeHand(deal.hands.S);
      expect(south.hcp).toBeGreaterThanOrEqual(15);
      expect(south.hcp).toBeLessThanOrEqual(17);
    }
  });

  it('respects maxAttempts and reports incompleteness for impossible constraints', () => {
    // 41+ HCP in one hand is impossible (max is 37: AKQ in three suits + AK).
    const constraints: ConstraintSet = { hands: { N: { hcp: { min: 41 } } } };
    const result = generateDeals({ constraints, count: 1, maxAttempts: 1000, seed: 5 });
    expect(result.accepted).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.attempts).toBe(1000);
  });

  it('finds deals with a strong NS partnership', () => {
    const constraints: ConstraintSet = { partnership: { NS: { hcp: { min: 30 } } } };
    const result = generateDeals({ constraints, count: 3, seed: 77, maxAttempts: 500_000 });
    expect(result.complete).toBe(true);
    for (const deal of result.deals) {
      const total = analyzeHand(deal.hands.N).hcp + analyzeHand(deal.hands.S).hcp;
      expect(total).toBeGreaterThanOrEqual(30);
    }
  });
});
