import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 3', () => runShard(3), 10_800_000);
