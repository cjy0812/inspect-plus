<script setup lang="tsx">
// ... 保持 import 不变 ...
import ActionCard from '@/components/ActionCard.vue';
import GapList from '@/components/GapList';
import { useSnapshotWindowCard } from '@/composables/useSnapshotWindowCard';
import { message } from '@/utils/discrete';
import { copy, delay } from '@/utils/others';
import type { ShallowRef, VNode } from 'vue';
import { useSnapshotStore } from './snapshot';

const slots = defineSlots<{
  renderLabel?: (props: {
    option: RawNode;
    label: string | VNode;
  }) => VNode | string;
}>();

const router = useRouter();
const snapshotStore = useSnapshotStore();
const { updateFocusNode, focusNode, focusTime } = snapshotStore;
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;

const treeContainer = useTemplateRef('treeContainerRef');
const {
  expandedKeys,
  selectedKeys,
  treeRef,
  rootTreeData,
  treeFilter,
  treeNodeProps,
  createRenderLabel,
  app,
  deviceName,
  activityId,
  gkdVersionName,
  appVersionCodeText,
} = useSnapshotWindowCard({
  snapshot,
  rootNode,
  focusNode,
  focusTime,
  updateFocusNode,
  treeContainer,
});

const renderLabel = createRenderLabel(
  ({ option, label }) => slots.renderLabel?.({ option, label }) ?? label,
);

const onDelete = async () => {
  message.success(`删除成功,即将回到首页`);
  await delay(2000);
  router.replace({ path: `/` });
};
</script>

<template>
  <div v-if="snapshot" flex flex-col overflow-hidden>
    <div flex items-center px-8px>
      <GapList class="flex flex-wrap items-center gap-8px gkd_code">
        <template #gap>
          <div w-1px bg-gray h-12px />
        </template>
        <NTooltip>
          <template #trigger>
            <div @click="copy(deviceName)">
              {{ deviceName }}
            </div>
          </template>
          设备名称
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div :class="{ 'opacity-50': !gkdVersionName }">
              {{ gkdVersionName || 'null' }}
            </div>
          </template>
          GKD 版本
        </NTooltip>

        <div flex items-center gap-2px max-w-120px>
          <NTooltip v-if="app?.isSystem">
            <template #trigger>
              <SvgIcon
                name="system"
                style="--svg-h: 16px; --svg-w: 16px"
                class="text-yellow-600"
              />
            </template>
            {{ `${app.name} 是一个系统应用` }}
          </NTooltip>

          <NTooltip>
            <template #trigger>
              <div @click="copy(app?.name || '')">
                {{ app?.name || '-' }}
              </div>
            </template>
            应用名称
          </NTooltip>
        </div>

        <NTooltip>
          <template #trigger>
            <div @click="copy(app?.versionName || '')">
              {{ app?.versionName || '-' }}
            </div>
          </template>
          版本名称
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div @click="copy(appVersionCodeText)">
              {{ appVersionCodeText || '-' }}
            </div>
          </template>
          版本代码
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div @click="copy(snapshot.appId)">
              {{ snapshot.appId }}
            </div>
          </template>
          应用ID
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div
              :class="{ 'opacity-50': !activityId }"
              @click="copy(activityId)"
            >
              {{ activityId || 'null' }}
            </div>
          </template>
          界面ID
        </NTooltip>
      </GapList>

      <div flex-1 />
      <ActionCard
        class="ml-8px"
        :snapshot="snapshot"
        :showPreview="false"
        @delete="onDelete"
      />
    </div>

    <div h-1px mt-4px bg="#efeff5" />
    <div ref="treeContainerRef" flex-1 min-h-0>
      <NTree
        v-if="rootNode"
        ref="treeRef"
        v-model:expandedKeys="expandedKeys"
        v-model:selectedKeys="selectedKeys"
        class="h-full"
        virtualScroll
        showLine
        blockLine
        keyField="id"
        :data="rootTreeData"
        :filter="treeFilter"
        :nodeProps="treeNodeProps"
        :renderLabel="renderLabel"
      />
    </div>
  </div>
  <div v-else flex-1 flex items-center justify-center>
    <NEmpty description="加载中..." />
  </div>
</template>
