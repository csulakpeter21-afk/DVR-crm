# wt-06-script-engine

- **Branch:** `feat/script-engine`
- **Worktree:** `/home/user/devora-wt/wt-06-script-engine`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** yes
- **Status:** READY

The 100 ms next-node budget is the constraint that shapes the design: load a whole published version client side before the call starts.

## Goal

Interactive script engine: versioned branching trees, a runtime that shows the next line instantly when the rep clicks the prospect's answer, and full path logging.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/script-engine`
- `apps/web/src/components/script-player`
- `apps/api/src/scripts`

## Consumes without editing

- `packages/contracts`
- `packages/ui`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/specs/M6_*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-06-T1 Tree model and versioning** — ScriptTree, ScriptVersion (immutable once published), ScriptNode (line, intent, variables such as {first_name}, {signal_hook}), ScriptAnswer (label, next node, outcome tag). Validation: no orphans, no dead ends without an outcome.
2. **P1-06-T2 Runtime** — Resolve next node from answer client side with prefetch; variable filling from lead and dossier (only sourced fields); fallback lines when a variable is missing.
3. **P1-06-T3 Script player UI** — Current line large, answer buttons, back step, objection shortcut, booking node that opens the booking panel; works with keyboard only.
4. **P1-06-T4 Path logging** — CallPath with timestamps per node; script.node_answered events; supports experiment variant id.
5. **P1-06-T5 Seed script** — A synthetic placeholder tree for testing only, clearly marked as not for live use, written to the copy rules.

## Acceptance criteria

- Given a published version, When an editor changes it, Then a new version is created and live calls keep the version they started with.
- Given a rep clicks an answer, When the next node renders, Then it appears in under 100 ms on a standard laptop (no network round trip).
- Given a node needs {signal_hook} and the dossier has no sourced signal, When rendered, Then the fallback line is shown.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-06-script-engine_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory. It points
at the context pack, which is self-contained: a session that reads
`DEV_PLAN.json` as well is paying ~14k tokens for nothing.

```
Read docs/build/context/wt-06-script-engine.md and do the work it describes. It is
self-contained: do not read DEV_PLAN.json. Before coding, check the current
official docs of any library or external API you use, and write a short plan
in docs/build/plans/wt-06-script-engine.notes.md. Work test first where the pack says so.
Rebase on claude/ecstatic-mendel-abdmov at the start of each session. Use
`turbo run test --filter=<pkg>...` while working and `pnpm verify` once before
merging. When done, write docs/build/reports/wt-06-script-engine_report.md and say you are
ready to merge. Stop and ask at any human gate.
```
