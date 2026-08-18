/**
 * WesComp — opening-bid comparisons, visualised. Recreates Richard Pavlicek's
 * "Opening Bid Comparisons" (rpbridge.net/9x00) from our championship auctions:
 * for each pair of opening choices, a horizontal win-share bar shows which
 * choice won more IMPs long-term, the winning side tinted gold.
 *
 * Data: research/opening-comparisons.json (npm run research:compare). Bundled.
 */

import './styles.css';
import './comp.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import compData from '../research/opening-comparisons.json';

interface Row {
  seat: string;
  a: string; b: string; aLabel: string; bLabel: string;
  cases: number; aImps: number; bImps: number; aPct: number; bPct: number;
  winner: 'a' | 'b';
}
interface Comparison { id: string; title: string; note: string; rows: Row[] }
interface Data { generated: string; rows: number; comparedBoards: number; avgSwing: number; comparisons: Comparison[] }

const data = compData as unknown as Data;

const SEAT_SHORT: Record<string, string> = { First: '1st', Second: '2nd', Third: '3rd' };
const fmt = (n: number): string => n.toLocaleString('en-US');
const THIN = 30; // cases below this are flagged as noisy

function suitColor(label: string): Array<Node | string> {
  // Colour ♥/♦ red inside an action label.
  const out: Array<Node | string> = [];
  let buf = '';
  for (const ch of label) {
    if (ch === '♥' || ch === '♦') {
      if (buf) { out.push(buf); buf = ''; }
      out.push(h('span', { class: 'suit-red' }, [ch]));
    } else buf += ch;
  }
  if (buf) out.push(buf);
  return out;
}

function bar(r: Row): HTMLElement {
  const aWin = r.winner === 'a';
  const segA = h('div', {
    class: 'comp-seg a ' + (aWin ? 'win' : 'lose'),
    style: `width:${r.aPct}%`,
  });
  const segB = h('div', {
    class: 'comp-seg b ' + (aWin ? 'lose' : 'win'),
    style: `width:${r.bPct}%`,
  });
  const labA = h('span', { class: 'comp-lbl left' + (aWin ? ' win' : '') }, [
    ...suitColor(r.aLabel), h('b', {}, [` ${r.aPct}%`]),
  ]);
  const labB = h('span', { class: 'comp-lbl right' + (!aWin ? ' win' : '') }, [
    ...suitColor(r.bLabel), h('b', {}, [` ${r.bPct}%`]),
  ]);
  return h('div', { class: 'comp-barwrap' }, [
    h('div', { class: 'comp-bar' }, [segA, segB]),
    labA,
    labB,
    h('div', { class: 'comp-mid', title: '50%' }, []),
  ]);
}

function rowEl(r: Row): HTMLElement {
  const thin = r.cases < THIN;
  return h('div', { class: 'comp-row' + (thin ? ' thin' : '') }, [
    h('div', { class: 'comp-seat' }, [
      h('span', { class: 'comp-matchup' }, [
        ...suitColor(r.aLabel), ' vs ', ...suitColor(r.bLabel),
      ]),
      h('span', { class: 'comp-pos' }, [SEAT_SHORT[r.seat] ?? r.seat]),
    ]),
    bar(r),
    h('div', { class: 'comp-cases', title: `${r.aImps} vs ${r.bImps} IMPs over ${r.cases} boards` }, [
      `${fmt(r.cases)}${thin ? ' ⚠' : ''}`,
    ]),
  ]);
}

function section(c: Comparison): HTMLElement {
  return h('section', { class: 'comp-section', id: c.id }, [
    h('h2', {}, [c.title]),
    h('p', { class: 'comp-note' }, [c.note]),
    h('div', { class: 'comp-rows' }, c.rows.map(rowEl)),
  ]);
}

function build(): void {
  const app = document.getElementById('app')!;
  app.classList.add('comp-app');

  const toc = h('div', { class: 'comp-toc' }, data.comparisons.map((c) =>
    h('a', { href: `#${c.id}` }, [c.title]),
  ));

  app.append(
    siteNav('compare'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['WesComp']),
      h('p', { class: 'tagline' }, [
        'Opening-bid comparisons, after ',
        h('a', { href: 'https://www.rpbridge.net/9x00.htm', class: 'comp-link' }, ['Pavlicek']),
        ` — recreated from ${fmt(data.comparedBoards)} two-table championship boards (2023–2026).`,
      ]),
    ]),
    h('div', { class: 'comp-intro' }, [
      h('p', {}, [
        'On a team board the same hand is played at two tables. Where a seat ',
        h('b', {}, ['opened differently']),
        ' at the two tables, the board’s IMP swing goes to whichever choice did better; ',
        'summed over every such case, the ',
        h('span', { class: 'comp-key win' }, ['gold']),
        ' side is the long-term winner. Split by seat (1st = dealer). ',
        h('span', { class: 'comp-warn' }, ['⚠']),
        ` marks fewer than ${THIN} cases — noisy. Average board swing ${data.avgSwing} IMPs.`,
      ]),
      toc,
    ]),
    ...data.comparisons.map(section),
  );
}

build();
