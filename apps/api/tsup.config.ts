import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  // Workspace packages ship TypeScript source, so they are bundled in.
  noExternal: [/^@devora\//],
});
