/**
 * Double-dummy solving on top of the `bridge-dds` WASM engine.
 *
 * `Dds` is imported as a type only, so this module carries no runtime
 * dependency on the WASM — the caller (the DD worker, or a test) passes in a
 * loaded instance. Verified against `CalcDDTablePBN` in `tests/dd.test.ts`.
 */

import type { Dds } from 'bridge-dds';
import { type DDCell, leaderOf } from './dd';

const EMPTY_TRICK = [0, 0, 0];

// Per-cell `SolveBoardPBN` costs ~24 ms; the whole 20-cell table costs ~190 ms
// (~9.6 ms/cell, because CalcDDTable reuses its transposition table). Break-even
// is ~8 cells, so above that we just compute the full table and index into it.
const FULL_TABLE_THRESHOLD = 8;

/** Tricks `declarer` can take in `strain` (0=♠..4=NT), double dummy. */
export function declarerTricks(dds: Dds, pbn: string, strain: number, declarer: number): number {
  const ft = dds.SolveBoardPBN(
    {
      trump: strain,
      first: leaderOf(declarer),
      currentTrickSuit: EMPTY_TRICK,
      currentTrickRank: EMPTY_TRICK,
      remainCards: pbn,
    },
    -1, // target: find the maximum
    1, // solutions: best line only
    1, // mode: normal search
  );
  // score[0] is the leading (defending) side's tricks; declarer gets the rest.
  return 13 - ft.score[0];
}

/** Tricks for each requested cell, in the same order as `cells`. */
export function solveDeal(dds: Dds, pbn: string, cells: DDCell[]): number[] {
  if (cells.length === 0) return [];
  if (cells.length > FULL_TABLE_THRESHOLD) {
    const table = dds.CalcDDTablePBN({ cards: pbn }).resTable; // [strain][declarer]
    return cells.map((c) => table[c.strain][c.declarer]);
  }
  return cells.map((c) => declarerTricks(dds, pbn, c.strain, c.declarer));
}
