/**
 * 规范化快照基础字段，兼容缺失 appId/activityId 的历史数据。
 */
export const normalizeSnapshotMeta = (snapshot: Snapshot) => {
  const appId = snapshot.appId || snapshot.appInfo?.id || '';
  snapshot.appId = appId;
  if (snapshot.appInfo && !snapshot.appInfo.id) {
    snapshot.appInfo.id = appId;
  }
  if (!snapshot.activityId) {
    snapshot.activityId = '(unknown)';
  }
  return snapshot;
};
