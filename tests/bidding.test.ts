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
  maxLenAtCoverage,
  classifyPair,
  PairOpenings,
  median,
  bottomTeams,
  theirLenBucket,
  hcpBand,
  Agg,
  deriveSuitBidRule,
  deriveDoubleRule,
  deriveNtRule,
  type SeatFeatures,
  type MatchVp,
} from '../research/bidding/lib';
import { compileFilter, type HandContext } from '../src/engine/filter';

/** Build SeatFeatures from suit lengths + hcp (stoppers/akq optional). */
function feat(
  len: [number, number, number, number],
  hcp: number,
  opts: { akq?: number[]; stop?: boolean[] } = {},
): SeatFeatures {
  const sorted = [...len].sort((a, b) => b - a);
  return {
    hcp,
    len,
    akq: opts.akq ?? [1, 1, 1, 1],
    stop: opts.stop ?? [false, false, false, false],
    balanced: sorted[3] >= 2 && sorted[0] <= 5 && !(sorted[0] === 5 && sorted[1] === 4),
  };
}

/** Evaluate a compiled filter expression against a simple hand. */
function passes(expr: string, len: [number, number, number, number], hcp: number, mask?: number[]): boolean {
  const r = compileFilter(expr);
  if (r.error || !r.filter) throw new Error(`bad expr: ${expr} — ${r.error}`);
  const ctx: HandContext = { hcp, knr: 0, controls: 0, len, mask: mask ?? [0, 0, 0, 0] };
  return r.filter.predicate(ctx);
}

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

describe('coverage helpers', () => {
  it('maxLenAtCoverage returns the smallest sufficient cap', () => {
    const hist = new Uint32Array(14);
    hist[1] = 10;
    hist[2] = 80;
    hist[3] = 10;
    expect(maxLenAtCoverage(hist, 0.9)).toBe(2);
    expect(maxLenAtCoverage(hist, 0.95)).toBe(3);
  });
  it('buckets and bands', () => {
    expect([0, 1, 2, 3, 4, 5].map(theirLenBucket)).toEqual([0, 0, 1, 2, 3, 3]);
    expect([8, 10, 11, 13, 14, 16, 17, 25].map(hcpBand)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});

describe('bottomTeams', () => {
  it('flags the k weakest teams by average RR VP', () => {
    const rows: MatchVp[] = [];
    const teams = ['A', 'B', 'C', 'D'];
    const strength: Record<string, number> = { A: 15, B: 12, C: 8, D: 5 };
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        rows.push({
          tournament: 't',
          event: 'OPEN',
          stage: 'RR',
          home: teams[i],
          away: teams[j],
          vpHome: strength[teams[i]],
          vpAway: strength[teams[j]],
        });
      }
    }
    // KO rows must be ignored.
    rows.push({ tournament: 't', event: 'OPEN', stage: 'FF', home: 'D', away: 'A', vpHome: null, vpAway: null });
    const weak = bottomTeams(rows, 2);
    expect(weak.has('t|OPEN|D')).toBe(true);
    expect(weak.has('t|OPEN|C')).toBe(true);
    expect(weak.has('t|OPEN|A')).toBe(false);
  });
});

describe('Agg cross-tabs and anatomy', () => {
  it('tracks hcp by their-suit length and stoppers', () => {
    const agg = new Agg();
    agg.add(feat([5, 2, 3, 3], 8, { stop: [false, true, false, false] }), 0, 1, false);
    agg.add(feat([5, 4, 2, 2], 13), 0, 1, false);
    expect(agg.theirN).toBe(2);
    expect(agg.theirStop).toBe(1);
    const short = histStats(agg.hcpForBuckets([0, 1])); // ≤2 hearts
    const long = histStats(agg.hcpForBuckets([2, 3]));
    expect(short.n).toBe(1);
    expect(short.p[3]).toBe(8);
    expect(long.n).toBe(1);
    expect(long.p[3]).toBe(13);
  });
  it('tracks double anatomy per band (major opened → other major + both minors)', () => {
    const agg = new Agg();
    agg.add(feat([4, 1, 4, 4], 12), null, 1, true); // (1H) X classic shape
    agg.add(feat([2, 4, 4, 3], 18), null, 1, true); // strong offshape
    expect([...agg.xBandN!]).toEqual([0, 1, 0, 1]);
    expect(agg.xMajMin![1 * 8 + 4]).toBe(1); // band 11-13: spades 4
    expect(agg.xMajMin![3 * 8 + 2]).toBe(1); // band 17+: spades 2
    expect(agg.xMinorMin![1 * 8 + 4]).toBe(1); // min(d,c)=4
    expect(agg.xMinorMin![3 * 8 + 3]).toBe(1);
  });
  it('mergeFrom combines every part', () => {
    const a = new Agg();
    const b = new Agg();
    a.add(feat([5, 2, 3, 3], 10), 0, 2, false);
    b.add(feat([5, 3, 2, 3], 12), 0, 2, false);
    b.add(feat([4, 1, 4, 4], 17), null, 2, true);
    a.mergeFrom(b);
    expect(a.n).toBe(3);
    expect(a.theirN).toBe(3);
    expect(a.xBandN![3]).toBe(1);
    expect(histStats(a.hcpForBuckets([0, 1, 2, 3])).n).toBe(3);
  });
});

describe('rule derivation', () => {
  it('suit-bid rule splits shortage from length and compiles', () => {
    const agg = new Agg();
    // 30 light overcalls short in their suit (♦), 30 sounder with length.
    for (let i = 0; i < 30; i++) {
      agg.add(feat([5, 3, 2, 3], 8 + (i % 3), { akq: [1, 0, 0, 0] }), 0, 2, false);
      agg.add(feat([5, 2, 3, 3], 11 + (i % 4), { akq: [2, 0, 0, 0] }), 0, 2, false);
    }
    const rule = deriveSuitBidRule(agg, 0, 2);
    expect(rule.common).toContainEqual({ suit: 0, min: 5 });
    expect(rule.anyOf.length).toBe(2);
    expect(rule.quality).toEqual({ suit: 0, minTop3: 1 });
    // Short in diamonds and light → in; long and light → out; long and sound → in.
    const aceOfSpades = [1 << 12, 0, 0, 0];
    expect(passes(rule.filterExpr, [5, 3, 2, 3], 8, aceOfSpades)).toBe(true);
    expect(passes(rule.filterExpr, [5, 2, 3, 3], 8, aceOfSpades)).toBe(false);
    expect(passes(rule.filterExpr, [5, 2, 3, 3], 12, aceOfSpades)).toBe(true);
    // No spade honour → out (quality).
    expect(passes(rule.filterExpr, [5, 3, 2, 3], 9, [0, 0, 0, 0])).toBe(false);
  });
  it('double rule has shape branches and a shape-free strong branch', () => {
    const agg = new Agg();
    for (let i = 0; i < 40; i++) agg.add(feat([4, 1, 4, 4], 11 + (i % 5)), null, 1, true);
    for (let i = 0; i < 5; i++) agg.add(feat([2, 3, 4, 4], 18 + (i % 3)), null, 1, true);
    const rule = deriveDoubleRule(agg, 1);
    expect(rule.anyOf.length).toBeGreaterThanOrEqual(2);
    expect(rule.anyOf.at(-1)!.suit).toBeUndefined(); // strength branch is shape-free
    // Classic shape, moderate points → in.
    expect(passes(rule.filterExpr, [4, 1, 4, 4], 12)).toBe(true);
    // Flat with their-suit length, moderate → out; same hand very strong → in.
    expect(passes(rule.filterExpr, [2, 4, 4, 3], 12)).toBe(false);
    expect(passes(rule.filterExpr, [2, 4, 4, 3], 19)).toBe(true);
  });
  it('double rule splits shortage from length when the floors differ', () => {
    const agg = new Agg();
    // Short in theirs: light takeout doubles; 3 cards in theirs: sound ones.
    for (let i = 0; i < 30; i++) agg.add(feat([4, 1, 4, 4], 10 + (i % 4)), null, 1, true);
    for (let i = 0; i < 30; i++) agg.add(feat([4, 3, 3, 3], 14 + (i % 3)), null, 1, true);
    for (let i = 0; i < 6; i++) agg.add(feat([3, 3, 4, 3], 19), null, 1, true);
    const rule = deriveDoubleRule(agg, 1);
    expect(rule.anyOf.length).toBe(3);
    // Light with shortage → in; light with 3-card length → out; sound length → in.
    expect(passes(rule.filterExpr, [4, 1, 4, 4], 10)).toBe(true);
    expect(passes(rule.filterExpr, [4, 3, 3, 3], 10)).toBe(false);
    expect(passes(rule.filterExpr, [4, 3, 3, 3], 14)).toBe(true);
  });
  it('NT rule demands the stopper when the data does', () => {
    const agg = new Agg();
    for (let i = 0; i < 30; i++) {
      agg.add(feat([3, 3, 3, 4], 15 + (i % 3), { stop: [false, true, false, false] }), 4, 1, false);
    }
    const rule = deriveNtRule(agg, 1);
    expect(rule.stopper).toBe(1);
    expect(rule.balanced).toBe(true);
    // Ace of hearts (bit 12 of mask[1]) satisfies has(h,a).
    expect(passes(rule.filterExpr, [3, 3, 3, 4], 15, [0, 1 << 12, 0, 0])).toBe(true);
    expect(passes(rule.filterExpr, [3, 3, 3, 4], 15, [0, 0, 0, 0])).toBe(false);
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
