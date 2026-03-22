# Refactor Todo

Last updated: 2026-03-22

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
  - [ ] Replace tree prop casts in `src/views/snapshot/WindowCard.vue` and `src/views/plus/snapshot/WindowCard.vue`
- [ ] Tests
  - [ ] Add wrapper contract tests for `HomePage` / `DevicePage`
  - [ ] Add parser tests for `RuleCard` / `useDeviceControlTools`

## Done in this round

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

## Next recommended order

1. Replace tree prop casts in `WindowCard` base/plus pair
2. Continue reducing duplicated logic between base and plus `SearchCard` / `WindowCard`
3. Add the first wrapper contract tests before further seam work
4. Continue seam-first cleanup for `snapshot.ts`
