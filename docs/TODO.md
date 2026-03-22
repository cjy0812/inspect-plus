# Refactor Todo

Last updated: 2026-03-22

## Current focus

Keep `offical` mergeable while reducing Plus-only runtime risk.

## In progress

- [ ] Snapshot seam cleanup
  - [ ] Continue moving Plus-only `snapshot.ts` behavior into neutral seams or `src/composables/plus/*`
  - [ ] Reduce duplicated logic between base and plus `WindowCard` / `SearchCard`
- [ ] Type tightening
  - [ ] Replace high-risk `any` in `src/views/plus/snapshot/SearchCard.vue`
  - [ ] Replace high-risk `any` in `src/views/plus/snapshot/RuleCard.vue`
  - [ ] Replace high-risk `any` in `src/composables/plus/useDeviceControlTools.ts`
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

## Next recommended order

1. Split parsing and candidate-building out of `src/composables/plus/useDeviceControlTools.ts`
2. Extract `RuleCard` parser/validator into dedicated Plus utils or composables
3. Remove `any`-based result plumbing from `src/views/plus/snapshot/SearchCard.vue`
4. Add the first wrapper contract tests before further seam work
