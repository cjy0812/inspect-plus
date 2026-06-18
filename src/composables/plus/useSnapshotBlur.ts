import { screenshotStorage } from '@/utils/snapshot';
import { useSnapshotStore } from '@/views/snapshot/snapshot';

export const useSnapshotBlur = createSharedComposable(() => {
  const { snapshotId, screenshotUrl, updateScreenshot } = useSnapshotStore();
  const { snapshotImportId, snapshotImageId, importSnapshotId, settingsStore } =
    useStorageStore();

  const maskedScreenshotUrl = shallowRef<string>();
  const showRegenerateTip = shallowRef(false);

  const revokeMaskedScreenshotUrl = () => {
    if (maskedScreenshotUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(maskedScreenshotUrl.value);
    }
  };

  const resetBlurredScreenshot = () => {
    revokeMaskedScreenshotUrl();
    maskedScreenshotUrl.value = undefined;
    showRegenerateTip.value = false;
  };

  const invalidateShareLinks = () => {
    if (!snapshotId.value) return;
    const sid = snapshotId.value;
    Object.entries(importSnapshotId).forEach(([k, v]) => {
      if (v === sid) delete importSnapshotId[k];
    });
    if (snapshotImageId[sid]) delete snapshotImageId[sid];
    if (snapshotImportId[sid]) delete snapshotImportId[sid];
  };

  const applyBlurredScreenshot = async (url: string) => {
    revokeMaskedScreenshotUrl();
    maskedScreenshotUrl.value = url;
    if (snapshotId.value) {
      try {
        const editedBuffer = await fetch(url).then((r) => r.arrayBuffer());
        await screenshotStorage.setItem(snapshotId.value, editedBuffer);
        updateScreenshot(editedBuffer);
        resetBlurredScreenshot();
      } catch {
        // 转存失败时，保留当前遮罩预览，至少保证用户可见结果
      }
    }
    invalidateShareLinks();
    showRegenerateTip.value = true;
  };

  const dismissRegenerateTip = () => {
    showRegenerateTip.value = false;
  };

  const displayScreenshotUrl = computed(
    () => maskedScreenshotUrl.value || screenshotUrl.value,
  );

  watch(
    () => screenshotUrl.value,
    () => {
      resetBlurredScreenshot();
    },
  );

  const blurEditorShow = shallowRef(false);
  const openBlurEditor = () => {
    if (!displayScreenshotUrl.value) return;
    blurEditorShow.value = true;
  };
  const closeBlurEditor = () => {
    blurEditorShow.value = false;
  };

  const randomizeFocusColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 58;
    const lightness = 52;
    const c = (1 - Math.abs(2 * (lightness / 100) - 1)) * (saturation / 100);
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness / 100 - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (hue < 60) {
      r = c;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = c;
    } else if (hue < 180) {
      g = c;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const to255 = (v: number) => Math.round((v + m) * 255);
    settingsStore.focusNodeColor = `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
  };

  watchImmediate(
    () => snapshotId.value,
    (v) => {
      if (v && settingsStore.randomFocusNodeColorOnOpen) {
        randomizeFocusColor();
      }
    },
  );

  return {
    maskedScreenshotUrl,
    displayScreenshotUrl,
    showRegenerateTip,
    blurEditorShow,
    openBlurEditor,
    closeBlurEditor,
    applyBlurredScreenshot,
    resetBlurredScreenshot,
    dismissRegenerateTip,
  };
});
