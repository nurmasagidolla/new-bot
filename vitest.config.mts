import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 10_000,
    hookTimeout: 15_000,
    setupFiles: ['tests/setup.ts'],
    pool: 'forks',
    singleFork: true,
    fileParallelism: false,
  },
});