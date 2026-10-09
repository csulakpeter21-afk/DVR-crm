# Worktrees

All 17 worktrees are checked out with dependencies installed, one per ownership
boundary from `DEV_PLAN.json`. Each is a real `git worktree` with its own branch
and working directory under `/home/user/devora-wt/`, all cut from
`claude/ecstatic-mendel-abdmov`.

**Created is not started.** Cutting a worktree costs a checkout. Starting a
session in a spec-gated one costs real credits and risks writing code twice when
the spec lands, so the gate column is binding. See
[EXECUTION_PLAN.md](EXECUTION_PLAN.md) for the reasoning and the cost model.

| Wave | Worktree                      | Branch                         | Tasks | Gate                                      | Docs                                                                                              |
| ---- | ----------------------------- | ------------------------------ | ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1    | wt-01-core-domain             | `feat/core-domain`             | 6     | **open now**                              | [pack](context/wt-01-core-domain.md) · [plan](plans/wt-01-core-domain.md)                         |
| 1    | wt-03-compliance              | `feat/compliance-engine`       | 5     | **open now**                              | [pack](context/wt-03-compliance.md) · [plan](plans/wt-03-compliance.md)                           |
| 1    | wt-04-integrations-framework  | `feat/integrations-framework`  | 4     | **open now**                              | [pack](context/wt-04-integrations-framework.md) · [plan](plans/wt-04-integrations-framework.md)   |
| 1    | wt-06-script-engine           | `feat/script-engine`           | 5     | **open now**                              | [pack](context/wt-06-script-engine.md) · [plan](plans/wt-06-script-engine.md)                     |
| 2    | wt-02-auth-rbac               | `feat/auth-rbac`               | 3     | wave 1 merged                             | [pack](context/wt-02-auth-rbac.md) · [plan](plans/wt-02-auth-rbac.md)                             |
| 2    | wt-07-telephony-adapter       | `feat/telephony-adapter`       | 4     | wave 1 merged                             | [pack](context/wt-07-telephony-adapter.md) · [plan](plans/wt-07-telephony-adapter.md)             |
| 3    | wt-05-design-system-workspace | `feat/design-system-workspace` | 3     | wave 2 merged                             | [pack](context/wt-05-design-system-workspace.md) · [plan](plans/wt-05-design-system-workspace.md) |
| 4    | wt-08-offer-icp-signals       | `feat/offer-icp-signals`       | 3     | P1 merged + specs M1, M2, M3, M6, M7, M10 | [pack](context/wt-08-offer-icp-signals.md) · [plan](plans/wt-08-offer-icp-signals.md)             |
| 4    | wt-11-calling-live            | `feat/calling-live`            | 3     | P1 merged + specs M1, M2, M3, M6, M7, M10 | [pack](context/wt-11-calling-live.md) · [plan](plans/wt-11-calling-live.md)                       |
| 4    | wt-12-rep-ops                 | `feat/rep-ops`                 | 4     | P1 merged + specs M1, M2, M3, M6, M7, M10 | [pack](context/wt-12-rep-ops.md) · [plan](plans/wt-12-rep-ops.md)                                 |
| 5    | wt-09-sourcing-enrichment     | `feat/sourcing-enrichment`     | 3     | wave 4 merged + specs M4, M5              | [pack](context/wt-09-sourcing-enrichment.md) · [plan](plans/wt-09-sourcing-enrichment.md)         |
| 5    | wt-10-dossier                 | `feat/dossier`                 | 3     | wave 4 merged + specs M4, M5              | [pack](context/wt-10-dossier.md) · [plan](plans/wt-10-dossier.md)                                 |
| 6    | wt-13-booking-handoff         | `feat/booking-handoff`         | 4     | P2 merged + specs M8, M9, M11             | [pack](context/wt-13-booking-handoff.md) · [plan](plans/wt-13-booking-handoff.md)                 |
| 6    | wt-14-collateral              | `feat/collateral`              | 2     | P2 merged + specs M8, M9, M11             | [pack](context/wt-14-collateral.md) · [plan](plans/wt-14-collateral.md)                           |
| 6    | wt-15-experimentation         | `feat/experimentation`         | 3     | P2 merged + specs M8, M9, M11             | [pack](context/wt-15-experimentation.md) · [plan](plans/wt-15-experimentation.md)                 |
| 6    | wt-16-dashboards              | `feat/dashboards`              | 2     | P2 merged + specs M8, M9, M11             | [pack](context/wt-16-dashboards.md) · [plan](plans/wt-16-dashboards.md)                           |
| 7    | wt-17-system-acceptance       | `feat/system-acceptance`       | 4     | P3 merged + the wave 1 pilot plan         | [pack](context/wt-17-system-acceptance.md) · [plan](plans/wt-17-system-acceptance.md)             |

30 tasks across waves 1 to 3 need no spec that does not exist and can run now.
The 31 tasks in waves 4 to 7 are gated on Peter, not on engineering.

## Running one

```bash
cd /home/user/devora-wt/wt-01-core-domain
```

Dependencies are already installed. Open a Claude Code session there and paste the
session prompt from the bottom of that worktree's plan file. It points at
`docs/build/context/{worktree}.md`, a self-contained pack of about 1,500 tokens
carrying the goal, the owned paths, the tasks, the acceptance criteria, every
invariant, the copy rules and the human gates.

**A session should not read `DEV_PLAN.json`.** The pack replaces it, and the plan
file is 14k tokens that buy nothing extra. Each pack says so at the top.

## The rules that keep 17 sessions from colliding

- **Path ownership.** Each worktree edits only the paths in its pack. No file has
  two owners. This is what makes parallel work safe with no coordination, and it
  is why the boundaries are drawn where they are rather than one per task.
- **`packages/contracts` has one owner: wt-01.** Any other worktree needing a
  contract change writes `docs/change-requests/CR-xxx.md`. Approved changes are
  applied in wt-01 and dependants rebase. Contract changes are a human gate.
- **Rebase on `claude/ecstatic-mendel-abdmov`** at the start of every session and
  before opening a merge.
- **Scoped checks while working**, whole-repo once before merging:

  ```bash
  turbo run test --filter=@devora/domain...   # while working
  pnpm verify                                 # before merging
  ```

- **A report per worktree** at `docs/build/reports/{worktree}_report.md`: what was
  built, library and API versions, decisions, deviations, known issues, handoffs.

## Merge order

Within P1:

```
wt-01  →  wt-02  →  wt-03  →  wt-04  →  wt-06  →  wt-07  →  wt-05
```

wt-01 first because everything imports the contracts package. wt-05 last so the UI
is built on contracts that have stopped moving. wt-07 after wt-04 because it needs
the adapter framework.

The full test suite runs after every merge. When waves 1 to 3 are in, the P1
acceptance demo runs as a Playwright suite:

> Log in as a rep, see a queue of synthetic leads, open one, run a mock call with
> the script player clicking answers to the end, log the outcome, move the lead to
> `meeting_booked` through the state machine, and see the audit log and emitted
> events. A suppressed lead cannot be queued or dialled.

## Removing one when it is done

```bash
git worktree remove /home/user/devora-wt/wt-01-core-domain
```

Worktrees in waves 4 to 7 will need `pnpm install` again by the time they open, if
earlier waves changed the lockfile. It is idempotent and takes a second.
