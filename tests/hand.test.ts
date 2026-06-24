import { describe, it, expect } from 'vitest';
import { analyzeHand, hasCard, isBalanced } from '../src/engine/hand';
import { makeCard, type Card } from '../src/engine/cards';

/** Build a hand from a compact "S:AKQ H:.. D:.. C:.." style spec. */
function hand(spec: { S?: string; H?: string; D?: string; C?: string }): Card[] {
  const rankVal: Record<string, number> = {
    A: 14, K: 13, Q: 12, J: 11, T: 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
  };
  const cards: Card[] = [];
  (['S', 'H', 'D', 'C'] as const).forEach((suit) => {
    for (const ch of spec[suit] ?? '') cards.push(makeCard(suit, rankVal[ch]));
  });
  return cards;
}

describe('hand analysis', () => {
  it('computes suit lengths, HCP and shape', () => {
    // 4-3-3-3, 13 HCP (A+K spades=7, A hearts=4, K diamonds=3 -> 14)
    const a = analyzeHand(hand({ S: 'AK52', H: 'A93', D: 'K84', C: '976' }));
    expect(a.lengths).toEqual({ S: 4, H: 3, D: 3, C: 3 });
    expect(a.shape).toEqual([4, 3, 3, 3]);
    expect(a.hcp).toBe(4 + 3 + 4 + 3);
    expect(a.controls).toBe(2 + 1 + 2 + 1);
  });

  it('sorts each suit high to low', () => {
    const a = analyzeHand(hand({ S: '2AKQ' }));
    expect(a.bySuit.S.map((c) => c % 13 + 2)).toEqual([14, 13, 12, 2]);
  });

  it('detects specific honors', () => {
    const a = analyzeHand(hand({ S: 'AK', H: 'Q', D: 'JT98765', C: '432' }));
    expect(hasCard(a, 'S', 14)).toBe(true);
    expect(hasCard(a, 'S', 12)).toBe(false);
    expect(hasCard(a, 'C', 2)).toBe(true);
  });

  it('classifies balanced shapes', () => {
    expect(isBalanced(analyzeHand(hand({ S: 'AKQJ', H: 'AKQ', D: 'AKQ', C: 'AKQ' })))).toBe(true); // 4-3-3-3
    expect(isBalanced(analyzeHand(hand({ S: 'AKQJ', H: 'AKQ2', D: 'AK', C: 'AKQ' })))).toBe(true); // 4-4-3-2
    expect(isBalanced(analyzeHand(hand({ S: 'AKQJ', H: 'AKQ2', D: 'AKQ3', C: 'A' })))).toBe(false); // 4-4-4-1
  });

  it('treats 5-3-3-2 as balanced and 6-3-2-2 as not', () => {
    expect(isBalanced(analyzeHand(hand({ S: 'AKQJ9', H: 'AKQ', D: 'AK2', C: 'AK' })))).toBe(true);
    expect(isBalanced(analyzeHand(hand({ S: 'AKQJ97', H: 'AKQ', D: 'AK', C: 'A2' })))).toBe(false);
  });
});
