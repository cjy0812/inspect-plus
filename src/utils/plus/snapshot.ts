/**
 * 规范化快照基础字段，兼容缺失 appId/activityId 的历史数据。
 *
 * 注意：该函数会“原地修改”传入的 `snapshot` 对象（非纯函数）。
 * 被修改字段：
 * - `snapshot.appId`
 * - `snapshot.appInfo.id`（当 `appInfo` 存在且 `id` 为空时）
 * - `snapshot.activityId`
 *
 * @param snapshot 待规范化的快照对象（会被直接修改）
 * @returns 返回同一个已被规范化的 `snapshot` 引用
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
