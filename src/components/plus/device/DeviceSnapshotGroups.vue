<script setup lang="ts">
import { computed, provide, toRef } from 'vue';
import {
  deleteSnapshotKey,
  devicePlusKey,
  previewSnapshotKey,
  type SnapshotAction,
} from '@/composables/plus/useDevicePlus';
import { useDevicePlus } from '@/composables/plus/useDevicePlus';
import SnapshotItemRow from './SnapshotItemRow.vue';

const props = defineProps<{
  snapshots: Snapshot[];
  checkedRowKeys: number[];
  refreshSnapshots: () => Promise<void>;
  previewSnapshot: SnapshotAction;
  deleteSnapshot: SnapshotAction;
}>();

const emit = defineEmits<{
  'update:checkedRowKeys': [value: number[]];
}>();

const checkedRowKeysModel = computed({
  get: () => props.checkedRowKeys,
  set: (value: number[]) => emit('update:checkedRowKeys', value),
});

const devicePlusContext = useDevicePlus({
  snapshots: toRef(props, 'snapshots'),
  checkedRowKeys: checkedRowKeysModel,
  refreshSnapshots: props.refreshSnapshots,
});

provide(devicePlusKey, devicePlusContext);
provide(previewSnapshotKey, props.previewSnapshot);
provide(deleteSnapshotKey, props.deleteSnapshot);

// 解构出主组件 Template 渲染需要的状态和方法
const {
  groupedSnapshots,
  expandedPackageNames,
  expandedActivityNames,
  batchDelete,
  getGroupSnapshotIds,
  getActivitySnapshotIds,
  getCheckedStats,
  setCheckedByIds,
} = devicePlusContext;
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
              <SnapshotItemRow
                v-for="item in activity.snapshots"
                :key="item.id"
                :item="item"
              />
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
