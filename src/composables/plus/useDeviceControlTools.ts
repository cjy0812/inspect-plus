import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import {
  mergeSubscriptionPayload,
  normalizeSubscriptionImportText,
  parseSubscriptionImportText,
  type SnapshotAppHeader,
  type SubscriptionCandidate,
} from '@/utils/plus/subscriptionImport';
import { getAppInfo } from '@/utils/node';
import { snapshotStorage } from '@/utils/snapshot';
import { useTask } from '@/utils/task';

export const useDeviceControlTools = () => {
  const { api, origin } = useDeviceApi();
  const route = useRoute();
  const deviceLink = useStorage('device_link', '');

  watchEffect(() => {
    origin.value = deviceLink.value || undefined;
  });

  const ensureDeviceConnected = () => {
    if (!origin.value) {
      message.error('未连接设备，请先在 /device 页面连接设备');
      throw new Error('未连接设备，请先在 /device 页面连接设备');
    }
  };

  const showSubsModel = shallowRef(false);
  const subsText = shallowRef('');
  const parsedCandidates = shallowRef<SubscriptionCandidate[]>([]);
  const selectedCandidateKeys = shallowRef<string[]>([]);
  const parsedFingerprint = shallowRef('');

  const candidateOptions = computed(() =>
    parsedCandidates.value.map((item) => ({
      label: item.label,
      value: item.key,
    })),
  );

  const selectAllCandidates = () => {
    selectedCandidateKeys.value = parsedCandidates.value.map(
      (item) => item.key,
    );
  };

  const clearCandidateSelection = () => {
    selectedCandidateKeys.value = [];
  };

  const invertCandidateSelection = () => {
    const selectedSet = new Set(selectedCandidateKeys.value);
    selectedCandidateKeys.value = parsedCandidates.value
      .map((item) => item.key)
      .filter((key) => !selectedSet.has(key));
  };

  watch(
    () => subsText.value,
    () => {
      parsedCandidates.value = [];
      selectedCandidateKeys.value = [];
      parsedFingerprint.value = '';
    },
  );

  const getSnapshotAppHeader = async (): Promise<SnapshotAppHeader> => {
    if (route.path.startsWith('/device')) {
      throw new Error(
        '当前在 /device 页面，无法自动补全 app 头，请在快照页面操作',
      );
    }
    if (!route.path.startsWith('/snapshot')) {
      throw new Error(
        '缺少 app 头规则：请在快照页面打开后再导入，或手动补全 app.id',
      );
    }
    const snapshotId = Number(route.params.snapshotId);
    if (!Number.isSafeInteger(snapshotId) || snapshotId <= 0) {
      throw new Error('当前快照信息无效，无法补全 app 头');
    }
    const snapshot = await snapshotStorage.getItem(snapshotId);
    if (!snapshot) {
      throw new Error('未找到当前快照数据，无法补全 app 头');
    }
    const app = getAppInfo(snapshot);
    if (!app.id) {
      throw new Error('当前快照缺少 app.id，无法补全 app 头');
    }
    return { id: app.id, name: app.name || app.id };
  };

  const parseCandidatesCore = async () => {
    try {
      const { normalizedText, candidates } = await parseSubscriptionImportText(
        subsText.value,
        getSnapshotAppHeader,
      );
      parsedCandidates.value = candidates;
      selectedCandidateKeys.value = [];
      parsedFingerprint.value = normalizedText;
      if (candidates.length > 1) {
        message.info(
          `已解析 ${candidates.length} 项，请勾选后再次点击“确认导入”`,
        );
      }
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '规则解析失败');
      return false;
    }
  };

  const parseCandidates = useTask(async () => {
    await parseCandidatesCore();
  });

  const updateSubs = useTask(async () => {
    ensureDeviceConnected();

    const normalizedText = normalizeSubscriptionImportText(subsText.value);
    if (!normalizedText) {
      message.error('请输入订阅文本');
      return;
    }

    const needParse =
      parsedFingerprint.value !== normalizedText ||
      parsedCandidates.value.length === 0;
    if (needParse) {
      const parsedOk = await parseCandidatesCore();
      if (!parsedOk) return;
      if (parsedCandidates.value.length > 1) return;
    }

    const selected = parsedCandidates.value.filter((item) =>
      selectedCandidateKeys.value.includes(item.key),
    );
    if (!selected.length) {
      message.error('请至少选择一项后再导入');
      return;
    }

    const payload = mergeSubscriptionPayload(selected);
    if (
      !payload.apps?.length &&
      !payload.globalGroups?.length &&
      !payload.categories?.length
    ) {
      message.error('没有可导入内容');
      return;
    }

    await api.updateSubscription(payload);
    message.success(`导入成功，共 ${selected.length} 项`);
    parsedCandidates.value = [];
    selectedCandidateKeys.value = [];
    parsedFingerprint.value = '';
    subsText.value = '';
  });

  const showSelectorModel = shallowRef(false);
  const actionOptions: { value?: string; label: string }[] = [
    { label: '仅查询', value: '' },
    { value: 'click', label: 'click' },
    { value: 'clickNode', label: 'clickNode' },
    { value: 'clickCenter', label: 'clickCenter' },
    { value: 'back', label: 'back' },
    { value: 'longClick', label: 'longClick' },
    { value: 'longClickNode', label: 'longClickNode' },
    { value: 'longClickCenter', label: 'longClickCenter' },
  ];
  const clickAction = shallowReactive({
    selector: '',
    action: 'click',
    quickFind: false,
  });
  const execSelector = useTask(async () => {
    ensureDeviceConnected();
    const { quickFind, ...payload } = clickAction;
    const result = await api.execSelector({
      ...payload,
      fastQuery: quickFind,
    });
    if (result.message) {
      message.success(`操作成功: ${result.message}`);
      return;
    }
    if (result.action) {
      if (result.result) {
        message.success(`操作成功: ${result.action}`);
      } else {
        message.error(`操作失败: ${result.action}`);
      }
    } else if (result.result) {
      message.success('查询成功');
    }
  });

  return {
    showSubsModel,
    subsText,
    parsedCandidates,
    selectedCandidateKeys,
    candidateOptions,
    selectAllCandidates,
    clearCandidateSelection,
    invertCandidateSelection,
    parseCandidates,
    updateSubs,
    showSelectorModel,
    actionOptions,
    clickAction,
    execSelector,
  };
};
