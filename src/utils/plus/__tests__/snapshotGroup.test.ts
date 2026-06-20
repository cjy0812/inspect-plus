/**
 * 快照分组工具测试
 *
 * 验证目标：
 * - buildGroupedSnapshots 按 appId → activityId 二级分组
 * - 排序逻辑：包按 activity 数量降序，activity 内按快照数降序
 * - 快照按 importTime 降序排列
 * - 兼容缺失 appId / activityId 的历史数据
 */
import { describe, expect, it } from 'vitest';
import { buildGroupedSnapshots } from '@/utils/plus/snapshotGroup';

function makeSnapshot(overrides: Partial<Snapshot> & { id: number }): Snapshot {
  return {
    appId: 'com.example.app',
    activityId: '.MainActivity',
    ...overrides,
  } as Snapshot;
}

describe('snapshotGroup utils', () => {
  describe('buildGroupedSnapshots', () => {
    it('groups snapshots by appId then by activityId', () => {
      const snapshots = [
        makeSnapshot({ id: 1, appId: 'com.a', activityId: '.Act1' }),
        makeSnapshot({ id: 2, appId: 'com.a', activityId: '.Act2' }),
        makeSnapshot({ id: 3, appId: 'com.b', activityId: '.Act1' }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result).toHaveLength(2);
      const pkgA = result.find((p) => p.packageName === 'com.a')!;
      expect(pkgA.activities).toHaveLength(2);
      const pkgB = result.find((p) => p.packageName === 'com.b')!;
      expect(pkgB.activities).toHaveLength(1);
    });

    it('sorts packages by activity count descending', () => {
      const snapshots = [
        makeSnapshot({ id: 1, appId: 'com.one', activityId: '.A' }),
        makeSnapshot({ id: 2, appId: 'com.many', activityId: '.A' }),
        makeSnapshot({ id: 3, appId: 'com.many', activityId: '.B' }),
        makeSnapshot({ id: 4, appId: 'com.many', activityId: '.C' }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result[0].packageName).toBe('com.many');
      expect(result[0].activities).toHaveLength(3);
      expect(result[1].packageName).toBe('com.one');
    });

    it('sorts activities by snapshot count descending', () => {
      const snapshots = [
        makeSnapshot({ id: 1, appId: 'com.x', activityId: '.Small' }),
        makeSnapshot({ id: 2, appId: 'com.x', activityId: '.Big' }),
        makeSnapshot({ id: 3, appId: 'com.x', activityId: '.Big' }),
        makeSnapshot({ id: 4, appId: 'com.x', activityId: '.Big' }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result[0].activities[0].activityId).toBe('.Big');
      expect(result[0].activities[0].snapshots).toHaveLength(3);
      expect(result[0].activities[1].activityId).toBe('.Small');
    });

    it('sorts snapshots within activity by importTime descending', () => {
      const importTimeMap = { 1: 100, 2: 300, 3: 200 };
      const snapshots = [
        makeSnapshot({ id: 1, appId: 'com.x', activityId: '.A' }),
        makeSnapshot({ id: 2, appId: 'com.x', activityId: '.A' }),
        makeSnapshot({ id: 3, appId: 'com.x', activityId: '.A' }),
      ];
      const result = buildGroupedSnapshots(snapshots, importTimeMap);

      const ids = result[0].activities[0].snapshots.map((s) => s.id);
      expect(ids).toEqual([2, 3, 1]);
    });

    it('falls back to snapshot id when importTime is missing', () => {
      const snapshots = [
        makeSnapshot({ id: 10, appId: 'com.x', activityId: '.A' }),
        makeSnapshot({ id: 50, appId: 'com.x', activityId: '.A' }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      const ids = result[0].activities[0].snapshots.map((s) => s.id);
      expect(ids).toEqual([50, 10]);
    });

    it('handles missing appId by using (unknown)', () => {
      const snapshots = [makeSnapshot({ id: 1, appId: '', activityId: '.A' })];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result[0].packageName).toBe('(unknown)');
    });

    it('handles missing activityId by using (unknown)', () => {
      const snapshots = [
        makeSnapshot({ id: 1, appId: 'com.x', activityId: '' }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result[0].activities[0].activityId).toBe('(unknown)');
    });

    it('extracts appName from first snapshot with a name', () => {
      const snapshots = [
        makeSnapshot({
          id: 1,
          appId: 'com.x',
          activityId: '.A',
          appInfo: {
            id: 'com.x',
            name: 'MyApp',
            versionCode: 1,
            isSystem: false,
            mtime: 0,
            hidden: false,
          },
        }),
        makeSnapshot({
          id: 2,
          appId: 'com.x',
          activityId: '.B',
          appInfo: {
            id: 'com.x',
            name: '',
            versionCode: 1,
            isSystem: false,
            mtime: 0,
            hidden: false,
          },
        }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result[0].appName).toBe('MyApp');
    });

    it('falls back to packageName when no snapshot has a name', () => {
      const snapshots = [
        makeSnapshot({ id: 1, appId: 'com.x', activityId: '.A' }),
      ];
      const result = buildGroupedSnapshots(snapshots, {});

      expect(result[0].appName).toBe('com.x');
    });

    it('returns empty array for empty input', () => {
      expect(buildGroupedSnapshots([], {})).toEqual([]);
    });
  });
});
