/**
 * Convention-card (system-card) harvester — a loose prototype.
 *
 * Championship organisers publish each pair's WBF convention card as a typed
 * PDF in a standard two-page layout. This fetches a whole tournament's systems
 * directory, extracts the bidding agreements we care about (1C style, 1NT
 * range, 2D meaning, overcall style, 1NT defence, transfer responses…), and
 * joins the cards to the pairs already in the scrape so we can eventually
 * condition the bidding study on DECLARED agreements instead of statistical
 * inference.
 *
 * Deliberately tolerant: every field is best-effort (null when not found) and
 * the full extracted text is kept per card, so new fields can be mined later
 * without re-fetching. Point it at other tournaments by setting WBF_SYSTEMS_URL
 * (default: the 2025 Bermuda Bowl).
 *
 * Run: npm run research:systems
 * Needs `pdftotext` (poppler) on PATH; ships with Git for Windows.
 */

import { it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseCsv, csvColumns } from './lib';

const SYSTEMS_URL =
  process.env.WBF_SYSTEMS_URL ??
  'http://systems.worldbridge.org/default.asp?dir=2025%20Bermuda%20Bowl%20Systems';
const HOST = 'http://systems.worldbridge.org/';
const CACHE = path.join(import.meta.dirname, 'systems-cache');
const OUT = path.join(import.meta.dirname, 'systems-cards.json');
const SCRAPE_DIR = path.join(
  import.meta.dirname,
  '..',
  '..',
  'Bridge - World Championship data scrape',
  'data',
  '_all',
);

// ---------------------------------------------------------------------------
// pdftotext
// ---------------------------------------------------------------------------

function resolvePdftotext(): string {
  const candidates = [
    process.env.PDFTOTEXT,
    'pdftotext',
    'C:/Program Files/Git/mingw64/bin/pdftotext.exe',
    'C:/Program Files/Git/usr/bin/pdftotext.exe',
    '/mingw64/bin/pdftotext',
    '/usr/bin/pdftotext',
  ].filter((c): c is string => !!c);
  for (const bin of candidates) {
    try {
      execFileSync(bin, ['-v'], { stdio: 'ignore' });
      return bin;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') continue;
      return bin; // ran (non-zero exit from -v on some builds) → it exists
    }
  }
  throw new Error('pdftotext not found — install poppler or set PDFTOTEXT');
}

function pdfToText(bin: string, file: string, layout: boolean): string {
  const args = layout ? ['-layout', file, '-'] : [file, '-'];
  try {
    return execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Fetch + cache
// ---------------------------------------------------------------------------

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Encode a relative path (with spaces / unicode) for the URL, keeping slashes. */
function encodePath(rel: string): string {
  return rel.split('/').map(encodeURIComponent).join('/');
}

async function fetchIndex(): Promise<string[]> {
  const res = await fetch(SYSTEMS_URL);
  const html = await res.text();
  const hrefs = new Set<string>();
  for (const m of html.matchAll(/href='([^']+\.pdf)'/gi)) hrefs.add(m[1]);
  for (const m of html.matchAll(/href="([^"]+\.pdf)"/gi)) hrefs.add(m[1]);
  return [...hrefs];
}

async function download(rel: string): Promise<string | null> {
  const dest = path.join(CACHE, rel);
  if (existsSync(dest)) return dest;
  mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(HOST + encodePath(rel));
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) return null; // guard against error pages
  writeFileSync(dest, buf);
  await sleep(200); // be polite
  return dest;
}

// ---------------------------------------------------------------------------
// Parsing (loose, keyword + row based)
// ---------------------------------------------------------------------------

interface Card {
  path: string;
  country: string;
  file: string;
  players: string[]; // surnames, lowercased
  openings: Record<string, string>; // 1C/1D/1M/1NT/2C/2D… → description
  competitive: {
    overcalls: string | null;
    oneNTovercall: string | null;
    jumpOvercalls: string | null;
    vsNT: string[]; // detected 1NT-defence convention names
    takeoutDoubles: string | null;
  };
  tags: {
    oneClub: string | null; // natural / short / strong / polish
    oneNT: string | null; // strong / weak
    twoD: string | null; // multi / weak / strong / natural
    transferResp: boolean | null; // transfers over 1C
  };
  chars: number;
  raw: string; // -layout text, kept for future mining
}

const NT_DEFENCES: Array<[RegExp, string]> = [
  [/cappelletti|hamilton|pottage/i, 'Cappelletti'],
  [/\bd\.?o\.?n\.?t\b|disturb/i, 'DONT'],
  [/multi[- ]?landy/i, 'Multi-Landy'],
  [/\blandy\b/i, 'Landy'],
  [/woolsey/i, 'Woolsey'],
  [/suction/i, 'Suction'],
  [/asptro|aspro/i, 'Aspro/Asptro'],
  [/brozel/i, 'Brozel'],
  [/ripstra/i, 'Ripstra'],
  [/meckwell|modified meck/i, 'Meckwell'],
  [/lionel/i, 'Lionel'],
  [/\btransfer/i, 'transfers'],
];

/** Grab the tail of the first line that contains `label`. */
function inlineAfter(lines: string[], label: RegExp): string | null {
  for (const line of lines) {
    const m = line.match(label);
    if (m) {
      const tail = line.slice((m.index ?? 0) + m[0].length).trim();
      if (tail) return tail.replace(/\s{2,}/g, ' ').trim();
    }
  }
  return null;
}

/** The description on the opening-grid row whose first token is `token`. */
function openingRow(layoutLines: string[], token: string): string | null {
  const re = new RegExp(`^\\s*${token.replace(/([.*+?^${}()|[\]\\])/g, '\\$1')}\\b`, 'i');
  for (const line of layoutLines) {
    if (re.test(line)) {
      const tail = line.replace(re, '').trim();
      // Keep the first whitespace-separated chunk group (the DESCRIPTION column).
      const chunk = tail.split(/\s{3,}/).find((c) => /[a-z0-9]/i.test(c));
      if (chunk && chunk.length > 2) return chunk.replace(/\s{2,}/g, ' ').trim();
    }
  }
  return null;
}

function firstRange(text: string, near: RegExp): string | null {
  const idx = text.search(near);
  if (idx < 0) return null;
  const window = text.slice(idx, idx + 60);
  const m = window.match(/(1\d)\s*[-+to]{1,3}\s*(1\d)/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function parseCard(rel: string, plain: string, layout: string): Card {
  const dir = rel.split('/');
  const file = dir[dir.length - 1].replace(/\.pdf$/i, '');
  const country = dir.length >= 2 ? dir[dir.length - 2] : '';
  const plainLines = plain.split('\n').map((l) => l.replace(/\s+$/, ''));
  const layoutLines = layout.split('\n');
  const both = plain + '\n' + layout;

  // Players → surnames. Prefer the "Players:" line; fall back to the filename.
  let playerStr: string | null = null;
  for (let i = 0; i < plainLines.length; i++) {
    const m = plainLines[i].match(/Players:\s*(.*)/i);
    if (m) {
      playerStr = m[1].trim() || (plainLines[i + 1] ?? '').trim();
      break;
    }
  }
  const nameSource = playerStr || file;
  const surnames = nameSource
    .split(/\s*[-–—/&]\s*|\s+&\s+|\s+and\s+/i)
    .map((n) => n.trim())
    .filter((n) => n.length > 1)
    .map((n) => {
      const toks = n.split(/\s+/).filter((t) => /[a-z]/i.test(t));
      // Surname = the ALL-CAPS token if present, else the longest token.
      const caps = toks.find((t) => t === t.toUpperCase() && t.length > 2);
      return (caps ?? toks.sort((a, b) => b.length - a.length)[0] ?? n).toLowerCase();
    })
    .filter((s) => s && !/^(bb|open|women|seniors|mixed|systems?|cc|card)$/i.test(s));

  const openings: Record<string, string> = {};
  for (const [token, key] of [
    ['1C', '1C'], ['1D', '1D'], ['1H', '1H'], ['1S', '1S'], ['1M', '1M'],
    ['1 ?NT', '1NT'], ['2C', '2C'], ['2D', '2D'], ['2 ?NT', '2NT'],
  ] as const) {
    const d = openingRow(layoutLines, token);
    if (d) openings[key] = d;
  }

  const competitive = {
    overcalls: inlineAfter(plainLines, /OVERCALLS\s*\(/i),
    oneNTovercall: (() => {
      // Value sits a couple of lines below the header (leads column interleaves).
      const i = plainLines.findIndex((l) => /1NT OVERCALL/i.test(l));
      if (i < 0) return null;
      for (let j = i + 1; j < Math.min(i + 5, plainLines.length); j++) {
        const r = plainLines[j].match(/(1\d)\s*[-+]\s*(1\d)/);
        if (r) return plainLines[j].trim();
      }
      return null;
    })(),
    jumpOvercalls: inlineAfter(plainLines, /JUMP OVERCALLS\s*\(/i),
    vsNT: NT_DEFENCES.filter(([re]) => {
      // Only look in the VS. NT region if we can find it, else whole text.
      const i = both.search(/VS\.?\s*NT/i);
      const region = i >= 0 ? both.slice(i, i + 300) : both;
      return re.test(region);
    }).map(([, name]) => name),
    takeoutDoubles: inlineAfter(plainLines, /TAKEOUT DOUBLES\s*\(/i),
  };

  // --- normalized tags (best-effort) ---
  const approach = (inlineAfter(plainLines, /GENERAL APPROACH AND STYLE/i) ?? '') + ' ' + (openings['1C'] ?? '');
  const oneClub = (() => {
    if (/strong|16\+|17\+|precision|18\+/i.test(openings['1C'] ?? '')) return 'strong';
    if (/polish|regres|wilkosz/i.test(both)) return 'polish';
    if (/short|2 ?cards|could be|prepared|nebulous|\b0\+|\b2\+/i.test(approach)) return 'short';
    if (openings['1C']) return 'natural';
    return null;
  })();
  const ntRange = firstRange(both, /1 ?NT (opening|:)|^\s*1 ?NT\b/im) ?? firstRange(both, /1 ?NT/);
  const oneNT = ntRange
    ? Number(ntRange.split('-')[0]) <= 13
      ? 'weak'
      : 'strong'
    : null;
  const twoD = (() => {
    const d2 = openings['2D'] ?? '';
    if (/multi/i.test(both)) return /multi/i.test(d2) || /2D.{0,40}multi/i.test(both) ? 'multi' : 'multi?';
    if (/weak two|weak 2|wk2/i.test(d2)) return 'weak/natural';
    if (/\bGF\b|game forc|22\+|strong/i.test(d2)) return 'strong';
    if (d2) return 'other';
    return null;
  })();
  const transferResp = openings['1C']
    ? /transfer/i.test(openings['1C']) || /1D\s*=?\s*(hearts|♥)/i.test(openings['1C'])
    : null;

  return {
    path: rel,
    country,
    file,
    players: surnames,
    openings,
    competitive,
    tags: { oneClub, oneNT, twoD, transferResp },
    chars: plain.replace(/\s+/g, ' ').length,
    raw: layout,
  };
}

// ---------------------------------------------------------------------------
// Join to the scrape's pairs
// ---------------------------------------------------------------------------

interface ScrapePair {
  surnames: Set<string>;
  label: string;
}

function loadScrapePairs(): ScrapePair[] {
  const file = path.join(SCRAPE_DIR, 'matches.csv');
  if (!existsSync(file)) return [];
  const rows = parseCsv(readFileSync(file, 'utf8'));
  const col = csvColumns(rows);
  const get = (r: string[], name: string): string => r[col.get(name) ?? -1] ?? '';
  const surnameOf = (name: string): string => (name.trim().split(/\s+/)[0] ?? '').toLowerCase();
  const seen = new Map<string, ScrapePair>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    for (const [a, b] of [
      ['open_N', 'open_S'],
      ['open_E', 'open_W'],
      ['closed_N', 'closed_S'],
      ['closed_E', 'closed_W'],
    ]) {
      const s1 = surnameOf(get(r, a));
      const s2 = surnameOf(get(r, b));
      if (!s1 || !s2) continue;
      const key = [s1, s2].sort().join('+');
      if (!seen.has(key)) seen.set(key, { surnames: new Set([s1, s2]), label: `${get(r, a)} / ${get(r, b)}` });
    }
  }
  return [...seen.values()];
}

function matchCard(card: Card, pairs: ScrapePair[]): ScrapePair | null {
  if (card.players.length < 2) return null;
  for (const p of pairs) {
    const hits = card.players.filter((s) => p.surnames.has(s)).length;
    if (hits >= 2) return p;
  }
  // Loose fallback: a single distinctive surname match.
  for (const p of pairs) {
    if (card.players.some((s) => s.length >= 5 && p.surnames.has(s))) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

it('harvest convention cards', async () => {
  const bin = resolvePdftotext();
  mkdirSync(CACHE, { recursive: true });

  console.log(`index: ${SYSTEMS_URL}`);
  const hrefs = await fetchIndex();
  console.log(`  ${hrefs.length} card PDFs listed`);
  if (hrefs.length === 0) throw new Error('no PDFs found — check the URL / page format');

  const cards: Card[] = [];
  let downloaded = 0;
  let empty = 0;
  for (const rel of hrefs) {
    const file = await download(rel);
    if (!file) {
      empty++;
      continue;
    }
    downloaded++;
    const plain = pdfToText(bin, file, false);
    const layout = pdfToText(bin, file, true);
    if (plain.replace(/\s+/g, '').length < 200) {
      empty++; // scanned / image-only card
      cards.push({
        path: rel, country: rel.split('/').slice(-2, -1)[0] ?? '', file: rel.split('/').pop() ?? '',
        players: [], openings: {}, competitive: { overcalls: null, oneNTovercall: null, jumpOvercalls: null, vsNT: [], takeoutDoubles: null },
        tags: { oneClub: null, oneNT: null, twoD: null, transferResp: null }, chars: 0, raw: '',
      });
      continue;
    }
    cards.push(parseCard(rel, plain, layout));
  }
  console.log(`  ${downloaded} downloaded, ${empty} unusable/scanned`);

  // Join to the scrape.
  const pairs = loadScrapePairs();
  let matched = 0;
  const rowsForReport: string[] = [];
  for (const c of cards) {
    const p = matchCard(c, pairs);
    if (p) matched++;
    if (rowsForReport.length < 12 && c.chars > 0) {
      rowsForReport.push(
        `  ${c.country}/${c.file}\n` +
          `     players=${c.players.join(',')} → ${p ? 'MATCHED ' + p.label : 'no scrape pair'}\n` +
          `     1C=${c.tags.oneClub} 1NT=${c.tags.oneNT} 2D=${c.tags.twoD} xferResp=${c.tags.transferResp} vsNT=[${c.competitive.vsNT.join(', ')}]\n` +
          `     open1C="${c.openings['1C'] ?? ''}"`,
      );
    }
  }

  writeFileSync(OUT, JSON.stringify({ source: SYSTEMS_URL, count: cards.length, cards }, null, 1));

  // --- coverage summary ---
  const usable = cards.filter((c) => c.chars > 0);
  const tally = (pick: (c: Card) => string | boolean | null): Map<string, number> => {
    const m = new Map<string, number>();
    for (const c of usable) {
      const v = String(pick(c));
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return m;
  };
  const fmt = (m: Map<string, number>): string =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ');

  console.log(`\n${cards.length} cards (${usable.length} with text), ${pairs.length} scrape pairs`);
  console.log(`joined to a scrape pair: ${matched}/${cards.length}`);
  console.log(`\nDeclared 1C style:   ${fmt(tally((c) => c.tags.oneClub))}`);
  console.log(`Declared 1NT range:  ${fmt(tally((c) => c.tags.oneNT))}`);
  console.log(`Declared 2D:         ${fmt(tally((c) => c.tags.twoD))}`);
  console.log(`Transfer responses:  ${fmt(tally((c) => c.tags.transferResp))}`);
  const nt = new Map<string, number>();
  for (const c of usable) for (const d of c.competitive.vsNT) nt.set(d, (nt.get(d) ?? 0) + 1);
  console.log(`1NT defences seen:   ${fmt(nt)}`);
  console.log(`\nsample parsed cards:\n${rowsForReport.join('\n')}`);
  console.log(`\nfull parse → ${OUT}`);
}, 300_000);
