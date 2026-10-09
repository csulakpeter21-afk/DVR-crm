/**
 * The allowed-transition table (P1-01-T2).
 *
 * This is the one file outside @devora/contracts that names states, because a
 * transition table cannot be expressed without naming them. It is listed in the
 * architecture test's VOCABULARY_OWNERS for that reason. It does not redefine
 * the enum: every key and value is typed `LeadState`, so a state that is not in
 * contracts will not compile, and the exhaustiveness test below proves every
 * state has an entry.
 *
 * ASSUMPTION A-010: the plan gives entry criteria per stage and four transition
 * rules, but no explicit table. These edges are the reading of those criteria.
 * Recorded in docs/02_ASSUMPTION_REGISTER.md.
 */
import { LEAD_STATES, SIDE_STATES, type LeadState } from '@devora/contracts';

/**
 * Side states every stage can reach. Suppression is universal because
 * compliance may block a lead at any point, and a prospect may object to
 * processing during any conversation.
 */
const ALWAYS_AVAILABLE: readonly LeadState[] = ['disqualified', 'nurture', 'suppressed'];

/** Forward edges only. The side states are added to each entry below. */
const FORWARD: Readonly<Record<LeadState, readonly LeadState[]>> = {
  sourced: ['enriched'],
  enriched: ['researched'],
  researched: ['queued'],
  // A dial that does not connect sends the lead round again, or to recycled
  // once the cadence is spent.
  queued: ['dialled'],
  dialled: ['connected', 'queued', 'recycled'],
  connected: ['conversation', 'queued', 'recycled'],
  conversation: ['meeting_booked'],
  // A no-show puts the lead back in a rep's hands rather than ending it.
  meeting_booked: ['meeting_held', 'queued'],
  meeting_held: ['qualified'],
  qualified: ['opportunity'],
  opportunity: ['won'],
  // Terminal. Only a retention rule moves a won lead, and that is to suppressed.
  won: [],
  // A disqualified lead can be revived into nurture when something changes.
  disqualified: ['nurture'],
  // Re-entry after the nurture date.
  nurture: ['queued'],
  // Terminal unless the compliance role lifts it.
  suppressed: ['queued'],
  // Back to the queue after the cool-down.
  recycled: ['queued'],
};

const build = (): Readonly<Record<LeadState, ReadonlySet<LeadState>>> => {
  const table = {} as Record<LeadState, ReadonlySet<LeadState>>;
  for (const state of LEAD_STATES) {
    const targets = new Set<LeadState>(FORWARD[state]);
    // `won` is terminal and suppression is the only exit; side states do not
    // cascade into each other beyond what FORWARD declares.
    if (state !== 'won' && !(SIDE_STATES as readonly string[]).includes(state)) {
      for (const side of ALWAYS_AVAILABLE) targets.add(side);
    }
    if (state === 'won') targets.add('suppressed');
    if ((SIDE_STATES as readonly string[]).includes(state)) targets.add('suppressed');
    targets.delete(state);
    table[state] = targets;
  }
  return Object.freeze(table);
};

export const ALLOWED_TRANSITIONS = build();

/** True when the table permits this move, ignoring guards and compliance. */
export const isAllowedTransition = (from: LeadState, to: LeadState): boolean =>
  ALLOWED_TRANSITIONS[from].has(to);

export const allowedTargets = (from: LeadState): readonly LeadState[] => [
  ...ALLOWED_TRANSITIONS[from],
];

/**
 * States that require a reason code to enter. A lead that leaves the funnel
 * without a reason is a lead nobody can learn from.
 */
export const REASON_REQUIRED: ReadonlySet<LeadState> = new Set<LeadState>([
  'disqualified',
  'nurture',
  'suppressed',
]);

/** Only the compliance role may move a lead out of suppressed. */
export const requiresComplianceRole = (from: LeadState): boolean => from === 'suppressed';
