/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Build to relative paths so the app can be opened from disk if desired.
  base: './',
  build: {
    // Four pages: deal generator (index), suit-break odds, double-dummy lab,
    // bidding-range study.
    rollupOptions: {
      input: { main: 'index.html', odds: 'odds.html', lab: 'lab.html', bidding: 'bidding.html' },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
