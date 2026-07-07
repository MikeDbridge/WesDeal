import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 5', () => runShard(5), 3_600_000);
