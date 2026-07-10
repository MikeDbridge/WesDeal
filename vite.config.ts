/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Build to relative paths so the app can be opened from disk if desired.
  base: './',
  build: {
    // Six pages: deal generator (index), suit-break odds, double-dummy lab,
    // opening-lead analyser, bidding-range study, tournament calendar.
    rollupOptions: {
      input: {
        main: 'index.html', odds: 'odds.html', lab: 'lab.html', lead: 'lead.html',
        bidding: 'bidding.html', calendar: 'calendar.html',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
