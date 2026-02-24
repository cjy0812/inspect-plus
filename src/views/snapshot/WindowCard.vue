<script setup lang="ts">
import ActionCard from '@/components/ActionCard.vue';
import GapList from '@/components/GapList';
import { message } from '@/utils/discrete';
import {
  getAppInfo,
  getDevice,
  getGkdAppInfo,
  getNodeLabel,
  getNodeStyle,
  getNodeQf,
} from '@/utils/node';
import { copy, delay } from '@/utils/others';
import type { TreeInst, TreeOption, TreeProps } from 'naive-ui';
import { h, type ShallowRef } from 'vue';
import { useSnapshotStore } from './snapshot';
import SvgIcon from '@/components/SvgIcon.vue';

interface QuickFindMeta {
  self: boolean;
  has: boolean;
}

const router = useRouter();

const snapshotStore = useSnapshotStore();
const { updateFocusNode, focusNode, focusTime } = snapshotStore;
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;

let lastClickId = Number.NaN;
const expandedKeys = shallowRef<number[]>([]);
const selectedKeys = shallowRef<number[]>([]);
watch([() => focusNode.value, () => focusTime.value], async () => {
  if (!focusNode.value) return;
  const key = focusNode.value.id;

  // Check if focus change was triggered by tree node click
  if (lastClickId === key) {
    // When click targeted this node, skip quick find
    lastClickId = Number.NaN;
  } else {
    // Reset lastClickId for next time
    lastClickId = Number.NaN;

    // Find first quick target in current node's subtree
    const target = findQuickTarget(focusNode.value);
    if (target && target.id !== key) {
      // Update focus to quick target
      updateFocusNode(target);
      return; // Exit to avoid duplicate processing
    }
  }

  nextTick().then(async () => {
    await delay(300);
    if (key === focusNode.value?.id) {
      selectedKeys.value = [key];

      // Scroll using treeRef only to avoid duplicate DOM operations
      treeRef.value?.scrollTo({ key, behavior: 'smooth', debounce: true });
    }
  });

  // Expand all ancestor nodes
  let parent = focusNode.value.parent;
  if (!parent) {
    return;
  }
  const s = new Set(expandedKeys.value);
  while (parent) {
    s.add(parent.id);
    parent = parent.parent;
  }
  if (
    s.size == expandedKeys.value.length &&
    expandedKeys.value.every((v) => s.has(v))
  ) {
    return;
  }
  expandedKeys.value = [...s];
});

const treeRef = shallowRef<TreeInst>();
const treeData = computed<TreeOption[]>(() => {
  return rootNode.value ? [rootNode.value as unknown as TreeOption] : [];
});

const treeFilter: NonNullable<TreeProps['filter']> = (_pattern, node) => {
  const rawNode = node as unknown as RawNode;
  return rawNode.id === focusNode.value?.id;
};
const treeNodeProps: NonNullable<TreeProps['nodeProps']> = (info) => {
  const option = info.option as unknown as RawNode;
  const style = getNodeStyle(option, focusNode.value);
  const meta = quickFindMeta.value.get(option.id);

  // Create new style object with proper type
  const newStyle: Record<string, string | number | undefined> = { ...style };

  // Add opacity only if node has no quick find potential and opacity is undefined
  if (meta && !meta.has && newStyle.opacity === undefined) {
    newStyle.opacity = 0.7;
  }

  return {
    onClick: () => {
      lastClickId = option.id;
      updateFocusNode(option);
    },
    style: {
      '--n-node-text-color': style.color,
      ...newStyle,
    },
    class: 'whitespace-nowrap',
    'data-node-id': String(option.id),
  };
};

const renderLabel: NonNullable<TreeProps['renderLabel']> = (info) => {
  const option = info.option as unknown as RawNode;
  // Compute node label once and reuse
  const label = getNodeLabel(option);
  const meta = quickFindMeta.value.get(option.id);

  // If node has no quick find potential, return original label
  if (!meta || !meta.has) {
    return label;
  }

  // If node has quick find potential, return label with icon
  return h(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      },
    },
    [
      label,
      h(SvgIcon, {
        name: 'ok',
        class: 'quickfind-icon',
        style: {
          width: '14px',
          height: '14px',
          color: 'var(--n-success-color, #00a240)',
          fill: 'var(--n-success-color, #00a240)',
          opacity: meta.self ? '1' : '0.4',
          stroke: 'var(--n-success-color, #00a240)',
          strokeWidth: '2',
          display: 'inline-block',
          verticalAlign: 'middle',
          marginLeft: '2px',
        },
      }),
    ],
  );
};

const deviceName = computed(() => {
  return `${getDevice(snapshot.value).manufacturer} Android ${getDevice(snapshot.value).release || ``}`;
});

const isSystem = computed(() => {
  return getAppInfo(snapshot.value).isSystem;
});
const activityId = computed(() => {
  const v = snapshot.value.activityId;
  const appId = snapshot.value.appId;
  if (!v || !appId) return '';
  if (v.startsWith(appId) && v[appId.length] === '.') {
    return v.substring(appId.length);
  }
  return v;
});

const onDelete = async () => {
  message.success(`删除成功,即将回到首页`);
  await delay(2000);
  router.replace({
    path: `/`,
  });
};
const gkdVersionName = computed(() => {
  const v = getGkdAppInfo(snapshot.value).versionName;
  return v ? `GKD@${v}` : undefined;
});

const quickFindMeta = computed(() => {
  const root = rootNode.value;
  if (!root) {
    return new Map<number, QuickFindMeta>();
  }
  const metaMap = new Map<number, QuickFindMeta>();
  const computeMeta = (node: RawNode): QuickFindMeta => {
    const self = getNodeQf(node);
    let has = self;

    for (const child of node.children) {
      const childMeta = computeMeta(child);
      if (childMeta.has) {
        has = true;
      }
    }

    const meta = { self, has };
    metaMap.set(node.id, meta);
    return meta;
  };

  computeMeta(root);
  return metaMap;
});

// Find first quick target in subtree
const findQuickTarget = (node: RawNode): RawNode | null => {
  const meta = quickFindMeta.value.get(node.id);

  // If node has no quick find potential, return null immediately
  if (!meta || !meta.has) {
    return null;
  }

  // If node itself is a quick find target, return it
  if (meta.self) {
    return node;
  }

  // Otherwise, recurse into children
  for (const child of node.children) {
    const target = findQuickTarget(child);
    if (target) {
      return target;
    }
  }

  return null;
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
          <NTooltip v-if="isSystem">
            <template #trigger>
              <SvgIcon name="system" />
            </template>
            {{ `${getAppInfo(snapshot).name} 是一个系统应用` }}
          </NTooltip>
          <NTooltip>
            <template #trigger>
              <div @click="copy(getAppInfo(snapshot).name)">
                {{ getAppInfo(snapshot).name }}
              </div>
            </template>
            应用名称
          </NTooltip>
        </div>

        <NTooltip>
          <template #trigger>
            <div @click="copy(getAppInfo(snapshot).versionName)">
              {{ getAppInfo(snapshot).versionName }}
            </div>
          </template>
          版本名称
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div @click="copy(getAppInfo(snapshot).versionCode.toString())">
              {{ getAppInfo(snapshot).versionCode }}
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
        class="ml-8px"
        :snapshot="snapshot"
        :showPreview="false"
        @delete="onDelete"
      />
    </div>
    <div h-1px mt-4px bg="#efeff5" />
    <div flex-1 min-h-0>
      <NTree
        ref="treeRef"
        v-model:expandedKeys="expandedKeys"
        v-model:selectedKeys="selectedKeys"
        class="h-full"
        virtualScroll
        showLine
        blockLine
        keyField="id"
        :data="treeData"
        :filter="treeFilter"
        :nodeProps="treeNodeProps"
        :renderLabel="renderLabel"
      />
    </div>
  </div>
</template>
