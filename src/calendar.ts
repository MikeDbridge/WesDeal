/**
 * WesCal — the standalone tournament-data map page.
 *
 * The view itself lives in ui/calendarView.ts so it can also be embedded in
 * the WesData (bidding) page. This module just mounts it as a full page.
 */

import './styles.css';
import { h } from './ui/dom';
import { siteNav } from './ui/nav';
import { renderCalendarView } from './ui/calendarView';

function build(): void {
  const app = document.getElementById('app')!;
  app.classList.add('cal-app');

  const { nodes, summary } = renderCalendarView();

  app.append(
    siteNav('calendar'),
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['Tournament Data Map']),
      h('p', { class: 'tagline' }, [summary]),
    ]),
    ...nodes,
  );
}

build();
