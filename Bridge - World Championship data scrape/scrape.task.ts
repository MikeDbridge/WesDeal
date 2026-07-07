import { it } from 'vitest';
import { runScrape } from './scrape';

// Scrape WBF results into ./data/. Scope with env: WBF_EVENTS (default all four),
// WBF_RR_ROUNDS (default "1-23"), WBF_KO_PHASES (default "QF,SF,FF").
it('scrape WBF results', () => runScrape(), 10_800_000);
