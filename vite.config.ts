import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'app',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        booth: resolve(import.meta.dirname, 'app/index.html'),
        result: resolve(import.meta.dirname, 'app/result.html'),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
