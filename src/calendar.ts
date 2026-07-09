/**
 * WesCal — a calendar of every tournament in the database, by year, making
 * clear which events contribute AUCTIONS to the bidding study ("bidding data")
 * and which are only final results ("results only").
 *
 * Data: research/calendar-data.json, produced by `npm run research:calendar`
 * from the full scrape. Bundled at build time.
 */

import './styles.css';
import './calendar.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import calendarData from '../research/calendar-data.json';

interface Stage {
  c: number;
  a: number;
}
interface Tournament {
  key: string;
  name: string;
  region: 'World' | 'Europe' | 'USA' | string;
  kind: string;
  year: number;
  contracts: number;
  auctions: number;
  hasBidding: boolean;
  stages: Record<string, Stage>;
}
interface Data {
  generated: string;
  totalContracts: number;
  totalAuctions: number;
  tournaments: Tournament[];
}

const data = calendarData as unknown as Data;

const REGION_GLYPH: Record<string, string> = { World: '🌍', Europe: '🇪🇺', USA: '🇺🇸' };
const STAGE_ORDER = ['RR', '32', '16', 'QF', 'SF', 'FF', 'KO'];
const STAGE_LABEL: Record<string, string> = {
  RR: 'Round robin', '32': 'R32', '16': 'R16', QF: 'QF', SF: 'SF', FF: 'Final', KO: 'KO',
};

const fmt = (n: number): string => n.toLocaleString('en-US');

type Mode = 'all' | 'bidding' | 'results';
let mode: Mode = 'all';

function stageChips(t: Tournament): HTMLElement {
  const chips = STAGE_ORDER.filter((s) => t.stages[s]).map((s) => {
    const st = t.stages[s];
    const bidding = st.a > 0;
    return h(
      'span',
      {
        class: 'cal-stage' + (bidding ? ' bidding' : ''),
        title: `${STAGE_LABEL[s] ?? s}: ${fmt(st.c)} contracts${bidding ? `, ${fmt(st.a)} with auctions` : ' (results only)'}`,
      },
      [STAGE_LABEL[s] ?? s],
    );
  });
  return h('span', { class: 'cal-stages' }, chips);
}

function card(t: Tournament): HTMLElement {
  return h('div', { class: 'cal-card ' + (t.hasBidding ? 'bidding' : 'results'), 'data-bidding': String(t.hasBidding) }, [
    h('div', { class: 'cal-card-head' }, [
      h('span', { class: 'cal-region', title: t.region }, [REGION_GLYPH[t.region] ?? '•']),
      h('span', { class: 'cal-name' }, [t.name]),
      h('span', { class: 'cal-badge ' + (t.hasBidding ? 'bidding' : 'results') }, [
        t.hasBidding ? 'bidding' : 'results only',
      ]),
    ]),
    h('div', { class: 'cal-meta' }, [
      h('span', { class: 'cal-kind' }, [t.kind]),
      h('span', { class: 'cal-counts' }, [
        t.hasBidding ? `${fmt(t.auctions)} auctions · ${fmt(t.contracts)} contracts` : `${fmt(t.contracts)} contracts`,
      ]),
    ]),
    stageChips(t),
  ]);
}

function build(): void {
  const app = document.getElementById('app')!;
  app.classList.add('cal-app');

  const years = [...new Set(data.tournaments.map((t) => t.year))].sort((a, b) => b - a);
  const biddingCount = data.tournaments.filter((t) => t.hasBidding).length;

  // --- controls (toggle) ---
  const modes: Array<[Mode, string]> = [
    ['all', 'All events'],
    ['bidding', 'Bidding data'],
    ['results', 'Results only'],
  ];
  const seg = h('div', { class: 'cal-toggle', role: 'tablist' }, []);
  const countEl = h('span', { class: 'cal-count' }, []);
  const yearRows: HTMLElement[] = [];

  const apply = (): void => {
    let shown = 0;
    for (const row of yearRows) {
      let any = false;
      for (const el of Array.from(row.querySelectorAll<HTMLElement>('.cal-card'))) {
        const isBidding = el.getAttribute('data-bidding') === 'true';
        const show = mode === 'all' || (mode === 'bidding' && isBidding) || (mode === 'results' && !isBidding);
        el.classList.toggle('hidden', !show);
        if (show) {
          any = true;
          shown++;
        }
      }
      row.classList.toggle('hidden', !any);
    }
    countEl.textContent = `${shown} shown`;
  };

  for (const [m, label] of modes) {
    const btn = h('button', { class: 'cal-toggle-btn' + (m === mode ? ' active' : ''), type: 'button' }, [label]);
    btn.addEventListener('click', () => {
      mode = m;
      for (const b of Array.from(seg.children)) b.classList.remove('active');
      btn.classList.add('active');
      apply();
    });
    seg.append(btn);
  }

  // --- year timeline ---
  const timeline = h('div', { class: 'cal-timeline' }, []);
  for (const year of years) {
    const inYear = data.tournaments
      .filter((t) => t.year === year)
      .sort((a, b) => a.region.localeCompare(b.region) || b.auctions - a.auctions);
    const row = h('div', { class: 'cal-year' }, [
      h('div', { class: 'cal-year-label' }, [String(year)]),
      h('div', { class: 'cal-year-cards' }, inYear.map(card)),
    ]);
    yearRows.push(row);
    timeline.append(row);
  }

  app.append(
    siteNav('calendar'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesCal']),
      h('p', { class: 'tagline' }, [
        `Every tournament in the database, ${years[years.length - 1]}–${years[0]} — ` +
          `${biddingCount} contribute bidding, the rest are final results only. ` +
          `${fmt(data.totalAuctions)} auctions across ${data.tournaments.length} events.`,
      ]),
    ]),
    h('div', { class: 'cal-controls' }, [seg, countEl, h('span', { class: 'cal-legend' }, [
      h('span', { class: 'cal-key bidding' }, ['●']), ' bidding (has auctions)   ',
      h('span', { class: 'cal-key results' }, ['●']), ' results only',
    ])]),
    timeline,
  );
  apply();
}

build();
