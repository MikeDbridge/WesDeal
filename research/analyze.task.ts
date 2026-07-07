/**
 * Analysis, focused on 3NT and 4♥/4♠ from balanced / semi-balanced pairs.
 *
 * Population filter (both North AND South): 4333/4432/5332, 6322 with a 6-card
 * minor, 4441/5431 with a stiff A/K/Q in a minor (lib.ts ntEligible).
 *
 * Sources pool cleanly: the eligible subset of the uniform shards has the same
 * distribution as the filter-generated shards (different seed streams, so no
 * duplicate deals). Uniform-only stats use just the uniform shards.
 *
 * Targets: ntNS = DD tricks in NT (better of N/S declaring); majTricks = DD
 * tricks in the pair's longer major (ties: more tricks), again best declarer.
 *
 * Prints the report and writes research/report-pilot.md.
 */

import { it } from 'vitest';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  parsePBN,
  handFeatures,
  shapeClass,
  ntEligible,
  doubletonHonours,
  doubletonClasses,
  SHORT_VALUES_MIN,
  linfit,
  mean,
  sd,
  type ShapeClass,
  type StoredDeal,
} from './lib';

const METRICS = ['hcp', 'bumrap', 'knr', 'controls'] as const;
type Metric = (typeof METRICS)[number];
const METRIC_LABELS: Record<Metric, string> = {
  hcp: 'HCP (4-3-2-1)',
  bumrap: 'BUM-RAP (4.5/3/1.5/0.75/0.25)',
  knr: 'Kaplan-Rubens',
  controls: 'Controls (A=2, K=1)',
};

interface Row {
  uniform: boolean;
  elig: boolean;
  ntNS: number;
  majTricks: number;
  majFit: number;
  m: Record<Metric, number>;
  clsN: ShapeClass | null;
  clsS: ShapeClass | null;
  dblN: number;
  dblS: number;
  /** Doubleton honor classes ("AK", "Kx", "xx", …) across both N and S. */
  dbls: string[];
}

function loadRows(dir: string): Row[] {
  const rows: Row[] = [];
  for (const fn of readdirSync(dir).filter((f) => f.endsWith('.jsonl'))) {
    const uniform = !fn.startsWith('deals-f');
    for (const line of readFileSync(path.join(dir, fn), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const { pbn, dd } = JSON.parse(line) as StoredDeal;
      const hands = parsePBN(pbn);
      const fN = handFeatures(hands.N);
      const fS = handFeatures(hands.S);
      const clsN = shapeClass(hands.N);
      const clsS = shapeClass(hands.S);
      const elig = ntEligible(hands.N) && ntEligible(hands.S); // shape + 1M-route rule
      if (!uniform && !elig) throw new Error(`filtered shard contains ineligible deal: ${pbn}`);

      const fitS = fN.lengths[0] + fS.lengths[0];
      const fitH = fN.lengths[1] + fS.lengths[1];
      const tricksIn = (strain: number): number => Math.max(dd[strain][0], dd[strain][2]);
      let major: number;
      if (fitS > fitH) major = 0;
      else if (fitH > fitS) major = 1;
      else major = tricksIn(0) >= tricksIn(1) ? 0 : 1;

      rows.push({
        uniform,
        elig,
        ntNS: tricksIn(4),
        majTricks: tricksIn(major),
        majFit: major === 0 ? fitS : fitH,
        m: {
          hcp: fN.hcp + fS.hcp,
          bumrap: fN.bumrap + fS.bumrap,
          knr: fN.knr + fS.knr,
          controls: fN.controls + fS.controls,
        },
        clsN,
        clsS,
        dblN: clsN === '5422' ? doubletonHonours(hands.N) : 0,
        dblS: clsS === '5422' ? doubletonHonours(hands.S) : 0,
        dbls: elig ? [...doubletonClasses(hands.N), ...doubletonClasses(hands.S)] : [],
      });
    }
  }
  return rows;
}

const pct = (num: number, den: number): string => (den === 0 ? '—' : `${((num / den) * 100).toFixed(0)}%`);

function fitTable(rows: Row[], target: (r: Row) => number): string[] {
  const ys = rows.map(target);
  const out = ['| metric | r | R² | residual sd (tricks) | tricks per point |', '|---|---|---|---|---|'];
  for (const metric of METRICS) {
    const f = linfit(rows.map((r) => r.m[metric]), ys);
    out.push(
      `| ${METRIC_LABELS[metric]} | ${f.r.toFixed(3)} | ${f.r2.toFixed(3)} | ${f.residSD.toFixed(2)} | ${f.slope.toFixed(3)} |`,
    );
  }
  return out;
}

/** Trick-count distribution table by combined HCP: raw counts for eyeballing. */
function trickDistTable(
  rows: Row[],
  tricksOf: (r: Row) => number,
  buckets: { label: string; has: (t: number) => boolean }[],
  makeAt: number,
  minN: number,
): string[] {
  const byHcp = new Map<number, Row[]>();
  for (const r of rows) {
    const list = byHcp.get(r.m.hcp) ?? [];
    list.push(r);
    byHcp.set(r.m.hcp, list);
  }
  const head = `| HCP | deals | avg tricks | sd | ${buckets.map((b) => b.label).join(' | ')} | P(make) |`;
  const sep = `|${'---|'.repeat(buckets.length + 5)}`;
  const out = [head, sep];
  for (const hcp of [...byHcp.keys()].sort((a, b) => a - b)) {
    const list = byHcp.get(hcp)!;
    if (list.length < minN) continue;
    const tricks = list.map(tricksOf);
    const counts = buckets.map((b) => tricks.filter((t) => b.has(t)).length);
    const made = tricks.filter((t) => t >= makeAt).length;
    out.push(
      `| ${hcp} | ${list.length} | ${mean(tricks).toFixed(2)} | ${sd(tricks).toFixed(2)} | ${counts.join(' | ')} | ${pct(made, list.length)} |`,
    );
  }
  return out;
}

const NT_BUCKETS = [
  { label: '≤6', has: (t: number) => t <= 6 },
  { label: '7', has: (t: number) => t === 7 },
  { label: '8', has: (t: number) => t === 8 },
  { label: '9', has: (t: number) => t === 9 },
  { label: '10', has: (t: number) => t === 10 },
  { label: '11', has: (t: number) => t === 11 },
  { label: '12+', has: (t: number) => t >= 12 },
];
const MAJ_BUCKETS = [
  { label: '≤7', has: (t: number) => t <= 7 },
  { label: '8', has: (t: number) => t === 8 },
  { label: '9', has: (t: number) => t === 9 },
  { label: '10', has: (t: number) => t === 10 },
  { label: '11', has: (t: number) => t === 11 },
  { label: '12+', has: (t: number) => t >= 12 },
];

/** 3NT vs 4M head-to-head on deals with an 8+ card major fit. */
function headToHead(rows: Row[], minN: number): string[] {
  const byHcp = new Map<number, Row[]>();
  for (const r of rows) {
    const list = byHcp.get(r.m.hcp) ?? [];
    list.push(r);
    byHcp.set(r.m.hcp, list);
  }
  const out = [
    '| HCP | deals | avg NT | avg 4M | P(3NT) | P(4M) | 4M✓ 3NT✗ | 3NT✓ 4M✗ |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const hcp of [...byHcp.keys()].sort((a, b) => a - b)) {
    const list = byHcp.get(hcp)!;
    if (list.length < minN) continue;
    const n = list.length;
    const nt9 = list.filter((r) => r.ntNS >= 9).length;
    const mj10 = list.filter((r) => r.majTricks >= 10).length;
    const mjOnly = list.filter((r) => r.majTricks >= 10 && r.ntNS < 9).length;
    const ntOnly = list.filter((r) => r.ntNS >= 9 && r.majTricks < 10).length;
    out.push(
      `| ${hcp} | ${n} | ${mean(list.map((r) => r.ntNS)).toFixed(2)} | ${mean(list.map((r) => r.majTricks)).toFixed(2)} ` +
        `| ${pct(nt9, n)} | ${pct(mj10, n)} | ${pct(mjOnly, n)} | ${pct(ntOnly, n)} |`,
    );
  }
  return out;
}

/** Effect of the major fit length (8+ card fits only), game-zone deals. */
function fitEffect(rows: Row[]): string[] {
  const groups: { label: string; has: (f: number) => boolean }[] = [
    { label: '8', has: (f) => f === 8 },
    { label: '9', has: (f) => f === 9 },
    { label: '10+', has: (f) => f >= 10 },
  ];
  const out = [
    '| major fit | deals | avg NT | avg major | major − NT | P(3NT) | P(4M) |',
    '|---|---|---|---|---|---|---|',
  ];
  for (const g of groups) {
    const list = rows.filter((r) => g.has(r.majFit));
    if (list.length === 0) continue;
    const nt = mean(list.map((r) => r.ntNS));
    const mj = mean(list.map((r) => r.majTricks));
    out.push(
      `| ${g.label} | ${list.length} | ${nt.toFixed(2)} | ${mj.toFixed(2)} | ${(mj - nt).toFixed(2)} ` +
        `| ${pct(list.filter((r) => r.ntNS >= 9).length, list.length)} | ${pct(list.filter((r) => r.majTricks >= 10).length, list.length)} |`,
    );
  }
  return out;
}

const STRICT_BAL = new Set<ShapeClass>(['4333', '4432', '5332']);
const isBal = (c: ShapeClass | null): boolean => c !== null && STRICT_BAL.has(c);

/**
 * Reference line for "at equal HCP" comparisons: NT tricks ~ combined HCP,
 * fitted on deals where both hands are strictly balanced.
 */
function balancedBaseline(rows: Row[]): { n: number; residOf: (r: Row) => number } {
  const base = rows.filter((r) => isBal(r.clsN) && isBal(r.clsS));
  const fit = linfit(base.map((r) => r.m.hcp), base.map((r) => r.ntNS));
  return { n: base.length, residOf: (r) => r.ntNS - (fit.intercept + fit.slope * r.m.hcp) };
}

// Doubleton holding classes, strongest first, for the honors-in-doubletons table.
const DBL_ORDER = ['AK', 'AQ', 'AJ', 'AT', 'Ax', 'KQ', 'KJ', 'KT', 'Kx', 'QJ', 'QT', 'Qx', 'JT', 'Jx', 'Tx', 'xx'];

/**
 * NT performance by specific doubleton holding (honors and honor pairings).
 * Every doubleton held by N or S in a study deal contributes one sample with
 * that deal's residual, so a deal with several doubletons appears several
 * times — fine for eyeballing relative quality.
 */
function doubletonTable(rows: Row[]): string[] {
  const { n, residOf } = balancedBaseline(rows);
  const acc = new Map<string, { resid: number[]; hcp: number[] }>();
  for (const r of rows) {
    for (const d of r.dbls) {
      const slot = acc.get(d) ?? { resid: [], hcp: [] };
      slot.resid.push(residOf(r));
      slot.hcp.push(r.m.hcp);
      acc.set(d, slot);
    }
  }
  const out = [
    `Baseline: both-strictly-balanced deals (n=${n}). Each doubleton held by N or S contributes the deal's residual.`,
    '',
    '| doubleton | samples | avg deal HCP | NT tricks vs baseline |',
    '|---|---|---|---|',
  ];
  for (const cls of DBL_ORDER) {
    const slot = acc.get(cls);
    if (!slot) continue;
    const m = mean(slot.resid);
    out.push(`| ${cls} | ${slot.resid.length} | ${mean(slot.hcp).toFixed(1)} | ${m >= 0 ? '+' : ''}${m.toFixed(2)} |`);
  }
  return out;
}

/**
 * NT performance of each shape class at equal HCP: mean residual vs a baseline
 * fitted on deals where BOTH hands are strictly balanced. Each qualifying deal
 * contributes one sample per seat whose partner is strictly balanced (so a
 * 4432 + 4333 deal appears once in each of those rows). 5422 is split by how
 * many honor cards (T+) sit in its two doubletons — the user's KT/AJ question.
 */
function shapeResidualTable(rows: Row[]): string[] {
  const { n: baseN, residOf } = balancedBaseline(rows);

  interface Cat {
    label: string;
    match: (cls: ShapeClass, dbl: number) => boolean;
  }
  const cats: Cat[] = [
    { label: '4333', match: (c) => c === '4333' },
    { label: '4432', match: (c) => c === '4432' },
    { label: '5332', match: (c) => c === '5332' },
    { label: '6m322', match: (c) => c === '6m322' },
    { label: '4441 (stiff mH)', match: (c) => c === '4441' },
    { label: '5431 (stiff mH)', match: (c) => c === '5431' },
    { label: '5422 · 0 dblton honors', match: (c, d) => c === '5422' && d === 0 },
    { label: '5422 · 1 dblton honor', match: (c, d) => c === '5422' && d === 1 },
    { label: '5422 · 2 dblton honors', match: (c, d) => c === '5422' && d === 2 },
    { label: '5422 · 3+ dblton honors', match: (c, d) => c === '5422' && d >= 3 },
  ];
  const samples = cats.map(() => ({ resid: [] as number[], hcp: [] as number[] }));
  const add = (cls: ShapeClass | null, dbl: number, r: Row): void => {
    if (cls === null) return;
    const i = cats.findIndex((c) => c.match(cls, dbl));
    if (i < 0) return;
    samples[i].resid.push(residOf(r));
    samples[i].hcp.push(r.m.hcp);
  };
  for (const r of rows) {
    if (isBal(r.clsS)) add(r.clsN, r.dblN, r);
    if (isBal(r.clsN)) add(r.clsS, r.dblS, r);
  }

  const out = [
    `Baseline: NT tricks ~ combined HCP, fitted on both-strictly-balanced deals (n=${baseN}).`,
    `Each row: hands of that shape whose PARTNER is strictly balanced; residual = NT tricks vs baseline at the same HCP.`,
    '',
    '| shape (partner balanced) | samples | avg HCP | NT tricks vs baseline |',
    '|---|---|---|---|',
  ];
  cats.forEach((cat, i) => {
    const s = samples[i];
    if (s.resid.length === 0) return;
    const m = mean(s.resid);
    out.push(
      `| ${cat.label} | ${s.resid.length} | ${mean(s.hcp).toFixed(1)} | ${m >= 0 ? '+' : ''}${m.toFixed(2)} |`,
    );
  });
  return out;
}

it('analyze the dataset (3NT / 4M focus)', () => {
  const dir = path.join(import.meta.dirname, 'data');
  if (!existsSync(dir)) throw new Error('No dataset found — run `npm run research:gen` first.');
  const rows = loadRows(dir);
  const uniform = rows.filter((r) => r.uniform);
  const study = rows.filter((r) => r.elig);
  const gameZone = study.filter((r) => r.m.hcp >= 22 && r.m.hcp <= 28);
  const fitDeals = study.filter((r) => r.majFit >= 8);

  const lines: string[] = [];
  const push = (...ls: string[]): void => {
    lines.push(...ls);
  };

  push(`# Hand evaluation vs double dummy — 3NT / 4M study`, '');
  push(
    `Deals: ${rows.length} total (${uniform.length} uniform + ${rows.length - uniform.length} filter-generated).`,
    `Study population (both N and S balanced/semi-balanced): **${study.length}** deals` +
      (uniform.length ? ` — ${((uniform.filter((r) => r.elig).length / uniform.length) * 100).toFixed(1)}% of random deals qualify.` : '.'),
    '',
    `Shapes: 4333/4432/5332, 6322 (6-card minor), 4441/5431 with stiff A/K/Q in a minor,`,
    `5422 except exactly 5♠-4♥ (doubleton honor quality measured below, not gated); both hands must qualify.`,
    `1M-route rule: 15-16 HCP with a 5+ major and a 4+ card lower suit is excluded unless`,
    `≥${SHORT_VALUES_MIN} HCP sit outside the two long suits. Major-fit analysis covers 8+ card fits only.`,
    `Tricks are double dummy, better of N/S declaring. 4M = the pair's longer major.`,
    '',
  );

  push(`## Metric accuracy, study population → NT tricks`, '');
  push(...fitTable(study, (r) => r.ntNS), '');
  push(`(For reference, on ALL uniform deals: )`, '');
  push(...fitTable(uniform, (r) => r.ntNS), '');

  push(`## Eyeball table: NT tricks by combined HCP (study population)`, '');
  push(`Counts of deals taking each number of NT tricks. P(make) = 9+ tricks.`, '');
  push(...trickDistTable(study, (r) => r.ntNS, NT_BUCKETS, 9, 10), '');

  push(`## Eyeball table: major-suit tricks by combined HCP (8+ card fit only, n=${fitDeals.length})`, '');
  push(`Counts of deals taking each number of tricks in the longer major. P(make) = 10+ tricks.`, '');
  push(...trickDistTable(fitDeals, (r) => r.majTricks, MAJ_BUCKETS, 10, 10), '');

  push(`## 3NT vs 4M head-to-head (8+ card major fit)`, '');
  push(...headToHead(fitDeals, 10), '');

  push(`## Fit-length effect, 8+ card major fits (game zone: 22–28 combined HCP)`, '');
  push(...fitEffect(gameZone), '');

  push(`## Shape quality in NT at equal HCP (incl. the 5422 doubleton-honor question)`, '');
  push(...shapeResidualTable(study), '');

  push(`## Honors in doubletons — specific holdings and pairings`, '');
  push(...doubletonTable(study), '');

  const report = lines.join('\n');
  console.log('\n' + report);
  writeFileSync(path.join(import.meta.dirname, 'report-pilot.md'), report + '\n');
}, 600_000);
