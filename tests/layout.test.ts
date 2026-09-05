import { describe, it, expect } from 'vitest';
import { makeCard } from '../src/engine/cards';
import {
  layoutFromHands, handsFromLayout, poolOf, zoneOf, moveCard, layoutComplete,
  dealFromLayout, poolFillTarget, emptyLayout,
} from '../src/engine/layout';

const N = 'AKQ2.54.T987.J32';
const E = 'J97.KQJ9.62.T874';
const S = 'T863.A87.AKQ.965';
const W = '54.T632.J543.AKQ';

describe('layout model', () => {
  it('round-trips a full deal through dotted holdings', () => {
    const { layout, dropped } = layoutFromHands({ N, E, S, W });
    expect(dropped).toEqual([]);
    expect(layoutComplete(layout)).toBe(true);
    expect(poolOf(layout)).toEqual([]);
    expect(handsFromLayout(layout)).toEqual({ N, E, S, W });
    expect(dealFromLayout(layout).hands.N).toHaveLength(13);
  });

  it('starts everything in the pool for an empty layout', () => {
    const layout = emptyLayout();
    expect(poolOf(layout)).toHaveLength(52);
    expect(layoutComplete(layout)).toBe(false);
    expect(handsFromLayout(layout)).toEqual({ N: '', E: '', S: '', W: '' });
  });

  it('keeps the first claim on a duplicated card and reports the drop', () => {
    const { layout, dropped } = layoutFromHands({ N: 'AK...', E: 'A...', S: '', W: '' });
    expect(layout.N).toContain(makeCard('S', 14));
    expect(layout.E).toEqual([]);
    expect(dropped).toEqual(['♠A was in both N and E; kept in N.']);
  });

  it('moves cards between hands and the pool', () => {
    const { layout } = layoutFromHands({ N, E, S, W });
    const sa = makeCard('S', 14);
    expect(zoneOf(layout, sa)).toBe('N');

    expect(moveCard(layout, sa, 'E')).toBe(true);
    expect(layout.N).toHaveLength(12);
    expect(layout.E).toHaveLength(14);
    expect(zoneOf(layout, sa)).toBe('E');
    expect(layoutComplete(layout)).toBe(false);

    expect(moveCard(layout, sa, 'pool')).toBe(true);
    expect(poolOf(layout)).toEqual([sa]);
    expect(moveCard(layout, sa, 'pool')).toBe(false); // no-op

    expect(moveCard(layout, sa, 'N')).toBe(true);
    expect(layoutComplete(layout)).toBe(true);
    expect(handsFromLayout(layout)).toEqual({ N, E, S, W }); // re-sorted on encode
  });

  it('sorts the pool by suit then rank', () => {
    const layout = layoutFromHands({ N, E, S, W }).layout;
    moveCard(layout, makeCard('C', 3), 'pool');
    moveCard(layout, makeCard('S', 14), 'pool');
    moveCard(layout, makeCard('S', 2), 'pool');
    expect(poolOf(layout)).toEqual([makeCard('S', 14), makeCard('S', 2), makeCard('C', 3)]);
  });

  it('suggests the obvious pool destination only when unambiguous', () => {
    const { layout } = layoutFromHands({ N, E, S, W: '' });
    expect(poolFillTarget(layout)).toBe('W'); // 13 in the pool, only W short

    const spread = layoutFromHands({ N, E, S: '', W: '' }).layout;
    expect(poolFillTarget(spread)).toBeNull(); // two hands short

    const partial = layoutFromHands({ N, E, S, W }).layout;
    moveCard(partial, makeCard('S', 14), 'W'); // W has 14, nothing short by pool size
    moveCard(partial, makeCard('H', 5), 'pool');
    expect(poolFillTarget(partial)).toBeNull(); // N short by 2, pool has 1
  });
});
