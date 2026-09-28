import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // The test DB does real inserts/deletes against Postgres — running
    // files in parallel would let them stomp on each other's rows.
    fileParallelism: false,
    hookTimeout: 20000,
  },
});
