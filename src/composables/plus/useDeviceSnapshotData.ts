import { computed, onMounted, shallowRef, watchEffect } from 'vue';
import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import { errorWrap } from '@/utils/error';
import { delay } from '@/utils/others';
import { useTask } from '@/utils/task';

export function useDeviceSnapshotData(): any {
  const { api, origin, serverInfo } = useDeviceApi();
  const link = useStorage('device_link', '');

  const normalizeDeviceUrl = (input: string): string | null => {
    const raw = input.trim();
    if (!raw) return null;
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
    return errorWrap(
      () => {
        const url = new URL(withProtocol);
        if (!url.port) url.port = '8888';
        return url.origin;
      },
      () => null,
    );
  };

  const connect = useTask(async () => {
    const normalized = normalizeDeviceUrl(link.value);
    if (!normalized) {
      message.error('非法设备地址');
      return;
    }
    origin.value = normalized;
    link.value = normalized;
    serverInfo.value = await api.getServerInfo();
  });

  const serverTitle = computed(() => {
    if (!serverInfo.value) return '未连接设备';
    const d = serverInfo.value.device;
    const g = serverInfo.value.gkdAppInfo;
    return `${d.manufacturer} Android${d.release} - GKD${g.versionName}`;
  });

  onMounted(async () => {
    await delay(500);
    if (normalizeDeviceUrl(link.value)) {
      connect.invoke();
    }
  });

  const snapshots = shallowRef<Snapshot[]>([]);
  const refreshSnapshots = async () => {
    if (!serverInfo.value) return;
    const result = await api.getSnapshots();
    result.sort((a, b) => b.id - a.id);
    snapshots.value = result;
  };

  watchEffect(async () => {
    if (!serverInfo.value) return;
    document.title = serverTitle.value;
    await refreshSnapshots();
  });

  return {
    api,
    origin,
    serverInfo,
    link,
    connect,
    serverTitle,
    snapshots,
    refreshSnapshots,
    normalizeDeviceUrl,
  };
}
