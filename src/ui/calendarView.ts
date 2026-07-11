/**
 * The tournament-data map, as an embeddable view.
 *
 * A calendar of every tournament in the database, by year, making clear which
 * events contribute AUCTIONS to the bidding study ("bidding data") and which
 * are only final results ("results only"). Rendered standalone by
 * `calendar.ts` and folded into the WesData page by `bidding.ts`.
 *
 * Data: research/calendar-data.json, produced by `npm run research:calendar`
 * from the full scrape. Bundled at build time.
 */

import '../calendar.css';
import { h } from './dom';
import calendarData from '../../research/calendar-data.json';

interface Stage {
  c: number;
  a: number;
  bid: boolean;
}
interface Tournament {
  key: string;
  name: string;
  region: 'World' | 'Europe' | 'USA' | string;
  kind: string;
  year: number;
  contracts: number;
  auctions: number;
  biddingKind: 'full' | 'partial' | 'none';
  hasBidding: boolean;
  divisions: string[];
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
const ALL_DIVISIONS = ['O', 'W', 'S', 'M'];
const DIVISION_NAME: Record<string, string> = { O: 'Open', W: 'Women', S: 'Seniors', M: 'Mixed' };
const BADGE: Record<string, string> = { full: 'bidding', partial: 'part bidding', none: 'results only' };

const fmt = (n: number): string => n.toLocaleString('en-US');

type Mode = 'all' | 'bidding' | 'results';

function stageChips(t: Tournament): HTMLElement {
  const chips = STAGE_ORDER.filter((s) => t.stages[s]).map((s) => {
    const st = t.stages[s];
    return h(
      'span',
      {
        class: 'cal-stage' + (st.bid ? ' bidding' : ''),
        title: `${STAGE_LABEL[s] ?? s}: ${fmt(st.c)} contracts${st.bid ? `, ${fmt(st.a)} with auctions` : ' — results only'}`,
      },
      [STAGE_LABEL[s] ?? s],
    );
  });
  return h('span', { class: 'cal-stages' }, chips);
}

/** The O/M/W/S corner flag — divisions present are lit, the rest dimmed. */
function divisionFlag(t: Tournament): HTMLElement {
  return h(
    'span',
    { class: 'cal-divflag', title: `Divisions: ${t.divisions.map((d) => DIVISION_NAME[d]).join(', ')}` },
    ALL_DIVISIONS.map((d) =>
      h('span', { class: 'cal-div' + (t.divisions.includes(d) ? ' on' : '') }, [d]),
    ),
  );
}

function card(t: Tournament): HTMLElement {
  return h('div', { class: `cal-card ${t.biddingKind}`, 'data-bidding': String(t.hasBidding) }, [
    h('div', { class: 'cal-card-head' }, [
      h('span', { class: 'cal-region', title: t.region }, [REGION_GLYPH[t.region] ?? '•']),
      h('span', { class: 'cal-name' }, [t.name]),
      h('span', { class: `cal-badge ${t.biddingKind}` }, [BADGE[t.biddingKind]]),
    ]),
    h('div', { class: 'cal-meta' }, [
      h('span', { class: 'cal-kind' }, [t.kind]),
      h('span', { class: 'cal-counts' }, [
        t.hasBidding ? `${fmt(t.auctions)} auctions · ${fmt(t.contracts)} contracts` : `${fmt(t.contracts)} contracts`,
      ]),
    ]),
    stageChips(t),
    divisionFlag(t),
  ]);
}

/** A one-line summary of the dataset, for taglines. */
export function calendarSummary(): string {
  const years = [...new Set(data.tournaments.map((t) => t.year))].sort((a, b) => b - a);
  const biddingCount = data.tournaments.filter((t) => t.hasBidding).length;
  return (
    `Every tournament in the database, ${years[years.length - 1]}–${years[0]} — ` +
    `${biddingCount} contribute bidding, the rest are final results only. ` +
    `${fmt(data.totalAuctions)} auctions across ${data.tournaments.length} events.`
  );
}

/**
 * Build the tournament-data map: the mode toggle, the legend key, and the
 * year timeline. Returns the nodes plus a `summary` string so callers can
 * render their own header. State is local, so multiple instances are safe.
 */
export function renderCalendarView(): { nodes: HTMLElement[]; summary: string } {
  const years = [...new Set(data.tournaments.map((t) => t.year))].sort((a, b) => b - a);
  let mode: Mode = 'all';

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

  const controls = h('div', { class: 'cal-controls' }, [seg, countEl]);
  const keyBar = h('div', { class: 'cal-key-bar' }, [
    h('span', { class: 'cal-key-group' }, [
      h('span', { class: 'cal-swatch full' }, []), 'bidding',
      h('span', { class: 'cal-swatch partial' }, []), 'part bidding (some stages)',
      h('span', { class: 'cal-swatch none' }, []), 'results only',
    ]),
    h('span', { class: 'cal-key-sep' }, ['·']),
    h('span', { class: 'cal-key-group' }, [
      h('span', { class: 'cal-divflag key' }, ALL_DIVISIONS.map((d) => h('span', { class: 'cal-div on' }, [d]))),
      ' = Open / Women / Seniors / Mixed (lit = present)',
    ]),
  ]);

  apply();
  return { nodes: [controls, keyBar, timeline], summary: calendarSummary() };
}
