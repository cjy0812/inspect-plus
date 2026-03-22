# Output Standards

## Progress updates

- Keep progress updates short and concrete.
- State what is being checked or changed next.
- Mention architecture intent when relevant, especially for base-vs-plus work.

## Final summary shape

Use this order:

1. `进展` or a short outcome line
2. `已完成`
3. `验证`
4. `当前建议提交文件`
5. `当前工作区还有无关改动`
6. `建议提交信息`
7. `下一步`

## Validation reporting

Always distinguish:

- type-check or lint results
- browser smoke results
- accessibility-only or non-blocking issues

## Commit message guidance

- Prefer one commit message per coherent round
- Use prefixes that match the work:
  - `fix(...)`
  - `refactor(...)`
  - `docs(...)`
  - `test(...)`
- The commit message should describe the main landed change, not the whole backlog
