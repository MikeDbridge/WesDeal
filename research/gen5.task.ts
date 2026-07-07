import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 5', () => runShard(5), 10_800_000);
