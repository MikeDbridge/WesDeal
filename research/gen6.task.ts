import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 6', () => runShard(6), 10_800_000);
