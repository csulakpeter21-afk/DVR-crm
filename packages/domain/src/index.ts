/**
 * @devora/domain owns the pipeline state machine, the task and SLA engine, the
 * audit log and the scoring interfaces.
 *
 * P0 SHELL. The state machine, guards and SLA timers are P1-01-T2 and P1-01-T5
 * (wt-01-core-domain); permissions are P1-02-T2 (wt-02-auth-rbac).
 * This file exists so the dependency on @devora/contracts is compiled and
 * proven from day one.
 */
import {
  DEFAULT_STATE_SLA_HOURS,
  STATE_ENTRY_CRITERIA,
  STATE_OWNER_ROLE,
  type LeadState,
  type Role,
} from '@devora/contracts';

export * from './pipeline/index.ts';

/** What the platform knows about a state before any lead is involved. */
export interface StateProfile {
  readonly state: LeadState;
  readonly entryCriteria: string;
  readonly ownerRole: Role;
  readonly slaHours: number | null;
}

/**
 * Resolves a state's static profile. The SLA engine (P1-01-T5) reads the owner
 * role from here to decide who gets the task when a timer breaches, rather than
 * each caller hard-coding an assignment.
 */
export const describeState = (state: LeadState): StateProfile => ({
  state,
  entryCriteria: STATE_ENTRY_CRITERIA[state],
  ownerRole: STATE_OWNER_ROLE[state],
  slaHours: DEFAULT_STATE_SLA_HOURS[state],
});
