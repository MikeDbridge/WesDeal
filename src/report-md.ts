/**
 * Minimal Markdown parser for the generated research reports.
 *
 * The bidding report (research/bidding-report.md) is machine-written with a
 * small, regular dialect — headings, pipe tables, flat bullet lists with
 * two-space continuation lines, fenced code blocks, `code` and **bold**
 * inline — so this parses exactly that, nothing more. Pure functions, no DOM:
 * the page module (bidding.ts) turns blocks into elements, and the parser is
 * unit-tested in tests/report-md.test.ts.
 */

export type Inline =
  | { t: 'text'; s: string }
  | { t: 'bold'; s: string }
  | { t: 'code'; s: string };

export type Block =
  | { t: 'h1' | 'h2' | 'h3'; text: string }
  | { t: 'p'; inline: Inline[] }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'table'; header: Inline[][]; rows: Inline[][][] }
  | { t: 'code'; text: string };

/** Split a line into text / **bold** / `code` runs. */
export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index! > last) out.push({ t: 'text', s: s.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**')) out.push({ t: 'bold', s: tok.slice(2, -2) });
    else out.push({ t: 'code', s: tok.slice(1, -1) });
    last = m.index! + tok.length;
  }
  if (last < s.length) out.push({ t: 'text', s: s.slice(last) });
  return out;
}

/** Split a pipe-table line into trimmed cell strings. */
function tableCells(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((c) => c.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes('-');
}

export function parseReport(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') {
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ t: 'h1', text: line.slice(2).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ t: 'h2', text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ t: 'h3', text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ t: 'code', text: buf.join('\n') });
      continue;
    }
    if (trimmed.startsWith('|')) {
      const header = tableCells(line).map(parseInline);
      i++;
      if (i < lines.length && isSeparatorRow(lines[i])) i++;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(tableCells(lines[i]).map(parseInline));
        i++;
      }
      blocks.push({ t: 'table', header, rows });
      continue;
    }
    if (line.startsWith('- ')) {
      const items: string[] = [line.slice(2)];
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (l.startsWith('- ')) {
          items.push(l.slice(2));
          i++;
        } else if (/^\s{2,}\S/.test(l)) {
          items[items.length - 1] += ' ' + l.trim();
          i++;
        } else break;
      }
      blocks.push({ t: 'ul', items: items.map(parseInline) });
      continue;
    }
    // Plain paragraph: merge consecutive prose lines (the generator hard-wraps).
    const buf: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (
        t === '' ||
        l.startsWith('#') ||
        l.startsWith('- ') ||
        t.startsWith('|') ||
        t.startsWith('```')
      ) {
        break;
      }
      buf.push(t);
      i++;
    }
    blocks.push({ t: 'p', inline: parseInline(buf.join(' ')) });
  }
  return blocks;
}

/** URL-safe anchor slug for a heading (unique-ified by the caller if needed). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Distribution cells ("4:3% 5:66% 6:23% 7:7%", optionally prefixed)
// ---------------------------------------------------------------------------

export interface DistToken {
  /** Display label: "5", "<5", "7+". */
  label: string;
  /** Slot the token occupies ("<k" sits at k−1, "k+" at k). */
  anchor: number;
  pct: number;
}

export interface DistCell {
  /** Text before the tokens, e.g. "their ♣:" (may be empty). */
  prefix: string;
  tokens: DistToken[];
}

const DIST_TOKEN_RE = /^(<(\d+)|(\d+)\+|(\d+)):(\d+)%$/;

/**
 * Parse a table cell that is a value:percent distribution. Returns null when
 * the text isn't one (fewer than two tokens, or any word that isn't a token
 * after the optional prefix).
 */
export function parseDistCell(text: string): DistCell | null {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return null;
  const tokens: DistToken[] = [];
  const prefixWords: string[] = [];
  for (const word of words) {
    const m = DIST_TOKEN_RE.exec(word);
    if (!m) {
      if (tokens.length > 0) return null; // prose after tokens → not a dist cell
      prefixWords.push(word);
      continue;
    }
    const pct = Number(m[5]);
    if (m[2] !== undefined) tokens.push({ label: `<${m[2]}`, anchor: Number(m[2]) - 1, pct });
    else if (m[3] !== undefined) tokens.push({ label: `${m[3]}+`, anchor: Number(m[3]), pct });
    else tokens.push({ label: m[4], anchor: Number(m[4]), pct });
  }
  if (tokens.length < 2) return null;
  return { prefix: prefixWords.join(' '), tokens };
}
