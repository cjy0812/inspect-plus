<script setup lang="ts">
import { computed, toRef } from 'vue';
import ActionCard from '@/components/ActionCard.vue';
import DeviceControlTools from '@/components/DeviceControlTools.vue';
import SvgIcon from '@/components/SvgIcon.vue';
import { useHomePlus } from '@/composables/plus/useHomePlus';

const props = defineProps<{
  snapshots: Snapshot[];
  checkedRowKeys: number[];
  loading: boolean;
  updateSnapshots: () => Promise<void>;
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
  lowMemoryMode,
  snapshotDisplayLimit,
  expandedPackageNames,
  expandedActivityNames,
  checkedSet,
  allFilteredSnapshotIds,
  allFilteredCheckedStats,
  groupRemarkModal,
  snapshotViewedTime,
  previewUrlMap,
  previewLoadingMap,
  previewErrorMap,
  ensurePreview,
  getVisibleSnapshots,
  showMoreSnapshots,
  isActivityFullyShown,
  getActivitySnapshotIds,
  getGroupSnapshotIds,
  getGroupCheckedStats,
  getActivityCheckedStats,
  setCheckedByIds,
  toggleChecked,
  getGroupRemark,
  getPackageRemarkKey,
  getActivityRemarkKey,
  openGroupRemarkModal,
  saveGroupRemark,
  goToSnapshot,
  getItemShortTimeText,
  getItemCreateTimeText,
  getItemImportTimeText,
  getItemDeviceText,
  getItemAppName,
} = useHomePlus({
  snapshots: toRef(props, 'snapshots'),
  checkedRowKeys: checkedRowKeysModel,
});
</script>

<template>
  <div class="plus-home-content">
    <div class="plus-home-toolbar surface-card">
      <NCheckbox
        v-if="allFilteredSnapshotIds.length"
        :checked="allFilteredCheckedStats.checked"
        :indeterminate="allFilteredCheckedStats.indeterminate"
        @update:checked="setCheckedByIds(allFilteredSnapshotIds, $event)"
      >
        {{ `全选当前结果 (${allFilteredSnapshotIds.length})` }}
      </NCheckbox>
      <div class="plus-home-toolbar-spacer" />
      <DeviceControlTools icon-size="20px" />
    </div>

    <NSpin :show="loading" class="h-full">
      <div
        v-if="!loading && !groupedSnapshots.length"
        py-40px
        text-center
        opacity-70
      >
        未找到匹配快照
      </div>
      <NCollapse
        v-else
        v-model:expandedNames="expandedPackageNames"
        :accordion="false"
        :displayDirective="lowMemoryMode ? 'if' : 'show'"
      >
        <NCollapseItem
          v-for="group in groupedSnapshots"
          :key="group.packageName"
          :name="group.packageName"
        >
          <template #header>
            <div flex items-center gap-8px>
              <NCheckbox
                :checked="getGroupCheckedStats(group.packageName).checked"
                :indeterminate="
                  getGroupCheckedStats(group.packageName).indeterminate
                "
                @click.stop
                @update:checked="
                  setCheckedByIds(getGroupSnapshotIds(group), $event)
                "
              />
              <NTag type="info" size="small">应用</NTag>
              <code>{{ `${group.appName} (${group.packageName})` }}</code>
              <NTag size="small">{{ group.activities.length }} 个界面</NTag>
              <NTag
                v-if="getGroupRemark(getPackageRemarkKey(group.packageName))"
                size="small"
                class="max-w-240px"
              >
                {{ getGroupRemark(getPackageRemarkKey(group.packageName)) }}
              </NTag>
              <NButton
                text
                size="tiny"
                @click.stop="
                  openGroupRemarkModal(
                    getPackageRemarkKey(group.packageName),
                    `应用备注: ${group.packageName}`,
                  )
                "
              >
                备注
              </NButton>
            </div>
          </template>
          <NCollapse
            v-model:expandedNames="expandedActivityNames"
            :accordion="false"
            :displayDirective="lowMemoryMode ? 'if' : 'show'"
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
                      getActivityCheckedStats(
                        group.packageName,
                        activity.activityId,
                      ).checked
                    "
                    :indeterminate="
                      getActivityCheckedStats(
                        group.packageName,
                        activity.activityId,
                      ).indeterminate
                    "
                    @click.stop
                    @update:checked="
                      setCheckedByIds(getActivitySnapshotIds(activity), $event)
                    "
                  />
                  <NTag type="success" size="small">Activity</NTag>
                  <code>{{ activity.activityId }}</code>
                  <NTag size="small"
                    >{{ activity.snapshots.length }} 个快照</NTag
                  >
                  <NTag
                    v-if="
                      getGroupRemark(
                        getActivityRemarkKey(
                          group.packageName,
                          activity.activityId,
                        ),
                      )
                    "
                    size="small"
                    class="max-w-240px"
                  >
                    {{
                      getGroupRemark(
                        getActivityRemarkKey(
                          group.packageName,
                          activity.activityId,
                        ),
                      )
                    }}
                  </NTag>
                  <NButton
                    text
                    size="tiny"
                    @click.stop="
                      openGroupRemarkModal(
                        getActivityRemarkKey(
                          group.packageName,
                          activity.activityId,
                        ),
                        `界面备注: ${activity.activityId}`,
                      )
                    "
                  >
                    备注
                  </NButton>
                </div>
              </template>
              <NSpace vertical :size="6">
                <div
                  v-for="item in getVisibleSnapshots(
                    group.packageName,
                    activity,
                  )"
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
                          <div
                            text-11px
                            opacity-65
                            leading-18px
                            flex
                            flex-wrap
                            gap-x-10px
                          >
                            <span mr-10px>
                              创建:
                              {{ getItemCreateTimeText(item) }}
                            </span>
                            <span>
                              导入:
                              {{ getItemImportTimeText(item) }}
                            </span>
                          </div>
                          <div
                            text-11px
                            opacity-65
                            leading-18px
                            flex
                            flex-wrap
                            gap-x-10px
                          >
                            <span mr-10px>
                              设备:
                              {{ getItemDeviceText(item) }}
                            </span>
                            <span mr-10px>应用ID: {{ item.appId }}</span>
                            <span mr-10px>
                              版本代码:
                              {{ item.appInfo?.versionCode }}
                            </span>
                            <span>
                              版本号:
                              {{ item.appInfo?.versionName || 'unknown' }}
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
                      @click="goToSnapshot(item.id)"
                    >
                      <template #icon><SvgIcon name="code" /></template>
                    </NButton>
                    <ActionCard
                      :snapshot="item"
                      :showPreview="false"
                      :onDelete="updateSnapshots"
                    />
                  </div>
                </div>
                <div
                  v-if="
                    activity.snapshots.length > snapshotDisplayLimit &&
                    !isActivityFullyShown(
                      group.packageName,
                      activity.activityId,
                    )
                  "
                  class="text-center py-6px"
                >
                  <NButton
                    quaternary
                    size="small"
                    @click="
                      showMoreSnapshots(group.packageName, activity.activityId)
                    "
                  >
                    {{
                      `显示更多（剩余 ${activity.snapshots.length - snapshotDisplayLimit} 条）`
                    }}
                  </NButton>
                </div>
              </NSpace>
            </NCollapseItem>
          </NCollapse>
        </NCollapseItem>
      </NCollapse>
    </NSpin>

    <NModal
      :show="groupRemarkModal.show"
      preset="dialog"
      :title="groupRemarkModal.title || '分组备注'"
      :showIcon="false"
      positiveText="保存"
      negativeText="取消"
      @positiveClick="saveGroupRemark"
      @negativeClick="groupRemarkModal.show = false"
      @close="groupRemarkModal.show = false"
    >
      <NInput
        v-model:value="groupRemarkModal.value"
        type="textarea"
        maxlength="160"
        show-count
        :autosize="{ minRows: 3, maxRows: 6 }"
        placeholder="请输入备注"
      />
    </NModal>
  </div>
</template>

<style scoped>
.plus-home-content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.plus-home-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.plus-home-toolbar-spacer {
  flex: 1;
}
</style>
