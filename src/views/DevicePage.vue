<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { usePreviewCache } from '@/composables/usePreviewCache';
import { showTextDLg, waitShareAgree } from '@/utils/dialog';
import { useDeviceApi } from '@/utils/api';
import { message } from '@/utils/discrete';
import { errorWrap } from '@/utils/error';
import {
  exportSnapshotAsImportId,
  exportSnapshotAsImage,
  exportSnapshotAsImageId,
  exportSnapshotAsZip,
} from '@/utils/export';
import { getAppInfo, getDevice } from '@/utils/node';
import { delay } from '@/utils/others';
import { buildGroupedSnapshots } from '@/utils/snapshotGroup';
import { screenshotStorage, snapshotStorage } from '@/utils/snapshot';
import { useBatchTask, useTask } from '@/utils/task';
import { getImagUrl } from '@/utils/url';
import dayjs from 'dayjs';
import JSON5 from 'json5';
import pLimit from 'p-limit';

const router = useRouter();
const { api, origin, serverInfo } = useDeviceApi();
const { settingsStore, snapshotImportTime, snapshotViewedTime } =
  useStorageStore();
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

const ensureSnapshotStored = async (row: Snapshot) => {
  if (!(await snapshotStorage.hasItem(row.id))) {
    await snapshotStorage.setItem(
      row.id,
      await api.getSnapshot({ id: row.id }),
    );
  }
};
const ensureScreenshotStored = async (row: Snapshot) => {
  if (!(await screenshotStorage.hasItem(row.id))) {
    await screenshotStorage.setItem(
      row.id,
      await api.getScreenshot({ id: row.id }),
    );
  }
};
const ensureLocalSnapshotData = async (row: Snapshot) => {
  await Promise.all([ensureSnapshotStored(row), ensureScreenshotStored(row)]);
};

const previewSnapshot = useBatchTask(
  async (row: Snapshot) => {
    await ensureLocalSnapshotData(row);
    snapshotViewedTime[row.id] = Date.now();
    window.open(
      router.resolve({
        name: 'snapshot',
        params: { snapshotId: row.id },
      }).href,
    );
  },
  (r) => r.id,
);

const getAutoExpandedNames = (
  groups: ReturnType<typeof buildGroupedSnapshots>,
  packageLimit = 4,
  activityLimit = 3,
) => {
  const packageNames = groups.slice(0, packageLimit).map((g) => g.packageName);
  const activityNames = groups
    .slice(0, packageLimit)
    .flatMap((g) =>
      g.activities
        .slice(0, activityLimit)
        .map((a) => `${g.packageName}::${a.activityId}`),
    );
  return { packageNames, activityNames };
};

const groupedSnapshots = computed(() => {
  return buildGroupedSnapshots(snapshots.value, snapshotImportTime);
});

const getItemAppName = (item: Snapshot) => getAppInfo(item).name || item.appId;
const getItemDeviceText = (item: Snapshot) =>
  `${getDevice(item).manufacturer} Android ${getDevice(item).release || ''}`;
const getItemImportTimeText = (item: Snapshot) =>
  dayjs(snapshotImportTime[item.id] || item.id).format('YYYY-MM-DD HH:mm:ss');

const previewCacheLimit = computed(() =>
  settingsStore.lowMemoryMode ? 6 : 24,
);
const { previewUrlMap, previewLoadingMap, previewErrorMap, ensurePreview } =
  usePreviewCache({
    getScreenshot: async (id) => {
      const local = await screenshotStorage.getItem(id);
      return local || (await api.getScreenshot({ id }));
    },
    cacheLimit: previewCacheLimit,
  });

const downloadSnapshotZip = useBatchTask(
  async (row: Snapshot) => {
    await ensureLocalSnapshotData(row);
    await exportSnapshotAsZip(row);
  },
  (r) => r.id,
);
const downloadSnapshotImage = useBatchTask(
  async (row: Snapshot) => {
    await ensureScreenshotStored(row);
    await exportSnapshotAsImage(row);
  },
  (r) => r.id,
);
const shareSnapshotZipUrl = useBatchTask(
  async (row: Snapshot) => {
    await waitShareAgree();
    await ensureLocalSnapshotData(row);
    const importId = await exportSnapshotAsImportId(row);
    showTextDLg({
      title: '分享链接',
      content: `${location.origin}/i/${importId}`,
    });
  },
  (r) => r.id,
);
const shareSnapshotImageUrl = useBatchTask(
  async (row: Snapshot) => {
    await waitShareAgree();
    await ensureScreenshotStored(row);
    const imageId = await exportSnapshotAsImageId(row);
    showTextDLg({
      title: '分享链接',
      content: getImagUrl(imageId),
    });
  },
  (r) => r.id,
);

const expandedPackageNames = shallowRef<(string | number)[]>([]);
const expandedActivityNames = shallowRef<(string | number)[]>([]);
watchEffect(() => {
  if (!settingsStore.autoExpandSnapshots) {
    expandedPackageNames.value = [];
    expandedActivityNames.value = [];
    return;
  }
  const { packageNames, activityNames } = getAutoExpandedNames(
    groupedSnapshots.value,
    5,
    4,
  );
  expandedPackageNames.value = packageNames;
  expandedActivityNames.value = activityNames;
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
                  class="rounded-8px border border-solid px-10px py-6px transition-colors"
                  :class="[
                    snapshotViewedTime[item.id]
                      ? 'snapshot-row-viewed'
                      : 'border-#efeff5 bg-white',
                  ]"
                >
                  <div flex items-start gap-10px flex-wrap>
                    <NPopover
                      trigger="hover"
                      placement="right-start"
                      :flip="true"
                      :shift="true"
                      @update:show="
                        if ($event) {
                          ensurePreview(item.id);
                        }
                      "
                    >
                      <template #trigger>
                        <div
                          class="min-w-0 inline-flex max-w-full cursor-default select-text flex-col"
                          @mouseenter="ensurePreview(item.id)"
                        >
                          <div flex items-center gap-6px leading-18px>
                            <NTag size="small" type="warning">{{
                              dayjs(item.id).format('MM-DD HH:mm:ss')
                            }}</NTag>
                            <NTag
                              v-if="snapshotViewedTime[item.id]"
                              size="small"
                              type="success"
                            >
                              已查看
                            </NTag>
                            <span class="truncate font-600">{{
                              getItemAppName(item)
                            }}</span>
                          </div>
                          <div text-12px mt-2px class="font-600">
                            界面ID: {{ item.activityId || '(unknown)' }}
                          </div>
                          <div mt-4px text-12px class="opacity-75">
                            <span
                              >创建时间:
                              {{
                                dayjs(item.id).format('YYYY-MM-DD HH:mm:ss')
                              }}</span
                            >
                            <span class="mx-6px opacity-45">|</span>
                            <span
                              >导入时间: {{ getItemImportTimeText(item) }}</span
                            >
                          </div>
                          <div mt-2px text-12px class="opacity-70">
                            <span>设备: {{ getItemDeviceText(item) }}</span>
                            <span class="mx-6px opacity-45">|</span>
                            <span>应用ID: {{ item.appId }}</span>
                            <span class="mx-6px opacity-45">|</span>
                            <span
                              >版本代码:
                              {{ getAppInfo(item).versionCode }}</span
                            >
                            <span class="mx-6px opacity-45">|</span>
                            <span
                              >版本号:
                              {{
                                getAppInfo(item).versionName || 'unknown'
                              }}</span
                            >
                          </div>
                        </div>
                      </template>
                      <div class="inline-block w-fit max-w-90vw">
                        <img
                          v-if="previewUrlMap[item.id]"
                          :src="previewUrlMap[item.id]"
                          class="block h-auto w-auto max-h-320px max-w-80vw rounded-6px"
                          alt="preview"
                        />
                        <div v-else py-20px text-center opacity-70>
                          {{
                            previewErrorMap[item.id] ||
                            (previewLoadingMap[item.id]
                              ? '预览加载中...'
                              : '暂无预览')
                          }}
                        </div>
                      </div>
                    </NPopover>
                    <NButton
                      text
                      size="small"
                      class="ml-auto shrink-0"
                      :loading="previewSnapshot.loading[item.id]"
                      @click="previewSnapshot.invoke(item)"
                    >
                      <template #icon><SvgIcon name="code" /></template>
                    </NButton>
                    <NPopover>
                      <template #trigger>
                        <NButton text>
                          <template #icon><SvgIcon name="export" /></template>
                        </NButton>
                      </template>
                      <NSpace vertical>
                        <NButton
                          :loading="downloadSnapshotZip.loading[item.id]"
                          @click="downloadSnapshotZip.invoke(item)"
                        >
                          下载-快照
                        </NButton>
                        <NButton
                          :loading="downloadSnapshotImage.loading[item.id]"
                          @click="downloadSnapshotImage.invoke(item)"
                        >
                          下载-图片
                        </NButton>
                      </NSpace>
                    </NPopover>
                    <NPopover>
                      <template #trigger>
                        <NButton text>
                          <template #icon><SvgIcon name="share" /></template>
                        </NButton>
                      </template>
                      <NSpace vertical>
                        <NButton
                          :loading="shareSnapshotZipUrl.loading[item.id]"
                          @click="shareSnapshotZipUrl.invoke(item)"
                        >
                          生成链接-快照
                        </NButton>
                        <NButton
                          :loading="shareSnapshotImageUrl.loading[item.id]"
                          @click="shareSnapshotImageUrl.invoke(item)"
                        >
                          生成链接-图片
                        </NButton>
                      </NSpace>
                    </NPopover>
                    <NTooltip>
                      <template #trigger>
                        <span class="inline-flex">
                          <NButton text disabled>
                            <template #icon><SvgIcon name="delete" /></template>
                          </NButton>
                        </span>
                      </template>
                      远端删除尚未实现
                    </NTooltip>
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
