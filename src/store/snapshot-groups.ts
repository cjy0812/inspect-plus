export const useSnapshotGroupStore = createGlobalState(() => {
  const packages = ref<PackageGroup[]>([]);
  const activeSnapshotId = ref<string | null>(null);

  function insertSnapshot(meta: SnapshotMeta) {
    let pkg = packages.value.find(
      (item) => item.packageName === meta.packageName,
    );
    if (!pkg) {
      pkg = { packageName: meta.packageName, activities: [] };
      packages.value.push(pkg);
    }

    let activity = pkg.activities.find(
      (item) => item.activityId === meta.activityId,
    );
    if (!activity) {
      activity = { activityId: meta.activityId, snapshots: [] };
      pkg.activities.push(activity);
    }

    activity.snapshots.unshift(meta);
  }

  return {
    packages,
    activeSnapshotId,
    insertSnapshot,
  };
});
