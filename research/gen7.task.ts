import { it } from 'vitest';
import { runShard } from './gen.core';

it('generate shard 7', () => runShard(7), 10_800_000);
