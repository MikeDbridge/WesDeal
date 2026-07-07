import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 4', () => runShard(4), 3_600_000);
