/**
 * Queue names and the shared default job options.
 *
 * P0 SHELL. The processors land with their owning worktree:
 *   outbox       -> P1-01-T3 (wt-01-core-domain) transactional outbox dispatch
 *   sla          -> P1-01-T5 (wt-01-core-domain) stage SLA timers
 *   retention    -> P1-03-T4 (wt-03-compliance)  deletion and anonymisation
 *   enrichment   -> P1-04    (wt-04-integrations-framework)
 *   dossier      -> P2-10    (wt-10-dossier)
 *
 * Retry policy is set once, here: every external call retries with exponential
 * backoff (DEV_PLAN.global_engineering_rules), and nothing is dropped silently
 * because failed jobs are kept for inspection.
 */
import { type JobsOptions } from 'bullmq';

export const QUEUE_NAMES = ['outbox', 'sla', 'retention', 'enrichment', 'dossier'] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1_000 },
  // Keep a window of completed jobs for debugging, and every failure.
  removeOnComplete: { age: 3_600, count: 1_000 },
  removeOnFail: false,
};
