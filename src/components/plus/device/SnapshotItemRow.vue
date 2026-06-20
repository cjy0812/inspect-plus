<script setup lang="ts">
import { inject } from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';
import { getAppInfo } from '@/utils/node';

defineProps<{
  item: Snapshot;
}>();

// 注入父组件提供的上下文数据
const devicePlusContext = inject<any>('devicePlusContext');
const previewSnapshotProp = inject<any>('previewSnapshot');
const deleteSnapshot = inject<{
  loading: Record<number, boolean | undefined>;
  invoke: (row: Snapshot) => unknown;
}>('deleteSnapshot')!;

// 解构出单行渲染和交互所需的所有方法与状态
const {
  checkedSet,
  snapshotViewedTime,
  toggleChecked,
  ensurePreview,
  previewUrlMap,
  previewLoadingMap,
  previewErrorMap,
  downloadSnapshotZip,
  downloadSnapshotImage,
  shareSnapshotZipUrl,
  shareSnapshotImageUrl,
  getItemAppName,
  getItemDeviceText,
  getItemShortTimeText,
  getItemCreateTimeText,
  getItemImportTimeText,
} = devicePlusContext;
</script>

<template>
  <div
    class="rounded-8px border border-solid px-10px py-6px transition-colors"
    :class="[
      snapshotViewedTime[item.id] ? 'snapshot-row-viewed' : 'surface-card',
    ]"
  >
    <div flex items-start gap-10px flex-wrap>
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
            <div flex items-center gap-6px leading-18px>
              <NTag size="small" type="warning">
                {{ getItemShortTimeText(item) }}
              </NTag>
              <NTag size="small">
                {{ getItemImportTimeText(item) }}
              </NTag>
              <NTag
                v-if="snapshotViewedTime[item.id]"
                size="small"
                type="success"
              >
                已查看
              </NTag>
              <span class="truncate font-600">
                {{ getItemAppName(item) }}
              </span>
            </div>
            <div text-12px mt-2px class="font-600">
              界面ID: {{ item.activityId || '(unknown)' }}
            </div>
            <div mt-4px text-12px class="opacity-75">
              <span>创建时间: {{ getItemCreateTimeText(item) }}</span>
              <span class="mx-6px opacity-45">|</span>
              <span>导入时间: {{ getItemImportTimeText(item) }}</span>
            </div>
            <div mt-2px text-12px class="opacity-70">
              <span>设备: {{ getItemDeviceText(item) }}</span>
              <span class="mx-6px opacity-45">|</span>
              <span>应用ID: {{ item.appId }}</span>
              <span class="mx-6px opacity-45">|</span>
              <span>版本代码: {{ getAppInfo(item).versionCode }}</span>
              <span class="mx-6px opacity-45">|</span>
              <span
                >版本号: {{ getAppInfo(item).versionName || 'unknown' }}</span
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
              (previewLoadingMap[item.id] ? '预览加载中...' : '暂无预览')
            }}
          </div>
        </div>
      </NPopover>

      <NTooltip>
        <template #trigger>
          <span class="ml-auto inline-flex shrink-0">
            <NButton
              text
              size="small"
              :loading="previewSnapshotProp.loading[item.id]"
              @click="previewSnapshotProp.invoke(item)"
            >
              <template #icon><SvgIcon name="code" /></template>
            </NButton>
          </span>
        </template>
        查看
      </NTooltip>

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

      <NPopconfirm
        :disabled="deleteSnapshot.loading[item.id]"
        @positiveClick="deleteSnapshot.invoke(item)"
      >
        是否删除快照?<br />ID:{{ item.id }}
        <template #trigger>
          <NTooltip>
            <template #trigger>
              <NButton
                text
                type="error"
                :loading="deleteSnapshot.loading[item.id]"
              >
                <template #icon><SvgIcon name="delete" /></template>
              </NButton>
            </template>
            删除快照
          </NTooltip>
        </template>
      </NPopconfirm>
    </div>
  </div>
</template>
