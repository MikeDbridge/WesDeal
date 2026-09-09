import { describe, expect, it } from 'vitest';
import { parseBoardAcrossDeal, parseBoardQboards, parseHands, parseKoSegment, parseMatchIds, parseMatchMeta, parseResults, parseRoundSpec } from '../parse';
import { parseHands2026, parseKoSegment2026, parseMatchMeta2026, parseResults2026 } from '../parse2026';
import handsHtml from './fixtures/handsacross-2550-r1.html?raw';
import roundHtml from './fixtures/roundteams-2550-r1.html?raw';
import boardHtml from './fixtures/boarddetails-153336.html?raw';
import koPhaseHtml from './fixtures/knockoutphase-2554-qf.html?raw';
import koBoardHtml from './fixtures/boarddetailsko-153642-qf.html?raw';
import mar23DealHtml from './fixtures/boardacross-2350-b1.html?raw';
import mar23BoardHtml from './fixtures/boarddetails-2350-112644.html?raw';
import mar23KoDealHtml from './fixtures/boardacrossko-2354-qf-b1.html?raw';
import mar23KoBoardHtml from './fixtures/boarddetailsko-2354-113816.html?raw';
import kat26HandsHtml from './fixtures/katowice26/handsacrossko-2650-ff-seg1.html?raw';
import kat26BoardHtml from './fixtures/katowice26/boarddetailsko-2650-169032-ff.html?raw';
import kat26PhaseHtml from './fixtures/katowice26/knockoutphase-2650-ff.html?raw';

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

// ---- cards2026: the redesigned WBF template (2026 World Bridge Series, Katowice) ----
// Fixtures are real pages from the Open Teams KO (Rosenblum Cup) final, tournid
// 2650, matchid 169032 (ROSENTHAL v FLEISHER), segment 1. Values below were read
// by eye off the live pages before being asserted here.

describe('parseHands2026', () => {
  const hands = parseHands2026(kat26HandsHtml);

  it('finds all 14 boards of the segment', () => {
    expect(hands.size).toBe(14);
    expect([...hands.keys()].sort((a, b) => a - b)).toEqual([...Array(14)].map((_, i) => i + 1));
  });

  it('parses board 1 deal, dealer and vulnerability', () => {
    const b1 = hands.get(1)!;
    expect(b1.dealer).toBe('N');
    expect(b1.vul).toBe('None');
    // Seats are labelled directly (pos-n/w/e/s) — no positional inference needed.
    expect(b1.pbn).toBe('N:J8642.6.KJ7.T532 9.KT832.QT653.K9 T5.Q975.982.AQ64 AKQ73.AJ4.A4.J87');
  });

  it('represents a void as an empty suit, not the literal en-dash placeholder', () => {
    // Board 4, South: spades T987, hearts void (rendered on the page as "&#8211;").
    const b4 = hands.get(4)!;
    expect(b4.dealer).toBe('W');
    expect(b4.vul).toBe('All');
    const south = b4.pbn.split(' ')[2]; // PBN order N E S W
    expect(south).toBe('T987..AQ986.J985');
  });
});

describe('parseKoSegment2026', () => {
  it('reads the segment number off the "Hand records" link', () => {
    expect(parseKoSegment2026(kat26BoardHtml)).toBe(1);
  });
});

describe('parseMatchMeta2026', () => {
  const m = parseMatchMeta2026(kat26BoardHtml);

  it('reads teams (no id — team links carry none) and the match IMP total', () => {
    expect(m.home).toEqual({ name: 'ROSENTHAL', id: null });
    expect(m.away).toEqual({ name: 'FLEISHER', id: null });
    expect(m.impHome).toBe(8);
    expect(m.impAway).toBe(46);
    expect(m.vpHome).toBeNull(); // knockout-only template — VP never shown
  });

  it('places the eight players by explicitly-labelled room and seat, with eurobridge qryid as id', () => {
    expect(m.open.N).toEqual({ name: 'ROSENTHAL Andrew', id: 29523 });
    expect(m.open.W).toEqual({ name: 'BRINK Sjoert', id: 3391 });
    expect(m.open.E).toEqual({ name: 'DRIJVER Bas', id: 16819 });
    expect(m.open.S).toEqual({ name: 'SILVERSTEIN Aaron', id: 17578 });
    expect(m.closed.N).toEqual({ name: 'BESSIS Thomas', id: 3470 });
    expect(m.closed.W).toEqual({ name: 'WILLENKEN Chris', id: 5924 });
    expect(m.closed.E).toEqual({ name: 'SCHALTZ Martin', id: 3328 });
    expect(m.closed.S).toEqual({ name: 'LORENZINI Cedric', id: 7967 });
  });
});

describe('parseResults2026', () => {
  const { results, impChecks } = parseResults2026(kat26BoardHtml);

  it('covers all 14 boards', () => {
    expect(results.size).toBe(14);
  });

  it('parses board 1 both rooms: contract, declarer, tricks, lead, score, auction', () => {
    const b1 = results.get(1)!;
    expect(b1.open).toMatchObject({ contract: '4H', strain: 1, declarer: 1, doubled: 0, tricks: 10, lead: 'ST', ewPoints: 420, nsPoints: 0 });
    expect(b1.open!.auction).toEqual(['P', '2H', 'P', '4H', 'P', 'P', 'P']);
    expect(b1.closed).toMatchObject({ contract: '4H', declarer: 3, tricks: 8, lead: 'C3', nsPoints: 100, ewPoints: 0 });
    expect(b1.closed!.auction).toEqual(['P', 'P', 'P', '1S', 'P', '1NT', 'P', '2NT', 'P', '3D', 'P', '3H', 'P', '3NT', 'P', '4H', 'P', 'P', 'P']);
  });

  it('parses board 3 as a flat board (identical result both rooms → 0 computed IMPs)', () => {
    const b3 = results.get(3)!;
    expect(b3.open).toMatchObject({ contract: '3NT', declarer: 1, tricks: 10, lead: 'S9', ewPoints: 630, nsPoints: 0 });
    expect(b3.closed).toMatchObject({ contract: '3NT', declarer: 1, tricks: 10, lead: 'D2', ewPoints: 630, nsPoints: 0 });
    expect(b3.impHome).toBe(0);
    expect(b3.impAway).toBe(0);
  });

  it('parses board 13: a doubled contract, and computes the board IMP from both rooms’ scores', () => {
    const b13 = results.get(13)!;
    expect(b13.open).toMatchObject({ contract: '4Sx', level: 4, strain: 0, declarer: 1, doubled: 1, lead: 'HA', tricks: 7, nsPoints: 800, ewPoints: 0 });
    expect(b13.open!.auction).toEqual(['P', '1S', '2H', '2S', '4H', 'X', 'P', '4S', 'X', 'P', 'P', 'P']);
    expect(b13.closed).toMatchObject({ contract: '4H', declarer: 0, doubled: 0, lead: 'CQ', tricks: 10, nsPoints: 620, ewPoints: 0 });
    // Open room home team (N-S) lost 800, closed room home team (E-W) lost 620 →
    // home differential -800-(-620) = -180 → toImps(180) = 5 IMPs to the away team.
    expect(b13.impHome).toBe(5);
    expect(b13.impAway).toBe(0);
  });

  it('every scraped auction’s final bid equals the recorded contract', () => {
    for (const [board, r] of results) {
      for (const play of [r.open, r.closed]) {
        if (!play || play.auction.length === 0) continue;
        const bids = play.auction.filter((c) => /^[1-7]/.test(c));
        expect(bids[bids.length - 1], `board ${board}`).toBe(play.contract.replace(/x+$/, ''));
      }
    }
  });

  it('computed per-board IMPs agree with the page’s own imp-h/imp-v figure on every board of this match', () => {
    expect(impChecks.length).toBeGreaterThan(0);
    for (const c of impChecks) expect(c, `board ${c.board}`).toMatchObject({ agree: true });
  });
});

describe('parseMatchIds on a cards2026 knockoutphase page', () => {
  it('lists the 4 match-segment ids of the Open Teams final (classic parseMatchIds is format-agnostic)', () => {
    const ids = parseMatchIds(kat26PhaseHtml);
    expect(ids.sort((a, b) => a - b)).toEqual([169032, 169033, 169034, 169035]);
  });
});
