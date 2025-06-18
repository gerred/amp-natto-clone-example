import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        worker: resolve(__dirname, 'src/worker/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['comlink', 'json-rules-engine'],
      output: {
        globals: {
          comlink: 'Comlink',
          'json-rules-engine': 'Engine',
        },
      },
    },
  },
});
