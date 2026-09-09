import type { DDCell } from '../engine/dd';
import type { LeadCardScore } from '../engine/lead';
import type { DDPlayPosition } from '../engine/play';

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

/** Score every legal card in a mid-play position (the WesPlay analyser). */
export interface DDPlayOne {
  type: 'play';
  jobId: number;
  index: number;
  position: DDPlayPosition;
}

/** Full 5×4 makeable-contracts table plus the par score for one deal. */
export interface DDTableOne {
  type: 'table';
  jobId: number;
  index: number;
  pbn: string;
  /** 0=N 1=E 2=S 3=W */
  dealer: number;
  /** DDS vulnerability: 0 none, 1 both, 2 NS, 3 EW. */
  vul: number;
}

export type DDWorkerRequest = DDSolveOne | DDLeadsOne | DDPlayOne | DDTableOne;

/** A worker's reply for one deal. */
export type DDWorkerMessage =
  | { type: 'result'; jobId: number; index: number; tricks: number[] }
  | { type: 'leads-result'; jobId: number; index: number; cards: LeadCardScore[] }
  | { type: 'play-result'; jobId: number; index: number; cards: LeadCardScore[] }
  | { type: 'table-result'; jobId: number; index: number; table: number[][]; parScore: number; parContracts: string[] }
  | { type: 'error'; jobId: number; index: number; message: string };
