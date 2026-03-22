---
name: inspect-plus-workflow
description: Standard workflow for inspect-plus maintenance, refactors, TODO tracking, `offical` diff review, pwsh7-first command execution, low-memory validation, and end-of-round browser smoke testing. Use when the user says continue TODO, refactor inspect-plus, compare with offical, update TODO, run browser tests, reduce merge conflicts, or prepare commit-ready summaries.
---

# Inspect Plus Workflow

IRON LAW: Do not refactor `inspect-plus` from memory or convenience. Re-anchor each round with an `offical..main` diff, keep `docs/TODO.md` current, prefer pwsh7 and low-memory-safe validation, and run browser smoke tests only at the end of the round.

## Skill responsibility

- Keep day-to-day `inspect-plus` work aligned with the upstream-friendly architecture.
- Turn repeated collaboration habits into a repeatable execution loop.
- Standardize how to diff, edit, validate, test, and report work in this repo.

## Trigger scenarios

Use this skill when the user asks to:

- continue the project TODO or refactor backlog
- compare current code with `offical`
- reduce merge conflict risk with upstream
- run the standard browser verification flow
- prepare commit-ready summaries for recent work

## Progressive loading

Load only the references needed for the current round:

1. Load `references/examples.md` if you need a quick reminder of the intended usage.
2. Load `references/diff-and-todo.md` before starting code changes.
3. Load `references/browser-testing.md` only when you are at the final verification step.
4. Load `references/tooling-and-memory.md` if command environment or memory limits matter.
5. Load `references/styling-and-responsive.md` when touching styles or layout.
6. Load `references/output-standards.md` before writing the final user-facing summary.

## Workflow checklist

- [ ] Step 1: Re-anchor the round ⚠️ REQUIRED
  - [ ] Run `scripts/resolve-tooling.ps1` if command or browser paths are uncertain
  - [ ] Run `scripts/update-src-diff.ps1` or `git diff offical..main -- src/ > src.diff`
  - [ ] Review the targeted file diff before editing
  - [ ] Check `git status --short` so unrelated worktree changes are not accidentally bundled
- [ ] Step 2: Scope the change
  - [ ] Classify the change as `official-compatible`, `plus-only`, or `mixed`
  - [ ] Prefer the smallest seam that solves the task
  - [ ] Keep base files mergeable and push Plus behavior down into `plus` layers when possible
- [ ] Step 3: Execute edits
  - [ ] Use `pwsh7` for commands when available
  - [ ] Keep edits small and coherent
  - [ ] Update `docs/TODO.md` when a tracked task moves forward
  - [ ] Avoid one-off style constants when a shared variable or theme token can express the same intent
- [ ] Step 4: Validate locally
  - [ ] Run `pnpm -s type-check`
  - [ ] Run targeted lint or other focused checks only where helpful
  - [ ] Use a low-memory build only when it adds value on this machine
- [ ] Step 5: Browser verification at the end ⚠️ REQUIRED
  - [ ] Confirm Vite is reachable
  - [ ] Confirm Chrome remote debugging is reachable
  - [ ] Run the fixed smoke-test route order
  - [ ] Expand coverage only for areas changed in this round, or for major rounds that touched multiple core features
  - [ ] Separate functional failures from accessibility-only issues
- [ ] Step 6: Final reporting
  - [ ] Summarize what changed
  - [ ] List validation results
  - [ ] Call out unrelated worktree files that were left untouched
  - [ ] Provide a clear commit message suggestion

## Execution rules

### Diff and baseline

- Prefer `git diff offical..main -- src/ > src.diff` before substantial refactor work.
- Use targeted diffs for the file you are touching so you do not drift from upstream reality.
- Treat `src.diff` as a working artifact, not a feature change.

### Command execution

- Prefer:
  - `C:\Program Files\PowerShell\7\pwsh.exe`
- If `pwsh7` is not immediately available, locate it before falling back.
- Use `scripts/resolve-tooling.ps1` to find `pwsh7` and Chrome without guessing.
- Keep commands narrow and cheap on this machine unless broader validation is necessary.

### Tool and browser discovery

- Prefer the project-standard Chrome location when present:
  - `D:\Chrome\Chrome.exe`
- If Chrome is not found there, look in environment variables, PATH, and common install locations before giving up.
- Use `scripts/start-devtools-chrome.ps1` when you need a repeatable way to start remote-debugging Chrome.

### TODO tracking

- If a task is already represented in `docs/TODO.md`, update that item instead of adding duplicates.
- Mark completed sub-steps as done in the same round they land.
- Refresh the "Next recommended order" section when priorities change.

### Browser testing

- Do not interrupt coding repeatedly for browser testing.
- Run browser smoke tests after code changes and local validation are complete.
- Follow the exact page order and reporting format in `references/browser-testing.md`.
- Keep tests targeted to the changed area unless the round was large enough to justify a broader main-feature sweep.

### Long-term maintainability

- Treat long-term mergeability with `offical` as a primary requirement, not a nice-to-have.
- Avoid building new large forks or convenience hacks that create future conflict debt.
- If a refactor direction is unclear, go back to the `offical` diff before choosing an implementation path.

### Styling and responsive discipline

- Avoid hard-coded style values unless they are truly intrinsic to the content.
- Prefer shared variables, theme tokens, or unified layout controls over per-element one-off values.
- Check that style changes do not leave one panel, modal, or floating window visually inconsistent.
- Consider both light and dark color visibility whenever changing UI color or emphasis.

## Confirmation gates

Stop and realign with the user before:

- deleting large file groups
- moving official files out of their current locations
- replacing a base view with a Plus-only fork
- introducing a new toolchain dependency or test framework

## Anti-patterns

Do not:

- refactor against stale memory instead of a fresh `offical..main` diff
- choose a refactor direction without checking how the same area differs from `offical`
- run broad browser testing in the middle of a coding round without a clear reason
- bury Plus-only logic inside base files when a seam or composable would work
- report generic console noise as a blocking runtime bug
- scatter one-off hard-coded styles across a feature when a shared token would work
- include unrelated worktree changes in a suggested commit

## Pre-delivery checklist

- [ ] Diff was refreshed against `offical`
- [ ] `docs/TODO.md` matches the actual progress
- [ ] `pnpm -s type-check` ran successfully or the failure was explained
- [ ] End-of-round browser smoke test was run or explicitly skipped with reason
- [ ] Any style changes were checked for dark/light readability and window-to-window consistency
- [ ] Final summary includes file list, validation status, and commit message
