import { onScopeDispose, readonly, shallowRef, watch, type Ref } from 'vue';

export const useArrayBufferObjectUrl = (
  source: Ref<ArrayBuffer | undefined>,
  mimeType = 'image/png',
) => {
  const url = shallowRef<string>();

  const revoke = () => {
    if (url.value?.startsWith('blob:')) {
      URL.revokeObjectURL(url.value);
    }
    url.value = undefined;
  };

  watch(
    source,
    (value) => {
      revoke();
      if (!value) return;
      url.value = URL.createObjectURL(
        new Blob([value], {
          type: mimeType,
        }),
      );
    },
    { immediate: true },
  );

  onScopeDispose(revoke);

  return {
    url: readonly(url),
    revoke,
  };
};
