import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    /**
     * The integration tests share one PostgreSQL database and truncate it
     * between tests, so running files in parallel would have them reset each
     * other mid-test. Sequential files, with tests inside a file still ordered.
     */
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
