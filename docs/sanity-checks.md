# Sanity Checks

Date: 2026-03-22

This document records the lightweight verification pass used during the refactor.
The machine running these checks has limited memory, so the verification strategy
favors targeted compile/build checks and explicit contract review over repeated
full dev-server sessions.

## Commands

The following commands completed successfully:

```powershell
pnpm -s tsc --noEmit
pnpm exec eslint src/views/DevicePage.vue src/views/home/HomePage.vue src/router.ts src/store/storage.ts
```

Production build was also verified with a capped Node heap:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=1536'
pnpm -s build
```

## Flow Matrix

### Home page

Route:

- `/` -> `src/views/plus/home/HomePage.vue`

Composition chain:

- Plus route wrapper renders `src/views/home/HomePage.vue`
- Base page exposes `content`
- Wrapper injects `src/components/plus/home/HomeSnapshotGroups.vue`
- Wrapper state is driven by `src/composables/plus/useHomePlus.ts`

Static contract checks:

- base slot exposes `checkedRowKeys`, `setCheckedRowKeys`, `filterSnapshots`, `loading`, `updateSnapshots`
- wrapper consumes the same contract
- child component emits `update:checkedRowKeys` and wrapper forwards it to `setCheckedRowKeys`

Fixes applied during sanity pass:

- `updateSnapshots()` now uses `try/finally`
- loading state can no longer remain stuck if snapshot loading throws

### Device page

Route:

- `/device` -> `src/views/plus/DevicePage.vue`

Composition chain:

- Plus route wrapper renders `src/views/DevicePage.vue`
- Base page exposes `server-actions`, `content`, `extra-modals`
- Wrapper injects `DeviceControlTools`, grouped snapshot content, and settings modal
- Wrapper state is driven by `src/composables/plus/useDevicePlus.ts`

Static contract checks:

- base `server-actions` slot exposes `captureSnapshot`, `downloadAllSnapshot`, `openSubsModal`, `openSelectorModal`
- base `content` slot exposes `snapshots`, `refreshSnapshots`
- wrapper consumes the same slot props without duplicating base orchestration

Fixes applied during sanity pass:

- reconnect now clears stale `serverInfo` and `snapshots` before fetching
- failed reconnect leaves the page in a safe empty state
- server title now uses a fallback when `versionName` is missing
- `/device` route guard now uses return-based Vue Router 4 syntax

### Snapshot page

Route:

- `/snapshot/:snapshotId` -> `src/views/plus/snapshot/SnapshotPage.vue`

Composition chain:

- Plus route wrapper renders `src/views/snapshot/SnapshotPage.vue`
- Base page exposes the named seams:
  - `sidebar`
  - `screenshot-card`
  - `window-card`
  - `search-card`
  - `rule-card`
  - `attr-card`
  - `overlap-card`
  - `track-dialog`
  - `extra-modals`
- Wrapper injects the Plus snapshot cards and modals through those seams

Static contract checks:

- named slot contracts are aligned between base shell and wrapper
- search/rule/attr panel visibility still flows through wrapper state
- track dialog still closes through wrapper-provided handlers

## Store / State Checks

### Storage store

- `src/store/storage.ts`
  - `settingsStore` now uses `reactive(...)`
  - persistence watcher now uses `{ deep: true }`
  - nested updates such as `settingsStore.groupRemarks[key] = value` are now tracked reliably

### Dialog store

- `src/store/dialog.ts`
  - promise callbacks remain outside reactive state in a `Map`
  - close/resolve/reject paths all delete stored callbacks

## Notes

- No TypeScript errors remain in the refactor path verified above.
- No ESLint errors remain in the targeted files verified above.
- Production build succeeds when Node heap is capped to fit the current machine.
- This pass is a static/build-level sanity sweep, not a manual click-through QA run.
