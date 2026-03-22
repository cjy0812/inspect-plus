# Architecture

Date: 2026-03-22

This document describes the current `inspect-plus` architecture and the rules
used to keep future merges from `offical` manageable.

## Goal

The repository follows a Base + Plus model:

- keep official-facing files easy to merge from `offical`
- keep Plus behavior isolated and removable
- avoid copy-paste forks of official views

The preferred shape is:

- base page: stable composition surface
- plus wrapper: glue code only
- plus composable: feature state and side effects
- plus component: isolated enhanced UI

## Layer Map

### Base Layer

Primary responsibility:

- core layout
- official behavior
- stable seams for extension

Key files:

- `src/views/home/HomePage.vue`
- `src/views/DevicePage.vue`
- `src/views/snapshot/SnapshotPage.vue`
- `src/views/snapshot/*`
- `src/store/*`
- shared utilities under `src/utils/*`

Rules:

- keep diffs small and reviewable
- prefer neutral slot / prop names
- do not push Plus-only logic deep into base templates

### Plus Wrapper Layer

Primary responsibility:

- route-level composition
- slot injection
- wiring Plus composables into base views

Key files:

- `src/views/plus/home/HomePage.vue`
- `src/views/plus/DevicePage.vue`
- `src/views/plus/snapshot/SnapshotPage.vue`
- `src/views/plus/SelectorPage.vue`
- `src/views/plus/SvgPage.vue`

Rules:

- wrappers should stay thin
- wrappers should not become second copies of base pages
- wrappers may hold small glue code only

### Plus Component Layer

Primary responsibility:

- isolated UI for enhanced behavior
- grouped rendering
- plus-only tools and indicators

Key files:

- `src/components/plus/home/HomeSnapshotGroups.vue`
- `src/components/plus/device/DeviceSnapshotGroups.vue`
- `src/components/plus/snapshot/FastQueryIndicator.vue`
- `src/components/plus/snapshot/SelectorSyntaxPreview.vue`
- `src/components/plus/snapshot/PrivacyBlurEditor.vue`
- `src/components/plus/snapshot/SelectorTestCard.vue`
- `src/components/plus/snapshot/AttrNameCell.vue`
- `src/components/plus/snapshot/AttrValueCell.vue`

### Plus Composable Layer

Primary responsibility:

- Plus-specific state
- effects and orchestration
- reusable feature helpers

Key files:

- `src/composables/plus/useHomePlus.ts`
- `src/composables/plus/useDevicePlus.ts`
- `src/composables/plus/useSnapshotPlus.ts`
- `src/composables/plus/useSearchCardPlus.ts`
- `src/composables/plus/useFastQueryIndicator.ts`
- `src/composables/plus/usePreviewCache.ts`
- `src/composables/plus/useTheme.ts`
- `src/composables/plus/useDeviceControlTools.ts`
- `src/composables/plus/useDeviceSnapshotData.ts`
- `src/composables/plus/useHomeSnapshotData.ts`
- `src/composables/plus/useWindowQuickFind.ts`
- `src/composables/plus/usesnapshot.ts`

### Plus Utility / Type Layer

Primary responsibility:

- helper functions that should not pollute the base utility layer
- declaration merging / augmentation for Plus-only types

Key files:

- `src/utils/plus/*`
- `src/types/plus/index.d.ts`

## Route Topology

End-user routes currently point to Plus entry views:

- `/` -> `src/views/plus/home/HomePage.vue`
- `/device` -> `src/views/plus/DevicePage.vue`
- `/snapshot/:snapshotId` -> `src/views/plus/snapshot/SnapshotPage.vue`
- `/selector` -> `src/views/plus/SelectorPage.vue`
- `/svg` -> `src/views/plus/SvgPage.vue`

This is acceptable only when those Plus route views remain wrappers instead of
large forks.

## Extension Seams

### Home page seams

File:

- `src/views/home/HomePage.vue`

Important slots:

- `toolbar-right`
- `content`
- `extra-modals`

`content` slot contract currently exposes:

- `checkedRowKeys`
- `setCheckedRowKeys`
- `filterSnapshots`
- `filterOption`
- `columns`
- `loading`
- `handleSorterChange`
- `updateSnapshots`

### Device page seams

File:

- `src/views/DevicePage.vue`

Important slots:

- `server-actions`
- `content`
- `extra-modals`

`server-actions` slot contract currently exposes:

- `captureSnapshot`
- `downloadAllSnapshot`
- `showSubsModel`
- `showSelectorModel`
- `openSubsModal`
- `openSelectorModal`

`content` slot contract currently exposes:

- `snapshots`
- `columns`
- `pagination`
- `handleSorterChange`
- `refreshSnapshots`

### Snapshot page seams

File:

- `src/views/snapshot/SnapshotPage.vue`

Important slots:

- `sidebar`
- `screenshot-card`
- `window-card`
- `search-card`
- `rule-card`
- `attr-card`
- `overlap-card`
- `track-dialog`
- `extra-modals`

This shell is the main seam surface for Plus snapshot UI.

## Type Augmentation

Base-friendly shared types live in:

- `src/types/global.d.ts`

Plus-only type extensions live in:

- `src/types/plus/index.d.ts`

Rules:

- do not modify official `.d.ts` files for Plus-only extensions
- use declaration merging or module augmentation under `src/types/plus/*`
- keep the base type surface close to upstream

Current Plus type extensions include:

- selector path augmentation for `@gkd-kit/selector`
- `fastQueryMeta` on search-result types
- extra settings fields on `SettingsStore`

## Conflict Minimization Rules

When adding or moving code, use this order:

1. `src/composables/plus/*`
2. `src/components/plus/*`
3. `src/utils/plus/*`
4. thin wrapper under `src/views/plus/*`
5. minimal seam patch in base view

Additional rules:

- prefer neutral names like `content`, `toolbar-right`, `extra-modals`
- avoid names such as `plus-*` in base seam APIs
- use `@/` aliases in Plus files
- if a change would duplicate a large chunk of an official file, stop and add a seam first

## High-Risk Files To Avoid Mirroring

These files are still the main merge-risk hotspots:

- `src/views/plus/snapshot/RuleCard.vue`
- `src/views/plus/snapshot/SearchCard.vue`
- `src/views/plus/snapshot/WindowCard.vue`
- `src/views/plus/snapshot/snapshot.ts`

These files should keep trending toward:

- smaller wrapper logic
- more Plus child components
- more Plus composables
- fewer copied base behaviors

## Maintenance Guide

### How to add a new Plus feature

1. Decide whether the behavior is base-compatible or Plus-only.
2. If it is Plus-only, start in `src/composables/plus/*` or `src/components/plus/*`.
3. Reuse an existing base seam if one already exists.
4. If no seam exists, add the smallest neutral seam to the base file first.
5. Wire the feature into a thin wrapper under `src/views/plus/*`.

### How to decide base vs Plus placement

Put code in the base layer when it:

- improves extensibility without knowing about Plus
- fixes a neutral null-safety or performance issue
- creates a stable slot / prop / event seam

Put code in the Plus layer when it:

- changes user experience only for Plus
- adds grouped rendering, debug tools, indicators, or editors
- depends on Plus-specific settings or helpers

### How to avoid upstream merge pain

- do not copy official views into Plus and edit them heavily
- do not duplicate computed/watch logic in base and Plus
- do not push Plus-only branches deep into official templates
- prefer seam-first refactors in separate commits
- keep documentation updated when a seam or layer boundary changes

## Current Recommendation

The next architecture payoff remains in snapshot cleanup:

1. continue shrinking `src/views/plus/snapshot/SearchCard.vue`
2. split more Plus-only logic out of `RuleCard.vue`
3. reduce `WindowCard.vue` fork debt with composables / child components

Those files are the highest-value targets for future upstream merge safety.
