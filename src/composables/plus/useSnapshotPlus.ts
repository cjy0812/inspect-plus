import { watchEffect, onScopeDispose, shallowRef, type Ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { loadingBar } from '@/utils/discrete';
import { useSnapshotStore } from '@/views/snapshot/snapshot';

/**
 * Snapshot Plus 面板显示状态接口
 */
export interface SnapshotPlusState {
  searchShow: Ref<boolean>;
  ruleShow: Ref<boolean>;
  attrShow: Ref<boolean>;
  settingsDlgShow: Ref<boolean>;
}

export const useSnapshotPlus = () => {
  // 1. 获取官方 Store 实例
  const snapshotStore = useSnapshotStore();

  // 2. 联动加载条逻辑
  watchEffect(() => {
    if (snapshotStore.loading.value) loadingBar.start();
    else loadingBar.finish();
  });

  onScopeDispose(() => {
    loadingBar.finish();
  });

  // 3. Plus 专属持久化状态
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
    // 转发官方 Store 内容（保持扁平化以便视图直接读取）
    ...snapshotStore,
    // 注入 Plus 逻辑
    searchShow,
    ruleShow,
    attrShow,
    settingsDlgShow,
    openSettings,
    onTrackDialogClosed,
  };
};
