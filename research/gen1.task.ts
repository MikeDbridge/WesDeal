import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 1', () => runShard(1), 3_600_000);
