/**
 * @devora/integrations holds every outbound adapter: enrichment (FullEnrich),
 * telephony, transcription, llm, email and calendar.
 *
 * P0 SHELL. The adapter framework, the FullEnrich adapter and the provider
 * mocks are P1-04 (wt-04-integrations-framework).
 *
 * The shape below is the contract every adapter will satisfy, so that the
 * framework can apply timeouts, retries with backoff, idempotency keys and cost
 * recording uniformly (DEV_PLAN.global_engineering_rules).
 */
import { type Money } from '@devora/contracts';

/** Identifies a provider in the cost ledger and in logs. */
export type ProviderId = string;

/** What every adapter call reports back, so cost is never silently untracked. */
export interface AdapterCallResult<T> {
  readonly provider: ProviderId;
  readonly data: T;
  /** Null when the call was free or served from cache. */
  readonly cost: Money | null;
  readonly idempotencyKey: string;
}
