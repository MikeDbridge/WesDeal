import { describe, it, expect } from 'vitest';
import { describeConditions, leadSummaryText, trickRange, type LeadSummaryInput } from '../src/engine/leadExport';
import { RANK_LABELS } from '../src/engine/cards';
import type { LeadRow } from '../src/engine/lead';
import type { FormState } from '../src/engine/shareState';

/** Build a single-card LeadRow from a {tricks: count} map (need = 4 → beats when ≥ 4). */
function row(suit: number, rank: number, counts: Record<number, number>, bestPct = 0.3, avgCost = 0.4): LeadRow {
  const arr = new Array<number>(14).fill(0);
  let n = 0;
  let sum = 0;
  let sets = 0;
  for (const [t, c] of Object.entries(counts)) {
    const ti = Number(t);
    arr[ti] = c;
    n += c;
    sum += ti * c;
    if (ti >= 4) sets += c;
  }
  return { suit, ranks: [rank], label: RANK_LABELS[rank], n, avg: sum / n, setPct: sets / n, bestPct, avgCost, counts: arr };
}

const baseInput: LeadSummaryInput = {
  level: 4,
  strain: 0, // ♠
  leader: 3, // West leads → declarer South
  deals: 10,
  requested: 10,
  seed: 42,
  vul: false,
  beatsPct: 0.2,
  rows: [row(0, 14, { 3: 2, 4: 5, 5: 3 }), row(1, 2, { 2: 1, 3: 4, 4: 5 })],
  openKeys: ['0-14'], // only ♠A expanded
  conditions: ['South (leader): ♠AK432 ♥KQ5 ♦A32 ♣54', 'North: 12-14 HCP, ♥5+'],
};

describe('leadSummaryText', () => {
  const text = leadSummaryText(baseInput);

  it('leads with the title, contract and beat rate', () => {
    expect(text).toContain('WesDeal — Opening-lead analysis');
    expect(text).toContain('4♠ by South');
    expect(text).toContain('10 deals · seed 42');
    expect(text).toContain('beats the contract on 20.0% of these deals');
  });

  it('lists every lead in the table with a vul-aware score header', () => {
    expect(text).toContain('Score(NV)');
    expect(text).toContain('♠A');
    expect(text).toContain('♥2');
  });

  it('charts only the expanded lead, spanning just its trick range', () => {
    expect(text).toContain('Trick distribution — defensive tricks 3..5');
    expect(text).toContain('█'); // ♠A's tallest bar
    // ♥2 (unexpanded, has a 2-trick outcome) would widen the range to 2..5.
    expect(text).not.toContain('2..5');
  });

  it('switches the score header when vulnerable', () => {
    expect(leadSummaryText({ ...baseInput, vul: true })).toContain('Score(vul)');
  });

  it('notes when fewer deals were solved than requested', () => {
    expect(leadSummaryText({ ...baseInput, deals: 812, requested: 1000 })).toContain('812 of 1,000 deals');
  });
});

describe('trickRange', () => {
  it('spans the outcomes present across rows', () => {
    expect(trickRange([row(0, 14, { 3: 1, 6: 1 }), row(1, 2, { 4: 1 })])).toEqual([3, 6]);
  });
  it('is [0, 0] for empty rows', () => {
    expect(trickRange([])).toEqual([0, 0]);
  });
});

describe('describeConditions', () => {
  const form: FormState = {
    seats: {
      N: { hcp: '12-14', knr: '', len: ['', '5+', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
      E: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
      S: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: true, hand: 'AK432 KQ5 A32 54' },
      W: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
    },
    partner: { nsHcp: '25+', nsKnr: '', ewHcp: '', ewKnr: '' },
    options: { count: '10', maxAttempts: '100000', seed: '42' },
    dd: [],
  };

  it('shows the locked leader hand with suit symbols and marks the leader', () => {
    const lines = describeConditions(form, 'S');
    expect(lines.some((l) => l.includes('South (leader)') && l.includes('♠AK432') && l.includes('♣54'))).toBe(true);
  });

  it('summarises unlocked constraints and partnership totals', () => {
    const lines = describeConditions(form, 'S');
    expect(lines.some((l) => l.startsWith('North') && l.includes('12-14 HCP') && l.includes('♥5+'))).toBe(true);
    expect(lines.some((l) => l.includes('N+S') && l.includes('25+ HCP'))).toBe(true);
  });

  it('falls back to a note when there are no constraints', () => {
    const empty: FormState = {
      seats: {
        N: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
        E: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
        S: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
        W: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
      },
      partner: { nsHcp: '', nsKnr: '', ewHcp: '', ewKnr: '' },
      options: { count: '10', maxAttempts: '100000', seed: '' },
      dd: [],
    };
    expect(describeConditions(empty, null)).toEqual(['No constraints — random deals.']);
  });
});
