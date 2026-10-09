import {
  LEAD_STATES,
  PIPELINE_STAGES,
  SIDE_STATES,
  SUPPRESSION_LIFT_ROLE,
  TERMINAL_STATES,
  isForwardProgress,
  stageIndex,
} from '@devora/contracts';
import { describe, expect, it } from 'vitest';

import { describeState } from './index.ts';

describe('describeState', () => {
  it('gives every state an owner role, so an SLA breach always has someone to assign to', () => {
    for (const state of LEAD_STATES) {
      expect(describeState(state).ownerRole, state).toBeTruthy();
    }
  });

  it('gives every state its entry criteria from the plan', () => {
    expect(describeState('queued').entryCriteria).toMatch(/ICP score/u);
    expect(describeState('suppressed').entryCriteria).toMatch(/Compliance block/u);
  });

  it('assigns the rep the states a rep actually works', () => {
    for (const state of ['queued', 'dialled', 'connected', 'conversation'] as const) {
      expect(describeState(state).ownerRole, state).toBe('rep');
    }
  });

  it('leaves suppression with the compliance role, which is the only role that can lift it', () => {
    expect(describeState('suppressed').ownerRole).toBe(SUPPRESSION_LIFT_ROLE);
  });

  it('sets no timer on states a lead may rest in indefinitely', () => {
    expect(describeState('won').slaHours).toBeNull();
    expect(describeState('suppressed').slaHours).toBeNull();
    expect(describeState('nurture').slaHours).toBeNull();
  });

  it('sets a timer on every state the platform is meant to push out of', () => {
    for (const state of ['sourced', 'enriched', 'researched', 'queued'] as const) {
      expect(describeState(state).slaHours, state).toBeGreaterThan(0);
    }
  });
});

describe('pipeline ordering', () => {
  it('orders the funnel from sourced to won', () => {
    expect(stageIndex('sourced')).toBe(0);
    expect(stageIndex('won')).toBe(PIPELINE_STAGES.length - 1);
  });

  it('recognises forward progress and refuses to call a step back progress', () => {
    expect(isForwardProgress('queued', 'conversation')).toBe(true);
    expect(isForwardProgress('conversation', 'queued')).toBe(false);
    expect(isForwardProgress('queued', 'queued')).toBe(false);
  });

  it('treats won and suppressed as terminal and nothing else', () => {
    expect([...TERMINAL_STATES].sort()).toEqual(['suppressed', 'won']);
  });

  it('keeps stages and side states disjoint', () => {
    const overlap = PIPELINE_STAGES.filter((stage) =>
      (SIDE_STATES as readonly string[]).includes(stage),
    );
    expect(overlap).toEqual([]);
  });
});
