# Phase P0 report: Foundation skeleton

**Status:** complete. All three acceptance criteria met, with one caveat noted
below. **Date:** 2026-10-09.

## What was built

| Task | Delivered |
| --- | --- |
| P0-T1 | pnpm workspace + Turborepo; strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`); ESLint flat config with **type-aware** rules; Prettier; 12 packages compiling |
| P0-T2 | `docker-compose.yml` with PostgreSQL 17.6, Redis 8.2 and the mock provider server, all health-checked; `.env.example`; `pnpm dev` starts the stack, waits for health, applies migrations, then runs web, api and worker |
| P0-T3 | `.github/workflows/ci.yml`: two jobs. `verify` runs format, lint, typecheck, copy-lint, tests and build against live PostgreSQL and Redis services. `e2e` runs Playwright. Required on `integration` and `main` |
| P0-T4 | Vitest per package; Playwright project with a passing smoke test; `resetDatabase()` and `assertTestDatabase()`; synthetic seed of one user per role |
| P0-T5 | ADR template, ADR-000, `docs/change-requests/`, `BUILD_TRACKER.md` (all 67 tasks), `QUESTIONS.md`, `02_ASSUMPTION_REGISTER.md`, `ROADMAP.md` |
| P0-T6 | `packages/contracts`: 12 stages, 4 side states, 7 roles, 23 events as Zod schemas, plus entry criteria, owner roles, SLA defaults and shared primitives |

## Test results

```
format:check   clean
lint           14/14 packages clean (type-aware)
typecheck      14/14 packages clean
copy-lint      clean, 6 outbound copy rules
test           13/13 packages, 65 tests passing
build          5/5 build targets
e2e            2/2 Playwright tests passing
```

Breakdown: compliance 30 (copy linter), domain 10, contracts 8 (architecture
guard), api 5, db 5 (3 of them against live PostgreSQL), worker 4, web 3.
Plus 2 Playwright tests.

## Acceptance criteria

**1. "Given a fresh clone, when the developer runs the documented setup commands,
then all services start and the smoke e2e test passes."**

Met for the application path: `pnpm install` then `pnpm e2e` starts the web app and
both smoke tests pass. Migrations and the seed were verified against a real
PostgreSQL 16 instance: `prisma migrate dev` created `20261009103028_init`,
`migrate deploy` applied it, the seed wrote 7 users, and the database integration
test proved `resetDatabase()` truncates.

**Caveat:** `docker compose up` itself could not be run here. This sandbox has the
Docker CLI but no daemon, so the Compose file is validated (`docker compose config`
passes) but unexecuted. Worth one `pnpm dev` on a machine with Docker before P1
merges. Nothing in the file is exotic; the risk is a typo, not a design problem.

**2. "Given a pull request to integration, when CI runs, then lint, typecheck,
tests and build all execute and block on failure."**

Met. Every step in the workflow was run locally and each one was observed failing
and then passing, so none of them is a no-op: the copy linter, the architecture
guard, lint, typecheck and the tests each caught a real defect during this phase
(listed under Decisions below).

**3. "Given packages/contracts, when another package imports the stage enum, then
it compiles and no other package defines its own stage list."**

Met, and enforced rather than asserted. `packages/contracts/src/architecture.test.ts`
scans every `.ts`/`.tsx` file in the repository and fails if any file outside the
contracts package enumerates three or more stages, roles or events in an array
literal. It also compares the four vocabularies against `DEV_PLAN.json` itself, so
editing a stage in code without going through the change-request gate breaks the
build. Both directions were verified with a deliberate violation.
`packages/db/src/schema.test.ts` extends the same guarantee to `schema.prisma`, so
the database enums cannot drift either.

## Decisions

Recorded in **ADR-000**. The two that matter:

- **TypeScript 5.9.3, not 7.0.2.** TypeScript 7 is released, but
  `typescript-eslint@8.71.1` requires `<6.1.0`. Taking TypeScript 7 means losing
  type-aware linting, and the floating-promise and exhaustiveness rules are what
  keep a job runner and a state machine honest. Revisit when the lint tooling
  catches up.
- **Prisma 7.10.0, not the 8.0 release candidate** on the `latest` tag. The system
  of record does not run on an RC.

Prisma 7 needed real work: `url` is gone from the datasource block, the Rust query
engine is gone, so the connection string moved to `packages/db/prisma.config.ts`,
`PrismaClient` takes a `@prisma/adapter-pg` driver adapter, and the config loads
`.env` itself because Prisma no longer does.

Smaller calls:

- Internal packages ship TypeScript source, not a build step. No build ordering.
- The pnpm catalog pins one TypeScript, Zod, Vitest and `@types/node` for the whole
  workspace, so contracts types cannot differ between consumers.
- `@types/node` is on the 22.x line to match the Node 22 runtime, not the 26.x
  latest.
- The copy linter masks code down to its string literals. Linting whole source
  files flagged indented method chains as "space before punctuation". Code comments
  are excluded; prose files are still linted whole.

## Deviations from the plan

1. **Branching.** `git_strategy` asks for `main` + `integration` + `feat/*`. This
   session may only push `claude/ecstatic-mendel-abdmov`, so that branch plays the
   role of `integration`. Worktrees are real `git worktree` checkouts on `feat/*`
   branches cut from it. Logged as Q-005; say the word and the three-tier layout
   goes to the remote.
2. **The copy linter shipped in P0, not P1-03-T5.** CI was specified to include it
   from P0, and a placeholder that passes everything is worse than no gate at all.
   All six rules are implemented with a blocking test each. wt-03 still owns
   extending it when the M12 spec lands.
3. **Playwright browser path.** This machine ships a Chromium whose build predates
   Playwright 1.64 and cannot download another, so the config honours
   `PLAYWRIGHT_CHROMIUM_PATH` when set and uses Playwright's own build otherwise,
   which is what CI does. Video recording is off under the override because the
   bundled ffmpeg is absent there.
4. **One defect found and fixed after the P0 commit.** The `.gitignore` carried a
   bare `build/`, which also matched `docs/build`, so everything
   `DEV_PLAN.reporting` requires in the repository was silently untracked: the
   build tracker, the questions file, this report, the worktree plans. The pattern
   is now scoped to real build output. Worth noting because the failure mode was
   invisible: the files existed on disk and `git status` was clean.
5. **A `User` model and two Prisma enums landed in P0**, ahead of P1-01-T1. The
   schema needed something real to prove `generate`, `migrate` and the reset
   utility, and the audit log needs an actor. wt-01 owns extending it.

## Known issues and handoffs

| Item | For | Note |
| --- | --- | --- |
| `docker compose up` unverified | next machine with a Docker daemon | Run `pnpm dev` once. Compose config validates |
| `eslint-config-next` not wired | wt-05 | React-hooks and Next-specific rules are not enforced yet. Root TypeScript rules do apply |
| `passWithNoTests` on four shells | wt-04, wt-06, wt-05 | `integrations`, `script-engine`, `ui`, `mocks`. Remove the flag with the first real test |
| Mock provider endpoints are namespaces only | wt-04 | Base URLs are fixed in `.env.example` so adapters can be written against them now |
| Entry-criteria guards are declarations, not checks | wt-01 | `STATE_ENTRY_CRITERIA` is text; P1-01-T2 makes them executable |
| A-002: French punctuation conflicts with the copy rule | Peter | See Q-001. No French template exists yet |

## Readiness for P1

Ready. All seven P1 worktrees can start. Dependencies: wt-07 waits on wt-04;
everything else needs only P0. Merge order is wt-01 first (it owns
`packages/contracts`), then wt-02, wt-03, wt-04, wt-06, wt-07, and wt-05 last so
the UI builds on settled contracts.

## Open questions for Peter

1. **Q-004, the specs.** P2 to P4 are spec-gated and none of the files exist. P1
   needs none of them, so nothing is blocked today. The one worth writing first is
   **M6, the call script**: it is the heart of the product, and wt-06 is otherwise
   building the engine against a synthetic placeholder tree.
2. **Q-002 and Q-003, telephony and transcription vendors.** Both are paid-vendor
   human gates. Recommendation: build P1 entirely on the mock and decide after the
   P1 demo, when there is a real call flow to judge against.
3. **Q-001, French punctuation.** One-line fix either way, needs your call before
   French templates are written.
4. **Q-005, branching.** Confirm whether the single-branch arrangement is fine or
   you want `main` plus `integration` on the remote.
