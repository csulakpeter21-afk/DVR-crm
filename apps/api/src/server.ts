/** Process entry point for the API. */
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const app = await buildApp(config);

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  process.exit(0);
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

await app.listen({ port: config.API_PORT, host: config.API_HOST });
