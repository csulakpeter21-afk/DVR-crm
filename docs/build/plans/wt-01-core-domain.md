# wt-01-core-domain

- **Branch:** `feat/core-domain`
- **Worktree:** `/home/user/devora-wt/wt-01-core-domain`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** yes
- **Status:** READY, merges first

Everything else imports packages/contracts, so this lands before the others rebase.

## Goal

Build the CRM backbone: data model, pipeline state machine, event outbox, audit log, task and SLA engine.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/contracts`
- `packages/db`
- `packages/domain`
- `apps/api/src/core`
- `apps/worker/src/core`

## Consumes without editing

- nothing

**This worktree owns `packages/contracts`.** Changing it is a human gate: change request plus ADR, and Peter approves. The architecture test compares the vocabulary against `DEV_PLAN.json`, so a change there needs the plan updated too.

## Spec inputs

- `docs/04_ARCHITECTURE.md`
- `docs/specs/M0_*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-01-T1 Entity schemas** — zod schemas and Prisma models for User, Team, Company, Contact, Lead, Campaign, Task, SlaPolicy, AuditLog, CostLedgerEntry; dedupe keys for Company (domain) and Contact (email, phone, LinkedIn URL).
2. **P1-01-T2 Pipeline state machine** — Stages and side states from domain_frame; allowed transitions table; guards (entry criteria as pluggable checks, compliance check hook); single transition API; DB guard against direct stage writes.
3. **P1-01-T3 Event outbox** — Transactional outbox, worker dispatcher, idempotent consumers, dead letter handling, replay tool.
4. **P1-01-T4 Audit log** — Append-only log for every transition and sensitive read or write; actor, timestamp, before/after, reason.
5. **P1-01-T5 Task and SLA engine** — SLA per stage, timers in worker, sla.breached event, automatic task creation and assignment.
6. **P1-01-T6 Core API** — CRUD with permissions hooks for companies, contacts, leads; lead transition endpoint; list endpoints with filters and pagination.

## Acceptance criteria

- Given a lead in stage researched with a failing compliance check, When a transition to queued is requested, Then it is rejected with a reason code and compliance.blocked is emitted.
- Given any successful transition, When it commits, Then exactly one audit entry and one outbox event exist in the same transaction.
- Given a stage SLA of N hours, When N hours pass without a transition, Then sla.breached is emitted once and a task is created for the owner role.
- Given two contacts with the same verified email, When the second is imported, Then it is merged into the existing contact, not duplicated.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-01-core-domain_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory:

```
You are working in worktree wt-01-core-domain on branch feat/core-domain of the Devora Sales Engine (a CRM that runs Devora's whole outbound sales process; Devora is a PR firm, never call it an agency). Read DEV_PLAN.json (sections product, company_rules, stack, domain_frame, global_engineering_rules, human_gates), docs/04_ARCHITECTURE.md, the specs listed in this worktree's spec_inputs, and the ADRs. Your goal: Build the CRM backbone: data model, pipeline state machine, event outbox, audit log, task and SLA engine.. You may only edit these paths: packages/contracts, packages/db, packages/domain, apps/api/src/core, apps/worker/src/core. You consume these contracts without editing them: nothing. Tasks, in order: P1-01-T1 Entity schemas; P1-01-T2 Pipeline state machine; P1-01-T3 Event outbox; P1-01-T4 Audit log; P1-01-T5 Task and SLA engine; P1-01-T6 Core API. Acceptance criteria: Given a lead in stage researched with a failing compliance check, When a transition to queued is requested, Then it is rejected with a reason code and compliance.blocked is emitted. | Given any successful transition, When it commits, Then exactly one audit entry and one outbox event exist in the same transaction. | Given a stage SLA of N hours, When N hours pass without a transition, Then sla.breached is emitted once and a task is created for the owner role. | Given two contacts with the same verified email, When the second is imported, Then it is merged into the existing contact, not duplicated.. Before coding: check current official docs for every library and API you use, then write a short plan in docs/build/plans/wt-01-core-domain.md. Work test first where the plan says so. Rebase on integration at the start of each session. When done: all tests, lint, typecheck and copy-lint green; write docs/build/reports/wt-01-core-domain_report.md (what was built, decisions, deviations, known issues, handoffs); then tell the orchestrator you are ready to merge. Stop and ask at any human gate.
```
