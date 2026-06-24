import { describe, it, expect } from 'vitest';
import { parseRangeExpr } from '../src/ui/range';

describe('parseRangeExpr', () => {
  it('treats blank as no constraint', () => {
    expect(parseRangeExpr('')).toEqual({});
    expect(parseRangeExpr('   ')).toEqual({});
  });

  it('parses an exact value', () => {
    expect(parseRangeExpr('12')).toEqual({ range: { min: 12, max: 12 } });
  });

  it('parses a minimum with +', () => {
    expect(parseRangeExpr('10+')).toEqual({ range: { min: 10 } });
    expect(parseRangeExpr('10 +')).toEqual({ range: { min: 10 } });
  });

  it('parses a maximum with trailing -', () => {
    expect(parseRangeExpr('11-')).toEqual({ range: { max: 11 } });
  });

  it('parses a min-max range', () => {
    expect(parseRangeExpr('12-14')).toEqual({ range: { min: 12, max: 14 } });
    expect(parseRangeExpr('12 - 14')).toEqual({ range: { min: 12, max: 14 } });
  });

  it('supports decimals for K&R', () => {
    expect(parseRangeExpr('20.5+')).toEqual({ range: { min: 20.5 } });
    expect(parseRangeExpr('13.5-15.5')).toEqual({ range: { min: 13.5, max: 15.5 } });
  });

  it('rejects an inverted range', () => {
    expect(parseRangeExpr('14-12').error).toBeTruthy();
  });

  it('rejects nonsense', () => {
    expect(parseRangeExpr('abc').error).toBeTruthy();
    expect(parseRangeExpr('1+2').error).toBeTruthy();
  });
});
