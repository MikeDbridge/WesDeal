import { describe, it, expect, beforeAll } from 'vitest';
import { loadDds, Dds } from 'bridge-dds';
import { solveDeal, declarerTricks } from '../src/engine/ddSolve';
import { generateDeals } from '../src/engine/dealer';
import { dealToPBN } from '../src/engine/format';
import { makeCard } from '../src/engine/cards';
import type { DDCell } from '../src/engine/dd';
import type { Deal } from '../src/engine/deal';

describe('double-dummy solving (bridge-dds)', () => {
  let dds: Dds;
  beforeAll(async () => {
    dds = new Dds(await loadDds());
  });

  it('a hand with 13 top winners takes 13 tricks in NT', () => {
    const north = [
      makeCard('S', 14), makeCard('S', 13), makeCard('S', 12), makeCard('S', 11), makeCard('S', 10),
      makeCard('H', 14), makeCard('H', 13), makeCard('H', 12),
      makeCard('D', 14), makeCard('D', 13), makeCard('D', 12),
      makeCard('C', 14), makeCard('C', 13),
    ];
    const used = new Set(north);
    const rest: number[] = [];
    for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
    const deal: Deal = {
      hands: { N: north, E: rest.slice(0, 13), S: rest.slice(13, 26), W: rest.slice(26, 39) },
    } as Deal;
    expect(declarerTricks(dds, dealToPBN(deal), 4 /* NT */, 0 /* North */)).toBe(13);
  });

  it('per-cell solving matches the full CalcDDTable', () => {
    const allCells: DDCell[] = [];
    for (let s = 0; s < 5; s++) for (let d = 0; d < 4; d++) allCells.push({ strain: s, declarer: d });

    for (const seed of [7, 99, 2024]) {
      const pbn = dealToPBN(generateDeals({ constraints: {}, count: 1, seed }).deals[0]);
      const table = dds.CalcDDTablePBN({ cards: pbn }).resTable;
      // A small selection exercises the per-cell SolveBoard path.
      const few = allCells.slice(0, 5);
      solveDeal(dds, pbn, few).forEach((tricks, i) => {
        expect(tricks).toBe(table[few[i].strain][few[i].declarer]);
      });
    }
  });
});
