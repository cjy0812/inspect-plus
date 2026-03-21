<script setup lang="ts">
import { computed, toRef } from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';
import { useDevicePlus } from '@/composables/plus/useDevicePlus';
import { getAppInfo } from '@/utils/node';

const props = defineProps<{
  snapshots: Snapshot[];
  checkedRowKeys: number[];
  refreshSnapshots: () => Promise<void>;
}>();

const emit = defineEmits<{
  'update:checkedRowKeys': [value: number[]];
}>();

const checkedRowKeysModel = computed({
  get: () => props.checkedRowKeys,
  set: (value: number[]) => emit('update:checkedRowKeys', value),
});

const {
  groupedSnapshots,
  expandedPackageNames,
  expandedActivityNames,
  checkedSet,
  snapshotViewedTime,
  batchDelete,
  previewUrlMap,
  previewLoadingMap,
  previewErrorMap,
  previewSnapshot,
  downloadSnapshotZip,
  downloadSnapshotImage,
  shareSnapshotZipUrl,
  shareSnapshotImageUrl,
  deleteSnapshot,
  ensurePreview,
  getGroupSnapshotIds,
  getActivitySnapshotIds,
  getCheckedStats,
  setCheckedByIds,
  toggleChecked,
  getItemAppName,
  getItemDeviceText,
  getItemShortTimeText,
  getItemCreateTimeText,
  getItemImportTimeText,
} = useDevicePlus({
  snapshots: toRef(props, 'snapshots'),
  checkedRowKeys: checkedRowKeysModel,
  refreshSnapshots: props.refreshSnapshots,
});
</script>

<template>
  <div class="plus-device-content">
    <div
      v-if="checkedRowKeysModel.length"
      class="plus-device-batch-bar surface-card"
    >
      <NButton
        type="error"
        size="small"
        :loading="batchDelete.loading"
        @click="batchDelete.invoke"
      >
        批量删除
      </NButton>
      <span class="plus-device-batch-text">
        已选中 {{ checkedRowKeysModel.length }} 个快照
      </span>
    </div>

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
            <NCheckbox
              :checked="getCheckedStats(getGroupSnapshotIds(group)).checked"
              :indeterminate="
                getCheckedStats(getGroupSnapshotIds(group)).indeterminate
              "
              @click.stop
              @update:checked="
                setCheckedByIds(getGroupSnapshotIds(group), $event)
              "
            />
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
                <NCheckbox
                  :checked="
                    getCheckedStats(getActivitySnapshotIds(activity)).checked
                  "
                  :indeterminate="
                    getCheckedStats(getActivitySnapshotIds(activity))
                      .indeterminate
                  "
                  @click.stop
                  @update:checked="
                    setCheckedByIds(getActivitySnapshotIds(activity), $event)
                  "
                />
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
                    : 'surface-card',
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
                          <span>
                            创建时间:
                            {{ getItemCreateTimeText(item) }}
                          </span>
                          <span class="mx-6px opacity-45">|</span>
                          <span>
                            导入时间: {{ getItemImportTimeText(item) }}
                          </span>
                        </div>
                        <div mt-2px text-12px class="opacity-70">
                          <span>设备: {{ getItemDeviceText(item) }}</span>
                          <span class="mx-6px opacity-45">|</span>
                          <span>应用ID: {{ item.appId }}</span>
                          <span class="mx-6px opacity-45">|</span>
                          <span>
                            版本代码:
                            {{ getAppInfo(item).versionCode }}
                          </span>
                          <span class="mx-6px opacity-45">|</span>
                          <span>
                            版本号:
                            {{ getAppInfo(item).versionName || 'unknown' }}
                          </span>
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
                        <NButton
                          text
                          type="error"
                          :loading="deleteSnapshot.loading[item.id]"
                          @click="deleteSnapshot.invoke(item)"
                        >
                          <template #icon><SvgIcon name="delete" /></template>
                        </NButton>
                      </span>
                    </template>
                    删除快照
                  </NTooltip>
                </div>
              </div>
            </NSpace>
          </NCollapseItem>
        </NCollapse>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped>
.plus-device-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 6px;
}

.plus-device-batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.plus-device-batch-text {
  font-size: 12px;
  opacity: 0.8;
}
</style>
