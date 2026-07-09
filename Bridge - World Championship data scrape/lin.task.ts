import { it } from 'vitest';
import { runLin } from './lin';

// Ingest BBO vugraph LIN broadcasts (NABC KOs) into ./data/<LIN_TOURN>/. Scope
// with env: LIN_SEARCH (';'-separated queries), LIN_TOURN (key).
it('ingest BBO vugraph LIN', () => runLin(), 10_800_000);
