/**
 * @devora/db owns the Prisma schema, its migrations and synthetic seed data.
 *
 * P0 SEED: the client factory and the test helpers. The full entity set is
 * P1-01-T1 (wt-01-core-domain).
 *
 * Synthetic data only, ever. Real lead data never enters this repository
 * (DEV_PLAN.global_engineering_rules).
 *
 * Prisma 7 requires a driver adapter rather than a connection string on the
 * client, so the pool is owned here and shared by the API and the worker.
 */
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/client/index.js';

export { PrismaClient } from '../generated/client/index.js';
export type { Prisma, User } from '../generated/client/index.js';

let client: PrismaClient | undefined;

const connectionString = (): string => {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env, or run `pnpm dev` which starts the local stack.',
    );
  }
  return url;
};

/**
 * One client per process. Next.js in development reloads modules, so a cached
 * instance avoids exhausting the connection pool.
 */
export const db = (): PrismaClient => {
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString() }),
    log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['error'],
  });
  return client;
};

export const disconnect = async (): Promise<void> => {
  await client?.$disconnect();
  client = undefined;
};

export { transitionLead } from './pipeline.ts';
export type { TransitionOutcome, TransitionRequest } from './pipeline.ts';
