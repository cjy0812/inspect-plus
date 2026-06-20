/**
 * 时钟工具测试 — 暗色模式时间窗口计算
 *
 * 验证目标：
 * - parseClock / normalizeClock / formatClock 的解析与格式化互逆性
 * - isInDarkRange 对同日、跨日、全天暗色窗口的边界判定
 */
import { describe, expect, it } from 'vitest';
import {
  formatClock,
  isInDarkRange,
  normalizeClock,
  parseClock,
} from '@/utils/plus/clock';

describe('clock utils', () => {
  // ---- parseClock ----

  describe('parseClock', () => {
    it('parses valid HH:MM strings', () => {
      expect(parseClock('00:00')).toBe(0);
      expect(parseClock('12:30')).toBe(750);
      expect(parseClock('23:59')).toBe(1439);
    });

    it('returns null for null / undefined / empty', () => {
      expect(parseClock(null)).toBeNull();
      expect(parseClock(undefined)).toBeNull();
      expect(parseClock('')).toBeNull();
    });

    it('returns null for out-of-range values', () => {
      expect(parseClock('24:00')).toBeNull();
      expect(parseClock('12:60')).toBeNull();
      expect(parseClock('-1:30')).toBeNull();
    });

    it('returns null for non-integer components', () => {
      expect(parseClock('ab:cd')).toBeNull();
      expect(parseClock('12:5x')).toBeNull();
    });
  });

  // ---- normalizeClock ----

  describe('normalizeClock', () => {
    it('trims whitespace before parsing', () => {
      expect(normalizeClock('  08:30  ')).toBe(510);
    });

    it('returns null for whitespace-only input', () => {
      expect(normalizeClock('   ')).toBeNull();
    });
  });

  // ---- formatClock ----

  describe('formatClock', () => {
    it('zero-pads hours and minutes', () => {
      expect(formatClock(0)).toBe('00:00');
      expect(formatClock(510)).toBe('08:30');
      expect(formatClock(1439)).toBe('23:59');
    });

    it('is the inverse of parseClock for valid times', () => {
      const times = ['00:00', '06:30', '12:00', '18:45', '23:59'];
      for (const t of times) {
        expect(formatClock(parseClock(t)!)).toBe(t);
      }
    });
  });

  // ---- isInDarkRange ----

  describe('isInDarkRange', () => {
    it('treats equal start/end as full-day dark', () => {
      expect(isInDarkRange(0, 480, 480)).toBe(true);
      expect(isInDarkRange(500, 480, 480)).toBe(true);
    });

    it('detects same-day range (start < end)', () => {
      // 08:00–20:00
      expect(isInDarkRange(479, 480, 1200)).toBe(false);
      expect(isInDarkRange(480, 480, 1200)).toBe(true);
      expect(isInDarkRange(1199, 480, 1200)).toBe(true);
      expect(isInDarkRange(1200, 480, 1200)).toBe(false);
    });

    it('detects cross-midnight range (start > end)', () => {
      // 22:00–06:00 → 1320–360
      expect(isInDarkRange(1319, 1320, 360)).toBe(false);
      expect(isInDarkRange(1320, 1320, 360)).toBe(true);
      expect(isInDarkRange(0, 1320, 360)).toBe(true);
      expect(isInDarkRange(359, 1320, 360)).toBe(true);
      expect(isInDarkRange(360, 1320, 360)).toBe(false);
      expect(isInDarkRange(720, 1320, 360)).toBe(false);
    });
  });
});
