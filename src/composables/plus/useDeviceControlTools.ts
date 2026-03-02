import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import { errorWrap } from '@/utils/error';
import {
  normalizeLooseJsonLikeText,
  tryParseJSON5Tolerant,
} from '@/utils/plus/json';
import { getAppInfo } from '@/utils/node';
import { snapshotStorage } from '@/utils/snapshot';
import { useTask } from '@/utils/task';

type SubscriptionPayload = {
  categories?: any[];
  globalGroups?: any[];
  apps?: any[];
};

type CandidateKind = 'app' | 'globalGroup' | 'category';

interface SubscriptionCandidate {
  key: string;
  label: string;
  kind: CandidateKind;
  payload: SubscriptionPayload;
}

const isObj = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v != null;

const isRuleGroup = (
  v: unknown,
): v is { key: number; name?: string; rules?: any[] } =>
  isObj(v) && typeof v.key === 'number';

const isRuleApp = (
  v: unknown,
): v is { id: string; name?: string; groups?: any[] } =>
  isObj(v) && typeof v.id === 'string';

const isSubscriptionLike = (
  v: unknown,
): v is { categories?: any[]; globalGroups?: any[]; apps?: any[] } =>
  isObj(v) &&
  (Array.isArray(v.categories) ||
    Array.isArray(v.globalGroups) ||
    Array.isArray(v.apps));

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

  watch(
    () => subsText.value,
    () => {
      parsedCandidates.value = [];
      selectedCandidateKeys.value = [];
      parsedFingerprint.value = '';
    },
  );

  const getSnapshotAppHeader = async (): Promise<{
    id: string;
    name: string;
  }> => {
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

  const buildCandidatesFromValue = async (
    data: unknown,
  ): Promise<SubscriptionCandidate[]> => {
    const candidates: SubscriptionCandidate[] = [];
    const append = (candidate: SubscriptionCandidate) =>
      candidates.push(candidate);
    const normalizeLabel = (text: unknown, fallback: string) =>
      String(text || '').trim() || fallback;

    const appendFromSubscription = (
      sub: { categories?: any[]; globalGroups?: any[]; apps?: any[] },
      prefix: string,
    ) => {
      (sub.apps || []).forEach((app: any, idx: number) => {
        if (!isRuleApp(app)) return;
        append({
          key: `${prefix}:app:${idx}:${app.id}`,
          kind: 'app',
          label: `App: ${normalizeLabel(app.name, app.id)} (${app.id})`,
          payload: { apps: [app] },
        });
      });
      (sub.globalGroups || []).forEach((group: any, idx: number) => {
        if (!isRuleGroup(group)) return;
        append({
          key: `${prefix}:group:${idx}:${group.key}`,
          kind: 'globalGroup',
          label: `GlobalGroup: ${normalizeLabel(group.name, `key=${group.key}`)}`,
          payload: { globalGroups: [group] },
        });
      });
      (sub.categories || []).forEach((category: any, idx: number) => {
        const cName = isObj(category)
          ? normalizeLabel(category.name, category.key || `#${idx + 1}`)
          : `#${idx + 1}`;
        append({
          key: `${prefix}:category:${idx}`,
          kind: 'category',
          label: `Category: ${cName}`,
          payload: { categories: [category] },
        });
      });
    };

    if (isSubscriptionLike(data)) {
      appendFromSubscription(data, 'root');
      return candidates;
    }

    if (isRuleApp(data)) {
      append({
        key: `root:app:${data.id}`,
        kind: 'app',
        label: `App: ${normalizeLabel(data.name, data.id)} (${data.id})`,
        payload: { apps: [data] },
      });
      return candidates;
    }

    if (Array.isArray(data) && data.length) {
      if (data.every((item) => isRuleApp(item))) {
        data.forEach((app) => {
          append({
            key: `root:app:${app.id}`,
            kind: 'app',
            label: `App: ${normalizeLabel(app.name, app.id)} (${app.id})`,
            payload: { apps: [app] },
          });
        });
        return candidates;
      }
      if (data.every((item) => isRuleGroup(item))) {
        const appHeader = await getSnapshotAppHeader();
        data.forEach((group) => {
          append({
            key: `root:auto-app-group:${group.key}`,
            kind: 'app',
            label: `App(auto): ${appHeader.name} / Group(${normalizeLabel(group.name, `key=${group.key}`)})`,
            payload: {
              apps: [
                {
                  id: appHeader.id,
                  name: appHeader.name,
                  groups: [group],
                },
              ],
            },
          });
        });
        return candidates;
      }
      data.forEach((item, idx) => {
        if (isSubscriptionLike(item)) {
          appendFromSubscription(item, `list-${idx}`);
          return;
        }
        if (isRuleApp(item)) {
          append({
            key: `list-${idx}:app:${item.id}`,
            kind: 'app',
            label: `App: ${normalizeLabel(item.name, item.id)} (${item.id})`,
            payload: { apps: [item] },
          });
          return;
        }
        if (isRuleGroup(item)) {
          append({
            key: `list-${idx}:group:${item.key}`,
            kind: 'globalGroup',
            label: `GlobalGroup: ${normalizeLabel(item.name, `key=${item.key}`)}`,
            payload: { globalGroups: [item] },
          });
        }
      });
      return candidates;
    }

    if (isObj(data) && Array.isArray(data.groups) && !data.id) {
      const appHeader = await getSnapshotAppHeader();
      data.groups.forEach((group: any) => {
        if (!isRuleGroup(group)) return;
        append({
          key: `root:auto-app-group:${group.key}`,
          kind: 'app',
          label: `App(auto): ${appHeader.name} / Group(${normalizeLabel(group.name, `key=${group.key}`)})`,
          payload: {
            apps: [
              {
                id: appHeader.id,
                name: appHeader.name,
                groups: [group],
              },
            ],
          },
        });
      });
      return candidates;
    }

    return candidates;
  };

  const mergePayloadFromCandidates = (candidates: SubscriptionCandidate[]) => {
    const result: SubscriptionPayload = {};
    const appMap = new Map<string, any>();
    const globalGroups: any[] = [];
    const categories: any[] = [];

    candidates.forEach((item) => {
      (item.payload.globalGroups || []).forEach((group) =>
        globalGroups.push(group),
      );
      (item.payload.categories || []).forEach((category) =>
        categories.push(category),
      );
      (item.payload.apps || []).forEach((app) => {
        if (!isRuleApp(app)) return;
        const prev = appMap.get(app.id);
        if (!prev) {
          appMap.set(app.id, {
            ...app,
            groups: Array.isArray(app.groups) ? [...app.groups] : [],
          });
          return;
        }
        const groups = Array.isArray(app.groups) ? app.groups : [];
        prev.groups.push(...groups);
      });
    });

    const apps = [...appMap.values()];
    if (apps.length) result.apps = apps;
    if (globalGroups.length) result.globalGroups = globalGroups;
    if (categories.length) result.categories = categories;
    return result;
  };

  const parseCandidatesCore = async () => {
    const normalizedText = normalizeLooseJsonLikeText(subsText.value.trim());
    const parsed = tryParseJSON5Tolerant(normalizedText);
    if (parsed.error) {
      const msg = parsed.error.message || '订阅文本解析失败';
      message.error(msg);
      return false;
    }
    const data = errorWrap(() => parsed.value);
    if (data == null) return false;
    try {
      const candidates = await buildCandidatesFromValue(data);
      if (!candidates.length) {
        message.error('无法识别的订阅文本');
        return false;
      }
      parsedCandidates.value = candidates;
      selectedCandidateKeys.value = candidates.map((item) => item.key);
      parsedFingerprint.value = normalizedText;
      if (candidates.length > 1) {
        message.info(
          `已解析 ${candidates.length} 项，请勾选后再次点击“确认导入”`,
        );
      }
      return true;
    } catch (e: any) {
      message.error(e?.message || '规则解析失败');
      return false;
    }
  };

  const parseCandidates = useTask(async () => {
    await parseCandidatesCore();
  });

  const updateSubs = useTask(async () => {
    ensureDeviceConnected();

    const normalizedText = normalizeLooseJsonLikeText(subsText.value.trim());
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

    const payload = mergePayloadFromCandidates(selected);
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
    parseCandidates,
    updateSubs,
    showSelectorModel,
    actionOptions,
    clickAction,
    execSelector,
  };
};
