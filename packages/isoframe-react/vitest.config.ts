import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@nice-tools/isoframe': resolve(__dirname, '../isoframe/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{spec,test}.ts', 'src/**/*.{spec,test}.tsx'],
  },
});
