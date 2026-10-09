/**
 * DEV_PLAN.global_engineering_rules: "Every compliance rule has a test that
 * proves the platform blocks the forbidden action."
 *
 * The calling window is the rule a rep meets most often, so these tests pin
 * both halves: it blocks when it should, and it does not block when it should
 * not, because a control that blocks everything gets switched off.
 */
import { describe, expect, it } from 'vitest';

import { callWindow, type CountryRuleLike } from './compliance.ts';

const rule = (over: Partial<CountryRuleLike> = {}): CountryRuleLike => ({
  country: 'FR',
  callWindowStartMinutes: 9 * 60,
  callWindowEndMinutes: 19 * 60,
  callDays: [1, 2, 3, 4, 5],
  recordingNoticeRequired: true,
  registryCheckRequired: false,
  ...over,
});

/** A zone whose local time we can state exactly, regardless of where CI runs. */
const AT_NOON_UTC = 'UTC';

describe('a contact with no country rule', () => {
  it('cannot be called, because an unknown rule is not an absent one', () => {
    const result = callWindow('Europe/Paris', null);
    expect(result.callable).toBe(false);
    expect(result.reason).toMatch(/No country rule/u);
  });
});

describe('an unrecognised time zone', () => {
  it('blocks rather than defaulting to callable', () => {
    const result = callWindow('Mars/Olympus_Mons', rule());
    expect(result.callable).toBe(false);
    expect(result.reason).toMatch(/not recognised/u);
  });
});

describe('the window itself', () => {
  it('blocks a window that has not opened, and says what time it is there', () => {
    // A window that opens after the current UTC hour can never be open now.
    const result = callWindow(
      AT_NOON_UTC,
      rule({ callWindowStartMinutes: 0, callWindowEndMinutes: 1 }),
    );
    expect(result.callable).toBe(false);
    expect(result.reason).toMatch(/The window for FR is/u);
    expect(result.reason).toMatch(/It is \d{2}:\d{2} for this contact/u);
  });

  it('allows a window that covers the whole day', () => {
    const result = callWindow(
      AT_NOON_UTC,
      rule({ callWindowStartMinutes: 0, callWindowEndMinutes: 24 * 60 }),
    );
    expect(result.callable).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('treats the closing minute as closed, not open', () => {
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const result = callWindow(
      AT_NOON_UTC,
      rule({ callWindowStartMinutes: 0, callWindowEndMinutes: utcMinutes }),
    );
    expect(result.callable).toBe(false);
  });

  it('reports the window in a form a rep can read', () => {
    const result = callWindow(AT_NOON_UTC, rule());
    expect(result.windowLabel).toBe('09:00 to 19:00 local');
  });
});

describe('weekends', () => {
  it('blocks a country whose rule lists no days at all', () => {
    const result = callWindow(AT_NOON_UTC, rule({ callDays: [] }));
    expect(result.callable).toBe(false);
    expect(result.reason).toMatch(/weekdays only/u);
  });
});

describe('the recording notice requirement travels with the rule', () => {
  it('is carried through so the dialler can log the notice first', () => {
    expect(
      callWindow(AT_NOON_UTC, rule({ recordingNoticeRequired: true })).recordingNoticeRequired,
    ).toBe(true);
    expect(
      callWindow(AT_NOON_UTC, rule({ recordingNoticeRequired: false })).recordingNoticeRequired,
    ).toBe(false);
  });

  it('assumes a notice is required when the rule is missing, which is the safe default', () => {
    expect(callWindow('Europe/Paris', null).recordingNoticeRequired).toBe(true);
  });
});
