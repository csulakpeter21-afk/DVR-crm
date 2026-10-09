/**
 * Process entry point for the worker.
 *
 * P0 SHELL: it connects to Redis, registers no processors yet and shuts down
 * cleanly. Each worktree adds its own processor to src/core/queues.ts.
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';

import { loadConfig } from './config.ts';
import { DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from './core/queues.ts';

const config = loadConfig();
const log = pino({
  level: config.LOG_LEVEL,
  ...(config.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : {}),
});

// BullMQ requires this setting and will not accept a connection without it.
const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

const queues = QUEUE_NAMES.map(
  (name) => new Queue(name, { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS }),
);

log.info({ queues: QUEUE_NAMES, concurrency: config.WORKER_CONCURRENCY }, 'worker started');

const shutdown = async (signal: string): Promise<void> => {
  log.info({ signal }, 'shutting down');
  await Promise.all(queues.map((queue) => queue.close()));
  await connection.quit();
  process.exit(0);
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}
