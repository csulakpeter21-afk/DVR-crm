/**
 * The Fastify application.
 *
 * P0 SHELL: health, security headers, rate limiting and the error shape every
 * route will use. Routes land with their owning worktree:
 *   src/core      -> P1-01-T6 (wt-01-core-domain)
 *   src/auth      -> P1-02    (wt-02-auth-rbac)
 *   src/compliance-> P1-03    (wt-03-compliance)
 *   src/webhooks  -> P1-04-T2 (wt-04-integrations-framework)
 *   src/scripts   -> P1-06    (wt-06-script-engine)
 *   src/calls     -> P1-07    (wt-07-telephony-adapter)
 */
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { LogController, type FastifyError, type FastifyInstance } from 'fastify';

import { type Config } from './config.ts';
import { registerHealthRoutes } from './core/health.ts';

/** Shared by both logger shapes below. Cookies and tokens never reach the log. */
const BASE_LOGGER: { redact: string[] } = {
  redact: ['req.headers.cookie', 'req.headers.authorization'],
};

export const buildApp = async (config: Config): Promise<FastifyInstance> => {
  const app = Fastify({
    // Structured logs with a request id, so one call can be traced across the
    // API, the worker and the provider adapters. The branch sits on the whole
    // object rather than on `transport`, because under
    // exactOptionalPropertyTypes an explicitly undefined `transport` is not the
    // same as an absent one and pino rejects it.
    logger:
      config.NODE_ENV === 'development'
        ? { ...BASE_LOGGER, level: config.LOG_LEVEL, transport: { target: 'pino-pretty' } }
        : { ...BASE_LOGGER, level: config.LOG_LEVEL },
    // Trust the first proxy hop so rate limiting sees the real client address.
    trustProxy: true,
    // Fastify 5.12 moved request-logging control here; the top-level
    // disableRequestLogging option is deprecated and goes away in Fastify 6.
    logController: new LogController({
      disableRequestLogging: config.NODE_ENV === 'test',
    }),
  });

  await app.register(helmet, { contentSecurityPolicy: config.NODE_ENV === 'production' });
  await app.register(cookie, {
    secret: config.SESSION_SECRET,
    parseOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
      path: '/',
    },
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });

  await app.register(registerHealthRoutes);

  /**
   * Fastify answers an unmatched route before the error handler runs, so the
   * 404 needs its own handler or it would be the one response in the API
   * without a reason code and a request id.
   */
  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: {
        reasonCode: 'route_not_found',
        message: `No route for ${request.method} ${request.url}`,
        requestId: request.id,
      },
    });
  });

  /**
   * One error shape for the whole API. A refusal always carries a reason code
   * the UI can turn into an explanation, which is what the compliance rules and
   * the state machine rely on.
   */
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) request.log.error({ err: error }, 'unhandled error');
    void reply.status(status).send({
      error: {
        reasonCode: status >= 500 ? 'internal_error' : (error.code ?? 'bad_request'),
        message: status >= 500 ? 'Internal error' : error.message,
        requestId: request.id,
      },
    });
  });

  return app;
};
