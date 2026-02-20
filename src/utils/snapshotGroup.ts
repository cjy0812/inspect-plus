import { getAppInfo } from './node';

export interface SnapshotActivityGroup {
  activityId: string;
  snapshots: Snapshot[];
}

export interface SnapshotPackageGroup {
  packageName: string;
  appName: string;
  activities: SnapshotActivityGroup[];
}

export const buildGroupedSnapshots = (
  snapshots: Snapshot[],
  snapshotImportTimeMap: Record<number, number>,
): SnapshotPackageGroup[] => {
  const packageMap = new Map<string, Map<string, Snapshot[]>>();
  for (const snapshot of snapshots) {
    const packageName = snapshot.appId || snapshot.appInfo?.id || '(unknown)';
    const activityId = snapshot.activityId || '(unknown)';
    if (!packageMap.has(packageName)) {
      packageMap.set(packageName, new Map());
    }
    const activityMap = packageMap.get(packageName)!;
    const list = activityMap.get(activityId) || [];
    list.push(snapshot);
    activityMap.set(activityId, list);
  }

  return [...packageMap.entries()]
    .map(([packageName, activityMap]) => ({
      packageName,
      appName:
        [...activityMap.values()]
          .flat()
          .map((s) => getAppInfo(s).name)
          .find(Boolean) || packageName,
      activities: [...activityMap.entries()]
        .map(([activityId, items]) => ({
          activityId,
          snapshots: [...items].sort(
            (a, b) =>
              (snapshotImportTimeMap[b.id] || b.id) -
              (snapshotImportTimeMap[a.id] || a.id),
          ),
        }))
        .sort((a, b) => b.snapshots.length - a.snapshots.length),
    }))
    .sort((a, b) => b.activities.length - a.activities.length);
};
