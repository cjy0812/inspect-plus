# Inspect Plus Refactoring Plan

> **CRITICAL RULE FOR AI**
> For every task below, you MUST follow `.agents/skills/inspect-plus-architecture/SKILL.md`.
> - ZERO copy-pasting of upstream views.
> - ALWAYS prefer Wrapper + Seam.
> - If a base file is too rigid, stop and create a seam first.
> - Do not proceed to the next phase until the current phase is fully verified and committed.

---

## Phase 0: Preflight Guardrails

- [x] **Task 0.1**: Confirm the current branch and compare against upstream baseline.
  - Run a targeted review of:
    - `git diff --name-status offical..main`
    - `git diff --stat offical..main`
  - Identify the highest-risk files first.

- [x] **Task 0.2**: Produce a short audit note inside the worktree or in the terminal output summarizing:
  - duplicated upstream views
  - mixed official/plus logic
  - missing seams
  - router divergence
  - store / composable coupling

- [x] **Commit**: `review: 审计文档`

---

## Phase 1: Architecture Audit

- [x] **Task 1**: Use the `inspect-plus-architecture` skill to analyze the following layers:
  - `src/views/*`
  - `src/views/plus/*`
  - `src/router/*`
  - `src/store/*`
  - `src/composables/*`
  - `src/components/*`
  - `src/utils/*`

  Identify:
  - duplicated upstream views
  - mixed upstream/plus logic
  - missing extension seams
  - router divergence
  - store-side coupling
  - any view that has grown into a near-copy fork

- [x] **Task 1.1**: Classify findings into:
  - `official-compatible`
  - `plus-only`
  - `mixed`
  - `high-risk fork debt`

- [x] **Task 1.2**: Produce a risk-ranked list with priority order for refactor.

- [x] **Commit**: `review: 审计文档`

---

## Phase 2: Establish Upstream Seams

- [x] **Task 2.1**: Refactor `src/views/home/HomePage.vue` to add minimal, upstream-compatible seams only.
  - Prefer `<slot>` or prop-driven seams.
  - Keep diff minimal.
  - Do not introduce Plus-only names into base unless unavoidable.
  - Prefer neutral slot/prop names such as:
    - `extra-content`
    - `extra-actions`
    - `item-footer`

- [x] **Task 2.2**: Refactor `src/views/DevicePage.vue` to add minimal, upstream-compatible seams only.
  - Keep the base page close to `offical`.
  - Add only the smallest viable seam.
  - Do not move Plus logic into base.

- [x] **Task 2.3**: If a file is too rigid for injection, first create a seam in a separate commit before any Plus feature implementation.

- [x] **Verification**:
  - Base pages still resemble upstream.
  - No large Plus branches inside official templates.
  - Diff remains small and reviewable.

- [x] **Commit**: `review: 审计文档`

---

## Phase 3: Implement Thin Wrapper Pattern

- [x] **Task 3.1**: Refactor `src/views/plus/home/HomePage.vue`.
  - Remove duplicate upstream logic.
  - Import the base view.
  - Inject Plus-specific UI through the seam created in Phase 2.
  - Keep the wrapper small and obvious.

- [x] **Task 3.2**: Refactor `src/views/plus/DevicePage.vue`.
  - Remove duplicate upstream logic.
  - Import the base view.
  - Inject Plus-specific UI through the seam created in Phase 2.
  - Keep the wrapper thin.

- [x] **Task 3.3**: Ensure wrappers only contain:
  - slot content
  - prop wiring
  - composable wiring
  - small glue code

- [ ] **Forbidden patterns**:
  - copying an entire upstream view into Plus
  - duplicating computed/watch logic in both base and plus
  - adding Plus-only branches deep inside official templates

- [x] **Verification**:
  - Plus wrappers are much smaller than the original forked views
  - Base pages remain upstream-friendly
  - No major business logic lives inside wrappers

- [x] **Commit**: `refactor(plus): convert home and device pages into thin wrappers`

---

## Phase 4: Extract Plus Logic into Composables

- [x] **Task 4.1**: Use `create-adaptable-composable` skill.
  - Extract Plus-specific reactive state and functions from the wrappers.
  - Create `src/composables/plus/useHomePlus.ts`.
  - Create `src/composables/plus/useDevicePlus.ts`.

- [x] **Task 4.2**: Move only Plus-specific logic.
  - Do not move upstream/core logic.
  - Do not make composables import views.
  - Keep composables reusable and testable.

- [x] **Task 4.3**: Make wrapper templates depend on composables rather than inline logic wherever possible.

- [x] **Verification**:
  - Composables contain Plus state and side effects.
  - Wrappers become thinner.
  - No duplicated logic remains in base and plus for the same behavior.

- [x] **Commit**: `refactor(plus): convert home and device pages into thin wrappers`

---

## Phase 5: TypeScript Augmentation

- [x] **Task 5.1**: Review all type extensions needed by Plus features.

- [x] **Task 5.2**: Do **not** modify official `.d.ts` files.

- [x] **Task 5.3**: Create `src/types/plus/index.d.ts` if needed and use:
  - declaration merging
  - module augmentation

- [x] **Task 5.4**: Keep Plus type extensions isolated under `src/types/plus/`.

- [x] **Neutral rule**:
  - Use generic type names where possible.
  - Avoid project-specific naming leakage into base type files.

- [x] **Verification**:
  - Type augmentation compiles cleanly
  - No upstream type files are touched
  - Plus types are isolated and easy to remove later

- [ ] **Commit**: `refactor(types): add plus type augmentations`

---

## Phase 6: Router Audit and Best-Practice Sweep

- [ ] **Task 6.1**: Use `vue-router-best-practices` skill to audit `src/router/*`.
  - Check for:
    - duplicated route definitions
    - Plus-specific route forks
    - route guards mixed with view logic
    - unnecessary router coupling

- [ ] **Task 6.2**: Use `vue-pinia-best-practices` skill to audit `src/store/*`.
  - Check for:
    - side effects in getters
    - oversized stores
    - state that belongs in composables
    - circular dependencies

- [ ] **Task 6.3**: Use `vue-best-practices` skill to audit:
  - `src/views/*`
  - `src/components/*`
  - `src/composables/*`

  Check for:
  - reactive misuse
  - watch abuse
  - computed misuse
  - lifecycle misuse

- [ ] **Task 6.4**: Do not expand scope into unrelated files unless they are directly implicated by the refactor.

- [ ] **Verification**:
  - Router remains stable and minimal
  - Stores are clean and side-effect-free where appropriate
  - Vue code follows predictable patterns

- [ ] **Commit**: `refactor(vue): align router store and vue patterns`

---

## Phase 7: Bug Squashing and Sanity Checks

- [ ] **Task 7.1**: Use `vue-debug-guides` skill.
  - Run type checks.
  - Fix runtime errors introduced during the refactor.
  - Focus on:
    - reactive loops
    - missing imports
    - undefined props
    - broken slot wiring
    - stale state

- [ ] **Task 7.2**: Verify the most important user flows still work:
  - Home page
  - Device page
  - Snapshot-related flows
  - Plus-specific injected UI

- [ ] **Task 7.3**: If a bug requires a large structural change, stop and create a seam-first refactor instead of patching deeply inside a forked view.

- [ ] **Verification**:
  - No TypeScript errors
  - No runtime regressions
  - Key pages render correctly
  - Plus UI still appears through wrappers

- [ ] **Commit**: `fix: resolve type and runtime issues post-refactor`

---

## Phase 8: Architecture Documentation

- [ ] **Task 8.1**: Generate `docs/architecture.md`.

- [ ] **Task 8.2**: Document the following clearly:
  - Base Layer
  - Plus Wrapper Layer
  - Extension Seams
  - Composables
  - Type Augmentation
  - Conflict Minimization Rules
  - High-risk files to avoid mirroring

- [ ] **Task 8.3**: Include a short maintenance guide:
  - how to add a new Plus feature
  - how to decide base vs plus placement
  - how to avoid upstream merge pain

- [ ] **Verification**:
  - Documentation matches actual code structure
  - New contributors can follow the architecture without guesswork

- [ ] **Commit**: `docs: add architecture documentation`

---

## Global Rules for Every Phase

1. **Seam First**
   - If the base file is too rigid, introduce a seam in a separate commit before implementing the Plus feature.

2. **Neutral Naming**
   - Use generic, upstream-friendly names for slots and props.
   - Prefer names like `extra-content`, `extra-actions`, `item-footer`.
   - Avoid project-specific prefixes like `plus-` in base seams.

3. **Conflict Minimization**
   - Prefer this placement order:
     1. `src/composables/plus/*`
     2. `src/components/plus/*`
     3. `src/utils/plus/*`
     4. `src/views/plus/*`
     5. minimal seam patch in base views

4. **Type Augmentation**
   - Never modify official `.d.ts` files for Plus-only needs.
   - Use declaration merging or module augmentation under `src/types/plus/`.

5. **Maximum Fork Debt Rule**
   - If a Plus view duplicates more than roughly 20% of an official file, stop and refactor the seam first.

6. **Upstream Compatibility**
   - `offical` is the baseline.
   - `src/views/*` should stay as close to upstream as possible.
   - Plus features should survive upstream merges with minimal conflict resolution.

7. **No Silent Scope Expansion**
   - Do not add unrelated fixes while in a refactor phase unless they are required to keep the refactor valid.

---

## Final Acceptance Criteria

The refactor is complete only if:

- Base pages remain close to `offical`
- Plus pages are thin wrappers
- Plus logic lives in composables/components/utils
- Router and store are audited
- Types are isolated under `src/types/plus/`
- No large duplicated view forks remain
- `docs/architecture.md` is added
- Each phase is committed separately
