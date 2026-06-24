import { describe, it, expect } from 'vitest';
import {
  inRange,
  matchesHand,
  matchesDeal,
  isEmptyConstraintSet,
  type ConstraintSet,
} from '../src/engine/constraints';
import { analyzeHand } from '../src/engine/hand';
import { makeCard, type Card } from '../src/engine/cards';
import { dealFromDeck } from '../src/engine/deal';

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

describe('inRange', () => {
  it('treats undefined range and undefined bounds as open', () => {
    expect(inRange(5, undefined)).toBe(true);
    expect(inRange(5, {})).toBe(true);
    expect(inRange(5, { min: 5 })).toBe(true);
    expect(inRange(4, { min: 5 })).toBe(false);
    expect(inRange(5, { max: 5 })).toBe(true);
    expect(inRange(6, { max: 5 })).toBe(false);
    expect(inRange(5, { min: 4, max: 6 })).toBe(true);
  });
});

describe('matchesHand', () => {
  const opener = analyzeHand(hand({ S: 'AK52', H: 'K93', D: 'Q84', C: 'K76' })); // 15 HCP, 4-3-3-3

  it('checks HCP range', () => {
    expect(matchesHand(opener, { hcp: { min: 15, max: 17 } })).toBe(true);
    expect(matchesHand(opener, { hcp: { min: 16 } })).toBe(false);
  });

  it('checks suit-length ranges', () => {
    expect(matchesHand(opener, { suit: { S: { min: 4 } } })).toBe(true);
    expect(matchesHand(opener, { suit: { S: { min: 5 } } })).toBe(false);
    expect(matchesHand(opener, { suit: { H: { min: 3, max: 3 }, D: { max: 3 } } })).toBe(true);
  });

  it('checks balanced flag', () => {
    expect(matchesHand(opener, { balanced: true })).toBe(true);
    expect(matchesHand(opener, { balanced: false })).toBe(false);
  });

  it('combines conditions with AND', () => {
    expect(matchesHand(opener, { hcp: { min: 15, max: 17 }, balanced: true, suit: { S: { min: 4 } } })).toBe(true);
    expect(matchesHand(opener, { hcp: { min: 15, max: 17 }, suit: { S: { min: 5 } } })).toBe(false);
  });

  it('checks Kaplan-Rubens points (opener is 14.45 K&R)', () => {
    // AK52 K93 Q84 K76 evaluates to 14.45 K&R (verified vs reference calculator).
    expect(matchesHand(opener, { knr: { min: 14, max: 15 } })).toBe(true);
    expect(matchesHand(opener, { knr: { min: 15 } })).toBe(false);
    expect(matchesHand(opener, { knr: { max: 14 } })).toBe(false);
  });
});

describe('matchesDeal', () => {
  // A fixed deal: N gets a strong balanced hand.
  const deal = dealFromDeck([
    ...hand({ S: 'AK52', H: 'K93', D: 'Q84', C: 'K76' }), // N: 15 HCP, balanced
    ...hand({ S: 'QJT', H: 'AQ', D: 'AKJ', C: 'AQJ95' }), // E
    ...hand({ S: '987', H: 'JT8765', D: '32', C: '43' }), // S: 1 HCP, 6 hearts
    ...hand({ S: '643', H: '42', D: 'T9765', C: 'T82' }), // W
  ]);

  it('applies per-seat constraints', () => {
    expect(matchesDeal(deal, { hands: { N: { hcp: { min: 15, max: 17 }, balanced: true } } })).toBe(true);
    expect(matchesDeal(deal, { hands: { N: { hcp: { min: 18 } } } })).toBe(false);
    expect(matchesDeal(deal, { hands: { S: { suit: { H: { min: 6 } } } } })).toBe(true);
  });

  it('applies partnership HCP totals', () => {
    const set: ConstraintSet = { partnership: { NS: { hcp: { min: 18, max: 22 } } } };
    // N=15, S has J + no other honors -> 1 HCP; total 16, outside 18..22
    expect(matchesDeal(deal, set)).toBe(false);
    expect(matchesDeal(deal, { partnership: { NS: { hcp: { max: 17 } } } })).toBe(true);
  });
});

describe('isEmptyConstraintSet', () => {
  it('recognises empty and non-empty sets', () => {
    expect(isEmptyConstraintSet({})).toBe(true);
    expect(isEmptyConstraintSet({ hands: {} })).toBe(true);
    expect(isEmptyConstraintSet({ hands: { N: { hcp: { min: 12 } } } })).toBe(false);
    expect(isEmptyConstraintSet({ partnership: { EW: { hcp: { min: 20 } } } })).toBe(false);
  });
});
