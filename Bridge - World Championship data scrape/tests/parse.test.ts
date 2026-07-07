import { describe, expect, it } from 'vitest';
import { parseBoardAcrossDeal, parseBoardQboards, parseHands, parseKoSegment, parseMatchIds, parseMatchMeta, parseResults, parseRoundSpec } from '../parse';
import handsHtml from './fixtures/handsacross-2550-r1.html?raw';
import roundHtml from './fixtures/roundteams-2550-r1.html?raw';
import boardHtml from './fixtures/boarddetails-153336.html?raw';
import koPhaseHtml from './fixtures/knockoutphase-2554-qf.html?raw';
import koBoardHtml from './fixtures/boarddetailsko-153642-qf.html?raw';
import mar23DealHtml from './fixtures/boardacross-2350-b1.html?raw';
import mar23BoardHtml from './fixtures/boarddetails-2350-112644.html?raw';
import mar23KoDealHtml from './fixtures/boardacrossko-2354-qf-b1.html?raw';
import mar23KoBoardHtml from './fixtures/boarddetailsko-2354-113816.html?raw';

describe('parseHands', () => {
  const hands = parseHands(handsHtml);

  it('finds all 14 boards of the round', () => {
    expect(hands.size).toBe(14);
    expect([...hands.keys()].sort((a, b) => a - b)).toEqual([...Array(14)].map((_, i) => i + 1));
  });

  it('parses board 1 deal, dealer and vulnerability', () => {
    const b1 = hands.get(1)!;
    expect(b1.dealer).toBe('N');
    expect(b1.vul).toBe('None');
    // Compass grid: N top, W mid-left, E mid-right, S bottom → PBN in N E S W.
    expect(b1.pbn).toBe('N:KJ72.T8.76.T8652 A986.AQ52.AJ8.Q9 Q43.J4.KT93.AKJ3 T5.K9763.Q542.74');
  });

  it('represents voids as an empty suit', () => {
    expect(hands.get(3)!.pbn.split(' ')[1]).toBe('.AK94.KQJT93.T83'); // board 3 East, spade void
    expect(hands.get(9)!.pbn.split(' ')[0]).toBe('N:.AT97654.JT98.T4'); // board 9 North, spade void
  });
});

describe('parseMatchIds / parseKoSegment', () => {
  it('lists the 12 round-robin matches', () => {
    const ids = parseMatchIds(roundHtml);
    expect(ids.length).toBe(12);
    expect(ids[0]).toBe(153334);
  });
  it('lists KO match-segment ids and reads a segment number', () => {
    expect(parseMatchIds(koPhaseHtml).length).toBeGreaterThan(10);
    expect(parseKoSegment(koBoardHtml)).toBe(1);
  });
});

describe('parseMatchMeta (round-robin)', () => {
  const m = parseMatchMeta(boardHtml);

  it('reads teams, VP and IMP', () => {
    expect(m.home).toEqual({ name: 'USA1', id: 1002 });
    expect(m.away).toEqual({ name: 'ARGENTINA', id: 1014 });
    expect(m.vpHome).toBeCloseTo(4.34);
    expect(m.vpAway).toBeCloseTo(15.66);
    expect(m.impHome).toBe(3);
    expect(m.impAway).toBe(25);
  });

  it('places the eight players by room and seat', () => {
    expect(m.open.N?.name).toBe('HURD John');
    expect(m.open.E?.name).toBe('RIZZO Leonardo');
    expect(m.open.S?.name).toBe('BATHURST Kevin');
    expect(m.open.W?.name).toBe('CLOPPET Marcelo');
    expect(m.closed.N?.name).toBe('PELLEGRINI Carlos');
    expect(m.closed.E?.name).toBe('KAPLAN Adam');
    expect(m.closed.W?.name).toBe('KOLESNIK Finn');
    expect(m.open.N?.id).toBe(4327);
  });
});

describe('parseMatchMeta (knockout)', () => {
  const m = parseMatchMeta(koBoardHtml);
  it('reads teams (no teamid link) and IMP, VP absent', () => {
    expect(m.home.name).toBe('ITALY');
    expect(m.away.name).toBe('BELGIUM');
    expect(m.vpHome).toBeNull();
    expect(m.impHome).toBe(14);
    expect(m.impAway).toBe(13);
    expect(m.open.N?.name).toBeTruthy();
  });
});

describe('parseResults', () => {
  const results = parseResults(boardHtml);

  it('covers all 14 boards', () => {
    expect(results.size).toBe(14);
  });

  it('parses board 1 both rooms: contract, declarer, tricks, lead, score, auction', () => {
    const b1 = results.get(1)!;
    expect(b1.open).toMatchObject({ contract: '3H', strain: 1, declarer: 1, tricks: 9, lead: 'CA', ewPoints: 140, nsPoints: 0 });
    expect(b1.open!.auction).toEqual(['P', '1NT', 'P', '2D', 'P', '3H', 'P', 'P', 'P']);
    expect(b1.closed).toMatchObject({ contract: '4H', declarer: 1, tricks: 9, nsPoints: 50 });
    expect(b1.impAway).toBe(5); // 5 IMP to Argentina
  });

  it('parses board 2 (5D by West, 11 vs 12 tricks)', () => {
    const b2 = results.get(2)!;
    expect(b2.open).toMatchObject({ contract: '5D', strain: 2, declarer: 3, tricks: 11 });
    expect(b2.closed).toMatchObject({ contract: '5D', declarer: 3, tricks: 12 });
  });
});

describe('Marrakech 2023 (no auctions, per-board deals)', () => {
  it('parses a BoardAcross deal', () => {
    const d = parseBoardAcrossDeal(mar23DealHtml)!;
    expect(d.board).toBe(1);
    expect(d.deal.dealer).toBe('N');
    expect(d.deal.vul).toBe('None');
    // Same N,W,E,S compass order → PBN in N E S W. West holds the 15-HCP 3NT hand.
    expect(d.deal.pbn).toBe('N:Q76.AT86.KQ65.T4 A32.KQ974.94.J82 KT985.J2.8732.75 J4.53.AJT.AKQ963');
  });

  it('maps board numbers to BoardAcross qboard tokens', () => {
    const q = parseBoardQboards(mar23BoardHtml);
    expect(q.size).toBe(16); // 2023 RR matches are 16 boards
    expect(q.get(1)).toBe('001.01..2350');
  });

  it('parses results (contract, lead, tricks) with empty auction', () => {
    const b1 = parseResults(mar23BoardHtml).get(1)!;
    expect(b1.open).toMatchObject({ contract: '3NT', declarer: 3, tricks: 10, lead: 'S6', ewPoints: 430 });
    expect(b1.open!.auction).toEqual([]); // no bidding on the 2023 microsite
  });

  it('still reads teams and players from the 2023 header', () => {
    const m = parseMatchMeta(mar23BoardHtml);
    expect(m.home.name).toBeTruthy();
    expect(m.away.name).toBeTruthy();
    expect(m.open.N?.name).toBeTruthy();
  });

  it('KO: BoardAcrossKO deals, segment in the qboard, and auctions ARE present', () => {
    const d = parseBoardAcrossDeal(mar23KoDealHtml)!;
    expect(d.board).toBe(1);
    expect(d.deal.dealer).toBe('N');
    // KO board pages carry the segment in the qboard (001.01.QF.2354 → 1).
    const q = parseBoardQboards(mar23KoBoardHtml);
    expect(q.get(1)).toBe('001.01.QF.2354');
    // Unlike the round-robin, the 2023 knockout has bidding.
    const b1 = parseResults(mar23KoBoardHtml).get(1)!;
    expect(b1.open!.auction.length).toBeGreaterThan(0);
    const bids = b1.open!.auction.filter((c) => /^[1-7]/.test(c)); // calls that are contract bids
    expect(bids[bids.length - 1]).toBe(b1.open!.contract.replace(/x+$/, '')); // final bid = contract
    // KO player anchors have no photo — the name comes from the anchor text.
    const meta = parseMatchMeta(mar23KoBoardHtml);
    expect(meta.open.N?.name).toBeTruthy();
    expect(meta.open.N?.id).toBeGreaterThan(0);
  });
});

describe('parseRoundSpec', () => {
  it('parses singles, lists and ranges', () => {
    expect(parseRoundSpec('1')).toEqual([1]);
    expect(parseRoundSpec('1-3')).toEqual([1, 2, 3]);
    expect(parseRoundSpec('1,3,5-7')).toEqual([1, 3, 5, 6, 7]);
  });
});
