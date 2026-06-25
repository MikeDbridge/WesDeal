import type { DDCell } from '../engine/dd';

/** Solve one deal. `jobId` lets the pool discard results from a superseded run. */
export interface DDSolveOne {
  type: 'solve';
  jobId: number;
  index: number;
  pbn: string;
  cells: DDCell[];
}

/** A worker's reply for one deal. */
export type DDWorkerMessage =
  | { type: 'result'; jobId: number; index: number; tricks: number[] }
  | { type: 'error'; jobId: number; index: number; message: string };
