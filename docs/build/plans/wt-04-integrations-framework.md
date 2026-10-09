# wt-04-integrations-framework

- **Branch:** `feat/integrations-framework`
- **Worktree:** `/home/user/devora-wt/wt-04-integrations-framework`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** yes
- **Status:** READY

Verify every FullEnrich endpoint against the current official docs before coding. wt-07 is waiting on the framework from T1.

## Goal

A uniform adapter framework plus the FullEnrich adapter and mocks for every external provider.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/integrations`
- `tools/mocks`
- `apps/api/src/webhooks`

## Consumes without editing

- `packages/contracts`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/specs/M4_*`
- `docs/adr/*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-04-T1 Adapter framework** — Interface pattern, timeouts, retries with backoff, idempotency keys, rate limit handling, credential storage via secrets, cost recording to CostLedgerEntry.
2. **P1-04-T2 Webhook receiver** — Signed or secret-verified endpoints, idempotent processing, correlation via custom parameters, dead letter queue.
3. **P1-04-T3 FullEnrich adapter** — Search API (synchronous) and Enrich API (asynchronous with webhook result). Verify every endpoint and payload against the current official FullEnrich docs before coding. Mock server reproduces success, partial, not found and error cases.
4. **P1-04-T4 Provider interfaces + mocks** — Interfaces and mock servers for telephony, transcription, llm, email, calendar; contract tests for each.

## Acceptance criteria

- Given an enrichment request, When the mock FullEnrich webhook posts the result twice, Then the contact is updated once and lead.enriched is emitted once.
- Given the provider times out, When retries are exhausted, Then lead.enrichment_failed is emitted and a task is created.
- Given any paid call, When it completes, Then a CostLedgerEntry with provider, unit and amount is written.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-04-integrations-framework_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory:

```
You are working in worktree wt-04-integrations-framework on branch feat/integrations-framework of the Devora Sales Engine (a CRM that runs Devora's whole outbound sales process; Devora is a PR firm, never call it an agency). Read DEV_PLAN.json (sections product, company_rules, stack, domain_frame, global_engineering_rules, human_gates), docs/04_ARCHITECTURE.md, the specs listed in this worktree's spec_inputs, and the ADRs. Your goal: A uniform adapter framework plus the FullEnrich adapter and mocks for every external provider.. You may only edit these paths: packages/integrations, tools/mocks, apps/api/src/webhooks. You consume these contracts without editing them: packages/contracts. Tasks, in order: P1-04-T1 Adapter framework; P1-04-T2 Webhook receiver; P1-04-T3 FullEnrich adapter; P1-04-T4 Provider interfaces + mocks. Acceptance criteria: Given an enrichment request, When the mock FullEnrich webhook posts the result twice, Then the contact is updated once and lead.enriched is emitted once. | Given the provider times out, When retries are exhausted, Then lead.enrichment_failed is emitted and a task is created. | Given any paid call, When it completes, Then a CostLedgerEntry with provider, unit and amount is written.. Before coding: check current official docs for every library and API you use, then write a short plan in docs/build/plans/wt-04-integrations-framework.md. Work test first where the plan says so. Rebase on integration at the start of each session. When done: all tests, lint, typecheck and copy-lint green; write docs/build/reports/wt-04-integrations-framework_report.md (what was built, decisions, deviations, known issues, handoffs); then tell the orchestrator you are ready to merge. Stop and ask at any human gate.
```
