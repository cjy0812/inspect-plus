import { useStorage } from '@vueuse/core';
import { loadingBar } from '@/utils/discrete';
import { useSnapshotStore } from '@/views/snapshot/snapshot';
import { useSnapshotBlur } from '@/composables/plus/useSnapshotBlur';

export interface SnapshotPlusState {
  searchShow: Ref<boolean>;
  ruleShow: Ref<boolean>;
  attrShow: Ref<boolean>;
  settingsDlgShow: Ref<boolean>;
  openSettings: () => void;
  onTrackDialogClosed: () => void;
}

export type UseSnapshotPlusResult = ReturnType<typeof useSnapshotStore> &
  ReturnType<typeof useSnapshotBlur> &
  SnapshotPlusState;

export const useSnapshotPlus = (): UseSnapshotPlusResult => {
  const snapshotStore = useSnapshotStore();
  const blurStore = useSnapshotBlur();

  watchEffect(() => {
    if (snapshotStore.loading.value) loadingBar.start();
    else loadingBar.finish();
  });

  onScopeDispose(() => {
    loadingBar.finish();
  });

  const searchShow = useStorage(
    'snapshotPlus:searchShow',
    true,
    sessionStorage,
  );
  const ruleShow = useStorage('snapshotPlus:ruleShow', false, sessionStorage);
  const attrShow = useStorage('snapshotPlus:attrShow', true, sessionStorage);
  const settingsDlgShow = shallowRef(false);

  const openSettings = () => {
    settingsDlgShow.value = true;
  };

  const onTrackDialogClosed = () => {
    snapshotStore.trackData.value = undefined;
  };

  return {
    ...snapshotStore,
    ...blurStore,
    searchShow,
    ruleShow,
    attrShow,
    settingsDlgShow,
    openSettings,
    onTrackDialogClosed,
  };
};
