/**
 * Parse a compact points-filter expression into a {min, max} range.
 *
 * Accepted syntax (decimals allowed, for fractional K&R):
 *   ""        no constraint
 *   "12"      exactly 12        → { min: 12, max: 12 }
 *   "10+"     at least 10       → { min: 10 }
 *   "11-"     at most 11        → { max: 11 }
 *   "12-14"   between 12 and 14 → { min: 12, max: 14 }
 */

export interface ParsedRange {
  min?: number;
  max?: number;
}

export interface RangeParseResult {
  /** Present when the expression is non-empty and valid. */
  range?: ParsedRange;
  /** Present when the expression is malformed. */
  error?: string;
}

const NUM = '\\d+(?:\\.\\d+)?';

export function parseRangeExpr(raw: string): RangeParseResult {
  const text = raw.trim();
  if (text === '') return {};

  let m = text.match(new RegExp(`^(${NUM})\\s*\\+$`));
  if (m) return { range: { min: Number.parseFloat(m[1]) } };

  m = text.match(new RegExp(`^(${NUM})\\s*-$`));
  if (m) return { range: { max: Number.parseFloat(m[1]) } };

  m = text.match(new RegExp(`^(${NUM})\\s*-\\s*(${NUM})$`));
  if (m) {
    const min = Number.parseFloat(m[1]);
    const max = Number.parseFloat(m[2]);
    if (min > max) return { error: `"${text}": minimum is greater than maximum` };
    return { range: { min, max } };
  }

  m = text.match(new RegExp(`^(${NUM})$`));
  if (m) {
    const v = Number.parseFloat(m[1]);
    return { range: { min: v, max: v } };
  }

  return { error: `"${text}" isn't a valid filter (try 12, 10+, 11-, or 12-14)` };
}
