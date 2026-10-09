/**
 * The single transition API (P1-01-T2, T3, T4).
 *
 * Every stage change in the platform goes through `planTransition` to decide and
 * then through the persistence callback to commit. Nothing writes `Lead.stage`
 * directly: a trigger in the database refuses it unless the transaction has set
 * `devora.transition_ok`, which only the committing adapter does.
 *
 * The decision half is pure, so the whole rule set is testable without a
 * database. The commit half is an interface this package does not implement,
 * which keeps @devora/domain free of a Prisma dependency.
 */
import { type EventName, type LeadState, type ReasonCode, type Role } from '@devora/contracts';

import { DEFAULT_GUARDS, runGuard, type Guard, type GuardContext } from './guards.ts';
import { REASON_REQUIRED, isAllowedTransition, requiresComplianceRole } from './transitions.ts';

export interface TransitionIntent {
  readonly to: LeadState;
  readonly reasonCode?: ReasonCode;
  readonly reasonDetail?: string;
  /** Required by `nurture`: when the lead comes back. */
  readonly reEntryAt?: Date;
  readonly actorUserId: string | null;
  readonly actorRole: Role | null;
}

/** What the caller should write, if anything. */
export type TransitionPlan =
  | {
      readonly outcome: 'commit';
      readonly from: LeadState;
      readonly to: LeadState;
      readonly reasonCode?: ReasonCode;
      readonly reasonDetail?: string;
      readonly reEntryAt?: Date;
      /**
       * The event to put in the outbox, chosen from the state being entered.
       * Null where the state has no event of its own: the audit entry is then
       * the whole record. Inventing an event would put a lie in the outbox and
       * every consumer downstream would act on it.
       */
      readonly event: EventName | null;
      readonly auditAction: string;
    }
  | {
      readonly outcome: 'rejected';
      readonly from: LeadState;
      readonly to: LeadState;
      readonly reasonCode: ReasonCode;
      readonly message: string;
      /**
       * A compliance refusal is itself an event: the platform records that it
       * blocked something, so the rate of blocks is measurable.
       */
      readonly event: EventName | null;
    };

/**
 * Which event a state entry emits. States with no event of their own emit none,
 * and the audit entry remains the record.
 *
 * ASSUMPTION A-011: the plan catalogues 23 events but does not map them to
 * states. This mapping is the obvious reading of the names.
 */
const EVENT_FOR_STATE: Readonly<Partial<Record<LeadState, EventName>>> = Object.freeze({
  sourced: 'lead.sourced',
  enriched: 'lead.enriched',
  researched: 'dossier.ready',
  queued: 'lead.queued',
  dialled: 'call.started',
  connected: 'call.connected',
  meeting_booked: 'meeting.booked',
  meeting_held: 'meeting.held',
  qualified: 'lead.qualified',
  disqualified: 'lead.disqualified',
  suppressed: 'lead.suppressed',
  recycled: 'lead.recycled',
});

export interface PlanInput {
  readonly current: LeadState;
  readonly intent: TransitionIntent;
  readonly guardContext: Omit<GuardContext, 'from' | 'to'>;
  readonly guards?: Readonly<Partial<Record<LeadState, Guard>>>;
}

/**
 * Decides a transition. Pure: same input, same answer, no I/O.
 *
 * Order matters. The table is checked before the guards so an impossible move is
 * reported as impossible rather than as a failed precondition, and compliance is
 * checked inside the `queued` guard before scoring so a blocked lead is never
 * described as merely low scoring.
 */
export const planTransition = ({
  current,
  intent,
  guardContext,
  guards = DEFAULT_GUARDS,
}: PlanInput): TransitionPlan => {
  const { to } = intent;
  const base = { from: current, to } as const;

  if (current === to) {
    return {
      ...base,
      outcome: 'rejected',
      reasonCode: 'already_in_state',
      message: `The lead is already in ${to}.`,
      event: null,
    };
  }

  if (!isAllowedTransition(current, to)) {
    return {
      ...base,
      outcome: 'rejected',
      reasonCode: 'transition_not_allowed',
      message: `A lead cannot move from ${current} to ${to}.`,
      event: null,
    };
  }

  if (requiresComplianceRole(current) && intent.actorRole !== 'compliance') {
    return {
      ...base,
      outcome: 'rejected',
      reasonCode: 'compliance_role_required',
      message: 'Only the compliance role may move a lead out of suppressed.',
      event: null,
    };
  }

  if (REASON_REQUIRED.has(to) && !intent.reasonCode) {
    return {
      ...base,
      outcome: 'rejected',
      reasonCode: 'reason_code_required',
      message: `Entering ${to} requires a reason code.`,
      event: null,
    };
  }

  if (to === 'nurture' && !intent.reEntryAt) {
    return {
      ...base,
      outcome: 'rejected',
      reasonCode: 're_entry_date_required',
      message: 'Nurture requires a date for the lead to come back.',
      event: null,
    };
  }

  const guard = runGuard(guards, { ...guardContext, from: current, to });
  if (!guard.ok) {
    return {
      ...base,
      outcome: 'rejected',
      reasonCode: guard.reasonCode,
      message: guard.message,
      // A compliance refusal is recorded as an event so blocks are countable.
      event:
        guard.reasonCode === 'compliance_blocked' || !guardContext.compliancePassed
          ? 'compliance.blocked'
          : null,
    };
  }

  return {
    ...base,
    outcome: 'commit',
    ...(intent.reasonCode === undefined ? {} : { reasonCode: intent.reasonCode }),
    ...(intent.reasonDetail === undefined ? {} : { reasonDetail: intent.reasonDetail }),
    ...(intent.reEntryAt === undefined ? {} : { reEntryAt: intent.reEntryAt }),
    event: EVENT_FOR_STATE[to] ?? null,
    auditAction: `lead.stage.${current}_to_${to}`,
  };
};

/** A neutral guard context, for callers that only need the table and the rules. */
export const permissiveGuardContext = (leadId: string): Omit<GuardContext, 'from' | 'to'> => ({
  leadId,
  hasVerifiedPhone: true,
  hasVerifiedEmail: true,
  dossierReady: true,
  icpScore: 100,
  icpThreshold: 0,
  compliancePassed: true,
  assigned: true,
  hasLegalBasis: true,
  decisionMakerReached: true,
  callDurationSeconds: 61,
});
