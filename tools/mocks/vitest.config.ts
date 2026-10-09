import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // P0 SHELL: this package has no tests yet. The worktree that fills it in
    // adds them, and this flag goes away with the first one.
    passWithNoTests: true,
  },
});
