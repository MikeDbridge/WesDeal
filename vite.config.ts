/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Build to relative paths so the app can be opened from disk if desired.
  base: './',
  build: {
    // Seven pages: deal generator (index, incl. the opening-lead analyser),
    // hand analyser (WesPlay), suit-break odds, double-dummy lab, bidding-range
    // study, tournament calendar, opening-bid comparisons (WesComp).
    rollupOptions: {
      input: {
        main: 'index.html', analyze: 'analyze.html', odds: 'odds.html', lab: 'lab.html',
        bidding: 'bidding.html', calendar: 'calendar.html', comp: 'comp.html',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
