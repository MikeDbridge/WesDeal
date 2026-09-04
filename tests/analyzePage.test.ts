// @vitest-environment jsdom
/**
 * DOM smoke test for the WesPlay page: the module builds its UI, a pasted
 * PBN lands in the review grid, Analyse opens the play view, and tapping a
 * card / Undo drives the play state. jsdom has no Worker, so the DD calls
 * reject quietly — everything else is the real page code.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const PBN_LINE = 'N:AKQ2.54.T987.J32 J97.KQJ9.62.T874 T863.A87.AKQ.965 54.T632.J543.AKQ';

const $ = (sel: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(sel);
  expect(el, sel).not.toBeNull();
  return el!;
};
const buttons = (): HTMLButtonElement[] => [...document.querySelectorAll('button')];
const button = (label: string): HTMLButtonElement => {
  const b = buttons().find((x) => x.textContent === label);
  expect(b, `button "${label}"`).toBeDefined();
  return b!;
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/analyze');
});

describe('WesPlay page (jsdom)', () => {
  it('renders the nav and import panel; analysis starts hidden', () => {
    expect($('.site-nav').textContent).toContain('WesPlay');
    $('.ap-import');
    expect($('.ap-analysis').hasAttribute('hidden')).toBe(true);
    expect(button('Analyse').disabled).toBe(true);
  });

  it('pastes a PBN line into the review grid', async () => {
    const ta = $('.ap-import-text') as HTMLTextAreaElement;
    ta.value = PBN_LINE;
    ta.dispatchEvent(new Event('input'));
    await sleep(260); // import debounce

    const inputs = [...document.querySelectorAll<HTMLInputElement>('.ap-grid input')];
    expect(inputs).toHaveLength(16);
    expect(inputs[0].value).toBe('AKQ2'); // North spades
    expect(inputs[15].value).toBe('AKQ'); // West clubs
    expect($('.ap-feedback').textContent).toContain('all 52 cards ✓');
    expect(button('Analyse').disabled).toBe(false);
    expect(location.hash).toContain('#d=');
  });

  it('opens the analysis view with all 52 cards on the compass', () => {
    button('Analyse').click();
    expect($('.ap-analysis').hasAttribute('hidden')).toBe(false);
    expect($('.ap-import').hasAttribute('hidden')).toBe(true);
    expect(document.querySelectorAll('.ap-card')).toHaveLength(52);
    // No contract imported → the picker invites one.
    expect($('.ap-analysis').textContent).toContain('Pick a contract');
  });

  it('sets a contract from the picker and puts the leader on turn', () => {
    // Level 4 merges into the 3NT-by-South starting point → 4NT by S; W leads.
    button('4').click();
    expect($('.ap-contract-chip').textContent).toContain('4');
    const turn = $('.ap-hand.turn');
    expect(turn.textContent).toContain('West');
    const enabled = [...turn.querySelectorAll<HTMLButtonElement>('.ap-card')].filter((b) => !b.disabled);
    expect(enabled).toHaveLength(13); // opening leader may play anything
  });

  it('plays a tapped card and undoes it', () => {
    const before = document.querySelectorAll('.ap-card').length;
    const turn = $('.ap-hand.turn');
    const card = [...turn.querySelectorAll<HTMLButtonElement>('.ap-card')].find((b) => !b.disabled)!;
    card.click();
    expect(document.querySelectorAll('.ap-card')).toHaveLength(before - 1);
    expect($('.ap-tricks').textContent).toContain('Declarer 0 · Defence 0');
    expect($('.ap-hand.turn').textContent).toContain('North'); // next to play

    button('↩ Undo').click();
    expect(document.querySelectorAll('.ap-card')).toHaveLength(before);
    expect(button('↩ Undo').disabled).toBe(true);
    expect(button('Redo ↪').disabled).toBe(false);
  });

  it('returns to the import panel with the grid intact', () => {
    button('Edit deal').click();
    expect($('.ap-import').hasAttribute('hidden')).toBe(false);
    const inputs = [...document.querySelectorAll<HTMLInputElement>('.ap-grid input')];
    expect(inputs[0].value).toBe('AKQ2');
  });
});
