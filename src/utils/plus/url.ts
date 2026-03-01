import { settingsStore } from '@/store/storage';
import { getImportUrl, isValidUrl } from '@/utils/url';

/**
 * 官方快照导入页地址。
 */
export const getOfficialImportUrl = (importId: number | string) => {
  return `https://i.gkd.li/i/${importId}`;
};

/**
 * 规范化 Origin 输入，仅返回 origin 部分。
 */
export const normalizeOriginText = (originText: string) => {
  const text = originText.trim();
  if (!text) return '';
  const u = isValidUrl(text);
  return u ? u.origin : '';
};

/**
 * 使用指定 origin 生成导入页链接。
 */
export const getImportUrlByOrigin = (
  originText: string,
  importId: number | string,
) => {
  const origin = normalizeOriginText(originText);
  if (!origin) return '';
  return `${origin}/i/${importId}`;
};

/**
 * 生成自定义域名导入链接；与主链接同域时返回空字符串避免重复显示。
 */
export const getCustomDomainImportUrl = (importId: number | string) => {
  const custom = normalizeOriginText(settingsStore.shareCustomImportDomain);
  if (!custom) return '';
  const primary = settingsStore.shareUseOfficialImportDomain
    ? getOfficialImportUrl(importId)
    : getImportUrl(importId);
  if (new URL(primary).origin == custom) return '';
  return `${custom}/i/${importId}`;
};
