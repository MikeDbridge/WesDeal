/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Build to relative paths so the app can be opened from disk if desired.
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
