import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source rather than a build step, so
  // Next compiles them with the app (Turborepo "just in time" packages).
  transpilePackages: [
    '@devora/ui',
    '@devora/contracts',
    '@devora/script-engine',
    '@devora/domain',
    '@devora/db',
  ],
  typedRoutes: true,
  experimental: {
    // The rep workspace is keyboard-driven; typed links keep the routes honest.
    typedEnv: true,
  },
};

export default config;
