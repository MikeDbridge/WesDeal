/**
 * Dealer and vulnerability for a board number.
 *
 * Both follow the fixed duplicate-bridge cycles. The dealer rotates N, E, S, W
 * every board. Vulnerability runs on a 16-board cycle; for board number `b` with
 * n = b - 1 it is `(n + floor(n / 4)) mod 4` indexed into None, N-S, E-W, Both.
 */

import { SEATS, type Seat } from './deal';

export type Vulnerability = 'None' | 'NS' | 'EW' | 'Both';

const VULN: Vulnerability[] = ['None', 'NS', 'EW', 'Both'];

/** Dealer for a 1-based board number (N, E, S, W cycling). */
export function dealerOf(board: number): Seat {
  return SEATS[(board - 1) % 4];
}

/** Vulnerability for a 1-based board number (16-board cycle). */
export function vulnerabilityOf(board: number): Vulnerability {
  const n = board - 1;
  return VULN[(n + Math.floor(n / 4)) % 4];
}

/** Human label, e.g. "None", "N-S", "E-W", "All". */
export function vulnerabilityLabel(v: Vulnerability): string {
  return v === 'NS' ? 'N-S' : v === 'EW' ? 'E-W' : v === 'Both' ? 'All' : 'None';
}
