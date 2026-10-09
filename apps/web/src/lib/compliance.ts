/**
 * The calling-window check the dial button obeys (wt-03 acceptance criterion 1:
 * "the dial button is disabled and the reason is shown").
 *
 * This is the read-only half, so the queue and the lead screen can show why a
 * lead cannot be called. The enforcing half runs server side before a call is
 * created, because a disabled button is a courtesy and not a control.
 */

export interface CountryRuleLike {
  readonly country: string;
  readonly callWindowStartMinutes: number;
  readonly callWindowEndMinutes: number;
  readonly callDays: number[];
  readonly recordingNoticeRequired: boolean;
  readonly registryCheckRequired: boolean;
}

export interface CallWindow {
  readonly callable: boolean;
  /** Shown to the rep when they cannot dial. Never a bare "not allowed". */
  readonly reason: string | null;
  /** The prospect's local time, so the rep knows what they are interrupting. */
  readonly localTime: string;
  readonly windowLabel: string;
  readonly recordingNoticeRequired: boolean;
}

const minutesLabel = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

/**
 * Works out the prospect's local time from their IANA zone rather than the
 * rep's, because the rule follows the person being called.
 */
export const callWindow = (timezone: string, rule: CountryRuleLike | null): CallWindow => {
  const now = new Date();
  let localTime: string;
  let localMinutes: number;
  let isoDay: number;

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
    localTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    localMinutes = hour * 60 + minute;
    isoDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday) + 1;
  } catch {
    // An unknown zone must not make a lead callable by accident.
    return {
      callable: false,
      reason: `The time zone ${timezone} is not recognised, so the calling window cannot be checked.`,
      localTime: 'unknown',
      windowLabel: 'unknown',
      recordingNoticeRequired: true,
    };
  }

  if (!rule) {
    return {
      callable: false,
      reason:
        'No country rule exists for this contact, so calling is blocked until compliance adds one.',
      localTime,
      windowLabel: 'no rule',
      recordingNoticeRequired: true,
    };
  }

  const windowLabel = `${minutesLabel(rule.callWindowStartMinutes)} to ${minutesLabel(rule.callWindowEndMinutes)} local`;

  if (!rule.callDays.includes(isoDay)) {
    return {
      callable: false,
      reason: `Calling ${rule.country} is allowed on weekdays only. It is currently the weekend where this contact is.`,
      localTime,
      windowLabel,
      recordingNoticeRequired: rule.recordingNoticeRequired,
    };
  }

  const inWindow =
    localMinutes >= rule.callWindowStartMinutes && localMinutes < rule.callWindowEndMinutes;

  return {
    callable: inWindow,
    reason: inWindow
      ? null
      : `It is ${localTime} for this contact. The window for ${rule.country} is ${windowLabel}.`,
    localTime,
    windowLabel,
    recordingNoticeRequired: rule.recordingNoticeRequired,
  };
};
