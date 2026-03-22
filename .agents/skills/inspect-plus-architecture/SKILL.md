---
name: inspect-plus-architecture
description: Use for inspect-plus refactors that must keep `offical` easy to merge while isolating Plus behavior. Apply when touching `src/views`, `src/views/plus`, `src/components/plus`, `src/composables/plus`, `src/utils/plus`, routing overrides, or any Base/Plus decoupling work.
---

# Inspect Plus Architecture

This skill governs how to evolve `inspect-plus` without making future merges from `offical` painful.

## Goal

Keep official code mergeable.
Keep Plus features isolated.
Avoid copy-paste forks of official views and components.

## Source-of-truth rules

1. `offical` is the upstream compatibility baseline.
2. `src/views/*` should stay as close to official as possible.
3. `src/views/plus/*` should be wrappers, not forks.
4. Plus-only logic belongs in `src/composables/plus/*`, `src/utils/plus/*`, or `src/components/plus/*`.
5. If a feature can be injected with props, slots, or one-line hooks, do that instead of rewriting the base file.

## File ownership

- Base views:
  - `src/views/DevicePage.vue`
  - `src/views/home/HomePage.vue`
  - `src/views/snapshot/*`
- Plus wrappers:
  - `src/views/plus/*`
- Plus business UI:
  - `src/components/plus/*`
- Plus feature logic:
  - `src/composables/plus/*`
- Plus helpers:
  - `src/utils/plus/*`

Do not move official logic into `plus` just because it is large.
Do move Plus-only logic out of base views when it reduces merge conflicts.

## Mandatory workflow before editing

1. Compare against official first.
   - Use `git diff --name-status offical..main`
   - Use targeted diffs for the file being changed.
2. Classify each change:
   - `official-compatible`: likely acceptable in base
   - `plus-only`: must live in plus layer
   - `mixed`: split before continuing
3. Prefer the smallest viable seam:
   - slot
   - prop
   - emitted event
   - wrapper component
   - composable
4. Only patch base files at stable seam points.

## Allowed base-file changes

These are the preferred kinds of base edits:

- Add slot outlets
- Add prop-driven extension points
- Extract shared logic into neutral composables
- Replace hard-coded UI sections with child components
- Add small guards for null safety or performance
- Add import path indirection needed for wrappers
- Use generic, neutral names for slots and props
  - Prefer names like `extra-content`, `item-footer`, `toolbar-right`
  - Avoid project-specific names like `plus-*`

These are discouraged:

- Copying an entire official file into `src/views/plus` and editing it heavily
- Re-implementing the same computed/watch logic in both base and plus
- Adding Plus-only branches deep inside official templates
- Mixing Plus styles into official component internals without a wrapper seam

## Wrapper design pattern

When Plus needs to enhance a page:

1. Keep the base page responsible for core layout and official behavior.
2. Create or keep a wrapper under `src/views/plus`.
3. Inject extra UI through slots or thin child components.
4. Put Plus state and side effects into a `useXxxPlus.ts` composable.
5. Keep wrapper templates small and obvious.

### The "Seam First" Rule

If a base file is too rigid for injection, first refactor the base file to introduce a seam such as a slot, prop, or event in a separate commit before implementing the Plus feature.

Target shape:

- base page: stable composition surface
- plus wrapper: glue code only
- plus composable: feature state and side effects
- plus component: isolated enhanced UI

## Conflict minimization rules

When deciding where code should go, use this order:

1. `src/composables/plus/*`
2. `src/components/plus/*`
3. `src/utils/plus/*`
4. wrapper under `src/views/plus/*`
5. minimal seam patch in base view

If a change would duplicate more than roughly 20 percent of an official file, stop and refactor the seam first.

If a Plus view grows into a near-copy of a base view, treat that as architecture debt and split it before adding new features.

Type augmentation rule:

- Do not modify official `.d.ts` files for Plus-only extensions
- Use TypeScript declaration merging or module augmentation under `src/types/plus/*`
- Keep base type surfaces upstream-friendly and put local extensions in the Plus layer

## Styling rules

1. Do not restyle official pages directly unless needed for a seam.
2. Plus styling should live in Plus components or wrapper-scoped `:deep(...)` overrides.
3. Prefer CSS variables from `src/style/var.scss`.
4. Avoid hard-coded layout values when a reusable variable is possible.

## Import rules

1. In Plus files, prefer `@/` aliases for official imports.
2. Do not use fragile deep relative imports to reach official files from Plus folders.
3. Keep file names and import case exact.

## Browser testing workflow

When validating `inspect-plus` in a real browser, use the same setup every time.

1. Prefer connect-before-launch.
   - Before using `chrome-devtools-mcp`, check whether `http://127.0.0.1:9222/json/version` is reachable.
   - If it is reachable, reuse the existing Chrome instance.
   - If it is not reachable, start Chrome with:
     - `D:\Chrome\Chrome.exe --remote-debugging-port=9222 --user-data-dir="D:\Chrome\UserData" --profile-directory="Default"`
2. Keep MCP in browserUrl mode.
   - `chrome-devtools-mcp` should connect to `http://127.0.0.1:9222`
   - Do not switch back to launching Chrome via MCP unless the user explicitly asks for that mode.
3. Start the app before testing pages.
   - Run `pnpm dev`
   - Wait until Vite reports a local URL or the page is reachable in the browser.
4. Use a fixed smoke-test route order.
   - `/`
   - `/device`
   - `/selector`
   - `/svg`
5. For each tested page, always do both:
   - capture a page snapshot
   - inspect console messages
6. Report only meaningful failures as page issues.
   - Functional/runtime problems such as Vue warnings, missing props, blank pages, failed navigation, and uncaught errors are real findings.
   - Ignore Vite hot-update noise unless it blocks testing.
   - Accessibility issues such as missing `id` or `name` should be reported separately from runtime failures.
7. If browser testing fails, debug in this order:
   - Is `http://127.0.0.1:9222/json/version` reachable?
   - Is Codex configured with `--browserUrl=http://127.0.0.1:9222`?
   - Was Chrome started with the project-standard remote debugging command?
   - Does the MCP session need to be restarted after config changes?

## Review checklist

Before finishing a refactor, verify:

- Is the base file still close to `offical`?
- Is Plus logic isolated from official logic?
- Did we remove duplication instead of moving it around?
- Can the feature survive an upstream merge with minimal manual conflict resolution?
- Are Plus imports using stable `@/` aliases?
- Did we avoid adding a second source of truth?

## High-risk areas in this repo

Prioritize mirror-code cleanup in:

- `src/views/plus/home/HomePage.vue`
- `src/views/plus/DevicePage.vue`
- `src/views/plus/snapshot/RuleCard.vue`
- `src/views/plus/snapshot/SearchCard.vue`
- `src/views/plus/snapshot/WindowCard.vue`

These files are likely to conflict with future upstream changes and should trend toward wrapper-plus-composable architecture instead of full forks.
