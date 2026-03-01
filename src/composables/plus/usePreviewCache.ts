import type { ComputedRef } from 'vue';
import { onBeforeUnmount, shallowReactive, shallowRef, watch } from 'vue';

type PreviewRaw = Blob | ArrayBuffer | null;

interface UsePreviewCacheOptions {
  getScreenshot: (id: number) => Promise<PreviewRaw>;
  cacheLimit: ComputedRef<number>;
  emptyErrorText?: string;
  loadErrorText?: string;
}

export const usePreviewCache = (options: UsePreviewCacheOptions) => {
  const previewUrlMap = shallowReactive<Record<number, string>>({});
  const previewLoadingMap = shallowReactive<Record<number, boolean>>({});
  const previewErrorMap = shallowReactive<Record<number, string>>({});
  const previewOrder = shallowRef<number[]>([]);

  const clearPreviewById = (id: number) => {
    const url = previewUrlMap[id];
    if (url) {
      URL.revokeObjectURL(url);
      delete previewUrlMap[id];
    }
    delete previewErrorMap[id];
    previewLoadingMap[id] = false;
    previewOrder.value = previewOrder.value.filter((v) => v != id);
  };

  const evictOverflow = () => {
    while (previewOrder.value.length > options.cacheLimit.value) {
      const removeId = previewOrder.value[0];
      if (typeof removeId == 'number') clearPreviewById(removeId);
      else break;
    }
  };

  const clearPreviewCache = () => {
    Object.keys(previewUrlMap).forEach((id) => clearPreviewById(Number(id)));
  };

  const ensurePreview = async (id: number) => {
    if (previewUrlMap[id] || previewLoadingMap[id]) return;
    previewErrorMap[id] = '';
    previewLoadingMap[id] = true;
    try {
      const raw = await options.getScreenshot(id);
      if (!raw) {
        previewErrorMap[id] = options.emptyErrorText || '暂无预览图';
        return;
      }
      const blob =
        raw instanceof Blob
          ? raw
          : new Blob([raw as ArrayBuffer], { type: 'image/png' });
      previewUrlMap[id] = URL.createObjectURL(blob);
      previewOrder.value = [...previewOrder.value.filter((v) => v != id), id];
      evictOverflow();
    } catch {
      previewErrorMap[id] = options.loadErrorText || '预览加载失败';
    } finally {
      previewLoadingMap[id] = false;
    }
  };

  watch(
    () => options.cacheLimit.value,
    () => {
      evictOverflow();
    },
  );

  onBeforeUnmount(clearPreviewCache);

  return {
    previewUrlMap,
    previewLoadingMap,
    previewErrorMap,
    ensurePreview,
  };
};
