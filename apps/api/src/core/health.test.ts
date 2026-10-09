import { describe, expect, it } from 'vitest';

import { buildApp } from '../app.ts';
import { loadConfig } from '../config.ts';

const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://devora:devora@localhost:5433/devora_test?schema=public',
  REDIS_URL: 'redis://localhost:6380',
  SESSION_SECRET: 'test-session-secret-at-least-32-bytes-long',
} satisfies NodeJS.ProcessEnv;

describe('configuration', () => {
  it('refuses to boot without a session secret', () => {
    const { SESSION_SECRET: _omitted, ...withoutSecret } = testEnv;
    expect(() => loadConfig(withoutSecret)).toThrow(/SESSION_SECRET/u);
  });

  it('refuses a session secret that is too short to sign cookies', () => {
    expect(() => loadConfig({ ...testEnv, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/u);
  });
});

describe('health endpoints', () => {
  it('reports liveness', async () => {
    const app = await buildApp(loadConfig(testEnv));
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'live' });
    await app.close();
  });

  it('reports readiness', async () => {
    const app = await buildApp(loadConfig(testEnv));
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ready' });
    await app.close();
  });

  it('returns a reason code and a request id on an unknown route', async () => {
    const app = await buildApp(loadConfig(testEnv));
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' });
    expect(response.statusCode).toBe(404);
    expect(response.json().error).toMatchObject({ reasonCode: expect.any(String) });
    expect(response.json().error.requestId).toBeTruthy();
    await app.close();
  });
});
