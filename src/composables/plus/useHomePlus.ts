import dayjs from 'dayjs';
import { computed, shallowReactive, shallowRef, toValue, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { usePreviewCache } from '@/composables/plus/usePreviewCache';
import { getAppInfo, getDevice } from '@/utils/node';
import { filterQuery } from '@/utils/others';
import { buildGroupedSnapshots } from '@/utils/plus/snapshotGroup';
import { screenshotStorage } from '@/utils/snapshot';

interface UseHomePlusOptions {
  snapshots: MaybeRefOrGetter<Snapshot[]>;
  checkedRowKeys: Ref<number[]>;
}

export function useHomePlus(options: UseHomePlusOptions) {
  const route = useRoute();
  const router = useRouter();
  const { settingsStore, snapshotImportTime, snapshotViewedTime } =
    useStorageStore();

  const snapshotDisplayLimit = 50;
  const expandedActivitySnapshotKeys = shallowRef<string[]>([]);
  const getActivityDisplayKey = (packageName: string, activityId: string) =>
    `${packageName}::${activityId}`;
  const isActivityFullyShown = (packageName: string, activityId: string) =>
    expandedActivitySnapshotKeys.value.includes(
      getActivityDisplayKey(packageName, activityId),
    );
  const showMoreSnapshots = (packageName: string, activityId: string) => {
    const key = getActivityDisplayKey(packageName, activityId);
    if (!expandedActivitySnapshotKeys.value.includes(key)) {
      expandedActivitySnapshotKeys.value = [
        ...expandedActivitySnapshotKeys.value,
        key,
      ];
    }
  };

  const groupedSnapshots = computed(() =>
    buildGroupedSnapshots(toValue(options.snapshots), snapshotImportTime),
  );

  const getVisibleSnapshots = (
    packageName: string,
    activity: { activityId: string; snapshots: Snapshot[] },
  ) => {
    if (
      isActivityFullyShown(packageName, activity.activityId) ||
      activity.snapshots.length <= snapshotDisplayLimit
    ) {
      return activity.snapshots;
    }
    return activity.snapshots.slice(0, snapshotDisplayLimit);
  };

  const expandedPackageNames = shallowRef<(string | number)[]>([]);
  const expandedActivityNames = shallowRef<(string | number)[]>([]);
  watch(
    [groupedSnapshots, () => settingsStore.autoExpandSnapshots],
    ([groups, autoExpand]) => {
      if (!autoExpand) {
        expandedPackageNames.value = [];
        expandedActivityNames.value = [];
        return;
      }
      expandedPackageNames.value = groups.slice(0, 4).map((g) => g.packageName);
      expandedActivityNames.value = groups
        .slice(0, 4)
        .flatMap((group) =>
          group.activities
            .slice(0, 3)
            .map((activity) => `${group.packageName}::${activity.activityId}`),
        );
    },
    { immediate: true },
  );

  const checkedSet = computed(() => new Set(options.checkedRowKeys.value));
  const allFilteredSnapshotIds = computed(() =>
    toValue(options.snapshots).map((snapshot) => snapshot.id),
  );
  const getActivitySnapshotIds = (activity: { snapshots: Snapshot[] }) =>
    activity.snapshots.map((snapshot) => snapshot.id);
  const getGroupSnapshotIds = (group: {
    activities: Array<{ snapshots: Snapshot[] }>;
  }) =>
    group.activities.flatMap((activity) => getActivitySnapshotIds(activity));

  const getCheckedStats = (ids: number[]) => {
    if (!ids.length) return { checked: false, indeterminate: false };
    let checkedCount = 0;
    ids.forEach((id) => {
      if (checkedSet.value.has(id)) checkedCount++;
    });
    return {
      checked: checkedCount === ids.length,
      indeterminate: checkedCount > 0 && checkedCount < ids.length,
    };
  };

  const allFilteredCheckedStats = computed(() =>
    getCheckedStats(allFilteredSnapshotIds.value),
  );
  const groupCheckedStatsMap = computed(() => {
    const map = new Map<string, { checked: boolean; indeterminate: boolean }>();
    groupedSnapshots.value.forEach((group) => {
      map.set(group.packageName, getCheckedStats(getGroupSnapshotIds(group)));
    });
    return map;
  });
  const activityCheckedStatsMap = computed(() => {
    const map = new Map<string, { checked: boolean; indeterminate: boolean }>();
    groupedSnapshots.value.forEach((group) => {
      group.activities.forEach((activity) => {
        map.set(
          `${group.packageName}::${activity.activityId}`,
          getCheckedStats(getActivitySnapshotIds(activity)),
        );
      });
    });
    return map;
  });

  const getGroupCheckedStats = (packageName: string) =>
    groupCheckedStatsMap.value.get(packageName) ?? {
      checked: false,
      indeterminate: false,
    };
  const getActivityCheckedStats = (packageName: string, activityId: string) =>
    activityCheckedStatsMap.value.get(`${packageName}::${activityId}`) ?? {
      checked: false,
      indeterminate: false,
    };

  const setCheckedByIds = (ids: number[], checked: boolean) => {
    if (checked) {
      const next = new Set(options.checkedRowKeys.value);
      ids.forEach((id) => next.add(id));
      options.checkedRowKeys.value = [...next];
      return;
    }
    const idSet = new Set(ids);
    options.checkedRowKeys.value = options.checkedRowKeys.value.filter(
      (id) => !idSet.has(id),
    );
  };

  const toggleChecked = (id: number, checked: boolean) => {
    if (checked) {
      if (!checkedSet.value.has(id)) {
        options.checkedRowKeys.value = [...options.checkedRowKeys.value, id];
      }
      return;
    }
    options.checkedRowKeys.value = options.checkedRowKeys.value.filter(
      (key) => key !== id,
    );
  };

  const groupRemarkModal = shallowReactive({
    show: false,
    key: '',
    title: '',
    value: '',
  });
  const ensureGroupRemarks = () => {
    if (!settingsStore.groupRemarks) settingsStore.groupRemarks = {};
    return settingsStore.groupRemarks;
  };
  const getGroupRemark = (key: string) =>
    (ensureGroupRemarks()[key] || '').trim();
  const getPackageRemarkKey = (packageName: string) => `package:${packageName}`;
  const getActivityRemarkKey = (packageName: string, activityId: string) =>
    `activity:${packageName}::${activityId}`;
  const openGroupRemarkModal = (key: string, title: string) => {
    groupRemarkModal.show = true;
    groupRemarkModal.key = key;
    groupRemarkModal.title = title;
    groupRemarkModal.value = getGroupRemark(key);
  };
  const saveGroupRemark = () => {
    const key = groupRemarkModal.key;
    if (!key) return;
    const value = groupRemarkModal.value.trim();
    if (value) ensureGroupRemarks()[key] = value;
    else delete ensureGroupRemarks()[key];
    groupRemarkModal.show = false;
  };

  const previewCacheLimit = computed(() =>
    settingsStore.lowMemoryMode ? 6 : 24,
  );
  const { previewUrlMap, previewLoadingMap, previewErrorMap, ensurePreview } =
    usePreviewCache({
      getScreenshot: (id) => screenshotStorage.getItem(id),
      cacheLimit: previewCacheLimit,
    });

  const goToSnapshot = (snapshotId: number) => {
    snapshotViewedTime[snapshotId] = Date.now();
    router.push({
      name: 'snapshot',
      params: { snapshotId },
      query: filterQuery(route.query, ['str', 'gkd']),
    });
  };

  const getItemShortTimeText = (item: Snapshot) =>
    dayjs(item.id).format('MM-DD HH:mm:ss');
  const getItemCreateTimeText = (item: Snapshot) =>
    dayjs(item.id).format('YYYY-MM-DD HH:mm:ss');
  const getItemImportTimeText = (item: Snapshot) =>
    dayjs(snapshotImportTime[item.id] || item.id).format('YYYY-MM-DD HH:mm:ss');
  const getItemDeviceText = (item: Snapshot) =>
    `${getDevice(item).manufacturer} Android ${getDevice(item).release || ''}`;

  return {
    groupedSnapshots,
    lowMemoryMode: computed(() => settingsStore.lowMemoryMode),
    snapshotDisplayLimit,
    expandedPackageNames,
    expandedActivityNames,
    checkedSet,
    allFilteredSnapshotIds,
    allFilteredCheckedStats,
    groupRemarkModal,
    snapshotViewedTime,
    previewUrlMap,
    previewLoadingMap,
    previewErrorMap,
    ensurePreview,
    getVisibleSnapshots,
    showMoreSnapshots,
    isActivityFullyShown,
    getActivitySnapshotIds,
    getGroupSnapshotIds,
    getGroupCheckedStats,
    getActivityCheckedStats,
    setCheckedByIds,
    toggleChecked,
    getGroupRemark,
    getPackageRemarkKey,
    getActivityRemarkKey,
    openGroupRemarkModal,
    saveGroupRemark,
    goToSnapshot,
    getItemShortTimeText,
    getItemCreateTimeText,
    getItemImportTimeText,
    getItemDeviceText,
    getItemAppName: (item: Snapshot) => getAppInfo(item).name || item.appId,
  };
}
