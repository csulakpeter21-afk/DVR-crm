# Change requests

`packages/contracts` is law, and only wt-01-core-domain edits it. Any other
worktree that needs a contract change writes a file here instead
(`DEV_PLAN.git_strategy.contracts_rule`).

Name it `CR-001-short-description.md` and keep it to the point:

```markdown
# CR-001: <what needs to change>

- **Requested by:** <worktree id>
- **Date:** YYYY-MM-DD
- **Status:** proposed | approved | applied in <commit> | rejected

## What needs to change

The exact schema, stage, role or event, and the shape you need.

## Why

What you cannot build without it. Name the task id.

## Who else it affects

Which packages import this today.

## Suggested migration

How existing data and callers move across.
```

The orchestrator applies approved changes in wt-01, adds an ADR when the change is
structural, and tells the dependent worktrees to rebase.

An approved change request is still a **human gate**: contract changes need Peter.
