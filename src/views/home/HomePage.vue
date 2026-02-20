<script setup lang="ts">
import ActionCard from '@/components/ActionCard.vue';
import { toValidURL } from '@/utils/check';
import { showTextDLg, waitShareAgree } from '@/utils/dialog';
import { dialog } from '@/utils/discrete';
import {
  batchCreateImageId,
  batchCreateZipUrl,
  batchImageDownloadZip,
  batchZipDownloadZip,
} from '@/utils/export';
import { importFromLocal, importFromNetwork } from '@/utils/import';
import { getAppInfo, getDevice } from '@/utils/node';
import { filterQuery, getDragEventFiles } from '@/utils/others';
import {
  screenshotStorage,
  shallowSnapshotStorage,
  snapshotStorage,
} from '@/utils/snapshot';
import { useTask } from '@/utils/task';
import { getImagUrl } from '@/utils/url';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const { settingsStore, snapshotImportTime, snapshotViewedTime } =
  useStorageStore();

const snapshots = shallowRef<Snapshot[]>([]);
const loading = shallowRef(true);
const updateSnapshots = async () => {
  loading.value = true;
  snapshots.value = (await shallowSnapshotStorage.getAllItems()).reverse();
  checkedRowKeys.value = [];
  loading.value = false;
};
onMounted(updateSnapshots);

const filterOption = shallowReactive({
  query: '',
  actualQuery: '',
  updateQuery: () => {
    filterOption.actualQuery = filterOption.query.trim();
    checkedRowKeys.value = [];
  },
});

const filteredSnapshots = computed(() => {
  const query = filterOption.actualQuery;
  return snapshots.value.filter((s) => {
    if (!query) return true;
    return (
      (getAppInfo(s).name || '').includes(query) ||
      (s.appId || '').includes(query) ||
      (s.appInfo?.id || '').includes(query) ||
      (s.activityId || '').includes(query)
    );
  });
});

const groupedSnapshots = computed(() => {
  const packageMap = new Map<string, Map<string, Snapshot[]>>();
  for (const snapshot of filteredSnapshots.value) {
    const packageName = snapshot.appId || snapshot.appInfo?.id || '(unknown)';
    const activityId = snapshot.activityId || '(unknown)';
    if (!packageMap.has(packageName)) {
      packageMap.set(packageName, new Map());
    }
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
          snapshots: items.sort(
            (a, b) =>
              (snapshotImportTime[b.id] || b.id) -
              (snapshotImportTime[a.id] || a.id),
          ),
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
    .slice(0, 4)
    .map((g) => g.packageName);
  expandedActivityNames.value = groupedSnapshots.value
    .slice(0, 4)
    .flatMap((g) =>
      g.activities.slice(0, 3).map((a) => `${g.packageName}::${a.activityId}`),
    );
});

const goToSnapshot = (snapshotId: number) => {
  router.push({
    name: 'snapshot',
    params: { snapshotId },
    query: filterQuery(route.query, ['str', 'gkd']),
  });
};

const importLocal = useTask(async (_files?: File[]) => {
  if (await importFromLocal(_files)) {
    await updateSnapshots();
  }
});
useEventListener(document.body, 'drop', async (e) => {
  e.preventDefault();
  await importLocal.invoke(getDragEventFiles(e));
});
useEventListener(document.body, 'dragover', (e) => e.preventDefault());

const showImportModal = shallowRef(false);
const textImportValue = shallowRef('');
const importNetwork = useTask(async () => {
  const urls = textImportValue.value
    .trim()
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => toValidURL(u));
  if (urls.length == 0) return;
  const r = await importFromNetwork(urls);
  if (!r) return;
  await updateSnapshots();
  textImportValue.value = '';
});

useEventListener(document.body, 'paste', (e) => {
  if (showImportModal.value) return;
  const target = e.target as HTMLElement;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target.className || '').includes('input')
  ) {
    return;
  }
  const dataTransfer = e.clipboardData;
  if (!dataTransfer) return;
  const text = (dataTransfer.getData('text') || '').trim();
  if (text.startsWith('https://') || text.startsWith('http://')) {
    showImportModal.value = true;
    setTimeout(() => {
      textImportValue.value = text;
    });
  }
});

const checkedRowKeys = shallowRef<number[]>([]);
const checkedSet = computed(() => new Set(checkedRowKeys.value));
const toggleChecked = (id: number, checked: boolean) => {
  if (checked) {
    if (!checkedSet.value.has(id))
      checkedRowKeys.value = [...checkedRowKeys.value, id];
  } else {
    checkedRowKeys.value = checkedRowKeys.value.filter((k) => k != id);
  }
};
const checkedSnapshots = () =>
  Promise.all(
    checkedRowKeys.value.map(
      (id) => snapshotStorage.getItem(id) as Promise<Snapshot>,
    ),
  );

const batchDelete = useTask(async () => {
  await new Promise((res, rej) => {
    dialog.warning({
      title: '删除',
      content: `是否批量删除 ${checkedRowKeys.value.length} 个快照`,
      negativeText: '取消',
      positiveText: '确认',
      onClose: rej,
      onEsc: rej,
      onMaskClick: rej,
      onNegativeClick: rej,
      onPositiveClick: res,
    });
  });
  await Promise.all(
    checkedRowKeys.value.map((k) => snapshotStorage.removeItem(k)),
  );
  await updateSnapshots();
});
const batchDownloadImage = useTask(async () => {
  await batchImageDownloadZip(await checkedSnapshots());
});
const batchDownloadZip = useTask(async () => {
  await batchZipDownloadZip(await checkedSnapshots());
});
const batchShareImageUrl = useTask(async () => {
  await waitShareAgree();
  const imageIds = await batchCreateImageId(await checkedSnapshots());
  showTextDLg({
    content: imageIds.map((s) => getImagUrl(s)).join('\n') + '\n',
  });
});
const batchShareZipUrl = useTask(async () => {
  await waitShareAgree();
  const zipUrls = await batchCreateZipUrl(await checkedSnapshots());
  showTextDLg({
    content: zipUrls.map((s) => location.origin + '/i/' + s).join('\n') + '\n',
  });
});

const settingsDlgShow = shallowRef(false);
const inputImportRef = shallowRef();

const previewUrlMap = shallowReactive<Record<number, string>>({});
const previewLoadingMap = shallowReactive<Record<number, boolean>>({});
const previewErrorMap = shallowReactive<Record<number, string>>({});
const previewOrder = shallowRef<number[]>([]);
const previewCacheLimit = computed(() =>
  settingsStore.lowMemoryMode ? 6 : 24,
);

const clearPreviewById = (id: number) => {
  const url = previewUrlMap[id];
  if (url) {
    URL.revokeObjectURL(url);
    delete previewUrlMap[id];
  }
  delete previewErrorMap[id];
  previewLoadingMap[id] = false;
  previewOrder.value = previewOrder.value.filter((v) => v != id);
};
const clearPreviewCache = () => {
  Object.keys(previewUrlMap).forEach((id) => clearPreviewById(Number(id)));
};
const ensurePreview = async (id: number) => {
  if (previewUrlMap[id] || previewLoadingMap[id]) return;
  previewErrorMap[id] = '';
  previewLoadingMap[id] = true;
  try {
    const raw = await screenshotStorage.getItem(id);
    if (!raw) {
      previewErrorMap[id] = '暂无预览图';
      return;
    }
    const blob =
      raw instanceof Blob
        ? raw
        : new Blob([raw as ArrayBuffer], { type: 'image/png' });
    previewUrlMap[id] = URL.createObjectURL(blob);
    previewOrder.value = [...previewOrder.value.filter((v) => v != id), id];
    while (previewOrder.value.length > previewCacheLimit.value) {
      const removeId = previewOrder.value[0];
      if (typeof removeId == 'number') clearPreviewById(removeId);
      else break;
    }
  } catch {
    previewErrorMap[id] = '预览加载失败';
  } finally {
    previewLoadingMap[id] = false;
  }
};
watch(
  () => settingsStore.lowMemoryMode,
  () => {
    while (previewOrder.value.length > previewCacheLimit.value) {
      const removeId = previewOrder.value[0];
      if (typeof removeId == 'number') clearPreviewById(removeId);
      else break;
    }
  },
);
onBeforeUnmount(clearPreviewCache);

const normalizeClock = (value: string) => {
  const v = value.trim();
  if (!/^\d{1,2}:\d{1,2}$/.test(v)) return null;
  const [hText, mText] = v.split(':');
  const h = Number(hText);
  const m = Number(mText);
  if (
    !Number.isInteger(h) ||
    !Number.isInteger(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
const updateDarkModeStart = () => {
  settingsStore.darkModeStart =
    normalizeClock(settingsStore.darkModeStart) || '18:00';
};
</script>

<template>
  <div flex flex-col p-10px gap-10px page-size>
    <div flex>
      <NSpace>
        <NInputGroup>
          <NInput
            v-model:value="filterOption.query"
            placeholder="请输入应用名/应用ID/界面ID"
            clearable
            class="min-w-320px"
            @keyup.enter="filterOption.updateQuery"
            @change="filterOption.updateQuery"
          />
          <NButton @click="filterOption.updateQuery">
            <template #icon><SvgIcon name="search" /></template>
          </NButton>
        </NInputGroup>
        <template v-if="checkedRowKeys.length">
          <NPopover>
            <template #trigger><NButton>批量下载</NButton></template>
            <NSpace vertical>
              <NButton
                :loading="batchDownloadZip.loading"
                @click="batchDownloadZip.invoke"
                >批量下载-快照</NButton
              >
              <NButton
                :loading="batchDownloadImage.loading"
                @click="batchDownloadImage.invoke"
                >批量下载-图片</NButton
              >
            </NSpace>
          </NPopover>
          <NPopover>
            <template #trigger><NButton>批量分享</NButton></template>
            <NSpace vertical>
              <NButton
                :loading="batchShareZipUrl.loading"
                @click="batchShareZipUrl.invoke"
                >批量生成链接-快照</NButton
              >
              <NButton
                :loading="batchShareImageUrl.loading"
                @click="batchShareImageUrl.invoke"
                >批量生成链接-图片</NButton
              >
            </NSpace>
          </NPopover>
          <NButton @click="batchDelete.invoke">批量删除</NButton>
          <div h-full flex flex-items-center>
            {{ `已选中 ${checkedRowKeys.length} 个快照` }}
          </div>
        </template>
      </NSpace>
      <div flex-1 />
      <div flex gap-24px items-center pr-8px class="[--svg-h:24px]">
        <NTooltip>
          <template #trigger>
            <NButton text @click="settingsDlgShow = true"
              ><SvgIcon name="settings"
            /></NButton>
          </template>
          设置
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <RouterLink flex to="/selector"
              ><NButton text><SvgIcon name="terminal" /></NButton
            ></RouterLink>
          </template>
          测试选择器
        </NTooltip>
        <NPopover>
          <template #trigger
            ><NButton text><SvgIcon name="import" /></NButton
          ></template>
          <NSpace vertical>
            <NButton
              :loading="importLocal.loading"
              @click="importLocal.invoke()"
              >导入本地文件</NButton
            >
            <NButton
              :loading="importNetwork.loading"
              @click="showImportModal = true"
              >导入网络文件</NButton
            >
          </NSpace>
        </NPopover>
        <NTooltip>
          <template #trigger>
            <RouterLink flex to="/device"
              ><NButton text><SvgIcon name="device" /></NButton
            ></RouterLink>
          </template>
          连接设备
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <a
              flex
              href="https://github.com/orgs/gkd-kit/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <NButton text><SvgIcon name="discussion" /></NButton>
            </a>
          </template>
          讨论交流
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <a
              flex
              href="https://github.com/gkd-kit/inspect"
              target="_blank"
              rel="noopener noreferrer"
            >
              <NButton text><SvgIcon name="github" /></NButton>
            </a>
          </template>
          Github
        </NTooltip>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden">
      <NSpin v-if="loading" class="h-full" />
      <div v-else-if="!groupedSnapshots.length" py-40px text-center opacity-70>
        未找到匹配快照
      </div>
      <div v-else class="h-full min-h-0 overflow-auto pr-6px">
        <NCollapse
          v-model:expandedNames="expandedPackageNames"
          :accordion="false"
          :displayDirective="settingsStore.lowMemoryMode ? 'if' : 'show'"
        >
          <NCollapseItem
            v-for="group in groupedSnapshots"
            :key="group.packageName"
            :name="group.packageName"
          >
            <template #header>
              <div flex items-center gap-8px>
                <NTag type="info" size="small">应用</NTag>
                <code>{{ `${group.appName} (${group.packageName})` }}</code>
                <NTag size="small">{{ group.activities.length }} 个界面</NTag>
              </div>
            </template>
            <NCollapse
              v-model:expandedNames="expandedActivityNames"
              :accordion="false"
              :displayDirective="settingsStore.lowMemoryMode ? 'if' : 'show'"
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
                      >{{ activity.snapshots.length }} 个快照</NTag
                    >
                  </div>
                </template>
                <NSpace vertical :size="6">
                  <div
                    v-for="item in activity.snapshots"
                    :key="item.id"
                    class="rounded-8px border border-solid px-10px py-8px transition-colors"
                    :class="[
                      snapshotViewedTime[item.id]
                        ? 'snapshot-row-viewed'
                        : 'bg-white border-#efeff5',
                    ]"
                  >
                    <div flex items-center gap-12px>
                      <NCheckbox
                        :checked="checkedSet.has(item.id)"
                        @update:checked="toggleChecked(item.id, $event)"
                      />
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
                            <div flex items-center gap-8px>
                              <NTag size="small" type="warning">{{
                                dayjs(item.id).format('MM-DD HH:mm:ss')
                              }}</NTag>
                              <NTag
                                v-if="snapshotViewedTime[item.id]"
                                size="small"
                                type="success"
                                >已查看</NTag
                              >
                              <span class="truncate">{{
                                getAppInfo(item).name || item.appId
                              }}</span>
                            </div>
                            <div text-12px mt-2px>
                              界面ID: {{ item.activityId || '(unknown)' }}
                            </div>
                            <div text-11px opacity-65 leading-18px>
                              <span mr-10px
                                >创建:
                                {{
                                  dayjs(item.id).format('YYYY-MM-DD HH:mm:ss')
                                }}</span
                              >
                              <span
                                >导入:
                                {{
                                  dayjs(
                                    snapshotImportTime[item.id] || item.id,
                                  ).format('YYYY-MM-DD HH:mm:ss')
                                }}</span
                              >
                            </div>
                            <div text-11px opacity-65 leading-18px>
                              <span mr-10px
                                >设备:
                                {{
                                  `${getDevice(item).manufacturer} Android ${getDevice(item).release || ''}`
                                }}</span
                              >
                              <span mr-10px>应用ID: {{ item.appId }}</span>
                              <span mr-10px
                                >版本代码:
                                {{ getAppInfo(item).versionCode }}</span
                              >
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
                          <NSpin :show="previewLoadingMap[item.id]">
                            <img
                              v-if="previewUrlMap[item.id]"
                              :src="previewUrlMap[item.id]"
                              class="h-auto w-auto max-h-320px max-w-80vw rounded-6px"
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
                          </NSpin>
                        </div>
                      </NPopover>
                      <NButton
                        quaternary
                        size="small"
                        @click="goToSnapshot(item.id)"
                        >查看</NButton
                      >
                      <ActionCard
                        :snapshot="item"
                        :showPreview="false"
                        :onDelete="updateSnapshots"
                      />
                    </div>
                  </div>
                </NSpace>
              </NCollapseItem>
            </NCollapse>
          </NCollapseItem>
        </NCollapse>
      </div>
    </div>
  </div>

  <NModal
    :show="showImportModal"
    preset="dialog"
    title="导入网络文件"
    :showIcon="false"
    positiveText="确认"
    negativeText="取消"
    style="width: 800px"
    :loading="importNetwork.loading"
    @positiveClick="importNetwork.invoke"
    @negativeClick="showImportModal = false"
    @close="showImportModal = false"
    @esc="showImportModal = false"
    @afterEnter="inputImportRef?.focus()"
    @afterLeave="textImportValue = ''"
  >
    <NInput
      ref="inputImportRef"
      :value="textImportValue"
      type="textarea"
      :placeholder="`1.支持 ZIP 文件链接\n2.支持快照分享链接\n每行一个\n空白行自动忽略\n非法链接行自动忽略`"
      :autosize="{ minRows: 8, maxRows: 16 }"
      :inputProps="{ style: 'white-space: nowrap;' }"
      @update:value="
        if (!importNetwork.loading) {
          textImportValue = $event;
        }
      "
    />
  </NModal>

  <NModal
    v-model:show="settingsDlgShow"
    preset="dialog"
    title="设置"
    :showIcon="false"
    positiveText="关闭"
    style="width: 620px"
    @positiveClick="settingsDlgShow = false"
  >
    <NCheckbox v-model:checked="settingsStore.ignoreUploadWarn"
      >关闭生成分享链接弹窗提醒</NCheckbox
    >
    <div h-1px my-10px bg="#eee" />
    <NCheckbox v-model:checked="settingsStore.ignoreWasmWarn"
      >关闭浏览器版本正则表达式 WASM(GC) 提醒</NCheckbox
    >
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px>
      <NSwitch v-model:value="settingsStore.autoUploadImport" />
      <div>打开快照页面自动生成分享链接（请确保不含隐私）</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px items-center>
      <NSwitch v-model:value="settingsStore.lowMemoryMode" />
      <div>低内存模式（限制预览缓存、减少动画、降低实时更新开销）</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px items-center>
      <NSwitch v-model:value="settingsStore.autoExpandSnapshots" />
      <div>自动展开快照</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex flex-col gap-10px>
      <div>主题模式</div>
      <NRadioGroup v-model:value="settingsStore.themeMode">
        <NSpace>
          <NRadio value="auto">自动</NRadio>
          <NRadio value="light">强制日间</NRadio>
          <NRadio value="dark">强制夜间</NRadio>
        </NSpace>
      </NRadioGroup>
      <div flex items-center gap-10px>
        <div class="w-100px">自动切换时间</div>
        <NInput
          v-model:value="settingsStore.darkModeStart"
          placeholder="18:00"
          class="w-120px"
          @blur="updateDarkModeStart"
        />
      </div>
    </div>
  </NModal>
</template>
