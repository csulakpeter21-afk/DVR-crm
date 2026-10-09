# ADR-000: Default stack for the Devora Sales Engine

- **Status:** proposed
- **Date:** 2026-10-09
- **Deciders:** Peter
- **Human gate:** no (records the plan's own defaults; it chooses no paid vendor)

## Context

DEV_PLAN.stack carries a default stack marked "DEFAULT pending ADR-001 (output of
task T02 Platform architecture & build vs buy)". Phase P0 had to build on
something, and `docs/04_ARCHITECTURE.md` does not exist yet. This ADR records what
P0 actually installed and pinned, so ADR-001 can accept, amend or replace a
written baseline rather than an assumption.

Nothing here commits Devora to a paid service. Every external provider sits behind
an adapter with a mock, and choosing a real vendor is a human gate.

## Decision

Build P0 on the DEV_PLAN default stack, with these versions pinned exactly
(`save-exact=true`, verified against the registry on 2026-10-09):

| Concern                    | Choice                                             | Version                    |
| -------------------------- | -------------------------------------------------- | -------------------------- |
| Language                   | TypeScript, strict                                 | 5.9.3                      |
| Monorepo                   | pnpm workspaces + Turborepo                        | pnpm 10.28.0, turbo 2.11.7 |
| Web                        | Next.js App Router + React + Tailwind              | 16.4.0 / 19.3.0 / 4.3.3    |
| API                        | Fastify                                            | 5.12.5                     |
| Worker                     | BullMQ on Redis (ioredis)                          | 6.3.12 / 6.0.0             |
| Database                   | PostgreSQL + Prisma                                | 17.6 / 7.10.0              |
| Schemas                    | Zod                                                | 4.6.5                      |
| Unit and integration tests | Vitest                                             | 5.0.3                      |
| End to end tests           | Playwright                                         | 1.64.0                     |
| Lint                       | ESLint flat config + typescript-eslint, type aware | 10.12.0 / 8.71.1           |
| Logs                       | pino                                               | 10.4.0                     |

### Two deviations from "latest", both deliberate

1. **TypeScript 5.9.3, not 7.0.2.** TypeScript 7 is released, but
   `typescript-eslint@8.71.1` declares `typescript >=4.8.4 <6.1.0`. Taking
   TypeScript 7 would mean giving up type-aware linting, which is what enforces
   the floating-promise and exhaustiveness rules this platform relies on.
   Revisit when typescript-eslint supports it.
2. **Prisma 7.10.0, not 8.0.0-rc.** Prisma's `latest` tag currently points at an
   8.0 release candidate. The platform's system of record does not run on a
   release candidate.

### Prisma 7 specifics worth recording

Prisma 7 removed `url` from the datasource block and dropped the Rust query
engine, so:

- the connection string for migrate lives in `packages/db/prisma.config.ts`;
- `PrismaClient` requires a driver adapter, here `@prisma/adapter-pg`;
- Prisma no longer loads `.env` itself, so the config loads it explicitly.

## Consequences

- One resolution of TypeScript, Zod, Vitest and `@types/node` across the
  workspace, enforced by the pnpm catalog, so `packages/contracts` types cannot
  drift between consumers.
- Type-aware linting costs CI time; the exhaustiveness and floating-promise rules
  are worth it for a state machine and a job runner.
- Internal packages ship TypeScript source rather than a build step, so there is
  no build ordering to maintain. Consumers (Next, tsup, tsx, Vitest) transpile.
- Pinned exact versions mean upgrades are deliberate commits, not install drift.

## Reversal

Cheap until P1 lands. Replacing Fastify or Next after the rep workspace exists
costs weeks; replacing Prisma after the entity set lands costs more. The adapter
boundary in `packages/integrations` keeps every external provider cheap to swap,
which is where reversal matters most.
