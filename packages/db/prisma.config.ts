/**
 * Prisma 7 configuration.
 *
 * Prisma 7 removed `url` from the datasource block: the connection string for
 * migrate and introspect lives here, and the application passes a driver
 * adapter to PrismaClient instead (see src/index.ts).
 *
 * Prisma 7 also stopped loading .env by itself, so this file loads the
 * repository root .env explicitly. The fallback is the local Docker Compose
 * stack, which keeps `prisma generate`, `pnpm typecheck` and CI working on a
 * clean clone with no environment set up. It can only ever point at the local
 * development database; real credentials come from the environment
 * (DEV_PLAN.global_engineering_rules).
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'prisma/config';

const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const LOCAL_POSTGRES = 'postgresql://devora:devora@localhost:5433';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/seed/index.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? `${LOCAL_POSTGRES}/devora?schema=public`,
    /**
     * Migrate needs a throwaway database to diff against. Docker Compose
     * provisions it next to the main one so `prisma migrate dev` works offline.
     */
    shadowDatabaseUrl:
      process.env['SHADOW_DATABASE_URL'] ?? `${LOCAL_POSTGRES}/devora_shadow?schema=public`,
  },
});
