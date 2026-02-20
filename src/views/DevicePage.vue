<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import { errorWrap } from '@/utils/error';
import { getAppInfo, getDevice } from '@/utils/node';
import { delay } from '@/utils/others';
import { screenshotStorage, snapshotStorage } from '@/utils/snapshot';
import { useBatchTask, useTask } from '@/utils/task';
import dayjs from 'dayjs';
import JSON5 from 'json5';
import pLimit from 'p-limit';

const router = useRouter();
const { api, origin, serverInfo } = useDeviceApi();
const { settingsStore, snapshotImportTime } = useStorageStore();
const link = useStorage('device_link', '');

const normalizeDeviceUrl = (input: string): string | null => {
  const raw = input.trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  const withPort = /:\d+(\/|$)/.test(withProtocol)
    ? withProtocol
    : `${withProtocol}:8888`;
  return errorWrap(
    () => new URL(withPort).origin,
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
watchEffect(async () => {
  if (!serverInfo.value) return;
  document.title = serverTitle.value;
  const result = await api.getSnapshots();
  result.sort((a, b) => b.id - a.id);
  snapshots.value = result;
  subsText.value = '';
});

const captureSnapshot = useTask(async () => {
  const snapshot = await api.captureSnapshot();
  const screenshot = await api.getScreenshot({ id: snapshot.id });
  await snapshotStorage.setItem(snapshot.id, snapshot);
  await screenshotStorage.setItem(snapshot.id, screenshot);
  message.success('捕获并保存快照成功');
  const result = await api.getSnapshots();
  result.sort((a, b) => b.id - a.id);
  snapshots.value = result;
});

const downloadAllSnapshot = useTask(async () => {
  const snapshotIds = (await api.getSnapshots()).map((s) => s.id);
  const existSnapshotIds = new Set(
    (await screenshotStorage.keys()).map((s) => parseInt(s)),
  );
  const unimportSnapshotIds = snapshotIds.filter(
    (k) => !existSnapshotIds.has(k),
  );
  if (unimportSnapshotIds.length == 0) {
    message.success('没有新记录可导入');
    return;
  }
  let okCount = 0;
  const limit = pLimit(3);
  await Promise.all(
    unimportSnapshotIds.map((snapshotId) =>
      limit(async () => {
        const [newSnapshot, newScreenshot] = await Promise.all([
          api.getSnapshot({ id: snapshotId }),
          api.getScreenshot({ id: snapshotId }),
        ] as const);
        if (!newSnapshot.nodes) return;
        await Promise.all([
          snapshotStorage.setItem(snapshotId, newSnapshot),
          screenshotStorage.setItem(snapshotId, newScreenshot),
        ]);
        okCount++;
      }),
    ),
  );
  message.success(`导入${okCount}条新记录`);
});

const previewSnapshot = useBatchTask(
  async (row: Snapshot) => {
    if (!(await snapshotStorage.hasItem(row.id))) {
      await snapshotStorage.setItem(
        row.id,
        await api.getSnapshot({ id: row.id }),
      );
    }
    if (!(await screenshotStorage.hasItem(row.id))) {
      await screenshotStorage.setItem(
        row.id,
        await api.getScreenshot({ id: row.id }),
      );
    }
    window.open(
      router.resolve({
        name: 'snapshot',
        params: { snapshotId: row.id },
      }).href,
    );
  },
  (r) => r.id,
);

const groupedSnapshots = computed(() => {
  const packageMap = new Map<string, Map<string, Snapshot[]>>();
  for (const snapshot of snapshots.value) {
    const packageName = snapshot.appId || snapshot.appInfo?.id || '(unknown)';
    const activityId = snapshot.activityId || '(unknown)';
    if (!packageMap.has(packageName)) packageMap.set(packageName, new Map());
    const activityMap = packageMap.get(packageName)!;
    const list = activityMap.get(activityId) || [];
    list.push(snapshot);
    activityMap.set(activityId, list);
  }
  return [...packageMap.entries()]
    .map(([packageName, activityMap]) => ({
      packageName,
      appName:
        [...activityMap.values()]
          .flat()
          .map((s) => getAppInfo(s).name)
          .find(Boolean) || packageName,
      activities: [...activityMap.entries()]
        .map(([activityId, items]) => ({
          activityId,
          snapshots: items.sort((a, b) => b.id - a.id),
        }))
        .sort((a, b) => b.snapshots.length - a.snapshots.length),
    }))
    .sort((a, b) => b.activities.length - a.activities.length);
});

const expandedPackageNames = shallowRef<(string | number)[]>([]);
const expandedActivityNames = shallowRef<(string | number)[]>([]);
watchEffect(() => {
  if (!settingsStore.autoExpandSnapshots) {
    expandedPackageNames.value = [];
    expandedActivityNames.value = [];
    return;
  }
  expandedPackageNames.value = groupedSnapshots.value
    .slice(0, 5)
    .map((g) => g.packageName);
  expandedActivityNames.value = groupedSnapshots.value
    .slice(0, 5)
    .flatMap((g) =>
      g.activities.slice(0, 4).map((a) => `${g.packageName}::${a.activityId}`),
    );
});

const showSubsModel = shallowRef(false);
const subsText = shallowRef('');
const updateSubs = useTask(async () => {
  const data = errorWrap(() => JSON5.parse(subsText.value.trim()));
  if (!data) return;
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
</script>

<template>
  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 84, left: 120 }"
    class="box-shadow-dim"
    :show="showSubsModel"
  >
    <NCard
      size="small"
      closable
      style="width: 90vw; max-width: 800px"
      @close="showSubsModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <span>修改内存订阅</span>
          <div flex-1 />
        </div>
      </template>
      <NInput
        v-model:value="subsText"
        :disabled="updateSubs.loading"
        type="textarea"
        class="gkd_code"
        :autosize="{ minRows: 20, maxRows: 25 }"
        placeholder="请输入订阅文本(JSON5)"
      />
      <div mt-10px flex justify-end gap-8px>
        <NButton @click="showSubsModel = false">取消</NButton>
        <NButton
          type="primary"
          :loading="updateSubs.loading"
          @click="updateSubs.invoke"
        >
          确认
        </NButton>
      </div>
    </NCard>
  </DraggableCard>
  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 120, left: 180 }"
    class="box-shadow-dim"
    :show="showSelectorModel"
  >
    <NCard
      size="small"
      closable
      style="width: 90vw; max-width: 800px"
      @close="showSelectorModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <span>执行选择器</span>
          <div flex-1 />
        </div>
      </template>
      <NInput
        v-model:value="clickAction.selector"
        :disabled="execSelector.loading"
        type="textarea"
        class="gkd_code"
        :autosize="{ minRows: 4, maxRows: 10 }"
        placeholder="请输入合法选择器"
      />
      <div h-15px />
      <NSpace>
        <NCheckbox v-model:checked="clickAction.quickFind">快速查询</NCheckbox>
      </NSpace>
      <div h-10px />
      <NSelect
        v-model:value="clickAction.action"
        :options="actionOptions"
        class="w-150px"
      />
      <div mt-10px flex justify-end gap-8px>
        <NButton @click="showSelectorModel = false">取消</NButton>
        <NButton
          type="primary"
          :loading="execSelector.loading"
          @click="execSelector.invoke"
        >
          确认
        </NButton>
      </div>
    </NCard>
  </DraggableCard>

  <div page-size flex flex-col p-10px gap-10px>
    <div flex items-center gap-24px>
      <RouterLink to="/" class="flex ml-12px" title="首页">
        <NButton text style="--n-icon-size: 24px">
          <template #icon><SvgIcon name="home" /></template>
        </NButton>
      </RouterLink>
      <NInputGroup>
        <NInput
          v-model:value="link"
          placeholder="请输入设备地址 默认端口:8888"
          class="gkd_code"
          :style="{ width: '320px' }"
          @keyup.enter="connect.invoke"
        />
        <NButton :loading="connect.loading" @click="connect.invoke"
          >刷新连接</NButton
        >
        <div
          v-if="serverInfo"
          gkd_code
          pl-16px
          whitespace-nowrap
          flex
          items-center
        >
          {{ serverTitle }}
        </div>
      </NInputGroup>
      <template v-if="serverInfo">
        <NButton
          :loading="captureSnapshot.loading"
          @click="captureSnapshot.invoke"
          >捕获快照</NButton
        >
        <NButton
          :loading="downloadAllSnapshot.loading"
          @click="downloadAllSnapshot.invoke"
          >下载所有快照</NButton
        >
        <NButton @click="showSubsModel = true">修改内存订阅</NButton>
        <NButton @click="showSelectorModel = true">执行选择器</NButton>
      </template>
    </div>

    <div class="flex-1 min-h-0 overflow-auto pr-6px">
      <div v-if="!groupedSnapshots.length" py-40px text-center opacity-70>
        暂无快照
      </div>
      <NCollapse
        v-else
        v-model:expandedNames="expandedPackageNames"
        :accordion="false"
      >
        <NCollapseItem
          v-for="group in groupedSnapshots"
          :key="group.packageName"
          :name="group.packageName"
        >
          <template #header>
            <div flex items-center gap-8px>
              <NTag type="info" size="small">包名</NTag>
              <code>{{ `${group.appName} (${group.packageName})` }}</code>
              <NTag size="small">{{ group.activities.length }} Activities</NTag>
            </div>
          </template>
          <NCollapse
            v-model:expandedNames="expandedActivityNames"
            :accordion="false"
          >
            <NCollapseItem
              v-for="activity in group.activities"
              :key="`${group.packageName}::${activity.activityId}`"
              :name="`${group.packageName}::${activity.activityId}`"
            >
              <template #header>
                <div flex items-center gap-8px>
                  <NTag type="success" size="small">Activity</NTag>
                  <code>{{ activity.activityId }}</code>
                  <NTag size="small"
                    >{{ activity.snapshots.length }} snapshots</NTag
                  >
                </div>
              </template>
              <NSpace vertical :size="6">
                <div
                  v-for="item in activity.snapshots"
                  :key="item.id"
                  class="rounded-8px border border-solid border-#efeff5 bg-white px-10px py-6px transition-colors"
                >
                  <div flex items-start gap-10px flex-wrap>
                    <div
                      class="min-w-0 inline-flex max-w-full cursor-default select-text flex-col"
                    >
                      <div text-12px opacity-70>
                        创建时间:
                        {{ dayjs(item.id).format('YYYY-MM-DD HH:mm:ss') }}
                      </div>
                      <div text-12px opacity-70>
                        导入时间:
                        {{
                          dayjs(snapshotImportTime[item.id] || item.id).format(
                            'YYYY-MM-DD HH:mm:ss',
                          )
                        }}
                      </div>
                      <div text-12px opacity-70>
                        设备:
                        {{
                          `${getDevice(item).manufacturer} Android ${getDevice(item).release || ''}`
                        }}
                      </div>
                      <div text-12px opacity-70>
                        应用名称: {{ getAppInfo(item).name }}
                      </div>
                      <div text-12px opacity-70>应用ID: {{ item.appId }}</div>
                      <div text-12px opacity-70>
                        版本代码: {{ getAppInfo(item).versionCode }}
                      </div>
                      <div text-12px opacity-70>
                        版本号: {{ getAppInfo(item).versionName || 'unknown' }}
                      </div>
                      <div text-12px opacity-70>
                        界面ID: {{ item.activityId || '(unknown)' }}
                      </div>
                    </div>
                    <NButton
                      text
                      size="small"
                      class="ml-auto shrink-0"
                      :loading="previewSnapshot.loading[item.id]"
                      @click="previewSnapshot.invoke(item)"
                    >
                      <template #icon><SvgIcon name="code" /></template>
                    </NButton>
                  </div>
                </div>
              </NSpace>
            </NCollapseItem>
          </NCollapse>
        </NCollapseItem>
      </NCollapse>
    </div>
  </div>
</template>
