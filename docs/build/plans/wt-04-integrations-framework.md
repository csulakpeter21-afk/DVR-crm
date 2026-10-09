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

Paste this into a Claude Code session opened in the worktree directory. It points
at the context pack, which is self-contained: a session that reads
`DEV_PLAN.json` as well is paying ~14k tokens for nothing.

```
Read docs/build/context/wt-04-integrations-framework.md and do the work it describes. It is
self-contained: do not read DEV_PLAN.json. Before coding, check the current
official docs of any library or external API you use, and write a short plan
in docs/build/plans/wt-04-integrations-framework.notes.md. Work test first where the pack says so.
Rebase on claude/ecstatic-mendel-abdmov at the start of each session. Use
`turbo run test --filter=<pkg>...` while working and `pnpm verify` once before
merging. When done, write docs/build/reports/wt-04-integrations-framework_report.md and say you are
ready to merge. Stop and ask at any human gate.
```
