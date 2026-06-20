/**
 * 通用工具函数测试
 *
 * 验证目标：
 * - toValidURL：URL 合法性校验
 * - timeAgo：相对时间格式化
 * - toInteger：安全整数转换
 * - isIntString：整数字符串判断
 * - toFixedNumber：格式化浮点数去除尾零
 * - filterQuery：路由 query 过滤
 */
import { describe, expect, it, vi } from 'vitest';
import {
  filterQuery,
  isIntString,
  timeAgo,
  toFixedNumber,
  toInteger,
} from '@/utils/others';

vi.mock('naive-ui', () => ({
  createDiscreteApi: () => ({
    message: { success: vi.fn(), error: vi.fn() },
    dialog: { create: vi.fn() },
    loadingBar: { start: vi.fn(), finish: vi.fn() },
    modal: { create: vi.fn() },
  }),
}));

vi.mock('@/utils/discrete', () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));

describe('others utils', () => {
  // ---- toValidURL (re-exported from check.ts) ----

  describe('toValidURL', () => {
    it('returns URL for valid strings', async () => {
      const { toValidURL } = await import('@/utils/check');
      expect(toValidURL('https://example.com')).toBeInstanceOf(URL);
      expect(toValidURL('https://example.com/path?q=1#hash')).toBeInstanceOf(
        URL,
      );
    });

    it('returns undefined for invalid strings', async () => {
      const { toValidURL } = await import('@/utils/check');
      expect(toValidURL('not-a-url')).toBeUndefined();
      expect(toValidURL('')).toBeUndefined();
    });
  });

  // ---- timeAgo ----

  describe('timeAgo', () => {
    it('returns "刚刚" for less than 60 seconds ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 30_000)).toBe('刚刚');
    });

    it('returns minutes ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 5 * 60 * 1000)).toBe('5 分钟前');
    });

    it('returns hours ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 3 * 3600 * 1000)).toBe('3 小时前');
    });

    it('returns days ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 7 * 86400 * 1000)).toBe('7 天前');
    });

    it('returns months ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 3 * 30 * 86400 * 1000)).toBe('3 月前');
    });

    it('returns years ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 2 * 365 * 86400 * 1000)).toBe('2 年前');
    });
  });

  // ---- toInteger ----

  describe('toInteger', () => {
    it('returns safe integers as-is', () => {
      expect(toInteger(42)).toBe(42);
      expect(toInteger(0)).toBe(0);
      expect(toInteger(-1)).toBe(-1);
    });

    it('parses integer strings', () => {
      expect(toInteger('123')).toBe(123);
      expect(toInteger('0')).toBe(0);
    });

    it('returns undefined for non-integer strings', () => {
      expect(toInteger('abc')).toBeUndefined();
      expect(toInteger('12.5')).toBeUndefined();
      expect(toInteger('')).toBeUndefined();
    });

    it('returns undefined for unsafe integers', () => {
      expect(toInteger(Number.MAX_SAFE_INTEGER + 1)).toBeUndefined();
    });

    it('returns undefined for other types', () => {
      expect(toInteger(true)).toBeUndefined();
      expect(toInteger(null)).toBeUndefined();
      expect(toInteger(undefined)).toBeUndefined();
    });
  });

  // ---- isIntString ----

  describe('isIntString', () => {
    it('returns true for digit-only strings', () => {
      expect(isIntString('123')).toBe(true);
      expect(isIntString('0')).toBe(true);
    });

    it('returns true for numbers', () => {
      expect(isIntString(42)).toBe(true);
    });

    it('returns false for strings with non-digit characters', () => {
      expect(isIntString('12a')).toBe(false);
      expect(isIntString('-1')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isIntString(undefined)).toBe(false);
    });
  });

  // ---- toFixedNumber ----

  describe('toFixedNumber', () => {
    it('formats with specified decimal places', () => {
      expect(toFixedNumber(3.1415, 2)).toBe('3.14');
    });

    it('strips trailing zeros', () => {
      expect(toFixedNumber(1.5, 2)).toBe('1.5');
      expect(toFixedNumber(1.0, 2)).toBe('1');
    });

    it('handles integers', () => {
      expect(toFixedNumber(5, 0)).toBe('5');
    });
  });

  // ---- filterQuery ----

  describe('filterQuery', () => {
    it('keeps only specified keys', () => {
      const query = { a: '1', b: '2', c: '3' };
      expect(filterQuery(query, ['a', 'c'])).toEqual({ a: '1', c: '3' });
    });

    it('skips keys not present in query', () => {
      const query = { a: '1' };
      expect(filterQuery(query, ['a', 'b'])).toEqual({ a: '1' });
    });

    it('skips undefined values', () => {
      const query: Record<string, string | undefined> = {
        a: '1',
        b: undefined,
      };
      expect(filterQuery(query as any, ['a', 'b'])).toEqual({ a: '1' });
    });
  });
});
