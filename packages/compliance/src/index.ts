/**
 * @devora/compliance is the gate the state machine and the dialler must pass
 * before the platform acts. Compliance is enforced in code, never left to a
 * rep's memory (DEV_PLAN.product.principles).
 *
 * P0 SHELL. The rules engine, suppression, legal basis records and retention
 * jobs are P1-03 (wt-03-compliance). The copy linter in ./copy-lint is live
 * from P0 because CI depends on it.
 */
import { type ReasonCode } from '@devora/contracts';

export * from './copy-lint/index.ts';

/** Outcome of a compliance check. A refusal always carries a machine-readable reason. */
export type ComplianceDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reasonCode: ReasonCode; readonly explanation: string };

export const allow = (): ComplianceDecision => ({ allowed: true });

export const refuse = (reasonCode: ReasonCode, explanation: string): ComplianceDecision => ({
  allowed: false,
  reasonCode,
  explanation,
});
