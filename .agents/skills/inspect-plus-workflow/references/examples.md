# Usage Examples

Use this reference when you want fast alignment on what the skill is supposed to handle.

## Example 1: Continue TODO-driven refactor work

User request:

`继续完成todo`

Expected behavior:

- refresh `src.diff` against `offical`
- inspect the targeted files
- implement the next TODO item
- update `docs/TODO.md`
- run local validation
- run browser smoke tests only at the end
- provide a commit message suggestion

## Example 2: Reduce drift from upstream

User request:

`帮我继续做，记得先和 offical 对比`

Expected behavior:

- generate `src.diff`
- compare the touched files against `offical`
- prefer seams and wrapper patterns over deep base rewrites
- call out any high-risk fork areas in the final summary

## Example 3: End-of-round browser verification

User request:

`收尾前跑一遍浏览器测试`

Expected behavior:

- verify Vite and Chrome remote debugging endpoints
- use the fixed page order `/`, `/device`, `/selector`, `/svg`
- capture snapshot plus console for each page
- separate functional issues from accessibility-only issues

## Example 4: Prepare a commit-ready summary

User request:

`改完请给出提交信息我好提交`

Expected behavior:

- summarize only the files that belong to the current task
- mention unrelated worktree files left untouched
- provide a single commit message that matches the landed work
