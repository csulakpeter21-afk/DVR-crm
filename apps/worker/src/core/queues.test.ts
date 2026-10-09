import { describe, expect, it } from 'vitest';

import { loadConfig } from '../config.ts';
import { DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from './queues.ts';

describe('worker configuration', () => {
  it('refuses to boot without Redis', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x/y', NODE_ENV: 'test' })).toThrow(
      /REDIS_URL/u,
    );
  });
});

describe('default job options', () => {
  it('retries with exponential backoff, as the engineering rules require', () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBeGreaterThan(1);
    expect(DEFAULT_JOB_OPTIONS.backoff).toMatchObject({ type: 'exponential' });
  });

  it('never discards a failed job, so nothing is lost silently', () => {
    expect(DEFAULT_JOB_OPTIONS.removeOnFail).toBe(false);
  });

  it('declares queue names that are unique', () => {
    expect(new Set(QUEUE_NAMES).size).toBe(QUEUE_NAMES.length);
  });
});
