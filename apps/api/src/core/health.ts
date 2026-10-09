/**
 * Liveness and readiness.
 *
 * Docker Compose and the `pnpm dev` orchestrator wait on /health/ready before
 * declaring the stack up, so this endpoint is what makes "one command to start
 * everything" reliable (DEV_PLAN P0-T2).
 */
import { type FastifyInstance } from 'fastify';

export const registerHealthRoutes = (app: FastifyInstance): void => {
  app.get('/health/live', () => ({ status: 'live' }));

  app.get('/health/ready', async () => {
    // P1-01 extends this with a database round trip once the schema is real.
    await Promise.resolve();
    return { status: 'ready', checks: { api: 'ok' } };
  });
};
