import { describe, it, expect } from 'vitest';
import {
  parseSuitHolding,
  parseHandHoldings,
  parseHandString,
  parseHandSpec,
} from '../src/engine/parse';
import { suitOf, rankOf, SUITS } from '../src/engine/cards';

describe('parseSuitHolding', () => {
  it('parses ranks high or low, ignoring spaces and commas', () => {
    const r = parseSuitHolding('S', 'A K, Q 5 2');
    expect(r.errors).toEqual([]);
    expect(r.cards.map(rankOf)).toEqual([14, 13, 12, 5, 2]);
    expect(r.cards.every((c) => suitOf(c) === 'S')).toBe(true);
  });

  it('accepts both T and 10 for the ten', () => {
    expect(parseSuitHolding('H', 'T').cards.map(rankOf)).toEqual([10]);
    expect(parseSuitHolding('H', '10').cards.map(rankOf)).toEqual([10]);
    expect(parseSuitHolding('H', 'AKQJ10').cards.map(rankOf)).toEqual([14, 13, 12, 11, 10]);
  });

  it('is case-insensitive', () => {
    expect(parseSuitHolding('D', 'akq').cards.map(rankOf)).toEqual([14, 13, 12]);
  });

  it('reports invalid characters', () => {
    const r = parseSuitHolding('C', 'AKX');
    expect(r.cards.map(rankOf)).toEqual([14, 13]);
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toContain('"X"');
  });

  it('reports a rank listed twice', () => {
    const r = parseSuitHolding('C', 'AA');
    expect(r.cards.map(rankOf)).toEqual([14]);
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toContain('twice');
  });
});

describe('parseHandHoldings', () => {
  it('combines four suits and reports the total length', () => {
    const r = parseHandHoldings({ S: 'AK52', H: 'K93', D: 'Q84', C: 'K76' });
    expect(r.errors).toEqual([]);
    expect(r.length).toBe(13);
    expect(r.cards.length).toBe(13);
  });

  it('treats a missing suit as a void', () => {
    const r = parseHandHoldings({ S: 'AKQJT98765432' });
    expect(r.length).toBe(13);
  });

  it('collects errors from every suit', () => {
    const r = parseHandHoldings({ S: 'AX', H: 'KK' });
    expect(r.errors.length).toBe(2);
  });
});

describe('parseHandString', () => {
  it('parses four space-separated holdings in S H D C order', () => {
    const r = parseHandString('AKQ52 K9 Q84 K76');
    expect(r.errors).toEqual([]);
    expect(r.length).toBe(13);
    const lengthBySuit = Object.fromEntries(SUITS.map((s) => [s, 0]));
    for (const c of r.cards) lengthBySuit[suitOf(c)]++;
    expect(lengthBySuit).toEqual({ S: 5, H: 2, D: 3, C: 3 });
  });

  it('treats a dash as a void', () => {
    const r = parseHandString('AKQ52 - Q84 KJ765');
    expect(r.errors).toEqual([]);
    expect(r.length).toBe(13);
    expect(r.cards.filter((c) => suitOf(c) === 'H').length).toBe(0);
  });

  it('reports when there are not four suits', () => {
    const r = parseHandString('AKQ52 K9 Q84');
    expect(r.errors.some((e) => e.includes('four suits'))).toBe(true);
  });

  it('is empty for blank input', () => {
    expect(parseHandString('   ')).toEqual({ cards: [], errors: [], length: 0 });
  });

  it('surfaces invalid ranks from a suit token', () => {
    const r = parseHandString('AKQ52 K9 Q8X K76');
    expect(r.errors.some((e) => e.includes('"X"'))).toBe(true);
  });
});

describe('parseHandSpec', () => {
  it('counts x as small-card placeholders and sums the length', () => {
    const r = parseHandSpec('AKxxx Kx Qxx Axx');
    expect(r.errors).toEqual([]);
    expect(r.length).toBe(13);
    expect(r.spec.S).toEqual({ ranks: [14, 13], x: 3 });
    expect(r.spec.H).toEqual({ ranks: [13], x: 1 });
  });

  it('handles a void and mixed explicit/x holdings', () => {
    const r = parseHandSpec('AKQJ987 - KQxx Tx');
    expect(r.errors).toEqual([]);
    expect(r.spec.H).toEqual({ ranks: [], x: 0 }); // void
    expect(r.spec.D).toEqual({ ranks: [13, 12], x: 2 });
    expect(r.length).toBe(7 + 0 + 4 + 2);
  });

  it('still flags genuinely invalid ranks', () => {
    const r = parseHandSpec('AKZ Kx Qxx Axxxx');
    expect(r.errors.some((e) => e.includes('"Z"'))).toBe(true);
  });
});
