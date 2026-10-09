# Devora Sales Engine: development roadmap, step 0 to finished UI

Derived from `DEV_PLAN.json`. The plan defines five phases and seventeen
worktrees; this document turns that into an ordered build sequence, assigns
**every task to exactly one worktree**, and adds the thing the plan leaves
implicit: a screen-by-screen inventory of the finished UI, so "done" is something
you can look at rather than infer.

Rules that shape the whole sequence:

- `packages/contracts` is law. Only **wt-01** edits it. Everyone else imports.
- Each worktree owns a disjoint set of paths. Two worktrees never edit one file.
- A worktree starts only when everything in its `depends_on` is merged.
- Phases P2 to P4 are **spec-gated**: they start when the listed specs exist in
  `docs/specs/` and are approved. None exist today (see `QUESTIONS.md` Q-004).

---

## The sequence at a glance

| Step | Phase                          | What exists at the end                                                                           | Worktrees                  | Gate to start                           |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------- |
| 0    | **P0 Foundation**              | Repo, CI, local stack, contracts seed, smoke test. No product UI.                                | none (single working copy) | nothing                                 |
| 1    | **P1 Backbone**                | A rep can log in, work a queue, run a mock call through a script, book a meeting. First real UI. | wt-01 … wt-07 (7 parallel) | P0 merged                               |
| 2    | **P2 Lead + calling engine**   | Leads sourced and enriched automatically, sourced dossiers, real telephony and transcription.    | wt-08 … wt-12 (5 parallel) | P1 merged **and** specs M1–M7, M10      |
| 3    | **P3 Conversion + leadership** | Booking emails, collateral, experiments, dashboards. UI is feature complete.                     | wt-13 … wt-16 (4 parallel) | P2 merged **and** specs M8, M9, M11     |
| 4    | **P4 Acceptance**              | Whole journey proven on synthetic data, compliance verified, go-live checklist signed.           | wt-17                      | P3 merged **and** the wave 1 pilot plan |
| 5    | **Wave 1**                     | Real reps calling real leads.                                                                    | none                       | Peter signs the checklist               |

Steps 0 and 1 are startable today. Steps 2 to 4 wait on specs, not on engineering.

---

## Step 0: P0 Foundation — status: **complete**

Sequential, one working copy, no worktrees: it builds the skeleton every worktree
branches from.

| Task  | What it delivered                                                                                                                                      | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| P0-T1 | pnpm workspaces, Turborepo, strict TypeScript, ESLint flat config with type-aware rules, Prettier, 12 packages as compiling shells                     | done   |
| P0-T2 | Docker Compose (PostgreSQL, Redis, mock providers), `.env.example`, `pnpm dev` as one command                                                          | done   |
| P0-T3 | GitHub Actions CI: format, lint, typecheck, copy-lint, tests, build, then e2e                                                                          | done   |
| P0-T4 | Vitest per package, Playwright project with a passing smoke test, test database reset utilities, synthetic seed                                        | done   |
| P0-T5 | ADR template, ADR-000, change-request folder, build tracker, questions, assumption register, this roadmap                                              | done   |
| P0-T6 | `packages/contracts`: pipeline stages, side states, roles, event catalogue as Zod schemas, plus the guard that keeps them in step with `DEV_PLAN.json` | done   |

**UI at the end of step 0:** one page listing the pipeline, proving the web app
compiles against the contracts package. Not product UI, and not meant to be.

---

## Step 1: P1 Backbone — seven worktrees in parallel

The first step that produces UI a rep could use. Merge order matters: **wt-01
merges first** because everything consumes `packages/contracts`; the others start
in parallel against the P0 seed and rebase after wt-01 lands.

### wt-01-core-domain → `feat/core-domain`

Owns `packages/contracts`, `packages/db`, `packages/domain`, `apps/api/src/core`,
`apps/worker/src/core`. Test first. Depends on: P0.

| Task     | Deliverable                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01-T1 | Entity schemas and Prisma models: User, Team, Company, Contact, Lead, Campaign, Task, SlaPolicy, AuditLog, CostLedgerEntry, with dedupe keys (Company by domain; Contact by email, phone, LinkedIn URL) |
| P1-01-T2 | Pipeline state machine: allowed-transition table, pluggable entry guards, compliance hook, one transition API, database guard against direct `stage` writes                                             |
| P1-01-T3 | Transactional outbox, worker dispatcher, idempotent consumers, dead letter handling, replay tool                                                                                                        |
| P1-01-T4 | Append-only audit log: actor, timestamp, before and after, reason                                                                                                                                       |
| P1-01-T5 | Task and SLA engine: per-stage timers, `sla.breached`, automatic task creation for the stage's owner role                                                                                               |
| P1-01-T6 | Core API: CRUD with permission hooks, the lead transition endpoint, filtered and paginated lists                                                                                                        |

### wt-02-auth-rbac → `feat/auth-rbac`

Owns `apps/api/src/auth`, `apps/web/src/auth`, `packages/domain/src/permissions`.
Test first. Depends on: P0 (rebases after wt-01).

| Task     | Deliverable                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| P1-02-T1 | Login, logout, sessions, password reset, rate limiting, secure cookies                                                           |
| P1-02-T2 | Permission matrix per role, API middleware, UI route guards, row-level rules (a rep sees own queue, a team lead sees their team) |
| P1-02-T3 | Admin user management: invite, assign role and team, deactivate without losing audit history                                     |

### wt-03-compliance → `feat/compliance-engine`

Owns `packages/compliance`, `apps/api/src/compliance`,
`apps/web/src/app/(admin)/compliance`. Test first. Depends on: P0.

| Task     | Deliverable                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-03-T1 | CountryRule engine: calling windows, recording-notice requirement, registry checks, retention period. Rules are versioned data the compliance role edits |
| P1-03-T2 | Suppression by phone, email, contact and company domain, checked on queue, dial and send                                                                 |
| P1-03-T3 | LegalBasisRecord per contact, required before a lead can be queued                                                                                       |
| P1-03-T4 | Retention jobs: deletion or anonymisation per rule, recordings and transcripts included, audit entries kept                                              |
| P1-03-T5 | Copy linter — **already delivered in P0** because CI depends on it; wt-03 extends it as the compliance spec lands                                        |

### wt-04-integrations-framework → `feat/integrations-framework`

Owns `packages/integrations`, `tools/mocks`, `apps/api/src/webhooks`. Test first.
Depends on: P0.

| Task     | Deliverable                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1-04-T1 | Adapter framework: timeouts, retries with backoff, idempotency keys, rate-limit handling, credentials from secrets, cost written to CostLedgerEntry                                        |
| P1-04-T2 | Webhook receiver: signature or secret verification, idempotent processing, correlation, dead letter queue                                                                                  |
| P1-04-T3 | FullEnrich adapter: Search (synchronous) and Enrich (asynchronous, webhook result), verified against the current official docs, with a mock covering success, partial, not found and error |
| P1-04-T4 | Interfaces and mock servers for telephony, transcription, llm, email, calendar, each with contract tests                                                                                   |

### wt-05-design-system-workspace → `feat/design-system-workspace`

Owns `packages/ui`, `apps/web/src/app/(rep)`, `apps/web/src/app/(shell)`.
Depends on: P0. **This is where the UI starts.**

| Task     | Deliverable                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1-05-T1 | Design tokens (colour, type, spacing, light and dark) and components: buttons, inputs, tables, cards, dialogs, toasts, empty states. Premium and restrained, WCAG 2.2 AA |
| P1-05-T2 | App shell and navigation per role: rep, team lead, qualifier, closer, growth lead, admin                                                                                 |
| P1-05-T3 | Rep queue and lead screen: prioritised queue, lead card with dossier panel, **one** primary action, keyboard shortcuts, day progress tracker                             |

### wt-06-script-engine → `feat/script-engine`

Owns `packages/script-engine`, `apps/web/src/components/script-player`,
`apps/api/src/scripts`. Test first. Depends on: P0.

| Task     | Deliverable                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-06-T1 | ScriptTree, ScriptVersion (immutable once published), ScriptNode with variables, ScriptAnswer; validation rejects orphans and dead ends without an outcome |
| P1-06-T2 | Runtime: next node resolved client side, under 100 ms, no network round trip; variables filled from sourced fields only, with fallback lines               |
| P1-06-T3 | Script player UI: current line large, answer buttons, back step, objection shortcut, booking node; keyboard only                                           |
| P1-06-T4 | CallPath logging with per-node timestamps, `script.node_answered`, experiment variant id                                                                   |
| P1-06-T5 | A synthetic placeholder tree for testing, clearly marked not for live use                                                                                  |

### wt-07-telephony-adapter → `feat/telephony-adapter`

Owns `packages/integrations/src/telephony`, `apps/web/src/components/dialler`,
`apps/api/src/calls`. Test first. Depends on: P0 **and wt-04**.

| Task     | Deliverable                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| P1-07-T1 | Call, Recording, CallTag; lifecycle started → ringing → connected → ended, mapped to the dialled, connected and conversation transitions |
| P1-07-T2 | Dialler: click to call, mute, hold, hang up, disposition picker, compliance pre-check before the dial is allowed                         |
| P1-07-T3 | Recording notice: where a CountryRule requires it, no recording exists before the notice event is logged                                 |
| P1-07-T4 | Mock provider simulating answer, no answer, voicemail, busy and failed, with webhooks                                                    |

**Merge order:** wt-01, wt-02, wt-03, wt-04, wt-06, wt-07, wt-05.

**P1 acceptance demo:** log in as a rep, see a queue of synthetic leads, open one,
run a mock call clicking script answers to the end, log the outcome, watch the lead
move to `meeting_booked` through the state machine, and inspect the audit log and
emitted events. A suppressed lead cannot be queued or dialled.

---

## Step 2: P2 Lead and calling engine — five worktrees, spec-gated

Needs `docs/specs/M1`–`M7` and `M10`.

| Worktree                  | Branch                     | Owns                                                                                                                    | Tasks                                                                                                                           |
| ------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| wt-08-offer-icp-signals   | `feat/offer-icp-signals`   | `packages/domain/src/icp`, `packages/domain/src/signals`, `apps/worker/src/signals`, `apps/web/src/app/(growth)/icp`    | P2-08-T1 offer knowledge base · T2 ICP engine with explainable scores · T3 signal detection with weights and freshness decay    |
| wt-09-sourcing-enrichment | `feat/sourcing-enrichment` | `apps/worker/src/sourcing`, `apps/web/src/app/(growth)/sourcing`                                                        | P2-09-T1 sourcing runs with volume and budget caps · T2 enrichment flow with waterfall · T3 quality and cost metrics            |
| wt-10-dossier             | `feat/dossier`             | `apps/worker/src/dossier`, `apps/web/src/components/dossier`                                                            | P2-10-T1 research pipeline storing DossierClaims · T2 unsourced-claim validator · T3 rep 15-second card and qualifier full view |
| wt-11-calling-live        | `feat/calling-live`        | `packages/integrations/src/telephony/providers`, `packages/integrations/src/transcription`, `apps/worker/src/analytics` | P2-11-T1 real vendor adapters (after the human gate) · T2 transcription and tagging · T3 script v1 import                       |
| wt-12-rep-ops             | `feat/rep-ops`             | `apps/web/src/app/(rep)/progress`, `apps/web/src/app/(lead)`, `apps/api/src/repops`                                     | P2-12-T1 queue prioritisation · T2 progress trackers · T3 QA and coaching · T4 onboarding and practice mode                     |

Dependencies inside the phase: wt-09 and wt-10 both wait on wt-08.

---

## Step 3: P3 Conversion, optimisation, leadership — four worktrees, spec-gated

Needs `docs/specs/M8`, `M9`, `M11`. **The UI is feature complete at the end of this step.**

| Worktree              | Branch                 | Owns                                                                                                                   | Tasks                                                                                                                                |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| wt-13-booking-handoff | `feat/booking-handoff` | `apps/api/src/meetings`, `apps/worker/src/meetings`, `apps/web/src/components/booking`, `apps/web/src/app/(qualifier)` | P3-13-T1 booking panel · T2 email sequences per market · T3 qualifier brief · T4 held and no-show flow                               |
| wt-14-collateral      | `feat/collateral`      | `apps/worker/src/collateral`, `packages/ui/src/documents`                                                              | P3-14-T1 one-pager and deck templates to PDF · T2 selection logic per ICP and signal                                                 |
| wt-15-experimentation | `feat/experimentation` | `packages/domain/src/experiments`, `apps/worker/src/experiments`, `apps/web/src/app/(growth)/experiments`              | P3-15-T1 sticky assignment · T2 per-variant and per-node metrics · T3 human-approved script change loop                              |
| wt-16-dashboards      | `feat/dashboards`      | `apps/web/src/app/(growth)/dashboards`, `apps/api/src/analytics`                                                       | P3-16-T1 metric layer traceable to source rows · T2 north star, funnel, rep efficiency, cost per held meeting, ROI, budget, forecast |

---

## Step 4: P4 System acceptance — one worktree

| Worktree                | Branch                   | Owns                           | Tasks                                                                                                                                                 |
| ----------------------- | ------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| wt-17-system-acceptance | `feat/system-acceptance` | `e2e`, `docs/build/acceptance` | P4-17-T1 journey suites ICP to won · T2 load, latency, security, dependency audit · T3 compliance verification · T4 go-live checklist and defect list |

---

## The finished UI, screen by screen

The plan names worktrees but never enumerates screens, so "final ready UI" had no
definition. This is it. Each screen names the worktree that builds it.

### Rep (the screen that decides whether this product works)

| Screen                                                 | Worktree                     | Step         |
| ------------------------------------------------------ | ---------------------------- | ------------ |
| Login                                                  | wt-02                        | 1            |
| App shell and navigation                               | wt-05                        | 1            |
| Call queue, prioritised, one primary action            | wt-05                        | 1            |
| Lead screen with dossier panel                         | wt-05, dossier content wt-10 | 1, content 2 |
| Script player                                          | wt-06                        | 1            |
| Dialler with compliance pre-check and recording notice | wt-07                        | 1            |
| Disposition and outcome logging                        | wt-07                        | 1            |
| Booking panel inside the call                          | wt-13                        | 3            |
| Day progress tracker                                   | wt-05, extended wt-12        | 1, 2         |
| Practice mode for onboarding                           | wt-12                        | 2            |

### Team lead

| Screen                                    | Worktree     | Step |
| ----------------------------------------- | ------------ | ---- |
| Team queue and assignment                 | wt-02, wt-05 | 1    |
| Call review with recording and transcript | wt-12        | 2    |
| QA scorecard and coaching notes           | wt-12        | 2    |

### Qualifier

| Screen                                                      | Worktree | Step |
| ----------------------------------------------------------- | -------- | ---- |
| Meeting list                                                | wt-13    | 3    |
| Qualifier brief (dossier, call path, transcript highlights) | wt-13    | 3    |
| Accept or reject with reason                                | wt-13    | 3    |
| Held, no-show, reschedule                                   | wt-13    | 3    |

### Closer

| Screen                      | Worktree                       | Step |
| --------------------------- | ------------------------------ | ---- |
| Opportunity pipeline to won | wt-05 shell, wt-01 transitions | 1    |

### Growth lead

| Screen                                                | Worktree                          | Step |
| ----------------------------------------------------- | --------------------------------- | ---- |
| ICP segments and scoring, with explainable breakdowns | wt-08                             | 2    |
| Signal taxonomy and precision tracking                | wt-08                             | 2    |
| Sourcing runs, budget caps, cost per usable lead      | wt-09                             | 2    |
| Experiments and per-node metrics                      | wt-15                             | 3    |
| Script approval and versioning                        | wt-06 engine, wt-15 approval loop | 1, 3 |
| North star and funnel dashboards                      | wt-16                             | 3    |
| Cost per held meeting, ROI, budget burn, forecast     | wt-16                             | 3    |

### Compliance

| Screen                                    | Worktree                | Step |
| ----------------------------------------- | ----------------------- | ---- |
| Country rules: windows, notice, retention | wt-03                   | 1    |
| Suppression list                          | wt-03                   | 1    |
| Legal basis records                       | wt-03                   | 1    |
| Audit log search                          | wt-01 log, wt-03 access | 1    |

### Admin

| Screen                       | Worktree | Step |
| ---------------------------- | -------- | ---- |
| Users, roles, teams          | wt-02    | 1    |
| Integrations and credentials | wt-04    | 1    |
| Settings                     | wt-02    | 1    |

**UI is finished when:** every screen above exists, every rep screen passes axe
with no serious or critical violations, the script player renders the next node in
under 100 ms, and wt-17's journey suites pass on synthetic data.

---

## What actually blocks progress

| Blocker                                     | Blocks                               | Owner              |
| ------------------------------------------- | ------------------------------------ | ------------------ |
| Specs M1–M7, M10 missing                    | all of step 2                        | Peter              |
| Specs M8, M9, M11 missing                   | all of step 3                        | Peter              |
| Wave 1 pilot plan missing                   | step 4                               | Peter              |
| Telephony vendor undecided (human gate)     | wt-07 beyond the mock, wt-11         | Peter, via ADR-002 |
| Transcription vendor undecided (human gate) | wt-11                                | Peter, via ADR-003 |
| M12 compliance spec and counsel review      | wt-03 default rules stay assumptions | Peter              |

Engineering is not blocked on any of these for step 1. Step 1 is seven worktrees
of work and it can start now.
