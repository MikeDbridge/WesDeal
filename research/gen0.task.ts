import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 0', () => runShard(0), 10_800_000);
