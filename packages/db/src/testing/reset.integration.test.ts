/**
 * Proves the test database utilities actually work (DEV_PLAN P0-T4).
 *
 * This test needs a live PostgreSQL, so it skips when none is configured. CI
 * provides one, which is where it must not be skipped.
 */
import { ROLES } from '@devora/contracts';
import { afterAll, describe, expect, it } from 'vitest';

import { db, disconnect } from '../index.ts';
import { assertTestDatabase, resetDatabase } from './index.ts';

const url = process.env['TEST_DATABASE_URL'] ?? process.env['DATABASE_URL'];
const hasDatabase = Boolean(url);

describe.skipIf(!hasDatabase)('test database utilities', () => {
  afterAll(async () => {
    await disconnect();
  });

  it('accepts a local database', () => {
    expect(() => {
      assertTestDatabase();
    }).not.toThrow();
  });

  it('refuses a database that does not look disposable', () => {
    const original = process.env['DATABASE_URL'];
    process.env['DATABASE_URL'] = 'postgresql://user:pw@prod.db.devora.io:5432/devora';
    try {
      expect(() => {
        assertTestDatabase();
      }).toThrow(/Refusing/u);
    } finally {
      if (original === undefined) delete process.env['DATABASE_URL'];
      else process.env['DATABASE_URL'] = original;
    }
  });

  it('truncates every table so each test starts from a known state', async () => {
    const prisma = db();
    await prisma.user.create({
      data: { email: 'reset.probe@example.com', displayName: 'Reset probe', role: ROLES[0] },
    });
    expect(await prisma.user.count()).toBeGreaterThan(0);

    await resetDatabase();

    expect(await prisma.user.count()).toBe(0);
  });
});
