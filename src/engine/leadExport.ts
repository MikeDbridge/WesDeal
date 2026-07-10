/**
 * Text export for the opening-lead analyser: a human-readable summary of the
 * conditions used and the results, with unicode sparkline charts for the leads
 * the user has expanded. Pure (no DOM) so it can be unit-tested; the image
 * export in ../ui/leadImage.ts renders the same data to a canvas.
 */

import { SEATS, type Seat } from './deal';
import { SUITS, SUIT_SYMBOLS } from './cards';
import { DD_STRAIN_LABELS } from './dd';
import { avgDefenderScore, declarerFor, type LeadRow } from './lead';
import type { FormState } from './shareState';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };
const SHAPE_LABELS: Record<string, string> = {
  balanced: 'balanced',
  unbalanced: 'unbalanced',
  semiNT: 'semi-balanced (NT)',
};

/** Everything both exporters need about one finished analysis. */
export interface LeadSummaryInput {
  /** Contract level 1..7. */
  level: number;
  /** Strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT. */
  strain: number;
  /** Opening-leader seat index (0=N 1=E 2=S 3=W). */
  leader: number;
  /** Deals actually solved. */
  deals: number;
  /** Deals requested (may exceed `deals` if stopped early). */
  requested: number;
  seed: number;
  vul: boolean;
  /** Share of deals the defence can beat the contract (0..1). */
  beatsPct: number;
  rows: LeadRow[];
  /** Keys ("suit-rank") of the rows the user expanded — charted in full. */
  openKeys: string[];
  /** Pre-rendered condition lines (from describeConditions). */
  conditions: string[];
}

const SPARK = ' ▁▂▃▄▅▆▇█';

function cardText(suit: number, label: string): string {
  return SUIT_SYMBOLS[SUITS[suit]] + label;
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Describe the form's conditions as readable lines (leader seat annotated). */
export function describeConditions(form: FormState, leaderSeat: Seat | null): string[] {
  const lines: string[] = [];
  for (const seat of SEATS) {
    const s = form.seats?.[seat];
    if (!s) continue;
    const tag = seat === leaderSeat ? ' (leader)' : '';
    if (s.locked) {
      const holdings = s.hand.trim().split(/\s+/);
      const shown = SUITS.map((suit, i) => {
        const held = holdings[i] ?? '';
        return `${SUIT_SYMBOLS[suit]}${held === '' || held === '-' ? '—' : held}`;
      }).join(' ');
      lines.push(`${SEAT_NAMES[seat]}${tag}: ${shown}`);
      continue;
    }
    const parts: string[] = [];
    if (s.hcp.trim()) parts.push(`${s.hcp.trim()} HCP`);
    if (s.knr.trim()) parts.push(`${s.knr.trim()} KnR`);
    SUITS.forEach((suit, i) => {
      const len = (s.len?.[i] ?? '').trim();
      if (len) parts.push(`${SUIT_SYMBOLS[suit]}${len}`);
    });
    if (s.shape && s.shape !== 'any') parts.push(SHAPE_LABELS[s.shape] ?? s.shape);
    if (s.filter.trim()) parts.push(`ƒ: ${s.filter.trim()}`);
    if (parts.length) lines.push(`${SEAT_NAMES[seat]}${tag}: ${parts.join(', ')}`);
  }

  const p = form.partner;
  const pair: string[] = [];
  if (p) {
    const ns: string[] = [];
    if (p.nsHcp?.trim()) ns.push(`${p.nsHcp.trim()} HCP`);
    if (p.nsKnr?.trim()) ns.push(`${p.nsKnr.trim()} KnR`);
    if (ns.length) pair.push(`N+S ${ns.join(', ')}`);
    const ew: string[] = [];
    if (p.ewHcp?.trim()) ew.push(`${p.ewHcp.trim()} HCP`);
    if (p.ewKnr?.trim()) ew.push(`${p.ewKnr.trim()} KnR`);
    if (ew.length) pair.push(`E+W ${ew.join(', ')}`);
  }
  if (pair.length) lines.push(pair.join(' · '));

  if (lines.length === 0) lines.push('No constraints — random deals.');
  return lines;
}

/** The trick-count range [min, max] spanned by a set of rows. */
export function trickRange(rows: LeadRow[]): [number, number] {
  let minT = 13;
  let maxT = 0;
  for (const r of rows) {
    for (let t = 0; t <= 13; t++) {
      if (r.counts[t] > 0) {
        if (t < minT) minT = t;
        if (t > maxT) maxT = t;
      }
    }
  }
  return minT > maxT ? [0, 0] : [minT, maxT];
}

function sparkLine(r: LeadRow, minT: number, maxT: number): string {
  let maxShare = 0;
  for (let t = minT; t <= maxT; t++) maxShare = Math.max(maxShare, r.counts[t] / r.n);
  let bars = '';
  const labels: string[] = [];
  for (let t = minT; t <= maxT; t++) {
    const share = r.counts[t] / r.n;
    const lvl = share === 0 || maxShare === 0 ? 0 : Math.max(1, Math.round((share / maxShare) * 8));
    bars += SPARK[lvl];
    if (share >= 0.005) labels.push(`${t}:${Math.round(share * 100)}%`);
  }
  return `${cardText(r.suit, r.label).padEnd(6)} ${bars}  ${labels.join(' ')}`;
}

function formatTable(header: string[], rows: string[][]): string[] {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const fmt = (cells: string[]): string =>
    cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');
  return [fmt(header), ...rows.map(fmt)];
}

/** Build the pasteable text summary of a finished lead analysis. */
export function leadSummaryText(d: LeadSummaryInput): string {
  const declarer = declarerFor(d.leader);
  const contract = `${d.level}${DD_STRAIN_LABELS[d.strain]} by ${SEAT_NAMES[SEATS[declarer]]}`;
  const dealsStr =
    d.deals < d.requested
      ? `${d.deals.toLocaleString()} of ${d.requested.toLocaleString()} deals`
      : `${d.deals.toLocaleString()} deal${d.deals === 1 ? '' : 's'}`;

  const out: string[] = [];
  out.push('WesDeal — Opening-lead analysis');
  out.push(`${contract} · ${dealsStr} · seed ${d.seed}`);
  out.push(`Double-dummy opening lead & defence beats the contract on ${pct(d.beatsPct)} of these deals.`);
  out.push('');
  out.push('Conditions');
  for (const line of d.conditions) out.push(`  ${line}`);
  out.push('');

  const vulTag = d.vul ? 'vul' : 'NV';
  const header = ['Lead', 'Avg', 'Beats', `Score(${vulTag})`, 'Best', 'Cost'];
  const rowsText = d.rows.map((r) => [
    cardText(r.suit, r.label),
    r.avg.toFixed(2),
    pct(r.setPct),
    signed(Math.round(avgDefenderScore(r.counts, r.n, d.level, d.strain, d.vul))),
    pct(r.bestPct),
    r.avgCost.toFixed(2),
  ]);
  out.push(...formatTable(header, rowsText));

  const open = d.rows.filter((r) => d.openKeys.includes(`${r.suit}-${r.ranks[0]}`));
  if (open.length) {
    const [minT, maxT] = trickRange(open);
    out.push('');
    out.push(`Trick distribution — defensive tricks ${minT}..${maxT}`);
    for (const r of open) out.push(sparkLine(r, minT, maxT));
  }

  out.push('');
  out.push('Beats = defence defeats the contract; Cost = avg tricks lost vs the best lead; scores from the defenders’ side.');
  out.push('Double dummy: every hand is open, so read the percentages as comparative.');
  return out.join('\n');
}
