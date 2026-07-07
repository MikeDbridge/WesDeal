import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 2', () => runShard(2), 10_800_000);
