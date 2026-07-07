import { defineConfig } from 'vitest/config';

/**
 * Config for the research pipeline (dataset generation + analysis) — separate
 * from the app's test suite so `npm test` / CI never runs these long jobs.
 * Run via: npm run research:gen / npm run research:analyze
 *
 * Generation is sharded across files; the forks pool runs them in parallel,
 * one DDS WASM instance per process.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['research/**/*.task.ts'],
    testTimeout: 10_800_000,
    hookTimeout: 10_800_000,
    pool: 'forks',
    poolOptions: { forks: { maxForks: 8, minForks: 1 } },
  },
});
