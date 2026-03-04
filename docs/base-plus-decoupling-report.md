# Base / Plus Decoupling Report

## 1) Mirror Scan Result

Scanned pairs under `src/views/*` and `src/views/plus/*` (same relative path).

High coupling still exists in:

- `src/views/plus/DevicePage.vue`
- `src/views/plus/home/HomePage.vue`
- `src/views/plus/snapshot/AttrCard.vue`
- `src/views/plus/snapshot/SearchCard.vue`
- `src/views/plus/snapshot/ScreenshotCard.vue`
- `src/views/plus/snapshot/snapshot.ts`

Mirror anti-pattern already removed (Plus now thin wrappers):

- `src/views/plus/SelectorPage.vue`
- `src/views/plus/SvgPage.vue`
- `src/views/plus/snapshot/OverlapCard.vue`
- `src/views/plus/snapshot/MiniHoverImg.vue`

These now only delegate to Base pages/components and contain no duplicated business logic.

## 2) Decoupling Actions Done

### 2.1 Thin-wrapper replacement

Replaced copied Plus files with thin wrappers that import Base:

- `@/views/plus/SelectorPage.vue -> @/views/SelectorPage.vue`
- `@/views/plus/SvgPage.vue -> @/views/SvgPage.vue`
- `@/views/plus/snapshot/OverlapCard.vue -> @/views/snapshot/OverlapCard.vue`
- `@/views/plus/snapshot/MiniHoverImg.vue -> @/views/snapshot/MiniHoverImg.vue`

### 2.2 Performance optimization (large snapshot list)

In `src/views/plus/home/HomePage.vue`:

- Added cached computed maps for checkbox state:
  - `groupCheckedStatsMap`
  - `activityCheckedStatsMap`
  - `allFilteredCheckedStats`
- Replaced repeated template calls that recomputed `getCheckedStats(...)` many times.

This reduces repeated O(n) scans during render on large datasets.

### 2.3 Mobile foundation

In `src/views/plus/snapshot/SnapshotPage.vue`:

- Added responsive layout groundwork with media query (`max-width: 900px`).
- Sidebar turns into horizontal scroll toolbar on narrow screens.

## 3) Stability / Safety Checks

- Null-render guards: snapshot-dependent panels already use `v-if` and top-level `v-if="snapshot && rootNode"`.
- Listener cleanup: uses `useEventListener` from VueUse (auto cleanup on unmount).
- Watcher cleanup: all `watch/watchEffect` are inside component/composable scope and are auto disposed with scope.

## 4) Next Refactor Plan (recommended)

For remaining high-coupling files, apply WindowCard-style split:

1. Extract Base-only logic into composables:
   - `useSnapshotListBase` (selection, filtering, expand/collapse)
   - `useSnapshotSearchBase`
   - `useAttrPanelBase`
2. Keep Base components pure and slot-friendly:
   - expose extension slots (`toolbar-extra`, `row-extra`, `panel-footer`)
3. Plus layer only injects enhancements via:
   - slots
   - `use*Plus` composables

Goal: Plus files should avoid duplicating Base computed/watchers; only compose and inject.
