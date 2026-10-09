# Worktrees

Seven P1 worktrees are checked out and ready. Each is a real `git worktree` with
its own branch and its own working directory, so seven sessions can run at once
without touching each other's files.

| Worktree                      | Branch                         | Directory                                            | Status                  | Plan                                           |
| ----------------------------- | ------------------------------ | ---------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| wt-01-core-domain             | `feat/core-domain`             | `/home/user/devora-wt/wt-01-core-domain`             | ready, **merges first** | [plan](plans/wt-01-core-domain.md)             |
| wt-02-auth-rbac               | `feat/auth-rbac`               | `/home/user/devora-wt/wt-02-auth-rbac`               | ready                   | [plan](plans/wt-02-auth-rbac.md)               |
| wt-03-compliance              | `feat/compliance-engine`       | `/home/user/devora-wt/wt-03-compliance`              | ready                   | [plan](plans/wt-03-compliance.md)              |
| wt-04-integrations-framework  | `feat/integrations-framework`  | `/home/user/devora-wt/wt-04-integrations-framework`  | ready                   | [plan](plans/wt-04-integrations-framework.md)  |
| wt-05-design-system-workspace | `feat/design-system-workspace` | `/home/user/devora-wt/wt-05-design-system-workspace` | ready, **merges last**  | [plan](plans/wt-05-design-system-workspace.md) |
| wt-06-script-engine           | `feat/script-engine`           | `/home/user/devora-wt/wt-06-script-engine`           | ready                   | [plan](plans/wt-06-script-engine.md)           |
| wt-07-telephony-adapter       | `feat/telephony-adapter`       | `/home/user/devora-wt/wt-07-telephony-adapter`       | **blocked on wt-04**    | [plan](plans/wt-07-telephony-adapter.md)       |

All seven are cut from `claude/ecstatic-mendel-abdmov` at the P0 commit.

## Running one

```bash
cd /home/user/devora-wt/wt-01-core-domain
pnpm install          # each worktree has its own node_modules
```

Then open a Claude Code session in that directory and paste the session prompt from
the bottom of the worktree's plan file. It points at
`docs/build/context/{worktree}.md`, a self-contained context pack of about 1,500
tokens that replaces the 26,000 a session would otherwise read from
`DEV_PLAN.json` and the docs. See [EXECUTION_PLAN.md](EXECUTION_PLAN.md) for why
that matters and for the wave schedule.

## The rules that keep them from colliding

- **Path ownership.** Each worktree edits only the paths in its plan. No file has
  two owners. This is what makes parallel work safe without coordination.
- **`packages/contracts` has one owner: wt-01.** Any other worktree needing a
  contract change writes `docs/change-requests/CR-xxx.md`. The orchestrator applies
  approved changes in wt-01 and tells dependants to rebase. Contract changes are a
  human gate.
- **Rebase on `claude/ecstatic-mendel-abdmov`** at the start of every session and
  before opening a merge.
- **`pnpm verify` green before merging**, plus a report in
  `docs/build/reports/{worktree_id}_report.md`.

## Merge order

```
wt-01  →  wt-02  →  wt-03  →  wt-04  →  wt-06  →  wt-07  →  wt-05
```

wt-01 first because everything imports the contracts package. wt-05 last so the UI
is built on contracts that have stopped moving. wt-07 after wt-04 because it needs
the adapter framework.

The full test suite runs after every merge. When all seven are in, the P1
acceptance demo runs as a Playwright suite:

> Log in as a rep, see a queue of synthetic leads, open one, run a mock call with
> the script player clicking answers to the end, log the outcome, move the lead to
> `meeting_booked` through the state machine, and see the audit log and emitted
> events. A suppressed lead cannot be queued or dialled.

## Removing one when it is done

```bash
git worktree remove /home/user/devora-wt/wt-01-core-domain
```

## Waves, not phases

[EXECUTION_PLAN.md](EXECUTION_PLAN.md) schedules all 61 remaining tasks into 7
dependency waves and assigns each a model tier. Waves 1 to 3 cover 30 tasks and
need no spec that does not exist, so they can run now. Waves 4 to 7 are gated on
Peter.

Wave 1 is wt-01, wt-03, wt-04 and wt-06. Wave 2 is wt-02 and wt-07. Wave 3 is
wt-05.

## P2 to P4

Those ten worktrees are defined in `DEV_PLAN.json` and mapped in
[ROADMAP.md](ROADMAP.md), but they are **spec-gated** and not created yet. They
open when the specs they need exist and are approved. See `QUESTIONS.md` Q-004.
