/**
 * Environment configuration, validated once at boot.
 *
 * The process refuses to start on bad configuration rather than failing on the
 * first request. Secrets come from the environment only
 * (DEV_PLAN.global_engineering_rules).
 */
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  /** Signs session cookies. Must be at least 32 bytes of entropy. */
  SESSION_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof configSchema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid API configuration:\n${detail}\n\nSee .env.example.`);
  }
  return parsed.data;
};
