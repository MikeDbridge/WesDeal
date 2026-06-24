/**
 * The dealer: generate-and-test.
 *
 * Deal fully random boards and keep the ones that satisfy the constraints. This
 * samples uniformly from the constrained population (no bias), which matters if
 * the deals are used for serious practice or simulation. The cost is that very
 * tight constraints may require many attempts per accepted deal — `maxAttempts`
 * bounds the work and the result reports how hard it had to look.
 */

import {
  type Deal,
  type RNG,
  type GivenSpecs,
  mulberry32,
  randomDeal,
  dealWithGivenSpecs,
  hasGivenSpecs,
  validateGivenSpecs,
} from './deal';
import { type ConstraintSet, matchesDeal } from './constraints';

export interface DealerOptions {
  constraints: ConstraintSet;
  /** Fixed hands to deal around (0, 1, or 2 seats), with "x" small-card support. */
  given?: GivenSpecs;
  /** How many matching deals to produce. Default 1. */
  count?: number;
  /** Hard cap on total random deals tried. Default 1,000,000. */
  maxAttempts?: number;
  /** Seed for reproducibility. Omit for a time-based seed. */
  seed?: number;
}

export interface DealerResult {
  deals: Deal[];
  /** Total random deals generated (matching + rejected). */
  attempts: number;
  /** Number of matching deals found (= deals.length). */
  accepted: number;
  /** True if `count` was reached; false if `maxAttempts` was hit first. */
  complete: boolean;
  /** The seed actually used (useful when one was auto-generated). */
  seed: number;
}

const DEFAULT_MAX_ATTEMPTS = 1_000_000;

export function generateDeals(options: DealerOptions): DealerResult {
  const count = options.count ?? 1;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const seed = options.seed ?? (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;
  const rng: RNG = mulberry32(seed);

  const given = options.given;
  if (given && hasGivenSpecs(given)) {
    const errors = validateGivenSpecs(given);
    if (errors.length) throw new Error(errors.join(' '));
  }
  const useGiven = hasGivenSpecs(given);
  const nextDeal = (): Deal => (useGiven ? dealWithGivenSpecs(given!, rng) : randomDeal(rng));

  const deals: Deal[] = [];
  let attempts = 0;

  while (deals.length < count && attempts < maxAttempts) {
    attempts++;
    const deal = nextDeal();
    if (matchesDeal(deal, options.constraints)) {
      deals.push(deal);
    }
  }

  return {
    deals,
    attempts,
    accepted: deals.length,
    complete: deals.length >= count,
    seed,
  };
}
