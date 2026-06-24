import { describe, it, expect } from 'vitest';
import { evaluateSpec } from '../src/engine/evaluate';
import { exactShape } from '../src/engine/hand';
import { parseHandSpec } from '../src/engine/parse';

function ev(str: string) {
  const r = parseHandSpec(str);
  expect(r.errors).toEqual([]);
  return evaluateSpec(r.spec);
}

describe('evaluateSpec', () => {
  it('computes HCP, exact shape and K&R for a fully specified hand', () => {
    const e = ev('AK52 K93 Q84 K76');
    expect(e.hcp).toBe(15);
    expect(e.length).toBe(13);
    expect(exactShape(e.lengths)).toBe('4=3=3=3');
    expect(e.knr).toBe(14.45); // matches reference calculator
  });

  it('evaluates a spec with x small cards independently of which small cards', () => {
    // "AKxxx Kx Qxx Axx" — same honors/lengths as AK762.K3.Q53.A74 (16.65 K&R).
    const e = ev('AKxxx Kx Qxx Axx');
    expect(e.hcp).toBe(16);
    expect(e.length).toBe(13);
    expect(exactShape(e.lengths)).toBe('5=2=3=3');
    expect(e.knr).toBe(16.65);
  });

  it('reports exact shape in suit order, not sorted', () => {
    const e = ev('Kx AKQxx xx Axxx'); // 2=5=2=4
    expect(exactShape(e.lengths)).toBe('2=5=2=4');
  });

  it('returns null K&R when a suit asks for more small cards than exist', () => {
    const e = ev('xxxxxxx AK Qx xx'); // 7 x in spades is unrealisable
    expect(e.knr).toBeNull();
  });
});
