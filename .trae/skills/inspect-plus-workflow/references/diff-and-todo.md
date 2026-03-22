# Diff And Todo Standard

## Baseline command

Preferred repo-wide source diff:

```powershell
git diff offical..main -- src/ > src.diff
```

Use it before substantial refactors so the round stays anchored to upstream reality.

## Mandatory pre-edit checks

1. `git status --short`
2. targeted diff for the file being touched
3. confirm whether the change is:
   - `official-compatible`
   - `plus-only`
   - `mixed`

## TODO rules

- Keep `docs/TODO.md` as the project execution log.
- Update it when a tracked task is completed in the same round.
- Do not leave stale future priorities after finishing an item.
- Avoid adding duplicate bullet points for work that is already tracked.

## Commit scoping

- Only include files from the current task in the suggested commit.
- Explicitly mention unrelated worktree files that were left alone.
- Treat `src.diff` as a working aid unless the user explicitly wants to track it.
