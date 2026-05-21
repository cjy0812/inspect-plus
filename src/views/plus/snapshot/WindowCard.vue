<script setup lang="tsx">
import ActionCard from '@/components/ActionCard.vue';
import GapList from '@/components/GapList';
import { useSnapshotWindowCard } from '@/composables/useSnapshotWindowCard';
import { message } from '@/utils/discrete';
import { copy, delay } from '@/utils/others';
import type { ShallowRef } from 'vue';
import { h } from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';
import { useWindowQuickFind } from '@/composables/plus/useWindowQuickFind';
import { useSnapshotStore } from './snapshot';

const router = useRouter();

const snapshotStore = useSnapshotStore();
const { updateFocusNode, focusNode, focusTime } = snapshotStore;
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;
const { getNodeQuickFindMeta } = useWindowQuickFind(rootNode);

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
  isSystem,
} = useSnapshotWindowCard({
  snapshot,
  rootNode,
  focusNode,
  focusTime,
  updateFocusNode,
});

const renderLabel = createRenderLabel(({ option: rawNode, label }) => {
  const meta = getNodeQuickFindMeta(rawNode);
  if (!meta?.has) {
    return label;
  }
  const labelNode = h(
    'span',
    {
      style: meta.self
        ? // 在部分字体下 700 不明显，这里用轻微描边增强“加粗可见性”
          'font-weight:700 !important;text-shadow:0.2px 0 currentColor,-0.2px 0 currentColor;'
        : undefined,
    },
    label,
  );
  return h(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
      },
    },
    [
      labelNode,
      h(SvgIcon, {
        name: 'ok',
        class: 'quickfind-icon',
        style: {
          marginLeft: '4px',
          width: '14px',
          height: '14px',
          opacity: meta.self ? '1' : '0.4',
        },
      }),
    ],
  );
});

const onDelete = async () => {
  message.success(`删除成功,即将回到首页`);
  await delay(2000);
  router.replace({
    path: `/`,
  });
};
</script>

<template>
  <div flex flex-col overflow-hidden>
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
            <div
              :class="{
                'opacity-50': !gkdVersionName,
              }"
            >
              {{ gkdVersionName || 'null' }}
            </div>
          </template>
          GKD 版本
        </NTooltip>

        <div flex items-center gap-2px max-w-120px>
          <NTooltip v-if="isSystem && app">
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
            <div v-if="snapshot" @click="copy(appVersionCodeText)">
              {{ appVersionCodeText || '-' }}
            </div>
            <div v-else>-</div>
          </template>
          版本代码
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div v-if="snapshot" @click="copy(snapshot.appId)">
              {{ snapshot.appId }}
            </div>
            <div v-else>-</div>
          </template>
          应用ID
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div
              :class="{
                'opacity-50': !activityId,
              }"
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
        v-if="snapshot"
        class="ml-8px"
        :snapshot="snapshot"
        :showPreview="false"
        @delete="onDelete"
      />
    </div>
    <div h-1px mt-4px bg="#efeff5" />
    <div flex-1 min-h-0>
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
</template>
