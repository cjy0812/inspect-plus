# Refactor Todo

Last updated: 2026-05-21

## Current focus

Keep `offical` mergeable while reducing Plus-only runtime risk.

## In progress

- [ ] Snapshot seam cleanup
  - [ ] Continue moving Plus-only `snapshot.ts` behavior into neutral seams or `src/composables/plus/*`
  - [ ] Reduce duplicated logic between base and plus `WindowCard` / `SearchCard`
- [ ] Type tightening
  - [x] Replace high-risk `any` in `src/views/plus/snapshot/SearchCard.vue`
  - [x] Replace remaining high-risk `any` in `src/views/plus/snapshot/RuleCard.vue`
  - [x] Replace remaining high-risk `any` in `src/composables/plus/useDeviceControlTools.ts`
  - [x] Replace tree prop casts in `src/views/snapshot/WindowCard.vue` and `src/views/plus/snapshot/WindowCard.vue`
- [ ] Tests
  - [x] Add wrapper contract tests for `HomePage` / `DevicePage`
  - [ ] Add parser tests for `RuleCard` / `useDeviceControlTools`

## Done in this round

- [x] Extract shared `WindowCard` seam
  - [x] Add neutral `src/composables/useSnapshotWindowCard.ts`
  - [x] Reuse shared tree state, focus scrolling, node props, and snapshot metadata in base and Plus `WindowCard`
  - [x] Keep Plus-only quick-find label rendering inside `src/views/plus/snapshot/WindowCard.vue`
- [x] Add first Adapter contract tests
  - [x] Add Vitest / Vue Test Utils test infrastructure
  - [x] Cover `HomePage` and `DevicePage` route-level slot wiring
- [x] Clarify Plus route Adapter layer
  - [x] Treat `src/views/plus/*` as the route-level Adapter layer
  - [x] Move root-level Plus-only components into `src/components/plus/<domain>/*`
  - [x] Keep official/base file paths stable for future `main` merges
- [x] Fix `/device` wrapper seam regression
  - [x] Restore `refreshSnapshots` as a real base-slot contract in `src/views/DevicePage.vue`
  - [x] Remove runtime `refreshSnapshots` undefined warnings observed in browser testing
- [x] Harden `/device` snapshot refresh flow
  - [x] Replace `watchEffect(async () => ...)` with guarded `watch(serverInfo, ...)`
  - [x] Add run-token protection to avoid stale snapshot responses overwriting newer state
  - [x] Keep `document.title` and `snapshots` consistent when device state changes
- [x] Fix screenshot object URL lifecycle
  - [x] Add neutral helper `src/composables/useArrayBufferObjectUrl.ts`
  - [x] Reuse it in both `src/views/snapshot/snapshot.ts` and `src/views/plus/snapshot/snapshot.ts`
  - [x] Stop creating unreleased object URLs from `computed(() => URL.createObjectURL(...))`
- [x] Small browser hardening
  - [x] Add `noopener,noreferrer` when opening snapshot pages from `/device`
- [x] Split device subscription import logic
  - [x] Extract normalization, candidate building and payload merge into `src/utils/plus/subscriptionImport.ts`
  - [x] Keep `useDeviceControlTools.ts` focused on UI state and API orchestration
- [x] Split RuleCard rule-test engine
  - [x] Extract rule parsing/validation/execution into `src/utils/plus/ruleTest.ts`
  - [x] Reduce `RuleCard.vue` to view state + presentation wiring
- [x] Tighten Plus snapshot typing
  - [x] Remove `any`-based result plumbing from `src/views/plus/snapshot/SearchCard.vue`
  - [x] Remove `any` from `src/views/plus/snapshot/RuleCard.vue`
  - [x] Remove `any` from `src/composables/plus/useDeviceControlTools.ts`
- [x] Tighten WindowCard tree typing
  - [x] Remove `as any` tree prop casts from `src/views/snapshot/WindowCard.vue`
  - [x] Remove `as any` tree prop casts from `src/views/plus/snapshot/WindowCard.vue`
  - [x] Align both files on `TreeProps` / `TreeOption`-based signatures

## Next recommended order

1. Continue reducing duplicated logic between base and plus `SearchCard` / `WindowCard`
2. Add the first wrapper contract tests before further seam work
3. Continue seam-first cleanup for `snapshot.ts`
4. Split the next large Plus-only block out of `RuleCard.vue` or `useDeviceControlTools.ts`
