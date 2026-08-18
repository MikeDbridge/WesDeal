import { describe, expect, it } from 'vitest';
import { rawScore, nsScore, declarerVul, toImps } from '../research/bidding/score';

// Strain index: 0=♠ 1=♥ 2=♦ 3=♣ 4=NT. (Validated 100% against 40,709 real
// scored deals; these lock the canonical cases.)
describe('rawScore', () => {
  it('part-scores and games', () => {
    expect(rawScore(4, 1, 0, 10, false)).toBe(420); // 4♥= nonvul
    expect(rawScore(4, 1, 0, 10, true)).toBe(620); // 4♥= vul
    expect(rawScore(3, 4, 0, 9, false)).toBe(400); // 3NT= nonvul
    expect(rawScore(3, 4, 0, 9, true)).toBe(600); // 3NT= vul
    expect(rawScore(2, 1, 0, 8, false)).toBe(110); // 2♥= part-score
    expect(rawScore(1, 4, 0, 8, false)).toBe(120); // 1NT+1 nonvul
  });
  it('slams', () => {
    expect(rawScore(6, 1, 0, 12, true)).toBe(1430); // 6♥= vul
    expect(rawScore(7, 4, 0, 13, false)).toBe(1520); // 7NT= nonvul
  });
  it('doubled makes', () => {
    expect(rawScore(4, 0, 1, 10, false)).toBe(590); // 4♠x= nonvul
    expect(rawScore(4, 0, 1, 11, false)).toBe(690); // 4♠x+1 nonvul (100 doubled OT)
    expect(rawScore(4, 0, 2, 10, false)).toBe(880); // 4♠xx= nonvul (480+300+100)
  });
  it('undertricks', () => {
    expect(rawScore(1, 0, 0, 6, false)).toBe(-50); // 1♠−1 nonvul
    expect(rawScore(1, 0, 0, 6, true)).toBe(-100); // 1♠−1 vul
    expect(rawScore(3, 4, 1, 6, false)).toBe(-500); // 3NTx−3 nonvul (100/200/200)
    expect(rawScore(3, 4, 1, 6, true)).toBe(-800); // 3NTx−3 vul (200/300/300)
    expect(rawScore(3, 4, 2, 6, false)).toBe(-1000); // redoubled = 2×
  });
});

describe('nsScore + declarerVul', () => {
  it('signs by declarer side and vulnerability', () => {
    expect(declarerVul('N-S', 'N')).toBe(true);
    expect(declarerVul('N-S', 'E')).toBe(false);
    expect(declarerVul('All', 'W')).toBe(true);
    expect(nsScore(4, 1, 0, 10, 'None', 'N')).toBe(420); // NS declares → +
    expect(nsScore(4, 1, 0, 10, 'None', 'E')).toBe(-420); // EW declares → NS view negative
  });
});

describe('toImps', () => {
  it('follows the standard scale', () => {
    expect(toImps(0)).toBe(0);
    expect(toImps(10)).toBe(0);
    expect(toImps(20)).toBe(1);
    expect(toImps(420)).toBe(9);
    expect(toImps(620)).toBe(12);
    expect(toImps(-50)).toBe(-2); // 50 points = 2 IMPs
    expect(toImps(1430)).toBe(16);
    expect(toImps(4000)).toBe(24);
  });
});
