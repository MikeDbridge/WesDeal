import { h } from './dom';

/** Top navigation shared by the app's pages. */
export function siteNav(active: 'deal' | 'odds'): HTMLElement {
  const link = (href: string, label: string, key: 'deal' | 'odds'): HTMLElement =>
    h('a', { href, class: 'nav-link' + (key === active ? ' active' : '') }, [label]);
  return h('nav', { class: 'site-nav' }, [
    h('span', { class: 'nav-brand' }, ['WesDeal']),
    link('./index.html', 'Deal generator', 'deal'),
    link('./odds.html', 'Suit-break odds', 'odds'),
  ]);
}
