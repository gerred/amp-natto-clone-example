import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.config.*',
        '**/*.test.*',
        '**/test/**',
        '**/tests/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@nodeflow/canvas': resolve(__dirname, './packages/canvas/src'),
      '@nodeflow/widgets': resolve(__dirname, './packages/widgets/src'),
      '@nodeflow/runtime': resolve(__dirname, './packages/runtime/src'),
      '@nodeflow/api': resolve(__dirname, './packages/api/src'),
    },
  },
});
