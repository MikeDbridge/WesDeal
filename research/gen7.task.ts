import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 7', () => runShard(7), 3_600_000);
