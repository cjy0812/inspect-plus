import { useStorage } from '@vueuse/core';
import dayjs from 'dayjs';
import { computed, shallowRef, toValue, watch, watchEffect } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { usePreviewCache } from '@/composables/plus/usePreviewCache';
import { useDeviceApi } from '@/utils/api';
import { showTextDLg, waitShareAgree } from '@/utils/dialog';
import { dialog, message } from '@/utils/discrete';
import {
  exportSnapshotAsImage,
  exportSnapshotAsImageId,
  exportSnapshotAsImportId,
  exportSnapshotAsZip,
} from '@/utils/export';
import { getAppInfo, getDevice } from '@/utils/node';
import { buildGroupedSnapshots } from '@/utils/plus/snapshotGroup';
import { screenshotStorage, snapshotStorage } from '@/utils/snapshot';
import { useBatchTask, useTask } from '@/utils/task';
import { getImagUrl, getImportUrl } from '@/utils/url';
import {
  getCustomDomainImportUrl,
  getOfficialImportUrl,
} from '@/utils/plus/url';

interface UseDevicePlusOptions {
  snapshots: MaybeRefOrGetter<Snapshot[]>;
  checkedRowKeys: Ref<number[]>;
  refreshSnapshots: () => Promise<void>;
}

export function useDevicePlus(options: UseDevicePlusOptions) {
  type SnapshotGroup = ReturnType<typeof buildGroupedSnapshots>[number];
  type SnapshotActivity = SnapshotGroup['activities'][number];

  const router = useRouter();
  const { settingsStore, snapshotImportTime, snapshotViewedTime } =
    useStorageStore();
  const deviceLink = useStorage('device_link', '');
  const { api, origin } = useDeviceApi();

  watchEffect(() => {
    origin.value = deviceLink.value || undefined;
  });

  const groupedSnapshots = computed(() =>
    buildGroupedSnapshots(toValue(options.snapshots), snapshotImportTime),
  );

  const checkedSet = computed(() => new Set(options.checkedRowKeys.value));

  const getGroupSnapshotIds = (group: SnapshotGroup) => {
    return group.activities.flatMap((activity) =>
      activity.snapshots.map((snapshot) => snapshot.id),
    );
  };

  const getActivitySnapshotIds = (activity: SnapshotActivity) => {
    return activity.snapshots.map((snapshot) => snapshot.id);
  };

  const getCheckedStats = (ids: number[]) => {
    const checkedIds = checkedSet.value;
    const checkedCount = ids.filter((id) => checkedIds.has(id)).length;
    return {
      checked: checkedCount > 0 && checkedCount === ids.length,
      indeterminate: checkedCount > 0 && checkedCount < ids.length,
    };
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

  const ensureSnapshotStored = async (row: Snapshot) => {
    if (!(await snapshotStorage.hasItem(row.id))) {
      await snapshotStorage.setItem(
        row.id,
        await api.getSnapshot({ id: row.id }),
      );
    }
  };

  const ensureScreenshotStored = async (row: Snapshot) => {
    if (!(await screenshotStorage.hasItem(row.id))) {
      await screenshotStorage.setItem(
        row.id,
        await api.getScreenshot({ id: row.id }),
      );
    }
  };

  const ensureLocalSnapshotData = async (row: Snapshot) => {
    await Promise.all([ensureSnapshotStored(row), ensureScreenshotStored(row)]);
  };

  const getItemAppName = (item: Snapshot) =>
    getAppInfo(item).name || item.appId || '(unknown)';
  const getItemDeviceText = (item: Snapshot) =>
    `${getDevice(item).manufacturer} Android ${getDevice(item).release || ''}`;
  const getItemShortTimeText = (item: Snapshot) =>
    dayjs(item.id).format('MM-DD HH:mm:ss');
  const getItemCreateTimeText = (item: Snapshot) =>
    dayjs(item.id).format('YYYY-MM-DD HH:mm:ss');
  const getItemImportTimeText = (item: Snapshot) =>
    dayjs(snapshotImportTime[item.id] || item.id).format('YYYY-MM-DD HH:mm:ss');

  const previewCacheLimit = computed(() =>
    settingsStore.lowMemoryMode ? 6 : 24,
  );
  const { previewUrlMap, previewLoadingMap, previewErrorMap, ensurePreview } =
    usePreviewCache({
      getScreenshot: async (id) => {
        const local = await screenshotStorage.getItem(id);
        return local || (await api.getScreenshot({ id }));
      },
      cacheLimit: previewCacheLimit,
    });

  const previewSnapshot = useBatchTask(
    async (row: Snapshot) => {
      await ensureLocalSnapshotData(row);
      snapshotViewedTime[row.id] = Date.now();
      window.open(
        router.resolve({
          name: 'snapshot',
          params: { snapshotId: row.id },
        }).href,
      );
    },
    (row) => row.id,
  );

  const downloadSnapshotZip = useBatchTask(
    async (row: Snapshot) => {
      await ensureLocalSnapshotData(row);
      await exportSnapshotAsZip(row);
    },
    (row) => row.id,
  );

  const downloadSnapshotImage = useBatchTask(
    async (row: Snapshot) => {
      await ensureScreenshotStored(row);
      await exportSnapshotAsImage(row);
    },
    (row) => row.id,
  );

  const shareSnapshotZipUrl = useBatchTask(
    async (row: Snapshot) => {
      await waitShareAgree();
      await ensureLocalSnapshotData(row);
      const importId = await exportSnapshotAsImportId(row);
      showTextDLg({
        title: '分享链接',
        content: settingsStore.shareUseOfficialImportDomain
          ? getOfficialImportUrl(importId)
          : getImportUrl(importId),
        extraContent: getCustomDomainImportUrl(importId),
      });
    },
    (row) => row.id,
  );

  const shareSnapshotImageUrl = useBatchTask(
    async (row: Snapshot) => {
      await waitShareAgree();
      await ensureScreenshotStored(row);
      const imageId = await exportSnapshotAsImageId(row);
      showTextDLg({
        title: '分享链接',
        content: getImagUrl(imageId),
      });
    },
    (row) => row.id,
  );

  const deleteSnapshot = useBatchTask(
    async (row: Snapshot) => {
      await new Promise((resolve, reject) => {
        dialog.warning({
          title: '删除',
          content: '是否删除此快照？',
          negativeText: '取消',
          positiveText: '确认',
          onClose: reject,
          onEsc: reject,
          onMaskClick: reject,
          onNegativeClick: reject,
          onPositiveClick: resolve,
        });
      });

      await api.deleteSnapshot({ id: row.id });
      await snapshotStorage.removeItem(row.id);
      await screenshotStorage.removeItem(row.id);
      message.success('快照删除成功');
      await options.refreshSnapshots();
      options.checkedRowKeys.value = options.checkedRowKeys.value.filter(
        (id) => id !== row.id,
      );
    },
    (row) => row.id,
  );

  const batchDelete = useTask(async () => {
    await new Promise((resolve, reject) => {
      dialog.warning({
        title: '删除',
        content: `是否批量删除 ${options.checkedRowKeys.value.length} 个快照`,
        negativeText: '取消',
        positiveText: '确认',
        onClose: reject,
        onEsc: reject,
        onMaskClick: reject,
        onNegativeClick: reject,
        onPositiveClick: resolve,
      });
    });

    await Promise.all(
      options.checkedRowKeys.value.map((id) => api.deleteSnapshot({ id })),
    );
    await Promise.all(
      options.checkedRowKeys.value.map((id) =>
        Promise.all([
          snapshotStorage.removeItem(id),
          screenshotStorage.removeItem(id),
        ]),
      ),
    );
    message.success(`成功删除 ${options.checkedRowKeys.value.length} 个快照`);
    options.checkedRowKeys.value = [];
    await options.refreshSnapshots();
  });

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
      expandedPackageNames.value = groups
        .slice(0, 5)
        .map((group) => group.packageName);
      expandedActivityNames.value = groups
        .slice(0, 5)
        .flatMap((group) =>
          group.activities
            .slice(0, 4)
            .map((activity) => `${group.packageName}::${activity.activityId}`),
        );
    },
    { immediate: true },
  );

  return {
    groupedSnapshots,
    expandedPackageNames,
    expandedActivityNames,
    checkedSet,
    snapshotViewedTime,
    batchDelete,
    previewUrlMap,
    previewLoadingMap,
    previewErrorMap,
    previewSnapshot,
    downloadSnapshotZip,
    downloadSnapshotImage,
    shareSnapshotZipUrl,
    shareSnapshotImageUrl,
    deleteSnapshot,
    ensurePreview,
    getGroupSnapshotIds,
    getActivitySnapshotIds,
    getCheckedStats,
    setCheckedByIds,
    toggleChecked,
    getItemAppName,
    getItemDeviceText,
    getItemShortTimeText,
    getItemCreateTimeText,
    getItemImportTimeText,
  };
}
