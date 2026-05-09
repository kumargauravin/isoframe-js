import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{spec,test}.ts', 'src/**/*.{spec,test}.tsx'],
  },
});
