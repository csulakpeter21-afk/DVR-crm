# Context pack: wt-06-script-engine

Everything this worktree needs. **Do not read `DEV_PLAN.json`** — it is 14k tokens
and this file replaces it for your purposes.

- **Branch:** `feat/script-engine` · **Phase:** P1 · **Test first:** yes
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

Interactive script engine: versioned branching trees, a runtime that shows the next line instantly when the rep clicks the prospect's answer, and full path logging.

## Paths you own

- `packages/script-engine`
- `apps/web/src/components/script-player`
- `apps/api/src/scripts`

Edit nothing outside these. No file has two owners.

## Packages you consume without editing

- `packages/contracts`
- `packages/ui`

## Your tasks, in order

### P1-06-T1 Tree model and versioning · tier: design

ScriptTree, ScriptVersion (immutable once published), ScriptNode (line, intent, variables such as {first_name}, {signal_hook}), ScriptAnswer (label, next node, outcome tag). Validation: no orphans, no dead ends without an outcome.

### P1-06-T2 Runtime · tier: design

Resolve next node from answer client side with prefetch; variable filling from lead and dossier (only sourced fields); fallback lines when a variable is missing.

### P1-06-T3 Script player UI · tier: standard

Current line large, answer buttons, back step, objection shortcut, booking node that opens the booking panel; works with keyboard only.

### P1-06-T4 Path logging · tier: standard

CallPath with timestamps per node; script.node_answered events; supports experiment variant id.

### P1-06-T5 Seed script · tier: mechanical

A synthetic placeholder tree for testing only, clearly marked as not for live use, written to the copy rules.

## Your acceptance criteria

- Given a published version, When an editor changes it, Then a new version is created and live calls keep the version they started with.
- Given a rep clicks an answer, When the next node renders, Then it appears in under 100 ms on a standard laptop (no network round trip).
- Given a node needs {signal_hook} and the dossier has no sourced signal, When rendered, Then the fallback line is shown.

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
`docs/build/reports/wt-06-script-engine_report.md` covering what was built, library versions,
decisions, deviations, known issues and handoffs.
