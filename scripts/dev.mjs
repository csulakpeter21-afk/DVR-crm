/**
 * One command to start everything (DEV_PLAN P0-T2).
 *
 *   pnpm dev
 *
 * Brings up PostgreSQL, Redis and the mock provider server, waits until each
 * is actually healthy rather than merely started, applies migrations, then runs
 * the web app, the API and the worker together.
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', ...options });
  if (result.status !== 0) {
    console.error(
      `\n${command} ${args.join(' ')} failed with status ${result.status ?? 'unknown'}`,
    );
    process.exit(result.status ?? 1);
  }
};

// A missing .env is the most common first-run stumble, so fix it rather than fail.
const envPath = join(ROOT, '.env');
if (!existsSync(envPath)) {
  copyFileSync(join(ROOT, '.env.example'), envPath);
  console.log('Created .env from .env.example. Set your own SESSION_SECRET before any shared use.');
}

console.log('\n1/3  Starting PostgreSQL, Redis and the mock providers');
run('docker', ['compose', 'up', '-d', '--wait']);

console.log('\n2/3  Applying database migrations');
run('pnpm', ['--filter', '@devora/db', 'run', 'migrate:deploy']);

console.log('\n3/3  Starting web, api and worker\n');
const dev = spawn('pnpm', ['run', 'dev:apps'], { cwd: ROOT, stdio: 'inherit' });

const stop = (signal) => {
  dev.kill(signal);
};
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
dev.on('exit', (code) => process.exit(code ?? 0));
