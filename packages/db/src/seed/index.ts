/**
 * Synthetic seed data.
 *
 * SYNTHETIC ONLY. Real lead data never enters this repository
 * (DEV_PLAN.global_engineering_rules). Every string here is invented, and the
 * email domain is reserved by RFC 2606 so no real inbox can be reached.
 *
 * P0 SEED: one user per role, so RBAC work in P1-02 has something to log in as.
 * Companies, contacts and leads arrive with P1-01-T1.
 */
import { ROLES, type Role } from '@devora/contracts';

import { db, disconnect } from '../index.ts';

/** RFC 2606 reserves example.com, so these addresses can never reach anyone. */
const emailFor = (role: Role): string => `${role.replace(/_/gu, '.')}@example.com`;

const displayNameFor = (role: Role): string =>
  role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') + ' (demo)';

export const seed = async (): Promise<void> => {
  const prisma = db();

  for (const role of ROLES) {
    await prisma.user.upsert({
      where: { email: emailFor(role) },
      update: { role, displayName: displayNameFor(role) },
      create: { email: emailFor(role), role, displayName: displayNameFor(role) },
    });
  }

  const count = await prisma.user.count();
  console.warn(`seed: ${count} demo users present, one per role. Synthetic data only.`);
};

await seed();
await disconnect();
