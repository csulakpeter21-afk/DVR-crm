/** Worker configuration, validated at boot. See apps/api/src/config.ts. */
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** How many jobs one worker process runs at once. */
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
});

export type Config = z.infer<typeof configSchema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid worker configuration:\n${detail}\n\nSee .env.example.`);
  }
  return parsed.data;
};
