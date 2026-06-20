/**
 * 快照元数据规范化测试
 *
 * 验证目标：
 * - normalizeSnapshotMeta 原地补全缺失的 appId / activityId
 * - 兼容 appInfo.id 回退
 * - 返回同一引用
 */
import { describe, expect, it } from 'vitest';
import { normalizeSnapshotMeta } from '@/utils/plus/snapshot';

describe('snapshot utils', () => {
  describe('normalizeSnapshotMeta', () => {
    it('fills appId from appInfo.id when appId is missing', () => {
      const snap = {
        id: 1,
        appId: '',
        appInfo: { id: 'com.fallback' },
        activityId: '.A',
      } as unknown as Snapshot;
      normalizeSnapshotMeta(snap);
      expect(snap.appId).toBe('com.fallback');
    });

    it('fills appInfo.id from appId when appInfo exists but has no id', () => {
      const snap = {
        id: 1,
        appId: 'com.example',
        appInfo: {},
        activityId: '.A',
      } as unknown as Snapshot;
      normalizeSnapshotMeta(snap);
      expect(snap.appInfo!.id).toBe('com.example');
    });

    it('defaults missing activityId to (unknown)', () => {
      const snap = {
        id: 1,
        appId: 'com.example',
        activityId: '',
      } as unknown as Snapshot;
      normalizeSnapshotMeta(snap);
      expect(snap.activityId).toBe('(unknown)');
    });

    it('defaults null activityId to (unknown)', () => {
      const snap = {
        id: 1,
        appId: 'com.example',
        activityId: null,
      } as unknown as Snapshot;
      normalizeSnapshotMeta(snap);
      expect(snap.activityId).toBe('(unknown)');
    });

    it('returns the same reference (mutates in-place)', () => {
      const snap = {
        id: 1,
        appId: 'com.example',
        activityId: '.A',
      } as unknown as Snapshot;
      const result = normalizeSnapshotMeta(snap);
      expect(result).toBe(snap);
    });

    it('does not overwrite existing valid fields', () => {
      const snap = {
        id: 1,
        appId: 'com.original',
        appInfo: { id: 'com.original' },
        activityId: '.Original',
      } as unknown as Snapshot;
      normalizeSnapshotMeta(snap);
      expect(snap.appId).toBe('com.original');
      expect(snap.activityId).toBe('.Original');
    });
  });
});
