# Execution plan: the credit-effective way to build the remaining 61 tasks

P0's 6 tasks are merged. This plan covers the other 61.

It exists because "one worktree per task" was the first instinct, and the numbers
say it costs about four times as much as the alternative for identical output. The
measurements and the reasoning are below, then the plan.

---

## Why 67 worktrees is the expensive option

### 1. Cold-start reads dominate, and they are per session

Measured on this repository today:

| What every cold session must read                                                         | Tokens             |
| ----------------------------------------------------------------------------------------- | ------------------ |
| `DEV_PLAN.json`                                                                           | 14,383             |
| `ROADMAP.md`, `BUILD_TRACKER.md`, assumption register, ADR-000, questions, README, AGENTS | 11,891             |
| **Plan and docs subtotal**                                                                | **~26,000**        |
| System prompt and tool definitions                                                        | ~20,000            |
| Reading enough existing source to extend it safely                                        | ~20,000 and rising |
| **Realistic fixed cost before the first line of code**                                    | **~65,000**        |

That cost is paid once per session, and it buys nothing that the previous session
did not already know.

| Sessions                        | Setup tokens | Merge, rebase and full-verify cycles |
| ------------------------------- | ------------ | ------------------------------------ |
| 67 (one per task)               | **~4.4M**    | 67                                   |
| 17 (one per ownership boundary) | **~1.1M**    | 17                                   |
| 7 (P1 only, as the plan has it) | ~0.46M       | 7                                    |

**~3.3M tokens of pure setup, spent to produce exactly the same code.**

Prompt caching makes this worse for the 67-way split, not better. A session that
does five related tasks fills its cache once and reuses it for all five. A session
that does one task fills the cache, does 20 minutes of work, and throws it away.

### 2. Not one of the 61 tasks is file-disjoint from its siblings

The plan defines 17 disjoint path sets. Every task sits inside one of them, so
splitting by task means N sessions claiming the same files:

| Worktree                                        | Tasks that would share one path set                                  |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| wt-01-core-domain                               | 6 (all touch `packages/contracts`, `packages/db`, `packages/domain`) |
| wt-03-compliance, wt-06-script-engine           | 5 each                                                               |
| wt-04, wt-07, wt-12, wt-13, wt-17               | 4 each                                                               |
| wt-02, wt-05, wt-08, wt-09, wt-10, wt-11, wt-15 | 3 each                                                               |
| wt-14, wt-16                                    | 2 each                                                               |

Six sessions editing `packages/db/prisma/schema.prisma` at the same time is not a
risk to manage, it is a conflict to pay for. Conflict resolution is re-reading
other agents' code: the most expensive token there is.

### 3. It breaks the plan's own `contracts_rule`

`DEV_PLAN.git_strategy.contracts_rule`: _only wt-01-core-domain edits
packages/contracts._ As 67 worktrees, six separate sessions would each need to
edit it. The rule exists to stop exactly this.

### 4. Half the tasks would be built against specs that do not exist

35 of the 61 are in P2 to P4, all `blocked_until_spec_gate`, and no spec file
exists. Building them on guesses and rewriting when the specs land is paying twice
for the same 35 tasks. **This is the single largest credit risk in the project**,
and it is bigger than the worktree-count question.

---

## The plan: 17 worktrees, 7 dependency waves, 5 credit levers

One session per ownership boundary. Each session does all of its worktree's tasks,
in order, with its context already loaded.

### Lever 1: context packs · saves ~24.5k tokens per session

`docs/build/context/{worktree}.md` is self-contained: product summary, goal, owned
paths, tasks with their detail, acceptance criteria, every invariant, the copy
rules, the vocabulary, the commands, the human gates. It is ~1,500 tokens and
**replaces the 26,000** a session would otherwise read.

Each pack opens with "do not read `DEV_PLAN.json`". At 17 sessions that is ~420k
tokens saved; at 67 it would be ~1.6M.

### Lever 2: do not start spec-gated work · saves up to 2x on 35 tasks

Waves 4 to 7 stay closed until their specs exist and are approved. The cheapest
code is the code not written twice. Write **M6, the call script** first: wt-06 is
otherwise building the script engine against a synthetic placeholder tree.

### Lever 3: model tiering · 61 tasks across 3 tiers

| Tier       | Tasks | What qualifies                                                                                                            | Model     |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------- | --------- |
| design     | 27    | An invariant the platform depends on: state machine, outbox, compliance rules, script runtime, ICP scoring, metric layer  | strongest |
| standard   | 23    | Real work with a clear shape: CRUD, UI screens, transcription tagging, briefs                                             | mid       |
| mechanical | 11    | Deterministic, verifiable by a test the task itself defines: seed data, templates, mock providers, admin CRUD, onboarding | cheapest  |

Putting all 61 on the strongest model pays design rates for seed data and PDF
templates.

### Lever 4: scoped verification while working

`pnpm verify` runs 14 packages. While working, use
`turbo run test --filter=@devora/domain...`. Full verify once, before merging.
Fewer tokens of output for the agent to read, and a much faster loop.

### Lever 5: one session per worktree, not one per task

The cache argument in reverse. A session carrying wt-01's six tasks writes the
entity schemas, then the state machine that uses them, then the outbox that the
state machine writes to, with all of it already in context. Split across six
sessions, each of the later five must first read and understand what the earlier
ones wrote.

---

## Wave schedule

A wave opens when every worktree in the previous one is merged. Within a wave,
worktrees run in parallel because their paths are disjoint.

| Wave | Worktrees                                                                              | Tasks | Gate                                                                              |
| ---- | -------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------- |
| 1    | wt-01-core-domain, wt-03-compliance, wt-04-integrations-framework, wt-06-script-engine | 20    | open now                                                                          |
| 2    | wt-02-auth-rbac, wt-07-telephony-adapter                                               | 7     | wave 1 merged (wt-07 needs the adapter framework; wt-02 needs the entity schemas) |
| 3    | wt-05-design-system-workspace                                                          | 3     | wave 2 merged, so the UI is built on settled contracts                            |
| 4    | wt-08-offer-icp-signals, wt-11-calling-live, wt-12-rep-ops                             | 10    | P1 merged **and** specs M1, M2, M3, M6, M7, M10                                   |
| 5    | wt-09-sourcing-enrichment, wt-10-dossier                                               | 6     | wave 4 merged (both need the ICP engine) **and** specs M4, M5                     |
| 6    | wt-13-booking-handoff, wt-14-collateral, wt-15-experimentation, wt-16-dashboards       | 11    | P2 merged **and** specs M8, M9, M11                                               |
| 7    | wt-17-system-acceptance                                                                | 4     | P3 merged **and** the wave 1 pilot plan                                           |

Waves 1 to 3 are 30 tasks and need no spec that does not exist. **Waves 1 to 3 can
run now.** Waves 4 to 7 are 31 tasks and are gated on Peter, not on engineering.

Merge order inside P1 is unchanged: wt-01 first (everything imports contracts),
wt-05 last (UI on settled contracts).

---

## All 61 tasks, assigned

| Task     | Title                          | Worktree                      | Wave | Tier       |
| -------- | ------------------------------ | ----------------------------- | ---- | ---------- |
| P1-01-T1 | Entity schemas                 | wt-01-core-domain             | 1    | design     |
| P1-01-T2 | Pipeline state machine         | wt-01-core-domain             | 1    | design     |
| P1-01-T3 | Event outbox                   | wt-01-core-domain             | 1    | design     |
| P1-01-T4 | Audit log                      | wt-01-core-domain             | 1    | standard   |
| P1-01-T5 | Task and SLA engine            | wt-01-core-domain             | 1    | design     |
| P1-01-T6 | Core API                       | wt-01-core-domain             | 1    | standard   |
| P1-02-T1 | Auth                           | wt-02-auth-rbac               | 2    | standard   |
| P1-02-T2 | RBAC                           | wt-02-auth-rbac               | 2    | design     |
| P1-02-T3 | Admin user management          | wt-02-auth-rbac               | 2    | mechanical |
| P1-03-T1 | Rules engine                   | wt-03-compliance              | 1    | design     |
| P1-03-T2 | Suppression                    | wt-03-compliance              | 1    | design     |
| P1-03-T3 | Legal basis records            | wt-03-compliance              | 1    | standard   |
| P1-03-T4 | Retention jobs                 | wt-03-compliance              | 1    | design     |
| P1-03-T5 | Copy linter                    | wt-03-compliance              | 1    | mechanical |
| P1-04-T1 | Adapter framework              | wt-04-integrations-framework  | 1    | design     |
| P1-04-T2 | Webhook receiver               | wt-04-integrations-framework  | 1    | design     |
| P1-04-T3 | FullEnrich adapter             | wt-04-integrations-framework  | 1    | standard   |
| P1-04-T4 | Provider interfaces + mocks    | wt-04-integrations-framework  | 1    | mechanical |
| P1-05-T1 | Design tokens and components   | wt-05-design-system-workspace | 3    | design     |
| P1-05-T2 | App shell per role             | wt-05-design-system-workspace | 3    | standard   |
| P1-05-T3 | Rep queue and lead screen      | wt-05-design-system-workspace | 3    | design     |
| P1-06-T1 | Tree model and versioning      | wt-06-script-engine           | 1    | design     |
| P1-06-T2 | Runtime                        | wt-06-script-engine           | 1    | design     |
| P1-06-T3 | Script player UI               | wt-06-script-engine           | 1    | standard   |
| P1-06-T4 | Path logging                   | wt-06-script-engine           | 1    | standard   |
| P1-06-T5 | Seed script                    | wt-06-script-engine           | 1    | mechanical |
| P1-07-T1 | Call model and lifecycle       | wt-07-telephony-adapter       | 2    | standard   |
| P1-07-T2 | Dialler component              | wt-07-telephony-adapter       | 2    | standard   |
| P1-07-T3 | Recording notice               | wt-07-telephony-adapter       | 2    | design     |
| P1-07-T4 | Mock provider                  | wt-07-telephony-adapter       | 2    | mechanical |
| P2-08-T1 | Offer knowledge base           | wt-08-offer-icp-signals       | 4    | mechanical |
| P2-08-T2 | ICP engine                     | wt-08-offer-icp-signals       | 4    | design     |
| P2-08-T3 | Signal detection               | wt-08-offer-icp-signals       | 4    | design     |
| P2-09-T1 | Sourcing runs                  | wt-09-sourcing-enrichment     | 5    | standard   |
| P2-09-T2 | Enrichment flow                | wt-09-sourcing-enrichment     | 5    | design     |
| P2-09-T3 | Quality and cost metrics       | wt-09-sourcing-enrichment     | 5    | standard   |
| P2-10-T1 | Research pipeline              | wt-10-dossier                 | 5    | design     |
| P2-10-T2 | Unsourced claim validator      | wt-10-dossier                 | 5    | design     |
| P2-10-T3 | Dossier views                  | wt-10-dossier                 | 5    | standard   |
| P2-11-T1 | Vendor adapters                | wt-11-calling-live            | 4    | design     |
| P2-11-T2 | Transcription and tagging      | wt-11-calling-live            | 4    | standard   |
| P2-11-T3 | Script v1 import               | wt-11-calling-live            | 4    | mechanical |
| P2-12-T1 | Queue prioritisation           | wt-12-rep-ops                 | 4    | design     |
| P2-12-T2 | Progress and activity trackers | wt-12-rep-ops                 | 4    | standard   |
| P2-12-T3 | QA and coaching                | wt-12-rep-ops                 | 4    | standard   |
| P2-12-T4 | Onboarding                     | wt-12-rep-ops                 | 4    | mechanical |
| P3-13-T1 | Booking panel                  | wt-13-booking-handoff         | 6    | standard   |
| P3-13-T2 | Email sequences                | wt-13-booking-handoff         | 6    | mechanical |
| P3-13-T3 | Qualifier brief                | wt-13-booking-handoff         | 6    | standard   |
| P3-13-T4 | Held and no-show flow          | wt-13-booking-handoff         | 6    | standard   |
| P3-14-T1 | Templates                      | wt-14-collateral              | 6    | mechanical |
| P3-14-T2 | Selection logic                | wt-14-collateral              | 6    | standard   |
| P3-15-T1 | Assignment                     | wt-15-experimentation         | 6    | design     |
| P3-15-T2 | Metrics                        | wt-15-experimentation         | 6    | design     |
| P3-15-T3 | Change proposals               | wt-15-experimentation         | 6    | standard   |
| P3-16-T1 | Metric layer                   | wt-16-dashboards              | 6    | design     |
| P3-16-T2 | Dashboards                     | wt-16-dashboards              | 6    | standard   |
| P4-17-T1 | End-to-end suites              | wt-17-system-acceptance       | 7    | standard   |
| P4-17-T2 | Non-functional checks          | wt-17-system-acceptance       | 7    | design     |
| P4-17-T3 | Compliance verification        | wt-17-system-acceptance       | 7    | design     |
| P4-17-T4 | Go-live checklist              | wt-17-system-acceptance       | 7    | mechanical |

Plus the 6 merged P0 tasks: P0-T1 to P0-T6. Total 67.

---

## If you want the 67-way split anyway

It is buildable, and here is what it would take so it is at least not reckless:

1. **Serialise within each ownership boundary.** Six sessions on wt-01's paths
   must run one after another, not at once, or they conflict on `schema.prisma`.
   That removes the only benefit of splitting, since the wall-clock stays the same
   while the token cost quadruples.
2. **Give the contracts rule an exception** for the six wt-01 tasks, and accept
   that the architecture guard will fire during the window when two sessions hold
   different ideas of the vocabulary.
3. **Budget ~4.4M tokens of setup** before any code, plus 67 merge cycles.

Say the word and I will cut all 67 worktrees. My recommendation is 17, because it
produces the same repository for roughly a quarter of the credits, and the
difference is setup and conflict resolution rather than anything you would see in
the code.
