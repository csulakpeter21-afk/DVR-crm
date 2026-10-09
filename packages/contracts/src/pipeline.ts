/**
 * The pipeline vocabulary: the twelve stages and four side states a lead can
 * occupy, straight from DEV_PLAN.domain_frame.
 *
 * This is the ONLY place in the monorepo that enumerates them
 * (DEV_PLAN P0 acceptance criterion 3). The architecture test in
 * src/architecture.test.ts fails the build if another package redeclares them.
 *
 * The allowed-transition table and the guards live in @devora/domain: this file
 * names the states, the state machine decides which moves are legal.
 */
import { z } from 'zod';

import { reasonCodeSchema, timestampSchema } from './common.ts';
import { type Role } from './roles.ts';

/** Forward progress, in order. The index is the funnel position. */
export const PIPELINE_STAGES = [
  'sourced',
  'enriched',
  'researched',
  'queued',
  'dialled',
  'connected',
  'conversation',
  'meeting_booked',
  'meeting_held',
  'qualified',
  'opportunity',
  'won',
] as const;

/** States off the main funnel. A lead is in exactly one stage or one side state. */
export const SIDE_STATES = ['disqualified', 'nurture', 'suppressed', 'recycled'] as const;

export const pipelineStageSchema = z.enum(PIPELINE_STAGES);
export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const sideStateSchema = z.enum(SIDE_STATES);
export type SideState = z.infer<typeof sideStateSchema>;

/** Everything a Lead.stage column may hold. */
export const LEAD_STATES = [...PIPELINE_STAGES, ...SIDE_STATES] as const;
export const leadStateSchema = z.enum(LEAD_STATES);
export type LeadState = z.infer<typeof leadStateSchema>;

/** Entry criteria, verbatim from the plan. The guards in @devora/domain enforce them. */
export const STATE_ENTRY_CRITERIA: Readonly<Record<LeadState, string>> = Object.freeze({
  sourced: 'Lead created from an approved source with company and contact identity',
  enriched: 'At least one verified phone or verified email stored',
  researched: 'Dossier status = ready and every claim has a source',
  queued: 'ICP score >= campaign threshold AND compliance check passed AND assigned to a rep queue',
  dialled: 'Call attempt started',
  connected: 'A person answered',
  conversation: 'Decision maker reached AND call duration > 60s',
  meeting_booked: 'Qualifier slot booked and confirmation queued',
  meeting_held: 'Qualifier marks the meeting as held',
  qualified: 'Qualifier accepts the lead as a genuine fit',
  opportunity: 'Closer opens an opportunity',
  won: 'Contract signed',
  disqualified: 'Reason code required (e.g. not ICP, no budget, wrong contact, lost)',
  nurture: 'Not now; re-entry date required',
  suppressed:
    'Compliance block (objection to processing, do-not-call, retention expiry); terminal unless compliance lifts it',
  recycled: 'Attempt cadence exhausted without connection; returns to queued after cool-down',
});

/**
 * Who owns a lead sitting in each state, and therefore who gets the task when
 * its SLA breaches (DEV_PLAN.domain_frame.transition_rules: "Every stage has an
 * owner role and an SLA").
 *
 * ASSUMPTION: the plan requires an owner per stage but does not name them.
 * These are the obvious reading of domain_frame.roles and are registered in
 * docs/02_ASSUMPTION_REGISTER.md as A-003.
 */
export const STATE_OWNER_ROLE: Readonly<Record<LeadState, Role>> = Object.freeze({
  sourced: 'growth_lead',
  enriched: 'growth_lead',
  researched: 'growth_lead',
  queued: 'rep',
  dialled: 'rep',
  connected: 'rep',
  conversation: 'rep',
  meeting_booked: 'rep',
  meeting_held: 'qualifier',
  qualified: 'closer',
  opportunity: 'closer',
  won: 'closer',
  disqualified: 'team_lead',
  nurture: 'growth_lead',
  suppressed: 'compliance',
  recycled: 'growth_lead',
});

/**
 * How long a lead may sit in a state before `sla.breached` fires and a task is
 * created for STATE_OWNER_ROLE. `null` means no timer.
 *
 * ASSUMPTION A-004: the plan mandates an SLA per stage without values. These
 * are starting points for synthetic data; real values are SlaPolicy rows that
 * the growth lead edits, so changing them needs no code change.
 */
export const DEFAULT_STATE_SLA_HOURS: Readonly<Record<LeadState, number | null>> = Object.freeze({
  sourced: 48,
  enriched: 48,
  researched: 24,
  queued: 72,
  dialled: 24,
  connected: 4,
  conversation: 4,
  meeting_booked: null,
  meeting_held: 24,
  qualified: 48,
  opportunity: null,
  won: null,
  disqualified: null,
  nurture: null,
  suppressed: null,
  recycled: null,
});

/**
 * The stages where a lead sits in a rep's hands rather than the platform's.
 *
 * The rep queue reads this instead of listing stages itself, so "what a rep is
 * working" has one definition. Adding a stage to the funnel forces a decision
 * here rather than leaving a queue quietly wrong.
 */
export const REP_ACTIVE_STAGES: readonly PipelineStage[] = Object.freeze([
  'queued',
  'dialled',
  'connected',
]);

/**
 * States no automatic process moves a lead out of.
 * `suppressed` is terminal unless the compliance role lifts it; `won` is the end
 * of the funnel.
 */
export const TERMINAL_STATES: ReadonlySet<LeadState> = new Set<LeadState>(['won', 'suppressed']);

const STAGE_INDEX: Readonly<Record<PipelineStage, number>> = Object.freeze(
  Object.fromEntries(PIPELINE_STAGES.map((stage, index) => [stage, index])) as Record<
    PipelineStage,
    number
  >,
);

export const isPipelineStage = (value: unknown): value is PipelineStage =>
  pipelineStageSchema.safeParse(value).success;

export const isSideState = (value: unknown): value is SideState =>
  sideStateSchema.safeParse(value).success;

export const isLeadState = (value: unknown): value is LeadState =>
  leadStateSchema.safeParse(value).success;

/** Funnel position, 0-based. Side states have no position. */
export const stageIndex = (stage: PipelineStage): number => STAGE_INDEX[stage];

/** True when `to` sits further down the funnel than `from`. */
export const isForwardProgress = (from: PipelineStage, to: PipelineStage): boolean =>
  STAGE_INDEX[to] > STAGE_INDEX[from];

/**
 * A requested move. Every transition in the platform is expressed as one of
 * these and goes through the state machine; nothing writes Lead.stage directly
 * (DEV_PLAN.domain_frame.transition_rules).
 */
export const transitionRequestSchema = z.object({
  leadId: z.uuid(),
  to: leadStateSchema,
  /** Required for disqualified, nurture, suppressed and any rejection. */
  reasonCode: reasonCodeSchema.optional(),
  reasonDetail: z.string().max(2000).optional(),
  /** Required by `nurture`: when the lead comes back. */
  reEntryAt: timestampSchema.optional(),
  actorUserId: z.uuid().nullable(),
});
export type TransitionRequest = z.infer<typeof transitionRequestSchema>;
