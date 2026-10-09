/**
 * Roles, straight from DEV_PLAN.domain_frame.roles.
 *
 * ASSUMPTION: the capability sentences are the plan's own wording. The binding
 * permission matrix is built on top of this in packages/domain/src/permissions
 * by wt-02-auth-rbac; this file only names the roles so every package agrees.
 */
import { z } from 'zod';

export const ROLES = [
  'rep',
  'team_lead',
  'qualifier',
  'closer',
  'growth_lead',
  'compliance',
  'admin',
] as const;

export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** What each role is for, as written in the plan. Shown in the admin UI. */
export const ROLE_DESCRIPTIONS: Readonly<Record<Role, string>> = Object.freeze({
  rep: 'Work own queue, run calls, log outcomes, book meetings',
  team_lead: 'Manage reps and queues, QA calls, coaching notes',
  qualifier: 'See briefs, run qualifier meetings, accept or reject leads',
  closer: 'Manage opportunities to won',
  growth_lead: 'All dashboards, budgets, experiments, ICP and script approval',
  compliance: 'Rules, suppression, retention, audit access',
  admin: 'Users, integrations, settings',
});

/**
 * Only this role may move a lead out of `suppressed`
 * (DEV_PLAN.domain_frame.transition_rules).
 */
export const SUPPRESSION_LIFT_ROLE: Role = 'compliance';

export const isRole = (value: unknown): value is Role => roleSchema.safeParse(value).success;
