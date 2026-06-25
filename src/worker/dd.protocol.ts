import type { DDCell } from '../engine/dd';

/** Ask the DD worker to solve `cells` for each deal (deals as PBN strings). */
export interface DDSolveRequest {
  type: 'solve';
  deals: string[];
  cells: DDCell[];
}

/** Messages the DD worker sends back. Results stream in per deal. */
export type DDWorkerMessage =
  | { type: 'ready' } // WASM loaded
  | { type: 'result'; index: number; tricks: number[] }
  | { type: 'done' }
  | { type: 'error'; message: string };
