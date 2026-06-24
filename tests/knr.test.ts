import { describe, it, expect } from 'vitest';
import { knrPoints } from '../src/engine/knr';
import { parseHandString } from '../src/engine/parse';

function knr(handStr: string): number {
  const r = parseHandString(handStr);
  expect(r.errors).toEqual([]);
  expect(r.length).toBe(13);
  return knrPoints(r.cards);
}

describe('knrPoints', () => {
  // Ground-truth values from Jeff Goldsmith's reference K&R calculator
  // (https://www.jeff-goldsmith.com/cgi-bin/knr.cgi).
  it('matches the reference calculator on verified hands', () => {
    expect(knr('AKQ52 K9 Q84 K76')).toBe(17.35);
    expect(knr('KQJT9 AQ9 J32 T2')).toBe(13.6);
    expect(knr('AK32 Q32 J32 432')).toBe(8.95);
  });

  it('gives -0.5 for a 4-3-3-3 Yarborough (the documented minimum)', () => {
    expect(knr('8642 753 642 532')).toBe(-0.5);
  });

  it('values a void via short-suit and length rules (reference 17.25)', () => {
    // Void hearts; the void contributes +3 before the global -1.
    expect(knr('AKQ52 - Q843 K762')).toBe(17.25);
  });

  it('produces values in 0.05 increments', () => {
    const v = knr('AJ732 KT4 Q95 J8');
    expect(Math.round(v * 20)).toBeCloseTo(v * 20, 9);
  });
});
