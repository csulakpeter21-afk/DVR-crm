/**
 * The state machine is the spine of the platform, so this suite is written
 * against DEV_PLAN's own rules and wt-01's acceptance criteria rather than
 * against the implementation.
 */
import { LEAD_STATES, PIPELINE_STAGES, type LeadState } from '@devora/contracts';
import { describe, expect, it } from 'vitest';

import {
  ALLOWED_TRANSITIONS,
  allowedTargets,
  isAllowedTransition,
  permissiveGuardContext,
  planTransition,
  type TransitionIntent,
} from './index.ts';

const intent = (to: LeadState, over: Partial<TransitionIntent> = {}): TransitionIntent => ({
  to,
  actorUserId: '00000000-0000-0000-0000-000000000001',
  actorRole: 'rep',
  ...over,
});

const plan = (
  current: LeadState,
  to: LeadState,
  over: Partial<TransitionIntent> = {},
  guardOver: Partial<ReturnType<typeof permissiveGuardContext>> = {},
) =>
  planTransition({
    current,
    intent: intent(to, over),
    guardContext: { ...permissiveGuardContext('lead-1'), ...guardOver },
  });

describe('the transition table', () => {
  it('has an entry for every state, so no state is a dead end by omission', () => {
    for (const state of LEAD_STATES) {
      expect(ALLOWED_TRANSITIONS[state], state).toBeDefined();
    }
  });

  it('lets every stage reach suppressed, because compliance may block at any point', () => {
    for (const state of LEAD_STATES) {
      if (state === 'suppressed') continue;
      expect(isAllowedTransition(state, 'suppressed'), state).toBe(true);
    }
  });

  it('never lets a state transition to itself', () => {
    for (const state of LEAD_STATES) {
      expect(isAllowedTransition(state, state), state).toBe(false);
    }
  });

  it('keeps won terminal apart from suppression, which retention needs', () => {
    expect(allowedTargets('won')).toEqual(['suppressed']);
  });

  it('walks the whole funnel sourced to won one step at a time', () => {
    for (let i = 0; i < PIPELINE_STAGES.length - 1; i += 1) {
      const from = PIPELINE_STAGES[i] as LeadState;
      const to = PIPELINE_STAGES[i + 1] as LeadState;
      expect(isAllowedTransition(from, to), `${from} -> ${to}`).toBe(true);
    }
  });

  it('refuses to skip a stage', () => {
    expect(isAllowedTransition('sourced', 'queued')).toBe(false);
    expect(isAllowedTransition('queued', 'meeting_booked')).toBe(false);
  });

  it('sends an unanswered dial back to the queue or to recycled', () => {
    expect(isAllowedTransition('dialled', 'queued')).toBe(true);
    expect(isAllowedTransition('dialled', 'recycled')).toBe(true);
  });

  it('brings nurture, recycled and a lifted suppression back to queued', () => {
    for (const state of ['nurture', 'recycled', 'suppressed'] as const) {
      expect(isAllowedTransition(state, 'queued'), state).toBe(true);
    }
  });
});

describe('wt-01 acceptance: a failing compliance check blocks queueing', () => {
  const rejected = plan('researched', 'queued', {}, { compliancePassed: false });

  it('rejects the transition', () => {
    expect(rejected.outcome).toBe('rejected');
  });

  it('gives a reason code rather than a bare failure', () => {
    expect(rejected.outcome === 'rejected' && rejected.reasonCode).toBe('compliance_blocked');
  });

  it('emits compliance.blocked so the block is countable', () => {
    expect(rejected.outcome === 'rejected' && rejected.event).toBe('compliance.blocked');
  });

  it('reports compliance, not the score, when both would fail', () => {
    const both = plan(
      'researched',
      'queued',
      {},
      { compliancePassed: false, icpScore: 10, icpThreshold: 90 },
    );
    expect(both.outcome === 'rejected' && both.reasonCode).toBe('compliance_blocked');
  });
});

describe('entry guards make the plan criteria executable', () => {
  it('enriched needs a verified phone or email', () => {
    const r = plan('sourced', 'enriched', {}, { hasVerifiedPhone: false, hasVerifiedEmail: false });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('no_verified_contact');
    expect(
      plan('sourced', 'enriched', {}, { hasVerifiedEmail: true, hasVerifiedPhone: false }).outcome,
    ).toBe('commit');
  });

  it('researched needs a ready dossier', () => {
    const r = plan('enriched', 'researched', {}, { dossierReady: false });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('dossier_not_ready');
  });

  it('queued needs the ICP threshold met', () => {
    const r = plan('researched', 'queued', {}, { icpScore: 55, icpThreshold: 60 });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('below_icp_threshold');
  });

  it('queued needs a legal basis record', () => {
    const r = plan('researched', 'queued', {}, { hasLegalBasis: false });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('no_legal_basis');
  });

  it('queued needs a rep to own it', () => {
    const r = plan('researched', 'queued', {}, { assigned: false });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('not_assigned');
  });

  it('conversation needs the decision maker', () => {
    const r = plan('connected', 'conversation', {}, { decisionMakerReached: false });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('no_decision_maker');
  });

  it('conversation needs more than 60 seconds, and 60 exactly is not more', () => {
    expect(plan('connected', 'conversation', {}, { callDurationSeconds: 60 }).outcome).toBe(
      'rejected',
    );
    expect(plan('connected', 'conversation', {}, { callDurationSeconds: 61 }).outcome).toBe(
      'commit',
    );
  });
});

describe('leaving the funnel is always explained', () => {
  it('requires a reason code for disqualified, nurture and suppressed', () => {
    for (const state of ['disqualified', 'nurture', 'suppressed'] as const) {
      const r = plan('queued', state);
      expect(r.outcome === 'rejected' && r.reasonCode, state).toBe('reason_code_required');
    }
  });

  it('requires a re-entry date for nurture', () => {
    const r = plan('queued', 'nurture', { reasonCode: 'not_now' });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('re_entry_date_required');
  });

  it('accepts nurture once both are given', () => {
    const r = plan('queued', 'nurture', {
      reasonCode: 'not_now',
      reEntryAt: new Date('2027-01-01'),
    });
    expect(r.outcome).toBe('commit');
  });
});

describe('only compliance lifts a suppression', () => {
  it('refuses a rep', () => {
    const r = plan('suppressed', 'queued', { actorRole: 'rep' });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('compliance_role_required');
  });

  it('refuses a growth lead, who can approve scripts but not this', () => {
    const r = plan('suppressed', 'queued', { actorRole: 'growth_lead' });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('compliance_role_required');
  });

  it('allows the compliance role', () => {
    const r = plan('suppressed', 'queued', { actorRole: 'compliance' });
    expect(r.outcome).toBe('commit');
  });
});

describe('every committed transition carries an event and an audit action', () => {
  it('names the event after the state entered', () => {
    const r = plan('researched', 'queued');
    expect(r.outcome === 'commit' && r.event).toBe('lead.queued');
  });

  it('records the move in the audit action', () => {
    const r = plan('researched', 'queued');
    expect(r.outcome === 'commit' && r.auditAction).toBe('lead.stage.researched_to_queued');
  });
});

describe('rejections that are not guard failures', () => {
  it('refuses a move to the same state', () => {
    const r = plan('queued', 'queued');
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('already_in_state');
  });

  it('refuses an impossible move before checking any precondition', () => {
    const r = plan('sourced', 'won', {}, { dossierReady: false, compliancePassed: false });
    expect(r.outcome === 'rejected' && r.reasonCode).toBe('transition_not_allowed');
  });
});

describe('a transition never invents an event', () => {
  it('emits nothing for a state the catalogue does not name', () => {
    // `conversation` has no event of its own. Emitting lead.sourced for it
    // would put a lie in the outbox that every consumer would act on.
    const r = plan('connected', 'conversation');
    expect(r.outcome).toBe('commit');
    expect(r.outcome === 'commit' && r.event).toBeNull();
  });

  it('still writes the audit action, which is the record in that case', () => {
    const r = plan('connected', 'conversation');
    expect(r.outcome === 'commit' && r.auditAction).toBe('lead.stage.connected_to_conversation');
  });

  it('emits the right event where the catalogue does name one', () => {
    expect(plan('conversation', 'meeting_booked').outcome === 'commit').toBe(true);
    const r = plan('conversation', 'meeting_booked');
    expect(r.outcome === 'commit' && r.event).toBe('meeting.booked');
  });
});
