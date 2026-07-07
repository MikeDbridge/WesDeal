/**
 * Dataset generation: random deals + their full double-dummy tables, written as
 * JSONL shards (research/data/). Each shard runs in its own vitest fork with its
 * own DDS WASM instance, so shards generate in parallel.
 *
 * Modes:
 *   - uniform (default): every random deal is solved and stored
 *     → data/deals-<shard>.jsonl, seeds 20260707+shard.
 *   - RESEARCH_FILTER=ntish: deal until BOTH North and South are balanced /
 *     semi-balanced (see ntEligible), and only solve those. Dealing costs
 *     microseconds vs ~300 ms per DD solve, so every solve lands in the study
 *     population → data/deals-f<shard>.jsonl, seeds 30260707+shard (a different
 *     stream, so filtered shards pool with uniform ones without duplicates).
 *
 * Deals per shard: RESEARCH_DEALS env var (default 500). Reruns with the same
 * settings reproduce the same dataset.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadDds, Dds } from 'bridge-dds';
import { mulberry32, randomDeal, type Deal } from '../src/engine/deal';
import { dealToPBN } from '../src/engine/format';
import { ntEligible } from './lib';

export async function runShard(shard: number): Promise<void> {
  const perShard = Number.parseInt(process.env.RESEARCH_DEALS ?? '500', 10);
  const filtered = process.env.RESEARCH_FILTER === 'ntish';
  const seedBase = filtered ? 30260707 : 20260707;
  const label = filtered ? `f${shard}` : `${shard}`;
  const dir = path.join(import.meta.dirname, 'data');
  mkdirSync(dir, { recursive: true });

  const dds = new Dds(await loadDds());
  const rng = mulberry32(seedBase + shard);
  const lines: string[] = [];
  const t0 = performance.now();
  let dealt = 0;

  for (let i = 0; i < perShard; i++) {
    let deal: Deal;
    do {
      deal = randomDeal(rng);
      dealt++;
    } while (filtered && !(ntEligible(deal.hands.N) && ntEligible(deal.hands.S)));

    const pbn = dealToPBN(deal);
    const dd = dds.CalcDDTablePBN({ cards: pbn }).resTable;
    lines.push(JSON.stringify({ pbn, dd }));
    if ((i + 1) % 250 === 0) {
      const msPer = (performance.now() - t0) / (i + 1);
      console.log(`shard ${label}: ${i + 1}/${perShard} (${msPer.toFixed(0)} ms/deal)`);
    }
  }

  writeFileSync(path.join(dir, `deals-${label}.jsonl`), lines.join('\n') + '\n');
  const secs = ((performance.now() - t0) / 1000).toFixed(0);
  const kept = filtered ? ` (kept ${perShard} of ${dealt} dealt, ${((perShard / dealt) * 100).toFixed(0)}%)` : '';
  console.log(`shard ${label}: wrote ${perShard} deals in ${secs} s${kept}`);
}
