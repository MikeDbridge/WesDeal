// @vitest-environment jsdom
/**
 * DOM smoke test for the WesPlay page: the module builds its UI, a pasted
 * PBN fills the card-layout editor, tap-select + "⤵ here" moves cards
 * between hands (with short/over shading), and the imported contract's
 * one-tap button enters card-by-card play. jsdom has no Worker, so the DD
 * calls reject quietly, and no pointer events, so dragging is exercised in
 * real browsers only — everything else is the real page code.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const EXAMPLE_PBN = [
  '[Board "1"]',
  '[Dealer "S"]',
  '[Vulnerable "None"]',
  '[Deal "S:AKQJT9.A32.K2.32 87.KQJT.QJT9.KQJ 32.54.A8765.A654 654.9876.43.T987"]',
  '[Contract "4S"]',
  '[Declarer "S"]',
].join('\n');

const $ = (sel: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(sel);
  expect(el, sel).not.toBeNull();
  return el!;
};
const zone = (name: string): HTMLElement => $(`[data-zone="${name}"]`);
const chipsIn = (el: HTMLElement): HTMLButtonElement[] => [...el.querySelectorAll<HTMLButtonElement>('.ap-card')];
const buttonLike = (text: string): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.textContent ?? '').includes(text));
  expect(b, `button containing "${text}"`).toBeDefined();
  return b!;
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/analyze');
});

describe('WesPlay page (jsdom)', () => {
  it('starts with all 52 cards in the pool and the play view hidden', () => {
    expect($('.site-nav').textContent).toContain('WesPlay');
    expect($('.ap-analysis').hasAttribute('hidden')).toBe(true);
    expect(chipsIn(zone('pool'))).toHaveLength(52);
    expect(zone('N').className).toContain('short');
    expect($('.ap-board').textContent).toContain('Give every hand 13 cards');
  });

  it('pastes a PBN file into the editor: 13 everywhere, one-tap play button', async () => {
    const ta = $('.ap-import-text') as HTMLTextAreaElement;
    ta.value = EXAMPLE_PBN;
    ta.dispatchEvent(new Event('input'));
    await sleep(260); // import debounce

    for (const seat of ['N', 'E', 'S', 'W']) {
      expect(chipsIn(zone(seat)), seat).toHaveLength(13);
      expect(zone(seat).className).toContain('ok');
    }
    expect(chipsIn(zone('pool'))).toHaveLength(0);
    expect($('.ap-feedback').textContent).toContain('all 52 cards ✓');
    expect($('.ap-board').textContent).toContain('Play a contract');
    expect(buttonLike('(imported)').textContent).toContain('4♠ by S');
    expect(location.hash).toContain('#d=');
  });

  it('moves a card with tap-select and “⤵ here”, shading short/over hands', () => {
    const north = chipsIn(zone('N'))[0]; // ♠3 (North's spades are 32)
    expect(north.textContent).toBe('3');
    north.click();
    expect(chipsIn(zone('N'))[0].className).toContain('sel');
    expect($('.ap-board').textContent).toContain('3 selected');

    (zone('E').querySelector<HTMLButtonElement>('.ap-move-pill'))!.click();
    expect(chipsIn(zone('N'))).toHaveLength(12);
    expect(chipsIn(zone('E'))).toHaveLength(14);
    expect(zone('N').className).toContain('short');
    expect(zone('E').className).toContain('over');
    expect($('.ap-board').textContent).toContain('Give every hand 13 cards');

    // Move it back: ♠3 now sits in East's spade row.
    const eastSpades = zone('E').querySelector<HTMLElement>('.ap-suitrow')!;
    const back = chipsIn(eastSpades).find((c) => c.textContent === '3')!;
    back.click();
    (zone('N').querySelector<HTMLButtonElement>('.ap-move-pill'))!.click();
    expect(chipsIn(zone('N'))).toHaveLength(13);
    expect($('.ap-board').textContent).toContain('Play a contract');
  });

  it('enters play from the imported contract and accepts a card', () => {
    buttonLike('(imported)').click();
    expect($('.ap-analysis').hasAttribute('hidden')).toBe(false);
    expect(document.querySelector('.ap-board')?.closest('div')?.hasAttribute('hidden')).toBe(true);
    expect(document.querySelectorAll('.ap-analysis .ap-card')).toHaveLength(52);

    const turn = $('.ap-hand.turn');
    expect(turn.textContent).toContain('West'); // 4S by S — W leads
    const enabled = chipsIn(turn).filter((b) => !b.disabled);
    expect(enabled).toHaveLength(13);
    enabled[0].click();
    expect($('.ap-tricks').textContent).toContain('Declarer 0 · Defence 0');
    expect($('.ap-hand.turn').textContent).toContain('North');
  });

  it('offers Resume after Edit deal, keeping the trick in progress', () => {
    buttonLike('Edit deal').click();
    expect($('.ap-analysis').hasAttribute('hidden')).toBe(true);
    expect(chipsIn(zone('N'))).toHaveLength(13); // layout intact

    const resume = buttonLike('Resume 4S by S');
    expect(resume.textContent).toContain('1 card played');
    resume.click();
    expect($('.ap-analysis').hasAttribute('hidden')).toBe(false);
    expect($('.ap-tricks').textContent).toContain('Declarer 0 · Defence 0');
    expect(document.querySelectorAll('.ap-analysis .ap-card')).toHaveLength(51); // one card in the trick

    buttonLike('↩ Undo').click();
    expect(document.querySelectorAll('.ap-analysis .ap-card')).toHaveLength(52);
    expect(buttonLike('Redo ↪').disabled).toBe(false);
  });
});
