import { describe, expect, it } from 'vitest';
import {
  parseCsv,
  checkAuction,
  classifyCall,
  contextLabel,
  featuresFromPbn,
  relVul,
  histStats,
  minLenAtCoverage,
  classifyPair,
  PairOpenings,
  median,
} from '../research/bidding/lib';

describe('parseCsv', () => {
  it('parses plain rows', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });
  it('handles quoted fields with commas and doubled quotes', () => {
    expect(parseCsv('a,"b,c","say ""hi"""\n')).toEqual([['a', 'b,c', 'say "hi"']]);
  });
  it('handles CRLF', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('checkAuction', () => {
  // Seats: dealer index 0 = N. Calls rotate N,E,S,W.
  it('accepts a simple complete auction', () => {
    const r = checkAuction(['1H', 'P', '2H', 'P', '4H', 'P', 'P', 'P'], 0, '4H', 0, 0);
    expect(r.ok).toBe(true);
  });
  it('accepts a truncated closing pass (site quirk)', () => {
    const r = checkAuction(['1H', 'P', '2H', 'P', '4H', 'P', 'P'], 0, '4H', 0, 0);
    expect(r.ok).toBe(true);
  });
  it('derives declarer as first of winning side to name the strain', () => {
    // N opens 1NT, S transfers with 2H, N completes 2S: declarer is N.
    const calls = ['1NT', 'P', '2H', 'P', '2S', 'P', 'P', 'P'];
    expect(checkAuction(calls, 0, '2S', 0, 0).ok).toBe(true);
    expect(checkAuction(calls, 0, '2S', 0, 2).ok).toBe(false);
  });
  it('validates doubling state', () => {
    const calls = ['1S', 'X', 'P', 'P', 'P'];
    expect(checkAuction(calls, 0, '1S', 1, 0).ok).toBe(true);
    expect(checkAuction(calls, 0, '1S', 0, 0).ok).toBe(false);
  });
  it('rejects junk tokens', () => {
    expect(checkAuction(['1H', 'CA', 'P', 'P', 'P'], 0, '1H', 0, 0).ok).toBe(false);
  });
  it('rejects insufficient bids', () => {
    expect(checkAuction(['1S', '1H', 'P', 'P', 'P'], 0, '1H', 0, 1).ok).toBe(false);
  });
  it('rejects a double of partner', () => {
    expect(checkAuction(['1S', 'P', 'X', 'P', 'P', 'P'], 0, '1S', 1, 0).ok).toBe(false);
  });
  it('rejects redouble by the doubling side', () => {
    expect(checkAuction(['1S', 'X', 'XX', 'P', 'P', 'P'], 0, '1S', 2, 0).ok).toBe(true);
    expect(checkAuction(['1S', 'X', 'P', 'XX', 'P', 'P', 'P'], 0, '1S', 2, 0).ok).toBe(false);
  });
  it('rejects calls after three closing passes', () => {
    expect(checkAuction(['1H', 'P', 'P', 'P', '1S'], 0, '1S', 0, 3).ok).toBe(false);
  });
});

describe('classifyCall', () => {
  it('classifies openings by seat', () => {
    expect(classifyCall(['1C'], 0)).toMatchObject({ family: 'open', key: 'seat1', action: '1C' });
    expect(classifyCall(['P', 'P', '1C'], 2)).toMatchObject({
      family: 'open',
      key: 'seat3',
      action: '1C',
    });
    expect(classifyCall(['P', 'P', 'P', '1S'], 3)).toMatchObject({ family: 'open', key: 'seat4' });
    // A pass is also an "opening decision".
    expect(classifyCall(['P', 'P'], 1)).toMatchObject({ family: 'open', key: 'seat2', action: 'P' });
  });
  it('classifies direct actions over an opening', () => {
    expect(classifyCall(['1C', '1H'], 1)).toMatchObject({
      family: 'overOpen',
      key: '1C',
      action: '1H',
      passedHand: false,
    });
    expect(classifyCall(['P', 'P', 'P', '1C', 'X'], 4)).toMatchObject({
      family: 'overOpen',
      key: '1C',
      action: 'X',
      passedHand: true,
    });
  });
  it('classifies balancing', () => {
    expect(classifyCall(['1S', 'P', 'P', 'X'], 3)).toMatchObject({
      family: 'balance',
      key: '1S',
      action: 'X',
    });
  });
  it('classifies responses with and without interference', () => {
    expect(classifyCall(['1C', 'P', '1H'], 2)).toMatchObject({
      family: 'resp',
      key: '1C',
      action: '1H',
    });
    expect(classifyCall(['1S', '2H', 'X'], 2)).toMatchObject({
      family: 'respInterf',
      key: '1S|2H',
      action: 'X',
    });
    expect(classifyCall(['1C', 'X', 'XX'], 2)).toMatchObject({
      family: 'respInterf',
      key: '1C|X',
      action: 'XX',
    });
  });
  it('classifies advances and sandwich actions', () => {
    expect(classifyCall(['1C', '1H', 'P', '1S'], 3)).toMatchObject({
      family: 'advance',
      key: '1C|1H|P',
      action: '1S',
    });
    expect(classifyCall(['1C', 'X', '2C', '2H'], 3)).toMatchObject({
      family: 'advance',
      key: '1C|X|2C',
      action: '2H',
    });
    expect(classifyCall(['1C', 'P', '1H', 'X'], 3)).toMatchObject({
      family: 'sandwich',
      key: '1C|1H',
      action: 'X',
    });
  });
  it('returns null for later auction rounds', () => {
    expect(classifyCall(['1H', 'P', '2H', 'P', '4H'], 4)).toBeNull();
  });
  it('labels contexts readably', () => {
    expect(contextLabel(classifyCall(['1C', '1H'], 1)!)).toBe('(1C) 1H');
    expect(contextLabel(classifyCall(['1S', '2H', 'X'], 2)!)).toBe('1S (2H) X');
    expect(contextLabel(classifyCall(['1S', 'P', 'P', 'X'], 3)!)).toBe('(1S) P (P) X');
  });
});

describe('relVul', () => {
  it('maps absolute vulnerability to the acting seat', () => {
    expect(relVul('N-S', 0)).toBe('we');
    expect(relVul('N-S', 1)).toBe('they');
    expect(relVul('E-W', 2)).toBe('they');
    expect(relVul('E-W', 3)).toBe('we');
    expect(relVul('All', 0)).toBe('both');
    expect(relVul('None', 1)).toBe('none');
  });
});

describe('featuresFromPbn', () => {
  const pbn = 'N:KJ5.KQJ754.KT4.A T963.A.J52.K9654 Q74.T86.A98.QJ87 A82.932.Q763.T32';
  it('computes HCP, lengths, suit quality, balance', () => {
    const f = featuresFromPbn(pbn);
    expect(f.map((x) => x.hcp).reduce((a, b) => a + b, 0)).toBe(40);
    expect(f[0].hcp).toBe(17);
    expect(f[0].len).toEqual([3, 6, 3, 1]); // ♠3 ♥6 ♦3 ♣1
    expect(f[0].akq).toEqual([1, 2, 1, 1]);
    expect(f[0].balanced).toBe(false);
    expect(f[3].balanced).toBe(true); // 3=3=4=3
  });
});

describe('histogram stats', () => {
  it('computes percentiles on discrete histograms', () => {
    const hist = new Uint32Array(38);
    for (let hcp = 8; hcp <= 16; hcp++) hist[hcp] = 10;
    const st = histStats(hist);
    expect(st.n).toBe(90);
    expect(st.min).toBe(8);
    expect(st.max).toBe(16);
    expect(st.p[3]).toBe(12); // median
  });
  it('derives a coverage-based minimum length', () => {
    const hist = new Uint32Array(14);
    hist[4] = 5;
    hist[5] = 70;
    hist[6] = 25;
    expect(minLenAtCoverage(hist, 0.9)).toBe(5);
    expect(minLenAtCoverage(hist, 0.999)).toBe(4);
  });
});

describe('classifyPair', () => {
  it('spots a strong club', () => {
    const po = new PairOpenings();
    po.hcp1C = [16, 17, 18, 16, 19, 17, 16, 20];
    po.clubs1C = [2, 3, 1, 4, 2, 3, 2, 5];
    expect(classifyPair(po).oneClub).toBe('strong');
    expect(classifyPair(po).naturalBase).toBe(false);
  });
  it('spots a natural club and natural base', () => {
    const po = new PairOpenings();
    po.hcp1C = [12, 13, 11, 14, 12, 15, 13, 12];
    po.clubs1C = [4, 3, 5, 3, 4, 6, 3, 5];
    po.dia1D = [4, 5, 3, 4, 6, 4];
    const s = classifyPair(po);
    expect(s.oneClub).toBe('natural');
    expect(s.oneDiamond).toBe('natural');
    expect(s.naturalBase).toBe(true);
  });
  it('median works for even counts', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});
