import { describe, it, expect } from 'vitest';
import { handToPBN, dealToPBN, handToText } from '../src/engine/format';
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

describe('PBN formatting', () => {
  it('renders a hand as spades.hearts.diamonds.clubs, high to low', () => {
    expect(handToPBN(hand({ S: 'AK52', H: 'K93', D: 'Q84', C: 'KT76' }))).toBe('AK52.K93.Q84.KT76');
  });

  it('renders a void as an empty segment', () => {
    expect(handToPBN(hand({ S: 'AKQJT98765432' }))).toBe('AKQJT98765432...');
  });

  it('renders a full deal starting from the named seat', () => {
    const deal = dealFromDeck([
      ...hand({ S: 'AK52', H: 'K93', D: 'Q84', C: 'K76' }),
      ...hand({ S: 'QJT', H: 'AQ', D: 'AKJ', C: 'AQJ95' }),
      ...hand({ S: '987', H: 'JT8765', D: '32', C: '43' }),
      ...hand({ S: '643', H: '42', D: 'T9765', C: 'T82' }),
    ]);
    const pbn = dealToPBN(deal, 'N');
    expect(pbn.startsWith('N:')).toBe(true);
    expect(pbn.split(' ').length).toBe(4);
    expect(pbn.split(' ')[0]).toBe('N:AK52.K93.Q84.K76');
  });
});

describe('text formatting', () => {
  it('shows each suit with a symbol and a dash for voids', () => {
    const text = handToText(hand({ S: 'AK', H: '', D: 'QJT', C: '2' }));
    expect(text).toContain('♠ AK');
    expect(text).toContain('♥ —');
    expect(text).toContain('♦ QJT');
  });
});
