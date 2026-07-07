import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 6', () => runShard(6), 3_600_000);
