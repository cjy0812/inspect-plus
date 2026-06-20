/**
 * URL 工具测试 (Plus)
 *
 * 验证目标：
 * - isValidUrl：URL 合法性校验
 * - normalizeOriginText：origin 输入规范化
 * - getImportUrlByOrigin：基于指定 origin 生成导入链接
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/store/storage', () => ({
  useStorageStore: vi.fn(() => ({
    settingsStore: {
      shareCustomImportDomain: '',
      shareUseOfficialImportDomain: false,
    },
  })),
}));

describe('url utils (plus)', () => {
  describe('isValidUrl', () => {
    it('returns URL for valid http URLs', async () => {
      const { isValidUrl } = await import('@/utils/plus/url');
      expect(isValidUrl('http://example.com')).toBeInstanceOf(URL);
    });

    it('returns URL for valid https URLs', async () => {
      const { isValidUrl } = await import('@/utils/plus/url');
      expect(isValidUrl('https://example.com/path')).toBeInstanceOf(URL);
    });

    it('returns undefined for invalid strings', async () => {
      const { isValidUrl } = await import('@/utils/plus/url');
      expect(isValidUrl('not-a-url')).toBeUndefined();
    });

    it('returns undefined for empty string', async () => {
      const { isValidUrl } = await import('@/utils/plus/url');
      expect(isValidUrl('')).toBeUndefined();
    });
  });

  describe('normalizeOriginText', () => {
    it('returns origin for valid http URL', async () => {
      const { normalizeOriginText } = await import('@/utils/plus/url');
      expect(normalizeOriginText('https://example.com/path')).toBe(
        'https://example.com',
      );
    });

    it('trims whitespace', async () => {
      const { normalizeOriginText } = await import('@/utils/plus/url');
      expect(normalizeOriginText('  https://example.com  ')).toBe(
        'https://example.com',
      );
    });

    it('returns empty for non-http protocols', async () => {
      const { normalizeOriginText } = await import('@/utils/plus/url');
      expect(normalizeOriginText('ftp://example.com')).toBe('');
    });

    it('returns empty for invalid URL', async () => {
      const { normalizeOriginText } = await import('@/utils/plus/url');
      expect(normalizeOriginText('just-text')).toBe('');
    });

    it('returns empty for empty string', async () => {
      const { normalizeOriginText } = await import('@/utils/plus/url');
      expect(normalizeOriginText('')).toBe('');
    });
  });

  describe('getImportUrlByOrigin', () => {
    it('generates import URL with valid origin', async () => {
      const { getImportUrlByOrigin } = await import('@/utils/plus/url');
      expect(getImportUrlByOrigin('https://example.com', 123)).toBe(
        'https://example.com/i/123',
      );
    });

    it('returns empty for invalid origin', async () => {
      const { getImportUrlByOrigin } = await import('@/utils/plus/url');
      expect(getImportUrlByOrigin('invalid', 123)).toBe('');
    });
  });
});
