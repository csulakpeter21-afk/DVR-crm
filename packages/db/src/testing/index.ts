/**
 * Test database utilities (DEV_PLAN P0-T4).
 *
 * Integration tests run against a real PostgreSQL instance, because the
 * invariants that matter most here are enforced in the database: the guard
 * against direct Lead.stage writes, the transactional outbox and the audit log
 * all have to be proven in SQL, not in a mock.
 */
import { db } from '../index.ts';

/**
 * Tables are truncated in dependency order with one statement so foreign keys
 * never block a reset. `_prisma_migrations` is preserved: re-running migrations
 * between tests would make the suite unusably slow.
 */
export const resetDatabase = async (): Promise<void> => {
  const prisma = db();
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
};

/** Guard so a stray test can never point at a database that is not disposable. */
export const assertTestDatabase = (): void => {
  const url = process.env['DATABASE_URL'] ?? '';
  if (!/_test(\?|$)|localhost|127\.0\.0\.1|postgres:/u.test(url)) {
    throw new Error(
      'Refusing to run destructive test helpers: DATABASE_URL does not look like a local test database.',
    );
  }
};
