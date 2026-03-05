import { useStorage } from '@vueuse/core';
import { computed, onMounted, shallowRef, watch } from 'vue';
import type { ComputedRef, ShallowRef } from 'vue';
import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import { errorWrap } from '@/utils/error';
import { delay } from '@/utils/others';
import { useTask } from '@/utils/task';

type DeviceApiContext = ReturnType<typeof useDeviceApi>;
interface UseDeviceSnapshotDataReturn {
  api: DeviceApiContext['api'];
  origin: DeviceApiContext['origin'];
  serverInfo: DeviceApiContext['serverInfo'];
  link: ReturnType<typeof useStorage<string>>;
  connect: {
    readonly loading: boolean;
    invoke: () => Promise<void>;
  };
  serverTitle: ComputedRef<string>;
  snapshots: ShallowRef<Snapshot[]>;
  refreshSnapshots: () => Promise<void>;
  normalizeDeviceUrl: (input: string) => string | null;
}

export function useDeviceSnapshotData(): UseDeviceSnapshotDataReturn {
  const { api, origin, serverInfo } = useDeviceApi();
  const link = useStorage('device_link', '');
  const snapshots = shallowRef<Snapshot[]>([]);

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
    latestSnapshotRun++;
    serverInfo.value = undefined as any;
    snapshots.value = [];
    try {
      serverInfo.value = await api.getServerInfo();
    } catch (e: any) {
      serverInfo.value = undefined as any;
      snapshots.value = [];
      message.error(e?.message || '连接设备失败');
      throw e;
    }
  });

  const serverTitle = computed(() => {
    if (!serverInfo.value) return '未连接设备';
    const d = serverInfo.value.device;
    const g = serverInfo.value.gkdAppInfo;
    return `${d.manufacturer} Android${d.release} - GKD${g?.versionName ?? '未知版本'}`;
  });

  onMounted(async () => {
    await delay(500);
    if (normalizeDeviceUrl(link.value)) {
      connect.invoke();
    }
  });

  let latestSnapshotRun = 0;
  const refreshSnapshots = async () => {
    const runId = ++latestSnapshotRun;
    if (!serverInfo.value) return;
    const result = await api.getSnapshots();
    result.sort((a, b) => b.id - a.id);
    if (runId !== latestSnapshotRun) return;
    snapshots.value = result;
  };

  let currentRun = 0;
  watch(
    serverInfo,
    async (value, _oldValue, onInvalidate) => {
      const run = ++currentRun;
      let cancelled = false;
      onInvalidate(() => {
        cancelled = true;
      });
      document.title = serverTitle.value;
      if (!value) {
        latestSnapshotRun++;
        snapshots.value = [];
        return;
      }
      await refreshSnapshots();
      if (cancelled || run !== currentRun) return;
    },
    { immediate: true },
  );

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
