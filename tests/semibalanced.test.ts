import { describe, it, expect } from 'vitest';
import { matchesHand } from '../src/engine/constraints';
import { analyzeHand } from '../src/engine/hand';
import { parseHandString } from '../src/engine/parse';
import { generateDeals } from '../src/engine/dealer';

function a(str: string) {
  const r = parseHandString(str);
  expect(r.errors).toEqual([]);
  expect(r.length).toBe(13);
  return analyzeHand(r.cards);
}

const SEMI = { semiBalancedNT: true } as const;

describe('semi-balanced for NT', () => {
  it('accepts the standard balanced shapes', () => {
    expect(matchesHand(a('AK52 K93 Q84 K76'), SEMI)).toBe(true); // 4-3-3-3
    expect(matchesHand(a('AK52 KQ93 Q8 K76'), SEMI)).toBe(true); // 4-4-2-3
    expect(matchesHand(a('AK652 K93 Q84 K6'), SEMI)).toBe(true); // 5-3-3-2
  });

  it('accepts 6-3-2-2 with the six-card suit a minor', () => {
    expect(matchesHand(a('Q83 K9 J7 AKQ542'), SEMI)).toBe(true); // 6 clubs
    expect(matchesHand(a('Q83 K9 AKQ542 J7'), SEMI)).toBe(true); // 6 diamonds
  });

  it('rejects 6-3-2-2 with the six-card suit a major', () => {
    expect(matchesHand(a('AKQ542 K9 J7 Q83'), SEMI)).toBe(false); // 6 spades
  });

  it('accepts 4-4-4-1 with an A/K/Q singleton in a minor', () => {
    expect(matchesHand(a('QJ32 KT54 9876 A'), SEMI)).toBe(true); // singleton ♣A
    expect(matchesHand(a('QJ32 KT54 K 9876'), SEMI)).toBe(true); // singleton ♦K
  });

  it('rejects 4-4-4-1 with a low minor singleton or a major singleton', () => {
    expect(matchesHand(a('QJ32 KT54 9876 2'), SEMI)).toBe(false); // singleton ♣2 (not an honor)
    expect(matchesHand(a('A KT54 QJ98 7653'), SEMI)).toBe(false); // singleton ♠A (a major)
  });

  it('rejects other unbalanced shapes', () => {
    expect(matchesHand(a('AK652 KQ93 Q8 76'), SEMI)).toBe(false); // 5-4-2-2
    expect(matchesHand(a('AKQ8742 K9 J7 Q3'), SEMI)).toBe(false); // 7-2-2-2
  });

  it('the dealer (compiled matcher) only accepts semi-balanced hands', () => {
    const res = generateDeals({
      constraints: { hands: { N: { semiBalancedNT: true } } },
      count: 40,
      seed: 5,
      maxAttempts: 200_000,
    });
    expect(res.complete).toBe(true);
    for (const d of res.deals) {
      expect(matchesHand(analyzeHand(d.hands.N), SEMI)).toBe(true);
    }
  });
});
