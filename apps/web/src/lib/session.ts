/**
 * The acting user.
 *
 * DEMO STAND-IN. Real authentication, sessions and RBAC are wt-02 (P1-02).
 * Until that lands, the workspace acts as the seeded rep so the queue and the
 * state machine have an actor to attribute transitions to. Everything that
 * writes takes the user id as an argument, so swapping this for a real session
 * is a one-file change.
 */
import { db } from '@devora/db';
import { type Role } from '@devora/contracts';

export interface ActingUser {
  readonly id: string;
  readonly displayName: string;
  readonly role: Role;
}

export const currentUser = async (): Promise<ActingUser> => {
  const user = await db().user.findFirstOrThrow({
    where: { role: 'rep', deactivatedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return { id: user.id, displayName: user.displayName, role: user.role };
};
