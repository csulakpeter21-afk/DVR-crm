/**
 * Entry guards (P1-01-T2).
 *
 * Each pipeline state has entry criteria in the plan. A guard turns one of
 * those sentences into a check the platform runs before it lets a lead in, so
 * the criteria are executable rather than documentation.
 *
 * Guards are pluggable: the state machine takes a map, so the compliance
 * package and the ICP engine supply their own without this file depending on
 * them.
 */
import { type LeadState, type ReasonCode } from '@devora/contracts';

/** What a guard is given to decide on. Deliberately plain data, so guards are pure. */
export interface GuardContext {
  readonly leadId: string;
  readonly from: LeadState;
  readonly to: LeadState;
  /** Verified contact details, which is what `enriched` means. */
  readonly hasVerifiedPhone: boolean;
  readonly hasVerifiedEmail: boolean;
  /** Dossier state, which is what `researched` means. */
  readonly dossierReady: boolean;
  /** ICP score and the campaign threshold, which is half of what `queued` means. */
  readonly icpScore: number;
  readonly icpThreshold: number;
  /** The other half: a compliance decision and a rep to own it. */
  readonly compliancePassed: boolean;
  readonly complianceReason?: ReasonCode;
  readonly assigned: boolean;
  /** A legal basis must exist before a contact may be worked. */
  readonly hasLegalBasis: boolean;
  /** `conversation` means a decision maker and more than 60 seconds. */
  readonly decisionMakerReached: boolean;
  readonly callDurationSeconds: number;
}

export type GuardResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reasonCode: ReasonCode; readonly message: string };

const ok: GuardResult = { ok: true };
const fail = (reasonCode: ReasonCode, message: string): GuardResult => ({
  ok: false,
  reasonCode,
  message,
});

export type Guard = (context: GuardContext) => GuardResult;

/**
 * The default guards, one per state that has a checkable criterion.
 * States absent from this map have no precondition beyond the transition table.
 */
export const DEFAULT_GUARDS: Readonly<Partial<Record<LeadState, Guard>>> = Object.freeze({
  enriched: (c) =>
    c.hasVerifiedPhone || c.hasVerifiedEmail
      ? ok
      : fail('no_verified_contact', 'Needs at least one verified phone or verified email.'),

  researched: (c) =>
    c.dossierReady
      ? ok
      : fail('dossier_not_ready', 'The dossier is not ready, or a claim has no source.'),

  queued: (c) => {
    // Compliance first: a blocked lead must not be told it is merely low scoring.
    if (!c.compliancePassed) {
      return fail(
        c.complianceReason ?? 'compliance_blocked',
        'Compliance refused this lead. It cannot be queued.',
      );
    }
    if (!c.hasLegalBasis) {
      return fail('no_legal_basis', 'No legal basis record exists for this contact.');
    }
    if (c.icpScore < c.icpThreshold) {
      return fail(
        'below_icp_threshold',
        `ICP score ${c.icpScore} is below the campaign threshold ${c.icpThreshold}.`,
      );
    }
    if (!c.assigned) {
      return fail('not_assigned', 'A queued lead needs a rep to own it.');
    }
    return ok;
  },

  conversation: (c) => {
    if (!c.decisionMakerReached) {
      return fail('no_decision_maker', 'A conversation needs the decision maker on the call.');
    }
    if (c.callDurationSeconds <= 60) {
      return fail(
        'call_too_short',
        `A conversation runs longer than 60 seconds; this call ran ${c.callDurationSeconds}.`,
      );
    }
    return ok;
  },
});

export const runGuard = (
  guards: Readonly<Partial<Record<LeadState, Guard>>>,
  context: GuardContext,
): GuardResult => guards[context.to]?.(context) ?? ok;
