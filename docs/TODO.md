# Refactor Todo

Last updated: 2026-03-22

## Current focus

Keep `offical` mergeable while reducing Plus-only runtime risk.

## In progress

- [ ] Snapshot seam cleanup
  - [ ] Continue moving Plus-only `snapshot.ts` behavior into neutral seams or `src/composables/plus/*`
  - [ ] Reduce duplicated logic between base and plus `WindowCard` / `SearchCard`
  - [x] Replace the manual privacy editor engine with a Fabric-based Plus composable/helper split
  - [x] Upgrade the Fabric privacy editor from demo UI to a compact toolbar with usable controls
  - [x] Add arrow tool, draggable toolbar placement and portrait/landscape adaptive toolbar layout
  - [x] Add a single-step post-save screenshot rollback path with bounded backup storage
- [ ] Type tightening
  - [x] Replace high-risk `any` in `src/views/plus/snapshot/SearchCard.vue`
  - [x] Replace remaining high-risk `any` in `src/views/plus/snapshot/RuleCard.vue`
  - [x] Replace remaining high-risk `any` in `src/composables/plus/useDeviceControlTools.ts`
  - [x] Replace tree prop casts in `src/views/snapshot/WindowCard.vue` and `src/views/plus/snapshot/WindowCard.vue`
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
- [x] Tighten WindowCard tree typing
  - [x] Remove `as any` tree prop casts from `src/views/snapshot/WindowCard.vue`
  - [x] Remove `as any` tree prop casts from `src/views/plus/snapshot/WindowCard.vue`
  - [x] Align both files on `TreeProps` / `TreeOption`-based signatures
- [x] Refactor the privacy screenshot editor
  - [x] Keep `ScreenshotCard.vue` and store integration unchanged
  - [x] Move blur/export helpers into `src/utils/plus/privacyBlur.ts`
  - [x] Move Fabric canvas state into `src/composables/plus/usePrivacyFabricEditor.ts`
  - [x] Shrink `src/components/plus/snapshot/PrivacyBlurEditor.vue` back to a thin view shell
  - [x] Add compact toolbar controls for color, size, text styling and action buttons
  - [x] Replace the floating regenerate warning panel with toast-style feedback
  - [x] Add arrow annotations and live blur / eraser feedback improvements
  - [x] Add one-step restore of the pre-edit screenshot after finishing

## Next recommended order

1. Continue reducing duplicated logic between base and plus `SearchCard` / `WindowCard`
2. Add the first wrapper contract tests before further seam work
3. Continue seam-first cleanup for `snapshot.ts`
4. Validate the new privacy editor in browser and tune tool behavior if needed
5. Split the next large Plus-only block out of `RuleCard.vue` or `useDeviceControlTools.ts`
