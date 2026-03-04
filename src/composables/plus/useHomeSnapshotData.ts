import { getAppInfo } from '@/utils/node';
import { buildGroupedSnapshots } from '@/utils/plus/snapshotGroup';
import { shallowSnapshotStorage } from '@/utils/snapshot';

export function useHomeSnapshotData(
  snapshotImportTime: Record<number, number>,
) {
  const snapshots = shallowRef<Snapshot[]>([]);
  const loading = shallowRef(true);

  const updateSnapshots = async () => {
    loading.value = true;
    snapshots.value = (await shallowSnapshotStorage.getAllItems()).reverse();
    loading.value = false;
  };

  const filterOption = shallowReactive({
    query: '',
    actualQuery: '',
    updateQuery: () => {
      filterOption.actualQuery = filterOption.query.trim();
    },
  });

  const filteredSnapshots = computed(() => {
    const query = filterOption.actualQuery;
    return snapshots.value.filter((s) => {
      if (!query) return true;
      return (
        (getAppInfo(s).name || '').includes(query) ||
        (s.appId || '').includes(query) ||
        (s.appInfo?.id || '').includes(query) ||
        (s.activityId || '').includes(query)
      );
    });
  });

  const groupedSnapshots = computed(() =>
    buildGroupedSnapshots(filteredSnapshots.value, snapshotImportTime),
  );

  onMounted(updateSnapshots);

  return {
    snapshots,
    loading,
    updateSnapshots,
    filterOption,
    filteredSnapshots,
    groupedSnapshots,
  };
}
