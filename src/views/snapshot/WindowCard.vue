<script setup lang="tsx">
// ... 保持 import 不变 ...
import ActionCard from '@/components/ActionCard.vue';
import GapList from '@/components/GapList';
import { message } from '@/utils/discrete';
import {
  getAppInfo,
  getDevice,
  getGkdAppInfo,
  getNodeLabel,
  getNodeStyle,
} from '@/utils/node';
import { copy, delay } from '@/utils/others';
import type { TreeInst, TreeOption, TreeProps } from 'naive-ui';
import type { HTMLAttributes, ShallowRef, VNode } from 'vue';
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

let lastClickId = Number.NaN;
const expandedKeys = shallowRef<number[]>([]);
const selectedKeys = shallowRef<number[]>([]);
const treeRef = shallowRef<TreeInst>();
const toRawNode = (option: TreeOption): RawNode => option as RawNode;
const rootTreeData = computed<TreeOption[]>(() =>
  rootNode.value ? [rootNode.value as TreeOption] : [],
);

// --- 逻辑部分保持现状，已足够健壮 ---
watch([() => focusNode.value, () => focusTime.value], async () => {
  if (!focusNode.value) return;
  const key = focusNode.value.id;
  nextTick().then(async () => {
    await delay(300);
    if (key === focusNode.value?.id) {
      if (lastClickId === key) {
        lastClickId = Number.NaN;
        return;
      }
      selectedKeys.value = [key];
      treeRef.value?.scrollTo({ key, behavior: 'smooth', debounce: true });
    }
  });
  let parent = focusNode.value.parent;
  if (!parent) return;
  const s = new Set(expandedKeys.value);
  while (parent) {
    s.add(parent.id);
    parent = parent.parent;
  }
  if (
    s.size == expandedKeys.value.length &&
    expandedKeys.value.every((v) => s.has(v))
  )
    return;
  expandedKeys.value = [...s];
});

const treeFilter: NonNullable<TreeProps['filter']> = (_pattern, node) =>
  toRawNode(node).id === focusNode.value?.id;

const treeNodeProps: NonNullable<TreeProps['nodeProps']> = ({
  option,
}): HTMLAttributes & Record<string, unknown> => {
  const rawNode = toRawNode(option);
  const style = getNodeStyle(rawNode, focusNode.value);
  return {
    onClick: () => {
      lastClickId = rawNode.id;
      updateFocusNode(rawNode);
    },
    style: { '--n-node-text-color': style.color, ...style },
    class: 'whitespace-nowrap',
    'data-node-id': String(rawNode.id),
  };
};

const renderLabel: NonNullable<TreeProps['renderLabel']> = ({ option }) => {
  const rawNode = toRawNode(option);
  const label = getNodeLabel(rawNode);
  if (slots.renderLabel) return slots.renderLabel({ option: rawNode, label });
  return label;
};

// --- 计算属性优化：提取 app 为内部变量，减少重复计算 ---
const app = computed(() =>
  snapshot.value ? getAppInfo(snapshot.value) : null,
);

const deviceName = computed(() => {
  if (!snapshot.value) return '';
  const device = getDevice(snapshot.value);
  return `${device.manufacturer} Android ${device.release || ''}`;
});

const activityId = computed(() => {
  if (!snapshot.value) return '';
  const { activityId: v, appId } = snapshot.value;
  if (!v || !appId) return '';
  return v.startsWith(appId) && v[appId.length] === '.'
    ? v.substring(appId.length)
    : v;
});

const gkdVersionName = computed(() => {
  if (!snapshot.value) return undefined;
  const v = getGkdAppInfo(snapshot.value).versionName;
  return v ? `GKD@${v}` : undefined;
});

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
            <div @click="copy(app?.versionCode?.toString() || '')">
              {{ app?.versionCode || '-' }}
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
  <div v-else flex-1 flex items-center justify-center>
    <NEmpty description="加载中..." />
  </div>
</template>
