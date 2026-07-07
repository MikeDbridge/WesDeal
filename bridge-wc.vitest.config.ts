import { defineConfig } from 'vitest/config';

/**
 * Config for the "Bridge - World Championship data scrape" project: the WBF
 * results scraper, its flatten step, and the parser unit tests. Kept separate
 * from the app suite (npm test) and the hand-eval research pipeline so none of
 * them run each other's long jobs.
 *
 * The folder name has spaces, so it is referenced only via globs here (never on
 * a shell command line). Run via: npm run bridge:scrape / :flatten / :test
 */
const DIR = 'Bridge - World Championship data scrape';

export default defineConfig({
  test: {
    environment: 'node',
    include: [`${DIR}/**/*.task.ts`, `${DIR}/**/*.test.ts`],
    testTimeout: 10_800_000,
    hookTimeout: 10_800_000,
    pool: 'forks',
    poolOptions: { forks: { maxForks: 8, minForks: 1 } },
  },
});
