import { describe, expect, it } from 'vitest';
import { parseReport, parseInline, slugify } from '../src/report-md';
// The exact import the WesBids page uses — also proves the ?raw bundling path.
import reportMd from '../research/bidding-report.md?raw';

describe('parseInline', () => {
  it('splits bold and code runs', () => {
    expect(parseInline('7/9/**11**/13 and `hcp in 7..16` end')).toEqual([
      { t: 'text', s: '7/9/' },
      { t: 'bold', s: '11' },
      { t: 'text', s: '/13 and ' },
      { t: 'code', s: 'hcp in 7..16' },
      { t: 'text', s: ' end' },
    ]);
  });
  it('passes plain text through', () => {
    expect(parseInline('plain')).toEqual([{ t: 'text', s: 'plain' }]);
  });
});

describe('parseReport', () => {
  it('parses headings, paragraphs, and merges wrapped prose', () => {
    const blocks = parseReport('# Title\n\n## Section\n\nOne line\nwrapped here.\n');
    expect(blocks[0]).toEqual({ t: 'h1', text: 'Title' });
    expect(blocks[1]).toEqual({ t: 'h2', text: 'Section' });
    expect(blocks[2]).toEqual({
      t: 'p',
      inline: [{ t: 'text', s: 'One line wrapped here.' }],
    });
  });

  it('parses pipe tables with separator rows', () => {
    const md = '| a | b |\n|---|---|\n| 1 | **2** |\n| 3 | 4 |\n';
    const blocks = parseReport(md);
    expect(blocks).toHaveLength(1);
    const t = blocks[0];
    if (t.t !== 'table') throw new Error('expected table');
    expect(t.header.map((c) => c[0].s)).toEqual(['a', 'b']);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0][1]).toEqual([{ t: 'bold', s: '2' }]);
  });

  it('parses bullets with two-space continuation lines', () => {
    const md = '- **First** starts\n  and continues here.\n- Second.\n';
    const blocks = parseReport(md);
    expect(blocks).toHaveLength(1);
    const ul = blocks[0];
    if (ul.t !== 'ul') throw new Error('expected ul');
    expect(ul.items).toHaveLength(2);
    expect(ul.items[0].map((t) => t.s).join('')).toBe('First starts and continues here.');
  });

  it('parses fenced code blocks verbatim', () => {
    const md = '```json\n{\n  "a": 1\n}\n```\n';
    const blocks = parseReport(md);
    expect(blocks).toEqual([{ t: 'code', text: '{\n  "a": 1\n}' }]);
  });

  it('handles a report-shaped document end to end', () => {
    const md = [
      '# Bidding ranges',
      '',
      'Intro prose',
      'across lines.',
      '',
      '## Headline answers',
      '',
      '| auction | HCP |',
      '|---|---|',
      '| (1C) 1H | 7–16 (med 10) |',
      '',
      '### (1C) ?',
      '',
      '- `X` → `((hcp in 10..17))`',
      '',
    ].join('\n');
    const kinds = parseReport(md).map((b) => b.t);
    expect(kinds).toEqual(['h1', 'p', 'h2', 'table', 'h3', 'ul']);
  });
});

describe('the real generated report', () => {
  it('parses cleanly into the expected structure', () => {
    const blocks = parseReport(reportMd);
    const count = (t: string): number => blocks.filter((b) => b.t === t).length;
    expect(count('h1')).toBe(1);
    expect(count('h2')).toBeGreaterThanOrEqual(8); // data, headline, findings, census, …
    expect(count('h3')).toBeGreaterThanOrEqual(40); // per-context cards
    expect(count('table')).toBeGreaterThanOrEqual(60);
    expect(count('code')).toBeGreaterThanOrEqual(1); // the profile JSON example
    // Every table row has the same cell count as its header.
    for (const b of blocks) {
      if (b.t !== 'table') continue;
      for (const row of b.rows) expect(row.length).toBe(b.header.length);
    }
    // No stray markdown syntax survives into text tokens.
    for (const b of blocks) {
      if (b.t === 'p') {
        const text = b.inline.filter((t) => t.t === 'text').map((t) => t.s).join('');
        expect(text).not.toContain('**');
      }
    }
  });
});

describe('slugify', () => {
  it('makes URL-safe anchors', () => {
    expect(slugify('Direct seat: RHO opens, we act — (opening) ?')).toBe(
      'direct-seat-rho-opens-we-act-opening',
    );
    expect(slugify('### weird')).toBe('weird');
  });
});
