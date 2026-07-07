import { it } from 'vitest';
import { runFlatten } from './flatten';

// Flatten ./data/*.jsonl into one-row-per-contract CSV + MSSQL schema.
it('flatten WBF results to CSV', () => runFlatten(), 600_000);
