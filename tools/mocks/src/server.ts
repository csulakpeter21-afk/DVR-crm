/**
 * The combined mock provider server.
 *
 * One process serves every provider under its own prefix, so local development
 * and CI need a single container. Routes are added by the worktree that owns
 * the adapter they stand in for.
 */
import Fastify from 'fastify';

import { MOCK_PROVIDERS, MOCK_SERVER_PORT } from './index.ts';

const app = Fastify({ logger: { level: process.env['LOG_LEVEL'] ?? 'info' } });

app.get('/health/live', () => ({ status: 'live', providers: MOCK_PROVIDERS }));

/**
 * Each provider gets a namespace now so adapter base URLs are stable from the
 * start. The endpoints themselves arrive with P1-04.
 */
for (const provider of MOCK_PROVIDERS) {
  app.get(`/${provider}/health`, () => ({
    provider,
    status: 'mock',
    note: 'Endpoints land with wt-04-integrations-framework (P1-04).',
  }));
}

const port = Number(process.env['MOCK_SERVER_PORT'] ?? MOCK_SERVER_PORT);
await app.listen({ port, host: '0.0.0.0' });
