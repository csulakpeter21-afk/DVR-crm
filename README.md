# Devora Sales Engine

The CRM that runs Devora's outbound sales process end to end: the system of record
for every company, contact, signal, call, meeting and outcome, and the automation
engine that moves each lead through the pipeline. The platform runs the process;
people have the conversations and make the judgement calls.

Devora is a PR firm. Never "agency", anywhere a user or a prospect can read it.
The copy linter enforces that in CI.

**North star:** qualified 30-minute qualifier meetings _held_ per week, accepted by
the qualifier as a genuine fit, at a target cost per held meeting.

## Where things are

| Path                             | What                                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| `DEV_PLAN.json`                  | The plan. Phases, worktrees, tasks, rules, acceptance criteria        |
| `docs/build/ROADMAP.md`          | Build order from step 0 to the finished UI, with the screen inventory |
| `docs/build/BUILD_TRACKER.md`    | Every task, its worktree and its state                                |
| `docs/build/QUESTIONS.md`        | Open questions and human gates for Peter                              |
| `docs/02_ASSUMPTION_REGISTER.md` | Every default taken where a spec was missing                          |
| `docs/adr/`                      | Architecture decisions. ADR-000 records the stack                     |
| `docs/build/reports/`            | What each phase and worktree actually delivered                       |

## Getting started

Needs Node 22+, pnpm 10+ and Docker.

```bash
pnpm install
pnpm dev          # starts PostgreSQL, Redis and the mocks, migrates, runs the apps
```

`pnpm dev` creates `.env` from `.env.example` on first run. Set your own
`SESSION_SECRET` before sharing the stack with anyone.

| URL                                | What           |
| ---------------------------------- | -------------- |
| http://localhost:3000              | Web app        |
| http://localhost:3001/health/ready | API            |
| http://localhost:4010/health/live  | Mock providers |

PostgreSQL is on 5433 and Redis on 6380, shifted so they never collide with
anything already running on your machine.

## Everyday commands

```bash
pnpm verify        # everything CI runs: format, lint, typecheck, copy-lint, test
pnpm test          # unit and integration tests
pnpm e2e           # Playwright suites and phase acceptance demos
pnpm lint          # ESLint, type aware
pnpm typecheck     # tsc across every package
pnpm copy-lint     # the outbound copy rules
pnpm db:migrate    # create a migration from a schema change
pnpm db:seed       # synthetic data, one user per role
```

Run `pnpm verify` before opening a merge. CI runs the same thing.

## Layout

```
apps/web          Next.js: rep workspace, qualifier, dashboards, admin
apps/api          Fastify HTTP API
apps/worker       BullMQ jobs, webhooks, schedulers, SLA timers
packages/contracts     Stages, roles, events, entity schemas, DTOs. THE source of truth
packages/db            Prisma schema, migrations, synthetic seed
packages/domain        Pipeline state machine, SLA engine, audit log, scoring
packages/compliance    Rules engine, suppression, retention, copy linter
packages/integrations  Adapters and mocks: enrichment, telephony, transcription, llm, email, calendar
packages/script-engine Script trees, versioning, runtime, path logging
packages/ui            Design system: tokens, components, layouts
tools/mocks       Mock provider servers
e2e               Playwright suites
```

## Rules that are not negotiable

These are enforced by tests and CI, not by review:

- **`packages/contracts` is law.** Nothing else may enumerate a pipeline stage, a
  role or an event name. An architecture test scans the repository and fails the
  build, and it also checks the vocabulary still matches `DEV_PLAN.json`. Changing
  contracts needs a change request in `docs/change-requests/` plus an ADR.
- **Nothing writes `Lead.stage` directly.** Transitions go through the state
  machine in `packages/domain`, which writes an audit entry and emits an event in
  the same transaction. A lint rule blocks direct assignment.
- **Compliance is enforced in code.** Calling windows, suppression, recording
  notice and legal basis are checked before the platform acts. Every rule has a
  test proving the forbidden action is blocked.
- **No unsourced claims.** Every automated statement about a lead carries a source
  URL and a retrieval date. A validator rejects generated text that cannot be
  linked to a stored claim.
- **Synthetic data only.** Real lead data never enters this repository. Seeded
  addresses use `example.com`, which RFC 2606 reserves.
- **Secrets only from the environment.** Never committed.
- **WCAG 2.2 AA** on every screen.

## Human gates

Stop and ask Peter, and write the question into `docs/build/QUESTIONS.md`, before:
choosing or signing up for a paid vendor; changing `packages/contracts` or the
architecture file; anything touching real personal data; deploying anywhere shared;
changing a compliance rule or legal basis logic; anything the decision log marks
irreversible or expensive.
