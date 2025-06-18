import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@nodeflow/canvas': resolve(__dirname, '../../packages/canvas/src'),
      '@nodeflow/widgets': resolve(__dirname, '../../packages/widgets/src'),
      '@nodeflow/runtime': resolve(__dirname, '../../packages/runtime/src'),
      '@nodeflow/api': resolve(__dirname, '../../packages/api/src'),
    },
  },
  server: {
    port: 5173,
  },
});
