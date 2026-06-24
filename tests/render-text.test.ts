import { describe, it, expect } from 'vitest';
import { dealsLayoutText, type BoardFormat } from '../src/ui/render';
import { generateDeals } from '../src/engine/dealer';

const deal = generateDeals({ constraints: {}, count: 1, seed: 1 }).deals[0];

function text(format: BoardFormat): string {
  return dealsLayoutText([deal], [], format);
}

describe('dealsLayoutText (Copy button output)', () => {
  it('compass-text uses S:/H:/D:/C: letters and a board header', () => {
    const t = text('compass-text');
    expect(t.startsWith('Board 1')).toBe(true);
    expect(t).toContain('S:');
    expect(t).toContain('H:');
    expect(t).toContain('D:');
    expect(t).toContain('C:');
  });

  it('compass-detailed includes the HCP/KnR meta line', () => {
    const t = text('compass-detailed');
    expect(t).toContain('HCP');
    expect(t).toContain('KnR');
    expect(t).toContain('♠');
  });

  it('compass-mini is a 4-line block (header + N / W,E / S)', () => {
    const lines = text('compass-mini').split('\n');
    expect(lines[0]).toBe('Board 1');
    expect(lines.length).toBe(4);
    expect(lines[2]).toContain('W ');
    expect(lines[2]).toContain('E ');
  });

  it('seat-lines lists one inline line per seat with suit symbols', () => {
    const lines = text('seat-lines').split('\n');
    expect(lines[0]).toBe('Board 1');
    expect(lines.slice(1).length).toBe(4);
    expect(lines[1]).toMatch(/^N\s+♠/);
  });

  it('marks locked seats in seat-lines', () => {
    const t = dealsLayoutText([deal], ['N'], 'seat-lines');
    expect(t).toContain('🔒N');
  });

  it('joins multiple boards with a blank line', () => {
    const result = generateDeals({ constraints: {}, count: 2, seed: 3 });
    const t = dealsLayoutText(result.deals, [], 'seat-lines');
    expect(t).toContain('Board 1');
    expect(t).toContain('Board 2');
    expect(t).toContain('\n\n');
  });
});
