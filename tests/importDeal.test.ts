import { describe, it, expect } from 'vitest';
import {
  importDeal, parsePbnDeal, parsePbnFile, parseLin, parseBboUrl, parseFreeText,
  contractFromAuction, linHandToDotted, checkDraft, missingLabel,
} from '../src/engine/importDeal';

// A valid 52-card deal used throughout (N/E/S/W).
const N = 'AKQ2.54.T987.J32';
const E = 'J97.KQJ9.62.T874';
const S = 'T863.A87.AKQ.965';
const W = '54.T632.J543.AKQ';
const PBN_LINE = `N:${N} ${E} ${S} ${W}`;

describe('PBN', () => {
  it('parses a deal line from North', () => {
    const { hands, errors } = parsePbnDeal(PBN_LINE);
    expect(errors).toEqual([]);
    expect(hands).toEqual({ N, E, S, W });
    expect(checkDraft(hands).ok).toBe(true);
  });

  it('rotates a deal line starting from any seat', () => {
    const { hands } = parsePbnDeal(`E:${E} ${S} ${W} ${N}`);
    expect(hands).toEqual({ N, E, S, W });
  });

  it('leaves hidden hands ("-") empty', () => {
    const { hands, errors } = parsePbnDeal(`N:${N} - ${S} -`);
    expect(errors).toEqual([]);
    expect(hands).toEqual({ N, E: '', S, W: '' });
  });

  it('normalises case, tens and flags junk', () => {
    const { hands } = parsePbnDeal('N:akq2.54.10987.j32 - - -');
    expect(hands.N).toBe(N);
    const bad = parsePbnDeal(`N:AKQ2 ${E} ${S} ${W}`);
    expect(bad.errors.some((e) => e.includes('spades.hearts'))).toBe(true);
  });

  it('reads a PBN file: deal, dealer, vul, contract, declarer', () => {
    const file = [
      '[Board "3"]',
      '[Dealer "S"]',
      '[Vulnerable "EW"]',
      `[Deal "S:${S} ${W} ${N} ${E}"]`,
      '[Contract "4SX"]',
      '[Declarer "S"]',
    ].join('\n');
    const r = parsePbnFile(file);
    expect(r.errors).toEqual([]);
    expect(r.deal!.hands).toEqual({ N, E, S, W });
    expect(r.deal!.dealer).toBe('S');
    expect(r.deal!.vul).toBe('EW');
    expect(r.deal!.contract).toBe('4Sx');
    expect(r.deal!.declarer).toBe('S');
  });

  it('takes the first deal of a multi-board file, with a note', () => {
    const file = [
      '[Board "1"]',
      `[Deal "N:${N} ${E} ${S} ${W}"]`,
      '[Board "2"]',
      '[Deal "N:- - - -"]',
    ].join('\n');
    const r = parsePbnFile(file);
    expect(r.deal!.hands.N).toBe(N);
    expect(r.deal!.dealer).toBe('N'); // from [Board "1"]
    expect(r.notes.some((n) => n.includes('2 deals'))).toBe(true);
  });

  it('derives dealer and vul from the board number when tags are missing', () => {
    const r = parsePbnFile(`[Board "5"]\n[Deal "${PBN_LINE}"]`);
    expect(r.deal!.dealer).toBe('N');
    expect(r.deal!.vul).toBe('NS');
  });
});

describe('LIN', () => {
  const LIN =
    'st||md|1SAKQJT9HA32DK2C32,S87HKQJTDQJT9CKQJ,S32H54DA8765CA654,|rh||ah|Board 1|sv|o' +
    '|mb|1S|mb|p|mb|2S|mb|p|mb|4S|mb|p|mb|p|mb|p|pc|HK|pc|H4|pc|H6|pc|HA|';

  it('converts LIN hand syntax', () => {
    expect(linHandToDotted('SAK96HK75DAKT7CQ6')).toBe('AK96.K75.AKT7.Q6');
    expect(linHandToDotted('SHAKQJT98765432DC')).toBe('.AKQJT98765432..');
    expect(linHandToDotted('')).toBe('');
  });

  it('derives contract and declarer from the auction', () => {
    expect(contractFromAuction('S', ['1S', 'P', '2S', 'P', '4S', 'P', 'P', 'P'])).toEqual({ contract: '4S', declarer: 'S' });
    // North named spades first for NS even though South bid them last.
    expect(contractFromAuction('N', ['1S', 'P', '4S', 'P', 'P', 'P'])).toEqual({ contract: '4S', declarer: 'N' });
    expect(contractFromAuction('W', ['1NT', 'X', 'P', 'P', 'P'])).toEqual({ contract: '1NTx', declarer: 'W' });
    expect(contractFromAuction('N', ['P', 'P', 'P', 'P'])).toBeNull();
  });

  it('parses a handviewer LIN: hands, dealer, vul, contract, play', () => {
    const r = parseLin(LIN);
    expect(r.errors).toEqual([]);
    const d = r.deal!;
    expect(d.dealer).toBe('S'); // md|1 → South
    expect(d.vul).toBe('None');
    expect(d.hands.S).toBe('AKQJT9.A32.K2.32');
    expect(d.hands.W).toBe('87.KQJT.QJT9.KQJ');
    expect(d.hands.N).toBe('32.54.A8765.A654');
    expect(d.hands.E).toBe('654.9876.43.T987'); // deduced from the other three
    expect(r.notes.some((n) => n.includes('filled in'))).toBe(true);
    expect(d.contract).toBe('4S');
    expect(d.declarer).toBe('S');
    expect(d.play).toBe('HKH4H6HA');
    expect(checkDraft(d.hands).ok).toBe(true);
  });

  it('imports only the first board of a vugraph file', () => {
    const two = `vg|t,s|qx|o1|md|3S${'AKQ2'}H54DT987CJ32,SJ97HKQJ9D62CT874,ST863HA87DAKQC965,S54HT632DJ543CAKQ|sv|o|qx|o2|md|3SAKQJT9HA32DK2C32,S87HKQJTDQJT9CKQJ,S32H54DA8765CA654,|sv|b|`;
    const r = parseLin(two);
    expect(r.deal!.dealer).toBe('N'); // md|3 → North
    expect(r.deal!.hands.S).toBe(N); // LIN lists South's hand first — here the "N" cards
    expect(r.notes.some((n) => n.includes('several boards'))).toBe(true);
  });
});

describe('BBO URLs', () => {
  it('decodes a handviewer lin= URL', () => {
    const lin = 'st||md|1SAKQJT9HA32DK2C32,S87HKQJTDQJT9CKQJ,S32H54DA8765CA654,|sv|o|mb|4S|mb|p|mb|p|mb|p|';
    const url = 'https://www.bridgebase.com/tools/handviewer.html?lin=' + encodeURIComponent(lin);
    const r = parseBboUrl(url);
    expect(r.deal!.dealer).toBe('S');
    expect(r.deal!.contract).toBe('4S');
    expect(checkDraft(r.deal!.hands).ok).toBe(true);
  });

  it('reads n=/e=/s=/w= handviewer parameters', () => {
    const url =
      'https://www.bridgebase.com/tools/handviewer.html?n=SAKQ2H54DT987CJ32&e=SJ97HKQJ9D62CT874' +
      '&s=ST863HA87DAKQC965&w=S54HT632DJ543CAKQ&d=n&v=n';
    const r = parseBboUrl(url);
    expect(r.deal!.hands).toEqual({ N, E, S, W });
    expect(r.deal!.dealer).toBe('N');
    expect(r.deal!.vul).toBe('NS');
  });

  it('falls back to the board number for dealer/vul', () => {
    const url = `https://example.com/x?n=SAKQ2H54DT987CJ32&e=SJ97HKQJ9D62CT874&s=ST863HA87DAKQC965&w=S54HT632DJ543CAKQ&b=5`;
    const r = parseBboUrl(url);
    expect(r.deal!.dealer).toBe('N');
    expect(r.deal!.vul).toBe('NS');
  });
});

describe('free text', () => {
  it('reads four labeled hand lines', () => {
    const text = ['N: AKQ2 54 T987 J32', 'E: J97 KQJ9 62 T874', 'S: T863 A87 AKQ 965', 'W: 54 T632 J543 AKQ'].join('\n');
    const r = parseFreeText(text);
    expect(r.deal!.hands).toEqual({ N, E, S, W });
  });

  it('reads four unlabeled lines in N E S W order', () => {
    const text = ['AKQ2 54 T987 J32', 'J97 KQJ9 62 T874', 'T863 A87 AKQ 965', '54 T632 J543 AKQ'].join('\n');
    expect(parseFreeText(text).deal!.hands).toEqual({ N, E, S, W });
  });

  it('places a single pasted hand in South', () => {
    const r = parseFreeText('AKQ52 K9 Q84 K76');
    expect(r.deal!.hands.S).toBe('AKQ52.K9.Q84.K76');
    expect(r.deal!.hands.N).toBe('');
    expect(r.notes.some((n) => n.includes('South'))).toBe(true);
  });

  it('keeps a labeled single hand where it was put', () => {
    const r = parseFreeText('N: AKQ52 K9 Q84 K76');
    expect(r.deal!.hands.N).toBe('AKQ52.K9.Q84.K76');
    expect(r.deal!.hands.S).toBe('');
  });

  it('reads dotted hands, four on one line', () => {
    expect(parseFreeText(`${N} ${E} ${S} ${W}`).deal!.hands).toEqual({ N, E, S, W });
  });

  it("reads the site's compass-text copy format", () => {
    const text = [
      '       S: AKQ2',
      '       H: 54',
      '       D: T987',
      '       C: J32',
      'S: 54          S: J97',
      'H: T632        H: KQJ9',
      'D: J543        D: 62',
      'C: AKQ         C: T874',
      '       S: T863',
      '       H: A87',
      '       D: AKQ',
      '       C: 965',
    ].join('\n');
    const r = parseFreeText(text);
    expect(r.deal!.hands).toEqual({ N, E, S, W });
    expect(checkDraft(r.deal!.hands).ok).toBe(true);
  });

  it('reads seat lines with suit symbols (and the 🔒 marker)', () => {
    const text = [
      'N  ♠ AKQ2  ♥ 54  ♦ T987  ♣ J32',
      '🔒E  ♠ J97  ♥ KQJ9  ♦ 62  ♣ T874',
      'S  ♠ T863  ♥ A87  ♦ AKQ  ♣ 965',
      'W  ♠ 54  ♥ T632  ♦ J543  ♣ AKQ',
    ].join('\n');
    expect(parseFreeText(text).deal!.hands).toEqual({ N, E, S, W });
  });

  it('reads a compass with voids and symbol suits', () => {
    const text = [
      '♠ AKQJT98765432  ♥ —  ♦ —  ♣ —',
      '♠ —  ♥ AKQJT98765432  ♦ —  ♣ —',
      '♠ —  ♥ —  ♦ AKQJT98765432  ♣ —',
      '♠ —  ♥ —  ♦ —  ♣ AKQJT98765432',
    ].join('\n');
    const r = parseFreeText(text);
    expect(r.deal!.hands.N).toBe('AKQJT98765432...');
    expect(r.deal!.hands.W).toBe('...AKQJT98765432');
    expect(checkDraft(r.deal!.hands).ok).toBe(true);
  });

  it('picks up dealer, vul, board and "by" contracts', () => {
    const text = ['Board 5 · Dealer E · Vul Both', '4S by South', `${N} ${E} ${S} ${W}`].join('\n');
    const r = parseFreeText(text);
    expect(r.deal!.dealer).toBe('E'); // explicit beats board number
    expect(r.deal!.vul).toBe('Both');
    expect(r.deal!.contract).toBe('4S');
    expect(r.deal!.declarer).toBe('S');
  });

  it('completes a missing fourth hand', () => {
    const text = ['N: AKQ2 54 T987 J32', 'E: J97 KQJ9 62 T874', 'S: T863 A87 AKQ 965'].join('\n');
    const r = parseFreeText(text);
    expect(r.deal!.hands.W).toBe(W);
    expect(r.notes.some((n) => n.includes('filled in'))).toBe(true);
  });
});

describe('format detection', () => {
  it('routes each format', () => {
    expect(importDeal(PBN_LINE).format).toBe('pbn');
    expect(importDeal(`[Deal "${PBN_LINE}"]`).format).toBe('pbn-file');
    expect(importDeal('md|1SAKQJT9HA32DK2C32,S87HKQJTDQJT9CKQJ,S32H54DA8765CA654,|sv|o|').format).toBe('lin');
    expect(importDeal('https://www.bridgebase.com/tools/handviewer.html?lin=md%7C1SAKQHT2D3C4%2C%2C%2C%7C').format).toBe('bbo-url');
    expect(importDeal('AKQ52 K9 Q84 K76').format).toBe('text');
    expect(importDeal('N:- ' + `${E} ${S} ${W}`).format).toBe('pbn');
    expect(importDeal('').deal).toBeNull();
  });
});

describe('checkDraft validation', () => {
  it('accepts a complete deal', () => {
    const check = checkDraft({ N, E, S, W });
    expect(check.ok).toBe(true);
    expect(check.deal).not.toBeNull();
    expect(check.missing).toEqual([]);
  });

  it('reports counts, duplicates and missing cards', () => {
    const check = checkDraft({
      N: 'AKQ2.54.T987.J32',
      E: 'AKQ2.54.T987.J32', // duplicates N
      S: 'T863.A87.AKQ.96', // 12 cards
      W: '',
    });
    expect(check.ok).toBe(false);
    expect(check.seats.S.errors.some((e) => e.includes('12 card'))).toBe(true);
    expect(check.seats.W.errors).toContain('Hand is empty.');
    expect(check.crossErrors.some((e) => e.includes('both N and E'))).toBe(true);
    expect(check.missing.length).toBeGreaterThan(0);
    expect(missingLabel(check.missing)).toContain('♠');
  });

  it('flags junk characters where they are typed', () => {
    const check = checkDraft({ N: 'AKQZ.54.T987.J32', E, S, W });
    expect(check.seats.N.errors.some((e) => e.includes('"Z"'))).toBe(true);
  });
});
