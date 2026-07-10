import { describe, it, expect } from 'vitest';
import { dealerOf, vulnerabilityOf, type Vulnerability } from '../src/engine/board';

describe('board dealer and vulnerability', () => {
  it('rotates the dealer N, E, S, W', () => {
    expect([1, 2, 3, 4, 5].map(dealerOf)).toEqual(['N', 'E', 'S', 'W', 'N']);
  });

  it('matches the canonical 16-board vulnerability cycle', () => {
    const expected: Vulnerability[] = [
      'None', 'NS', 'EW', 'Both', // 1-4
      'NS', 'EW', 'Both', 'None', // 5-8
      'EW', 'Both', 'None', 'NS', // 9-12
      'Both', 'None', 'NS', 'EW', // 13-16
    ];
    expect(Array.from({ length: 16 }, (_, i) => vulnerabilityOf(i + 1))).toEqual(expected);
  });

  it('repeats every 16 boards', () => {
    expect(vulnerabilityOf(17)).toBe(vulnerabilityOf(1));
    expect(vulnerabilityOf(32)).toBe(vulnerabilityOf(16));
    expect(dealerOf(17)).toBe(dealerOf(1));
  });
});
