import { h } from './dom';

type NavKey = 'deal' | 'odds' | 'lab' | 'lead' | 'bidding' | 'calendar';

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
  return h('nav', { class: 'site-nav' }, [
    brand,
    link('./index.html', 'WesDeal', 'Deal generator', 'deal'),
    link('./odds.html', 'WesOdds', 'Suit break calculator', 'odds'),
    link('./lab.html', 'WesLab', 'Double dummy lab', 'lab'),
    link('./lead.html', 'WesLead', 'Opening lead analyser', 'lead'),
    link('./bidding.html', 'WesBids', 'Bidding ranges study', 'bidding'),
    link('./calendar.html', 'WesCal', 'Tournament calendar', 'calendar'),
  ]);
}
