# Context pack: wt-01-core-domain

Everything this worktree needs. **Do not read `DEV_PLAN.json`** — it is 14k tokens
and this file replaces it for your purposes.

- **Branch:** `feat/core-domain` · **Phase:** P1 · **Test first:** yes
- **Depends on:** P0

## The product, in four sentences

The Devora Sales Engine is the CRM that runs Devora's outbound sales process end to
end: the system of record for every company, contact, signal, call, meeting and
outcome, and the automation engine that moves each lead through the pipeline. The
platform runs the process; people have the conversations and make the judgement
calls. The north star is qualified 30-minute qualifier meetings **held** per week,
accepted by the qualifier as a genuine fit, at a target cost per held meeting. The
rep UX rule is one screen, one next action: if a user has to remember something,
the design is not finished.

## Your goal

Build the CRM backbone: data model, pipeline state machine, event outbox, audit log, task and SLA engine.

## Paths you own

- `packages/contracts`
- `packages/db`
- `packages/domain`
- `apps/api/src/core`
- `apps/worker/src/core`

Edit nothing outside these. No file has two owners.

## Packages you consume without editing

- nothing

## Your tasks, in order

### P1-01-T1 Entity schemas · tier: design

zod schemas and Prisma models for User, Team, Company, Contact, Lead, Campaign, Task, SlaPolicy, AuditLog, CostLedgerEntry; dedupe keys for Company (domain) and Contact (email, phone, LinkedIn URL).

### P1-01-T2 Pipeline state machine · tier: design

Stages and side states from domain_frame; allowed transitions table; guards (entry criteria as pluggable checks, compliance check hook); single transition API; DB guard against direct stage writes.

### P1-01-T3 Event outbox · tier: design

Transactional outbox, worker dispatcher, idempotent consumers, dead letter handling, replay tool.

### P1-01-T4 Audit log · tier: standard

Append-only log for every transition and sensitive read or write; actor, timestamp, before/after, reason.

### P1-01-T5 Task and SLA engine · tier: design

SLA per stage, timers in worker, sla.breached event, automatic task creation and assignment.

### P1-01-T6 Core API · tier: standard

CRUD with permissions hooks for companies, contacts, leads; lead transition endpoint; list endpoints with filters and pagination.

## Your acceptance criteria

- Given a lead in stage researched with a failing compliance check, When a transition to queued is requested, Then it is rejected with a reason code and compliance.blocked is emitted.
- Given any successful transition, When it commits, Then exactly one audit entry and one outbox event exist in the same transaction.
- Given a stage SLA of N hours, When N hours pass without a transition, Then sla.breached is emitted once and a task is created for the owner role.
- Given two contacts with the same verified email, When the second is imported, Then it is merged into the existing contact, not duplicated.

## Invariants (enforced by tests, not review)

1. **`packages/contracts` is law.** Nothing outside it may enumerate a pipeline
   stage, a role or an event name. A test scans every source file and fails the
   build on 3 or more in one array literal, and also compares the vocabulary
   against `DEV_PLAN.json`. Need a change? Write `docs/change-requests/CR-xxx.md`.
   Do not edit contracts unless you own it.
2. **Nothing writes `Lead.stage` directly.** Transitions go through the state
   machine in `@devora/domain`, which writes one audit entry and one outbox event
   in the same transaction. A lint rule blocks direct assignment.
3. **Compliance is enforced in code.** Calling windows, suppression, recording
   notice and legal basis are checked before the platform acts. Every rule needs a
   test proving the forbidden action is blocked.
4. **No unsourced claims.** Every automated statement about a lead carries a
   source URL and a retrieval date.
5. **Synthetic data only.** Real lead data never enters this repository. Seeded
   addresses use `example.com` (RFC 2606).
6. **Secrets from the environment only.** Never committed.
7. **WCAG 2.2 AA** on every screen.
8. **Every external call goes through an adapter** with timeouts, retries with
   backoff, an idempotency key and a mock.

## Devora's copy rules (the copy linter fails CI on these)

Devora is a **PR firm**. Never "agency", anywhere a user or prospect can read it.
No dashes as punctuation. No space before punctuation. When listing outlets,
Forbes first, and write "Financial Times" in full. No signature in English emails.
French signs off `Bien à vous,` then `Péter`.

## Human gates: stop and ask Peter

Paid vendors; changing `packages/contracts` or the architecture file; real personal
data; deploying anywhere shared; changing a compliance rule or legal basis;
anything irreversible or expensive. Write the question into
`docs/build/QUESTIONS.md`.

## Vocabulary (import it, never retype it)

```ts
import { PIPELINE_STAGES, SIDE_STATES, ROLES, EVENT_NAMES } from '@devora/contracts';
```

12 stages: sourced, enriched, researched, queued, dialled, connected, conversation,
meeting_booked, meeting_held, qualified, opportunity, won.
4 side states: disqualified, nurture, suppressed, recycled.
7 roles: rep, team_lead, qualifier, closer, growth_lead, compliance, admin.
23 events: see `EVENT_NAMES`. Only `compliance` may lift `suppressed`.

## Commands

```bash
pnpm install
turbo run test --filter=@devora/<pkg>...   # scoped: use this while working
pnpm verify                                # whole repo: run once, before merging
```

## Missing specs

No file in `docs/specs/` exists. Work from the task detail below, label every
guess `ASSUMPTION` in a code comment, add a row to
`docs/02_ASSUMPTION_REGISTER.md`, and keep it behind an interface so the spec can
replace it without touching callers.

## Done means

`pnpm verify` green, migrations reversible, no secrets, rebased on
`claude/ecstatic-mendel-abdmov`, and a report at
`docs/build/reports/wt-01-core-domain_report.md` covering what was built, library versions,
decisions, deviations, known issues and handoffs.
