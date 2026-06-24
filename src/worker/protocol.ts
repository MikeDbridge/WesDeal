/** Message types crossing the main-thread ↔ worker boundary. */

import type { ConstraintSet } from '../engine/constraints';
import type { DealerResult } from '../engine/dealer';
import type { GivenSpecs } from '../engine/deal';

export interface GenerateRequest {
  constraints: ConstraintSet;
  given?: GivenSpecs;
  count: number;
  maxAttempts: number;
  seed?: number;
}

export type WorkerResponse =
  | { type: 'result'; result: DealerResult }
  | { type: 'error'; message: string };
