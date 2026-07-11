import { h } from './dom';

// 'lab' and 'calendar' are no longer linked in the nav, but their standalone
// pages still call siteNav() with those keys, so they stay in the union.
type NavKey = 'deal' | 'odds' | 'lab' | 'bidding' | 'calendar';

/** Top navigation shared by the app's pages. */
export function siteNav(active: NavKey): HTMLElement {
  const link = (href: string, label: string, sub: string, key: NavKey): HTMLElement =>
    h('a', { href, class: 'nav-link' + (key === active ? ' active' : '') }, [
      h('span', { class: 'nav-name' }, [label]),
      h('span', { class: 'nav-sub' }, [sub]),
    ]);
  const pip = (sym: string, pos: string): HTMLElement =>
    h('span', { class: 'brand-pip ' + pos }, [sym]);
  const brand = h('span', { class: 'nav-brand', title: 'WesBridge' }, [
    h('span', { class: 'brand-mark' }, [pip('♠', 's'), pip('♥', 'h'), pip('♦', 'd'), pip('♣', 'c')]),
    h('span', { class: 'brand-name' }, ['Wes', h('span', { class: 'brand-accent' }, ['Bridge'])]),
  ]);
  // WesRank points at the separately-deployed leaderboards site (/wc/).
  const rank = h('a', { href: '/wc/', class: 'nav-link nav-rank' }, [
    h('span', { class: 'nav-name' }, ['WesRank']),
    h('span', { class: 'nav-sub' }, ['Player leaderboards']),
  ]);
  return h('nav', { class: 'site-nav' }, [
    brand,
    link('./index.html', 'WesDeal', 'Deal generator and DD solver', 'deal'),
    link('./odds.html', 'WesOdds', 'Suit break calculator', 'odds'),
    link('./bidding.html', 'WesData', 'Championship Data', 'bidding'),
    rank,
  ]);
}
