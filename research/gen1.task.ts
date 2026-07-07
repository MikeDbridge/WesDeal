import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 1', () => runShard(1), 10_800_000);
