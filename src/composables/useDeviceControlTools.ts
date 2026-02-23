import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import { errorWrap } from '@/utils/error';
import { useTask } from '@/utils/task';
import JSON5 from 'json5';

export const useDeviceControlTools = () => {
  const { api, origin } = useDeviceApi();
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
  const updateSubs = useTask(async () => {
    ensureDeviceConnected();
    const data = errorWrap(() => JSON5.parse(subsText.value.trim()));
    if (data === undefined) return;
    if (data.categories || data.globalGroups || data.apps) {
      await api.updateSubscription(data);
    } else if (typeof data.id == 'string') {
      await api.updateSubscription({ apps: [data] });
    } else if (Array.isArray(data) && typeof data[0]?.id == 'string') {
      await api.updateSubscription({ apps: data });
    } else if (typeof data.key == 'number') {
      await api.updateSubscription({ globalGroups: [data] });
    } else if (Array.isArray(data) && typeof data[0]?.key == 'number') {
      await api.updateSubscription({ globalGroups: data });
    } else {
      message.error('无法识别的订阅文本');
      return;
    }
    message.success('修改成功');
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
    const result = await api.execSelector({
      ...clickAction,
      fastQuery: clickAction.quickFind,
    });
    if (result.message) {
      message.success(`操作成功: ${result.message}`);
      return;
    }
    if (result.action) {
      message.success(
        (result.result ? '操作成功: ' : '操作失败: ') + result.action,
      );
    } else if (result.result) {
      message.success('查询成功');
    }
  });

  return {
    showSubsModel,
    subsText,
    updateSubs,
    showSelectorModel,
    actionOptions,
    clickAction,
    execSelector,
  };
};
