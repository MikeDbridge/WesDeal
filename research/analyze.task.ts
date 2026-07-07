/**
 * Full analysis: how accurate are the classic evaluators, and can a fitted one
 * beat them? 3NT / 4M focus, balanced & semi-balanced pairs (see lib.ts rules).
 *
 * Data: research/data/*.jsonl. Filter-generated shards f0–f5 train any fitted
 * models; shards f6–f7 are a held-out test set (different seed streams, so the
 * split is clean). Uniform shards contribute to training and population stats.
 *
 * Targets: ntNS = DD tricks in NT (better of N/S declaring; that seat is "the
 * declarer" below); majTricks = DD tricks in the pair's longer major.
 *
 * Writes research/report.md.
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
  olsFit,
  olsPredict,
  auc,
  bestThreshold,
  fiftyPct,
  pearson,
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
  /** Filtered-shard index, or -1 for uniform shards. */
  shard: number;
  elig: boolean;
  pbn: string;
  ntNS: number;
  make: boolean; // 9+ NT tricks
  majTricks: number;
  majFit: number;
  m: Record<Metric, number>;
  clsN: ShapeClass | null;
  clsS: ShapeClass | null;
  dblHonN: number;
  dblHonS: number;
  /** Doubleton classes in the declarer's / dummy's hand (empty when N/S tie). */
  dblDecl: string[];
  dblDummy: string[];
  declIsStronger: boolean | null; // null on trick-tie or equal HCP
  /** Pair counts of A,K,Q,J,T,9,8. */
  cnt: number[];
  maxComb: number;
  qjDbl: number;
  stiffH: number;
  flat: number;
  tens: number;
  aces: number;
  unguarded: number;
}

function suitRanksOf(cards: number[]): number[][] {
  const suits: number[][] = [[], [], [], []];
  for (const c of cards) suits[(c / 13) | 0].push((c % 13) + 2);
  return suits;
}

function loadRows(dir: string): Row[] {
  const rows: Row[] = [];
  for (const fn of readdirSync(dir).filter((f) => f.endsWith('.jsonl'))) {
    const fMatch = /^deals-f(\d+)\.jsonl$/.exec(fn);
    const shard = fMatch ? Number.parseInt(fMatch[1], 10) : -1;
    const uniform = shard === -1;
    for (const line of readFileSync(path.join(dir, fn), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const { pbn, dd } = JSON.parse(line) as StoredDeal;
      const hands = parsePBN(pbn);
      const fN = handFeatures(hands.N);
      const fS = handFeatures(hands.S);
      const clsN = shapeClass(hands.N);
      const clsS = shapeClass(hands.S);
      const elig = ntEligible(hands.N) && ntEligible(hands.S);
      if (!uniform && !elig) throw new Error(`filtered shard contains ineligible deal: ${pbn}`);

      const fitS = fN.lengths[0] + fS.lengths[0];
      const fitH = fN.lengths[1] + fS.lengths[1];
      const tricksIn = (strain: number): number => Math.max(dd[strain][0], dd[strain][2]);
      let major: number;
      if (fitS > fitH) major = 0;
      else if (fitH > fitS) major = 1;
      else major = tricksIn(0) >= tricksIn(1) ? 0 : 1;

      // Pair-level card counts and structural features.
      const suitsN = suitRanksOf(hands.N);
      const suitsS = suitRanksOf(hands.S);
      const cnt = [0, 0, 0, 0, 0, 0, 0]; // A K Q J T 9 8
      for (const suits of [suitsN, suitsS]) {
        for (const s of suits) for (const r of s) if (r >= 8) cnt[14 - r] += 1;
      }
      let qjDbl = 0;
      let stiffH = 0;
      for (const suits of [suitsN, suitsS]) {
        for (const s of suits) {
          if (s.length === 2) qjDbl += s.filter((r) => r === 12 || r === 11).length;
          if (s.length === 1 && s[0] >= 12) stiffH++;
        }
      }
      let maxComb = 0;
      let unguarded = 0;
      for (let su = 0; su < 4; su++) {
        const comb = fN.lengths[su] + fS.lengths[su];
        if (comb > maxComb) maxComb = comb;
        const top = Math.max(0, ...suitsN[su], ...suitsS[su]);
        if (top < 12) unguarded++;
      }

      // Declarer = the seat whose NT declaration scores better (tie → excluded
      // from declarer-specific tables).
      const nDecl = dd[4][0];
      const sDecl = dd[4][2];
      let dblDecl: string[] = [];
      let dblDummy: string[] = [];
      let declIsStronger: boolean | null = null;
      if (elig && nDecl !== sDecl) {
        const declN = nDecl > sDecl;
        dblDecl = doubletonClasses(declN ? hands.N : hands.S);
        dblDummy = doubletonClasses(declN ? hands.S : hands.N);
        const dHcp = declN ? fN.hcp : fS.hcp;
        const oHcp = declN ? fS.hcp : fN.hcp;
        declIsStronger = dHcp === oHcp ? null : dHcp > oHcp;
      }

      const ntNS = tricksIn(4);
      rows.push({
        uniform,
        shard,
        elig,
        pbn,
        ntNS,
        make: ntNS >= 9,
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
        dblHonN: clsN === '5422' ? doubletonHonours(hands.N) : 0,
        dblHonS: clsS === '5422' ? doubletonHonours(hands.S) : 0,
        dblDecl,
        dblDummy,
        declIsStronger,
        cnt,
        maxComb,
        qjDbl,
        stiffH,
        flat: (clsN === '4333' ? 1 : 0) + (clsS === '4333' ? 1 : 0),
        tens: fN.tens + fS.tens,
        aces: fN.aces + fS.aces,
        unguarded,
      });
    }
  }
  return rows;
}

const pct = (num: number, den: number): string => (den === 0 ? '—' : `${((num / den) * 100).toFixed(0)}%`);
const signed = (x: number, dp = 2): string => `${x >= 0 ? '+' : ''}${x.toFixed(dp)}`;

const STRICT_BAL = new Set<ShapeClass>(['4333', '4432', '5332']);
const isBal = (c: ShapeClass | null): boolean => c !== null && STRICT_BAL.has(c);

function balancedBaseline(rows: Row[]): { n: number; residOf: (r: Row) => number } {
  const base = rows.filter((r) => isBal(r.clsN) && isBal(r.clsS));
  const fit = linfit(base.map((r) => r.m.hcp), base.map((r) => r.ntNS));
  return { n: base.length, residOf: (r) => r.ntNS - (fit.intercept + fit.slope * r.m.hcp) };
}

// ---- Part A: the method comparison -----------------------------------------

interface Scorer {
  label: string;
  unit: string;
  scoreOf: (r: Row) => number;
}

function comparisonTable(scorers: Scorer[], train: Row[], test: Row[], zone: (r: Row) => boolean): string[] {
  const out = [
    '| method | r | R² | resid sd | AUC(3NT) | 50% make at | bid-3NT accuracy (all / 22-27) |',
    '|---|---|---|---|---|---|---|',
  ];
  const testZone = test.filter(zone);
  const trainZone = train.filter(zone);
  for (const s of scorers) {
    const ts = test.map(s.scoreOf);
    const ty = test.map((r) => r.ntNS);
    const f = linfit(ts, ty);
    const a = auc(ts, test.map((r) => r.make));
    const fifty = fiftyPct(train.map(s.scoreOf), train.map((r) => r.make));
    const thrAll = bestThreshold(train.map(s.scoreOf), train.map((r) => r.make)).thr;
    const accAll = mean(test.map((r) => (s.scoreOf(r) >= thrAll) === r.make ? 1 : 0));
    const thrZone = bestThreshold(trainZone.map(s.scoreOf), trainZone.map((r) => r.make)).thr;
    const accZone = mean(testZone.map((r) => (s.scoreOf(r) >= thrZone) === r.make ? 1 : 0));
    out.push(
      `| ${s.label} | ${f.r.toFixed(3)} | ${f.r2.toFixed(3)} | ${f.residSD.toFixed(2)} | ${a.toFixed(3)} ` +
        `| ${fifty === null ? '—' : fifty.toFixed(1)} ${s.unit} | ${pct(accAll * test.length, test.length)} / ${pct(accZone * testZone.length, testZone.length)} |`,
    );
  }
  return out;
}

function disagreementTable(test: Row[], hcpOf: (r: Row) => number, wesOf: (r: Row) => number, hcpThr: number, wesThr: number): string[] {
  const groups = [
    { label: 'both say bid', f: (r: Row) => hcpOf(r) >= hcpThr && wesOf(r) >= wesThr },
    { label: 'both say pass', f: (r: Row) => hcpOf(r) < hcpThr && wesOf(r) < wesThr },
    { label: 'HCP bids, model passes', f: (r: Row) => hcpOf(r) >= hcpThr && wesOf(r) < wesThr },
    { label: 'model bids, HCP passes', f: (r: Row) => hcpOf(r) < hcpThr && wesOf(r) >= wesThr },
  ];
  const out = ['| decision | deals | P(3NT makes) | avg NT tricks |', '|---|---|---|---|'];
  for (const g of groups) {
    const list = test.filter(g.f);
    if (list.length === 0) continue;
    out.push(
      `| ${g.label} | ${list.length} | ${pct(list.filter((r) => r.make).length, list.length)} | ${mean(list.map((r) => r.ntNS)).toFixed(2)} |`,
    );
  }
  return out;
}

// ---- Part B tables (eyeball) ------------------------------------------------

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
    out.push(
      `| ${hcp} | ${n} | ${mean(list.map((r) => r.ntNS)).toFixed(2)} | ${mean(list.map((r) => r.majTricks)).toFixed(2)} ` +
        `| ${pct(list.filter((r) => r.ntNS >= 9).length, n)} | ${pct(list.filter((r) => r.majTricks >= 10).length, n)} ` +
        `| ${pct(list.filter((r) => r.majTricks >= 10 && r.ntNS < 9).length, n)} | ${pct(list.filter((r) => r.ntNS >= 9 && r.majTricks < 10).length, n)} |`,
    );
  }
  return out;
}

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

function shapeResidualTable(rows: Row[], residOf: (r: Row) => number, baseN: number): string[] {
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
    if (isBal(r.clsS)) add(r.clsN, r.dblHonN, r);
    if (isBal(r.clsN)) add(r.clsS, r.dblHonS, r);
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
    out.push(`| ${cat.label} | ${s.resid.length} | ${mean(s.hcp).toFixed(1)} | ${signed(mean(s.resid))} |`);
  });
  return out;
}

const DBL_ORDER = ['AK', 'AQ', 'AJ', 'AT', 'Ax', 'KQ', 'KJ', 'KT', 'Kx', 'QJ', 'QT', 'Qx', 'JT', 'Jx', 'Tx', 'xx'];

/** Doubleton holdings in the DECLARER's hand (dummy shown for contrast). */
function doubletonTable(rows: Row[], residOf: (r: Row) => number): string[] {
  const acc = new Map<string, { decl: number[]; dummy: number[] }>();
  let ties = 0;
  for (const r of rows) {
    if (r.dblDecl.length === 0 && r.dblDummy.length === 0) {
      ties++;
      continue;
    }
    for (const d of r.dblDecl) {
      const slot = acc.get(d) ?? { decl: [], dummy: [] };
      slot.decl.push(residOf(r));
      acc.set(d, slot);
    }
    for (const d of r.dblDummy) {
      const slot = acc.get(d) ?? { decl: [], dummy: [] };
      slot.dummy.push(residOf(r));
      acc.set(d, slot);
    }
  }
  const out = [
    `Declarer = the seat whose NT declaration scores better; N/S trick-ties (${pct(ties, rows.length)} of deals) excluded.`,
    `Residual = deal's NT tricks vs the balanced baseline at equal HCP.`,
    '',
    '| doubleton | in declarer: n | vs baseline | in dummy: n | vs baseline |',
    '|---|---|---|---|---|',
  ];
  for (const cls of DBL_ORDER) {
    const slot = acc.get(cls);
    if (!slot || (slot.decl.length === 0 && slot.dummy.length === 0)) continue;
    const d = slot.decl.length ? signed(mean(slot.decl)) : '—';
    const u = slot.dummy.length ? signed(mean(slot.dummy)) : '—';
    out.push(`| ${cls} | ${slot.decl.length} | ${d} | ${slot.dummy.length} | ${u} |`);
  }
  return out;
}

it('analyze the dataset (3NT / 4M focus)', () => {
  const dir = path.join(import.meta.dirname, 'data');
  if (!existsSync(dir)) throw new Error('No dataset found — run `npm run research:gen` first.');
  const rows = loadRows(dir);
  const uniform = rows.filter((r) => r.uniform);
  const study = rows.filter((r) => r.elig);
  const train = study.filter((r) => r.shard <= 5); // uniform (-1) + shards 0-5
  const test = study.filter((r) => r.shard >= 6);
  const zone = (r: Row): boolean => r.m.hcp >= 22 && r.m.hcp <= 27;
  const gameZone = study.filter((r) => r.m.hcp >= 22 && r.m.hcp <= 28);
  const fitDeals = study.filter((r) => r.majFit >= 8);
  const { n: baseN, residOf } = balancedBaseline(study);

  // ---- Fitted evaluators (train only) ----
  const honors6 = (r: Row): number[] => r.cnt.slice(0, 6); // A K Q J T 9
  const featV1 = (r: Row): number[] => [...r.cnt, r.maxComb, r.qjDbl, r.stiffH, r.flat];
  const beta0 = olsFit(train.map(honors6), train.map((r) => r.ntNS));
  const beta1 = olsFit(train.map(featV1), train.map((r) => r.ntNS));
  const wes0 = (r: Row): number => olsPredict(beta0, honors6(r));
  const wes1 = (r: Row): number => olsPredict(beta1, featV1(r));

  const scorers: Scorer[] = [
    { label: METRIC_LABELS.hcp, unit: 'pts', scoreOf: (r) => r.m.hcp },
    { label: METRIC_LABELS.bumrap, unit: 'pts', scoreOf: (r) => r.m.bumrap },
    { label: METRIC_LABELS.knr, unit: 'pts', scoreOf: (r) => r.m.knr },
    { label: METRIC_LABELS.controls, unit: 'ctrl', scoreOf: (r) => r.m.controls },
    { label: 'Fitted: honors only (v0)', unit: 'tricks', scoreOf: wes0 },
    { label: 'Fitted: honors + structure (v1)', unit: 'tricks', scoreOf: wes1 },
  ];

  const lines: string[] = [];
  const push = (...ls: string[]): void => {
    lines.push(...ls);
  };

  push(`# Hand evaluation vs double dummy — full study`, '');
  push(
    `Deals: ${rows.length} total (${uniform.length} uniform + ${rows.length - uniform.length} filter-generated).`,
    `Study population (both hands balanced/semi-balanced): **${study.length}** deals` +
      (uniform.length ? ` — ${((uniform.filter((r) => r.elig).length / uniform.length) * 100).toFixed(1)}% of random deals qualify.` : '.'),
    `Train: ${train.length} deals (uniform + shards f0-f5) · held-out test: ${test.length} deals (shards f6-f7).`,
    '',
    `Shapes: 4333/4432/5332, 6322 (6-card minor), 4441/5431 with stiff A/K/Q in a minor,`,
    `5422 except exactly 5♠-4♥. 1M-route rule: 15-16 HCP with a 5+ major and a 4+ card lower`,
    `suit is excluded unless ≥${SHORT_VALUES_MIN} HCP sit outside the two long suits. 8+ card major fits only.`,
    `Tricks are double dummy, better of N/S declaring.`,
    '',
  );

  // ---- Part A ----
  push(`# Part A — the method comparison (main goal)`, '');
  push(`## A1. Accuracy on the held-out test set`, '');
  push(
    `AUC = probability the method ranks a making 3NT deal above a failing one.`,
    `"Bid-3NT accuracy": threshold chosen on training data, applied to test deals (all, and within the 22-27 HCP decision zone).`,
    '',
  );
  push(...comparisonTable(scorers, train, test, zone), '');

  push(`## A2. What each card is actually worth (fitted on ${train.length} training deals)`, '');
  const coefK = beta0[2];
  push(
    `Per-card NT trick values from regression (v0), rescaled so K = 3 points for comparison:`,
    '',
    '| card | Work (4321) | BUM-RAP | fitted points (K=3) | raw tricks/card |',
    '|---|---|---|---|---|',
  );
  const WORK = [4, 3, 2, 1, 0, 0];
  const BUM = [4.5, 3, 1.5, 0.75, 0.25, 0];
  const CARD_NAMES = ['A', 'K', 'Q', 'J', 'T', '9'];
  CARD_NAMES.forEach((name, i) => {
    const coef = beta0[i + 1];
    push(`| ${name} | ${WORK[i]} | ${BUM[i]} | ${((coef * 3) / coefK).toFixed(2)} | ${coef.toFixed(3)} |`);
  });
  push('');

  push(`## A3. Structure adjustments (v1 coefficients, in tricks)`, '');
  push(
    '| feature | tricks per unit |',
    '|---|---|',
    `| eight (count) | ${signed(beta1[7], 3)} |`,
    `| longest combined suit (per card) | ${signed(beta1[8], 3)} |`,
    `| Q/J in a doubleton (per card) | ${signed(beta1[9], 3)} |`,
    `| stiff A/K/Q (per hand) | ${signed(beta1[10], 3)} |`,
    `| 4333 hand (per hand) | ${signed(beta1[11], 3)} |`,
    '',
  );

  push(`## A4. Signal beyond HCP (partial correlation with NT tricks, test set)`, '');
  const hcpFit = linfit(train.map((r) => r.m.hcp), train.map((r) => r.ntNS));
  const trickResid = (r: Row): number => r.ntNS - (hcpFit.intercept + hcpFit.slope * r.m.hcp);
  push('| method | partial r after removing HCP |', '|---|---|');
  for (const s of scorers.slice(1)) {
    const mFit = linfit(train.map((r) => r.m.hcp), train.map(s.scoreOf));
    const pr = pearson(
      test.map(trickResid),
      test.map((r) => s.scoreOf(r) - (mFit.intercept + mFit.slope * r.m.hcp)),
    );
    push(`| ${s.label} | ${pr.toFixed(3)} |`);
  }
  push('');

  push(`## A5. When the fitted model and HCP disagree (test set, 3NT decision)`, '');
  const hcpThr = bestThreshold(train.map((r) => r.m.hcp), train.map((r) => r.make)).thr;
  const wesThr = bestThreshold(train.map(wes1), train.map((r) => r.make)).thr;
  push(`HCP bids with ≥ ${hcpThr.toFixed(1)} combined; the model bids when it predicts ≥ ${wesThr.toFixed(2)} tricks.`, '');
  push(...disagreementTable(test, (r) => r.m.hcp, wes1, hcpThr, wesThr), '');

  const wesBids = test.filter((r) => r.m.hcp < hcpThr && wes1(r) >= wesThr && r.make).slice(0, 3);
  const hcpBids = test.filter((r) => r.m.hcp >= hcpThr && wes1(r) < wesThr && !r.make).slice(0, 3);
  if (wesBids.length || hcpBids.length) {
    push(`### Example deals`, '');
    for (const r of wesBids) push(`- Model right to bid (HCP ${r.m.hcp}, predicted ${wes1(r).toFixed(1)}, took ${r.ntNS}): \`${r.pbn}\``);
    for (const r of hcpBids) push(`- Model right to pass (HCP ${r.m.hcp}, predicted ${wes1(r).toFixed(1)}, took ${r.ntNS}): \`${r.pbn}\``);
    push('');
  }

  // ---- Part B ----
  push(`# Part B — eyeball tables and side questions`, '');
  push(`## B1. NT tricks by combined HCP (study population)`, '');
  push(...trickDistTable(study, (r) => r.ntNS, NT_BUCKETS, 9, 25), '');
  push(`## B2. Major-suit tricks by combined HCP (8+ card fit, n=${fitDeals.length})`, '');
  push(...trickDistTable(fitDeals, (r) => r.majTricks, MAJ_BUCKETS, 10, 25), '');
  push(`## B3. 3NT vs 4M head-to-head (8+ card major fit)`, '');
  push(...headToHead(fitDeals, 25), '');
  push(`## B4. Fit-length effect, 8+ card fits (22-28 HCP)`, '');
  push(...fitEffect(gameZone.filter((r) => r.majFit >= 8)), '');
  push(`## B5. Shape quality in NT at equal HCP`, '');
  push(...shapeResidualTable(study, residOf, baseN), '');

  push(`## B6. Doubletons in the DECLARER's hand (dummy for contrast)`, '');
  const stronger = study.filter((r) => r.declIsStronger !== null);
  push(
    `Context: the better-declaring seat is also the higher-HCP hand on ${pct(stronger.filter((r) => r.declIsStronger).length, stronger.length)} of (non-tied) deals.`,
    '',
  );
  push(...doubletonTable(study, residOf), '');

  push(`## B7. Tens (pair total) at equal HCP`, '');
  push('| tens | samples | NT tricks vs baseline | P(3NT) at 24-26 HCP |', '|---|---|---|---|');
  for (const t of [0, 1, 2, 3, 4]) {
    const list = study.filter((r) => (t === 4 ? r.tens >= 4 : r.tens === t));
    if (list.length < 25) continue;
    const zoneList = list.filter((r) => r.m.hcp >= 24 && r.m.hcp <= 26);
    push(
      `| ${t === 4 ? '4+' : t} | ${list.length} | ${signed(mean(list.map(residOf)))} | ${pct(zoneList.filter((r) => r.make).length, zoneList.length)}${zoneList.length ? ` (n=${zoneList.length})` : ''} |`,
    );
  }
  push('');

  push(`## B8. Aces at the 3NT boundary (24-26 combined HCP)`, '');
  push('| pair aces | deals | avg NT tricks | P(3NT) |', '|---|---|---|---|');
  const boundary = study.filter((r) => r.m.hcp >= 24 && r.m.hcp <= 26);
  for (const a of [1, 2, 3, 4]) {
    const list = boundary.filter((r) => (a === 1 ? r.aces <= 1 : r.aces === a));
    if (list.length < 15) continue;
    push(`| ${a === 1 ? '≤1' : a} | ${list.length} | ${mean(list.map((r) => r.ntNS)).toFixed(2)} | ${pct(list.filter((r) => r.make).length, list.length)} |`);
  }
  push('');

  push(`## B9. Unguarded suits (no A/K/Q between the hands), 23-27 HCP`, '');
  const zone2327 = study.filter((r) => r.m.hcp >= 23 && r.m.hcp <= 27);
  push('| unguarded suits | deals | avg NT tricks | P(3NT) |', '|---|---|---|---|');
  for (const u of [0, 1, 2]) {
    const list = zone2327.filter((r) => (u === 2 ? r.unguarded >= 2 : r.unguarded === u));
    if (list.length < 15) continue;
    push(`| ${u === 2 ? '2+' : u} | ${list.length} | ${mean(list.map((r) => r.ntNS)).toFixed(2)} | ${pct(list.filter((r) => r.make).length, list.length)} |`);
  }
  push('');

  push(`## B10. Which pairs are predictable? (residual sd vs HCP baseline)`, '');
  push('| pair type | deals | resid sd (tricks) |', '|---|---|---|');
  const pairCats: { label: string; f: (r: Row) => boolean }[] = [
    { label: 'both 4333', f: (r) => r.clsN === '4333' && r.clsS === '4333' },
    { label: 'both strictly balanced', f: (r) => isBal(r.clsN) && isBal(r.clsS) },
    { label: 'at least one semi-balanced', f: (r) => !isBal(r.clsN) || !isBal(r.clsS) },
  ];
  for (const c of pairCats) {
    const list = study.filter(c.f);
    if (list.length < 25) continue;
    push(`| ${c.label} | ${list.length} | ${sd(list.map(residOf)).toFixed(2)} |`);
  }
  push('');

  const report = lines.join('\n');
  console.log('\n' + report);
  writeFileSync(path.join(import.meta.dirname, 'report.md'), report + '\n');
}, 600_000);
