import { loadingBar } from '@/utils/discrete';
import { useSnapshotStore } from '@/views/snapshot/snapshot';

/**
 * Snapshot Plus 面板显示状态（会话级持久化）。
 */
export interface SnapshotPlusPanels {
  /** 搜索面板显示状态 */
  searchShow: Ref<boolean>;
  /** 规则测试面板显示状态 */
  ruleShow: Ref<boolean>;
  /** 属性面板显示状态 */
  attrShow: Ref<boolean>;
  /** 设置弹窗显示状态 */
  settingsDlgShow: Ref<boolean>;
}

/**
 * SnapshotPage 的 Plus 逻辑聚合：
 * - 加载条联动
 * - 面板显隐状态
 * - 轨迹弹窗关闭清理
 */
export const useSnapshotPlus = () => {
  const { snapshot, rootNode, loading, redirected, trackData, trackShow } =
    useSnapshotStore();

  watchEffect(() => {
    if (loading.value) loadingBar.start();
    else loadingBar.finish();
  });

  const searchShow = useStorage('searchShow', true, sessionStorage);
  const ruleShow = useStorage('ruleShow', false, sessionStorage);
  const attrShow = useStorage('attrShow', true, sessionStorage);
  const settingsDlgShow = shallowRef(false);

  /** 打开设置弹窗 */
  const openSettings = () => {
    settingsDlgShow.value = true;
  };

  /** 轨迹弹窗关闭后清理数据，防止残留引用 */
  const onTrackDialogClosed = () => {
    trackData.value = undefined;
  };

  return {
    snapshot,
    rootNode,
    loading,
    redirected,
    trackData,
    trackShow,
    searchShow,
    ruleShow,
    attrShow,
    settingsDlgShow,
    openSettings,
    onTrackDialogClosed,
  };
};
