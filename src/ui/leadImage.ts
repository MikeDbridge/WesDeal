/**
 * Image export for the opening-lead analyser: renders a finished analysis to a
 * self-contained PNG (fixed light theme, so it looks the same wherever it's
 * pasted). It draws the conditions, a results table with an inline "beats" bar,
 * and — the highlight — a full trick-distribution chart for every lead the user
 * has expanded, matching the on-page charts.
 */

import { SUITS, SUIT_SYMBOLS } from '../engine/cards';
import { SEATS, type Seat } from '../engine/deal';
import { DD_STRAIN_LABELS } from '../engine/dd';
import { avgDefenderScore, declarerFor, tricksToSet } from '../engine/lead';
import { trickRange, type LeadSummaryInput } from '../engine/leadExport';

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

const COL = {
  bg: '#ffffff',
  border: '#e2e8f0',
  title: '#0f172a',
  text: '#1e293b',
  muted: '#64748b',
  accent: '#2563eb',
  bar: '#cbd5e1',
  track: '#eef2f6',
  red: '#dc2626',
};

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

// Vertical rhythm — H is computed from these so the canvas fits exactly.
const P = 28;
const TITLE_H = 30;
const SUB_H = 22;
const BEATS_H = 36;
const GAP = 16;
const COND_HEAD_H = 22;
const COND_LINE_H = 18;
const COND_PAD = 12;
const TBL_HEAD_H = 24;
const TBL_ROW_H = 20;
const TBL_PAD = 14;
const CHART_HEAD_H = 24;
const LEAD_TITLE_H = 22;
const CHART_AREA = 120;
const CHART_LABELS = 20;
const CHART_GAP = 16;
const FOOTER_H = 40;
const W = 800;

const suitColor = (suit: number): string => (suit === 1 || suit === 2 ? COL.red : COL.text);
const cardText = (suit: number, label: string): string => SUIT_SYMBOLS[SUITS[suit]] + label;
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));

export function drawLeadSummary(d: LeadSummaryInput): HTMLCanvasElement {
  const open = d.rows.filter((r) => d.openKeys.includes(`${r.suit}-${r.ranks[0]}`));
  const perLead = LEAD_TITLE_H + CHART_AREA + CHART_LABELS + CHART_GAP;

  const H =
    P +
    TITLE_H +
    SUB_H +
    BEATS_H +
    GAP +
    (COND_HEAD_H + d.conditions.length * COND_LINE_H + COND_PAD) +
    (TBL_HEAD_H + d.rows.length * TBL_ROW_H + TBL_PAD) +
    (open.length ? CHART_HEAD_H + open.length * perLead : 0) +
    FOOTER_H +
    P;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.textBaseline = 'top';

  // Card background + border.
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  ctx.fillStyle = COL.accent;
  ctx.fillRect(0, 0, W, 4);

  const declarer = declarerFor(d.leader);
  const need = tricksToSet(d.level);
  const inW = W - 2 * P;
  let y = P;

  // Title + subtitle.
  ctx.fillStyle = COL.title;
  ctx.font = `bold 20px ${SANS}`;
  ctx.fillText('WesDeal — Opening-lead analysis', P, y);
  y += TITLE_H;

  const dealsStr =
    d.deals < d.requested
      ? `${d.deals.toLocaleString()} of ${d.requested.toLocaleString()} deals`
      : `${d.deals.toLocaleString()} deal${d.deals === 1 ? '' : 's'}`;
  ctx.fillStyle = COL.muted;
  ctx.font = `13px ${SANS}`;
  ctx.fillText(
    `${d.level}${DD_STRAIN_LABELS[d.strain]} by ${SEAT_NAMES[SEATS[declarer]]}  ·  ${dealsStr}  ·  seed ${d.seed}`,
    P,
    y,
  );
  y += SUB_H;

  // Beats headline + bar.
  ctx.fillStyle = COL.text;
  ctx.font = `bold 14px ${SANS}`;
  ctx.fillText(`Defence beats the contract on ${pct(d.beatsPct)} of these deals`, P, y);
  const barY = y + 20;
  ctx.fillStyle = COL.track;
  ctx.fillRect(P, barY, inW, 8);
  ctx.fillStyle = COL.accent;
  ctx.fillRect(P, barY, Math.round(inW * Math.max(0, Math.min(1, d.beatsPct))), 8);
  y += BEATS_H + GAP;

  // Conditions.
  ctx.fillStyle = COL.title;
  ctx.font = `bold 12px ${SANS}`;
  ctx.fillText('CONDITIONS', P, y);
  y += COND_HEAD_H;
  ctx.font = `13px ${SANS}`;
  for (const line of d.conditions) {
    ctx.fillStyle = COL.text;
    ctx.fillText(line, P, y);
    y += COND_LINE_H;
  }
  y += COND_PAD;

  // Results table.
  const xAvg = P + 236;
  const barX0 = P + 250;
  const barW = 120;
  const xBeats = P + 440;
  const xScore = P + 540;
  const xBest = P + 636;
  const xCost = inW + P;
  const right = (text: string, x: number, yy: number): void => {
    ctx.textAlign = 'right';
    ctx.fillText(text, x, yy);
    ctx.textAlign = 'left';
  };

  ctx.fillStyle = COL.muted;
  ctx.font = `bold 12px ${SANS}`;
  ctx.fillText('Lead', P, y);
  right('Avg', xAvg, y);
  ctx.fillText('Beats', barX0, y);
  right(`Score(${d.vul ? 'vul' : 'NV'})`, xScore, y);
  right('Best', xBest, y);
  right('Cost', xCost, y);
  y += TBL_HEAD_H - 6;
  ctx.strokeStyle = COL.border;
  ctx.beginPath();
  ctx.moveTo(P, y);
  ctx.lineTo(inW + P, y);
  ctx.stroke();
  y += 6;

  for (const r of d.rows) {
    const midY = y + TBL_ROW_H / 2 - 7;
    ctx.font = `bold 13px ${MONO}`;
    ctx.fillStyle = suitColor(r.suit);
    ctx.fillText(cardText(r.suit, r.label), P, midY);
    ctx.fillStyle = COL.text;
    ctx.font = `13px ${MONO}`;
    right(r.avg.toFixed(2), xAvg, midY);
    // Inline beats bar.
    const trackY = y + TBL_ROW_H / 2 - 4;
    ctx.fillStyle = COL.track;
    ctx.fillRect(barX0, trackY, barW, 7);
    ctx.fillStyle = COL.accent;
    ctx.fillRect(barX0, trackY, Math.round(barW * Math.max(0, Math.min(1, r.setPct))), 7);
    ctx.fillStyle = COL.text;
    right(pct(r.setPct), xBeats, midY);
    right(signed(Math.round(avgDefenderScore(r.counts, r.n, d.level, d.strain, d.vul))), xScore, midY);
    right(pct(r.bestPct), xBest, midY);
    right(r.avgCost.toFixed(2), xCost, midY);
    y += TBL_ROW_H;
  }
  y += TBL_PAD;

  // Expanded charts — the highlight.
  if (open.length) {
    ctx.fillStyle = COL.title;
    ctx.font = `bold 12px ${SANS}`;
    ctx.fillText('TRICK DISTRIBUTION (DEFENSIVE TRICKS)', P, y);
    y += CHART_HEAD_H;
    const [minT, maxT] = trickRange(open);
    const nBuckets = maxT - minT + 1;
    const slotW = Math.min(72, inW / nBuckets);
    const startX = P + (inW - slotW * nBuckets) / 2;

    for (const r of open) {
      ctx.font = `bold 14px ${MONO}`;
      ctx.fillStyle = suitColor(r.suit);
      ctx.fillText(cardText(r.suit, r.label), P, y);
      ctx.fillStyle = COL.muted;
      ctx.font = `12px ${SANS}`;
      ctx.fillText(`beats ${pct(r.setPct)} · avg ${r.avg.toFixed(2)} tricks`, P + 60, y + 1);
      y += LEAD_TITLE_H;

      const baseY = y + CHART_AREA;
      let maxShare = 0;
      for (let t = minT; t <= maxT; t++) maxShare = Math.max(maxShare, r.counts[t] / r.n);
      const maxBarH = CHART_AREA - 22;
      for (let t = minT; t <= maxT; t++) {
        const share = r.counts[t] / r.n;
        const cx = startX + (t - minT) * slotW + slotW / 2;
        const bw = Math.min(48, slotW * 0.62);
        const bh = share === 0 || maxShare === 0 ? 0 : Math.max(2, Math.round((share / maxShare) * maxBarH));
        if (bh > 0) {
          ctx.fillStyle = t >= need ? COL.accent : COL.bar;
          ctx.fillRect(cx - bw / 2, baseY - bh, bw, bh);
        }
        if (share >= 0.005) {
          ctx.fillStyle = COL.muted;
          ctx.font = `11px ${MONO}`;
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(share * 100)}%`, cx, baseY - bh - 14);
          ctx.textAlign = 'left';
        }
      }
      // Baseline + trick-count axis.
      ctx.strokeStyle = COL.border;
      ctx.beginPath();
      ctx.moveTo(startX, baseY + 0.5);
      ctx.lineTo(startX + slotW * nBuckets, baseY + 0.5);
      ctx.stroke();
      y += CHART_AREA;
      ctx.fillStyle = COL.muted;
      ctx.font = `11px ${MONO}`;
      ctx.textAlign = 'center';
      for (let t = minT; t <= maxT; t++) {
        ctx.fillText(String(t), startX + (t - minT) * slotW + slotW / 2, y + 4);
      }
      ctx.textAlign = 'left';
      y += CHART_LABELS + CHART_GAP;
    }
  }

  // Footer.
  ctx.fillStyle = COL.muted;
  ctx.font = `12px ${SANS}`;
  ctx.fillText('Double dummy: every hand is open, so read the percentages as comparative.', P, y + 8);
  ctx.fillStyle = COL.accent;
  ctx.textAlign = 'right';
  ctx.fillText('wesbridge.net', inW + P, y + 8);
  ctx.textAlign = 'left';

  return canvas;
}
