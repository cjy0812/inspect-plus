# Architecture Audit

Date: 2026-03-22
Baseline: `offical..main`

## Summary

The repository has already introduced some good upstream-friendly seams in base pages, but the main merge risk is still concentrated in large Plus route views that continue to own duplicated data orchestration and rendering logic.

Current shape:

- Base pages under `src/views/*` are partially seam-ready.
- Route entry points are redirected to `src/views/plus/*`.
- Several Plus pages are still near-fork implementations instead of thin wrappers.
- Plus logic has started to move into `src/composables/plus/*` and `src/components/plus/*`, but the move is incomplete.

## Phase 0 Preflight Findings

### Highest-risk duplicated views

- `src/views/plus/DevicePage.vue`
- `src/views/plus/home/HomePage.vue`
- `src/views/plus/snapshot/RuleCard.vue`
- `src/views/plus/snapshot/SearchCard.vue`
- `src/views/plus/snapshot/WindowCard.vue`

These files are the biggest future merge-conflict hotspots because upstream is likely to keep changing the same base surfaces.

### Mixed official / Plus logic

- `src/views/DevicePage.vue`
  - good: already has neutral seams
  - risk: base still owns built-in modal implementations and data orchestration that Plus wants to present differently
- `src/views/home/HomePage.vue`
  - good: already has neutral seams
  - risk: Plus grouped-list UI still lives outside a thin-wrapper model
- `src/views/snapshot/SnapshotPage.vue`
- `src/views/snapshot/SearchCard.vue`
- `src/views/snapshot/WindowCard.vue`

These are not pure upstream mirrors anymore, but they are also not fully reduced to stable seam hosts yet.

### Missing seams

- `DevicePage` still lacks a clean seam for richer grouped content behavior that needs refresh hooks after remote deletion/import actions.
- `HomePage` still lacks a full wrapper contract for replacing the content area with grouped, preview-heavy Plus UI without carrying parallel orchestration in the route view.
- Snapshot area still lacks a complete seam strategy for Search / Rule / Window enhancements.

### Router divergence

`src/router.ts` now points core routes directly to Plus pages:

- `/` -> `@/views/plus/home/HomePage.vue`
- `/snapshot/:snapshotId` -> `@/views/plus/snapshot/SnapshotPage.vue`
- `/device` -> `@/views/plus/DevicePage.vue`
- `/selector` -> `@/views/plus/SelectorPage.vue`
- `/svg` -> `@/views/plus/SvgPage.vue`

This is acceptable only if the Plus routes are thin wrappers. Today that is true for `SelectorPage` and `SvgPage`, but not yet true for `HomePage`, `DevicePage`, and much of snapshot.

### Store / composable coupling

- `src/composables/plus/useDeviceControlTools.ts`
  - contains substantial business parsing and device-side mutation logic
  - acceptable as Plus-only logic, but tightly coupled to route context and device API
- `src/composables/plus/useDeviceSnapshotData.ts`
  - good extraction of connect and snapshot loading logic
  - currently used by forked Plus view rather than by a thin wrapper around base
- `src/store/dialog.ts`
  - callback map refactor is healthy and upstream-safe

## Classification

### official-compatible

These changes are structurally reasonable to keep in base because they improve extensibility without hard-coding Plus identity:

- neutral slots in `src/views/DevicePage.vue`
  - `server-actions`
  - `content`
  - `extra-modals`
- neutral slots in `src/views/home/HomePage.vue`
  - `toolbar-right`
  - `content`
  - `extra-modals`
- helper methods exposed as neutral slot props in base pages
- `src/store/dialog.ts` callback map cleanup

### plus-only

These belong in the Plus layer and should continue to move away from route views:

- `src/components/plus/**/*`
- `src/composables/plus/**/*`
- `src/utils/plus/**/*`
- privacy editor / selector tools / fast-query indicators / grouped snapshot helpers

### mixed

These areas combine official behavior with Plus enhancement and should be split further:

- `src/views/DevicePage.vue`
- `src/views/home/HomePage.vue`
- `src/views/snapshot/SnapshotPage.vue`
- `src/views/snapshot/SearchCard.vue`
- `src/views/snapshot/WindowCard.vue`

### high-risk fork debt

These files should be treated as active architecture debt and refactored before more feature work lands in them:

- `src/views/plus/DevicePage.vue`
- `src/views/plus/home/HomePage.vue`
- `src/views/plus/snapshot/RuleCard.vue`
- `src/views/plus/snapshot/SearchCard.vue`
- `src/views/plus/snapshot/WindowCard.vue`
- `src/views/plus/snapshot/snapshot.ts`

## Risk-ranked refactor order

### P0: Convert entry-route forks into thin wrappers

1. `src/views/plus/DevicePage.vue`
2. `src/views/plus/home/HomePage.vue`

Reason:

- both are route entry points
- both already have some seam support in base
- both currently duplicate base-level orchestration and rendering
- shrinking these two views will materially reduce future upstream merge pain

### P1: Normalize snapshot entry composition

3. `src/views/plus/snapshot/SnapshotPage.vue`
4. `src/views/snapshot/SnapshotPage.vue`

Reason:

- snapshot is the heaviest customization area
- future upstream fixes are likely to touch the same shell
- the page needs a stable base shell plus injected Plus panels

### P2: Split snapshot card-level fork debt

5. `src/views/plus/snapshot/SearchCard.vue`
6. `src/views/plus/snapshot/RuleCard.vue`
7. `src/views/plus/snapshot/WindowCard.vue`

Reason:

- these files carry dense, feature-specific logic and UI
- they should trend toward “base card + plus overlay component + plus composable”

## Recommended next actions

### Action 1: DevicePage seam-first wrapper conversion

- keep `src/views/DevicePage.vue` as the base page
- convert `src/views/plus/DevicePage.vue` into a wrapper around the base page
- move grouped snapshot list UI into a Plus child component
- move grouped snapshot behavior into `src/composables/plus/useDevicePlus.ts`

### Action 2: HomePage wrapper conversion

- keep `src/views/home/HomePage.vue` as the base page
- convert `src/views/plus/home/HomePage.vue` into a wrapper around the base page
- move grouped rendering, preview cache, remarks, and selection helpers into Plus child components/composables

### Action 3: Snapshot seam map

- identify minimal seam points in base snapshot shell
- stop adding new feature logic directly inside large Plus card forks
- favor `components/plus/snapshot/*` plus `composables/plus/*`

## Phase 6 Audit Sweep

### Router

- `src/router.ts`
  - route targets intentionally point to `src/views/plus/*` for the end-user experience
  - this remains acceptable because `HomePage` and `DevicePage` were already reduced to thin wrappers
  - one concrete cleanup was required:
    - `/device` used legacy `beforeEnter(to, _, next)` syntax
    - this was converted to return-based Vue Router 4 syntax to avoid deprecated guard flow

### Store

- `src/store/dialog.ts`
  - healthy shape after the callback-map refactor
  - promise callbacks are no longer stored in reactive state
- `src/store/global.ts`
  - small and predictable
  - no additional sweep needed
- `src/store/storage.ts`
  - most important finding:
    - `settingsStore` was created with `shallowReactive`
    - this made nested objects such as `groupRemarks` fragile for persistence and UI reactivity
    - Plus code mutates `settingsStore.groupRemarks[key]`, so shallow tracking was an actual risk
  - fix applied:
    - switched `useReactiveStorage` to `reactive`
    - made persistence watch explicitly deep

### Vue / Composables

- `src/views/plus/home/HomePage.vue`
  - wrapper shape is now correct
  - business state remains in `useHomePlus`
- `src/views/plus/DevicePage.vue`
  - wrapper shape is now correct
  - business state remains in `useDevicePlus`
- remaining high-risk fork debt still lives mostly in snapshot:
  - `src/views/plus/snapshot/SearchCard.vue`
  - `src/views/plus/snapshot/RuleCard.vue`
  - `src/views/plus/snapshot/WindowCard.vue`
- current recommendation remains unchanged:
  - continue reducing snapshot fork debt by moving Plus behavior into child components and composables
  - avoid another large wrapper fork

## Acceptance criteria for the next refactor pass

- `src/views/plus/DevicePage.vue` is reduced to wrapper glue
- `src/views/plus/home/HomePage.vue` is reduced to wrapper glue
- new Plus behavior lives in composables/components instead of route views
- base pages remain upstream-friendly and use neutral seam names
- no new Plus-only naming leaks into base files
