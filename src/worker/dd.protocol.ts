import type { DDCell } from '../engine/dd';
import type { LeadCardScore } from '../engine/lead';

/** Solve one deal's requested cells. `jobId` lets the pool discard stale runs. */
export interface DDSolveOne {
  type: 'solve';
  jobId: number;
  index: number;
  pbn: string;
  cells: DDCell[];
}

/** Score every opening lead of one deal (leader = declarer's LHO). */
export interface DDLeadsOne {
  type: 'leads';
  jobId: number;
  index: number;
  pbn: string;
  /** 0=♠ 1=♥ 2=♦ 3=♣ 4=NT */
  trump: number;
  /** 0=N 1=E 2=S 3=W */
  leader: number;
}

export type DDWorkerRequest = DDSolveOne | DDLeadsOne;

/** A worker's reply for one deal. */
export type DDWorkerMessage =
  | { type: 'result'; jobId: number; index: number; tricks: number[] }
  | { type: 'leads-result'; jobId: number; index: number; cards: LeadCardScore[] }
  | { type: 'error'; jobId: number; index: number; message: string };
