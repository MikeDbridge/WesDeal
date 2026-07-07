/**
 * Dataset generation: random deals + their full double-dummy tables, written as
 * JSONL shards (research/data/). Each shard runs in its own vitest fork with its
 * own DDS WASM instance, so shards generate in parallel.
 *
 * Environment knobs (see research/README.md for recipes):
 *   RESEARCH_DEALS   target deals per shard (default 500; ×8 shards total).
 *   RESEARCH_FILTER  'ntish' → keep only deals where BOTH N and S are in the
 *                    balanced/semi-balanced study population (src/engine/study).
 *                    Dealing costs microseconds vs ~200 ms per DD solve, so
 *                    every solve lands in-population.
 *   RESEARCH_RUN     run id (default 0). Each run uses a fresh seed stream and
 *                    its own filenames (deals-f3-r2.jsonl), so runs ACCUMULATE
 *                    into an ever-bigger library instead of regenerating.
 *
 * Shards append line-by-line and RESEARCH_DEALS is a TARGET: an interrupted or
 * finished shard resumes/extends by fast-forwarding its deterministic deal
 * stream past the lines already on disk. Re-running with the same settings is
 * a no-op; a larger target extends the same stream.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadDds, Dds } from 'bridge-dds';
import { mulberry32, randomDeal, type Deal } from '../src/engine/deal';
import { dealToPBN } from '../src/engine/format';
import { ntEligible } from './lib';

export async function runShard(shard: number): Promise<void> {
  const target = Number.parseInt(process.env.RESEARCH_DEALS ?? '500', 10);
  const filtered = process.env.RESEARCH_FILTER === 'ntish';
  const run = Number.parseInt(process.env.RESEARCH_RUN ?? '0', 10);
  const seed = (filtered ? 30260707 : 20260707) + run * 100 + shard;
  const label = `${filtered ? 'f' : ''}${shard}${run > 0 ? `-r${run}` : ''}`;
  const dir = path.join(import.meta.dirname, 'data');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `deals-${label}.jsonl`);

  const existing = existsSync(file)
    ? readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() !== '').length
    : 0;
  if (existing >= target) {
    console.log(`shard ${label}: already has ${existing} deals (target ${target}) — nothing to do`);
    return;
  }

  const rng = mulberry32(seed);
  const nextDeal = (): Deal => {
    let deal = randomDeal(rng);
    while (filtered && !(ntEligible(deal.hands.N) && ntEligible(deal.hands.S))) deal = randomDeal(rng);
    return deal;
  };

  // Fast-forward the deterministic stream past what's already on disk.
  for (let i = 0; i < existing; i++) nextDeal();
  if (existing > 0) console.log(`shard ${label}: resuming at ${existing}/${target}`);

  const dds = new Dds(await loadDds());
  const t0 = performance.now();
  for (let i = existing; i < target; i++) {
    const pbn = dealToPBN(nextDeal());
    const dd = dds.CalcDDTablePBN({ cards: pbn }).resTable;
    appendFileSync(file, JSON.stringify({ pbn, dd }) + '\n');
    const done = i + 1;
    if (done % 250 === 0) {
      const msPer = (performance.now() - t0) / (done - existing);
      console.log(`shard ${label}: ${done}/${target} (${msPer.toFixed(0)} ms/deal)`);
    }
  }
  const secs = ((performance.now() - t0) / 1000).toFixed(0);
  console.log(`shard ${label}: wrote ${target - existing} deals in ${secs} s (file now ${target})`);
}
