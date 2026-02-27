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
import { h, type ShallowRef, useTemplateRef } from 'vue';
import { useSnapshotStore } from './snapshot';
import SvgIcon from '@/components/SvgIcon.vue';

// ==========================================
// 1. 自定义扩展定义区 (Quick Find)
// ==========================================
interface QuickFindMeta {
  self: boolean;
  has: boolean;
}

// ==========================================
// 2. 原版核心状态区
// ==========================================
const router = useRouter();
const snapshotStore = useSnapshotStore();
const { updateFocusNode, focusNode, focusTime } = snapshotStore;
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;

let lastClickId = Number.NaN;
const expandedKeys = shallowRef<number[]>([]);
const selectedKeys = shallowRef<number[]>([]);
const treeContainer = useTemplateRef<HTMLElement>('treeContainerRef');
const treeRef = shallowRef<TreeInst>();

// ==========================================
// 3. 自定义功能计算区 (Quick Find 逻辑)
// ==========================================
const quickFindMeta = computed(() => {
  const root = rootNode.value;
  if (!root) return new Map<number, QuickFindMeta>();

  const metaMap = new Map<number, QuickFindMeta>();
  const computeMeta = (node: RawNode): QuickFindMeta => {
    const self = getNodeQf(node);
    let has = self;
    for (const child of node.children) {
      if (computeMeta(child).has) has = true;
    }
    const meta = { self, has };
    metaMap.set(node.id, meta);
    return meta;
  };
  computeMeta(root);
  return metaMap;
});

const findQuickTarget = (node: RawNode): RawNode | null => {
  const meta = quickFindMeta.value.get(node.id);
  if (!meta || !meta.has) return null;
  if (meta.self) return node;
  for (const child of node.children) {
    const target = findQuickTarget(child);
    if (target) return target;
  }
  return null;
};

// ==========================================
// 4. 核心监听与渲染区 (原版混合扩展)
// ==========================================
watch([() => focusNode.value, () => focusTime.value], async () => {
  if (!focusNode.value) return;
  const key = focusNode.value.id;

  // --- [扩展插件] Quick Find 拦截 ---
  if (lastClickId === key) {
    lastClickId = Number.NaN;
  } else {
    lastClickId = Number.NaN;
    const target = findQuickTarget(focusNode.value);
    if (target && target.id !== key) {
      updateFocusNode(target);
      return; // 拦截成功，退出本次滚动逻辑
    }
  }
  // ----------------------------------

  nextTick().then(async () => {
    await delay(300);
    if (key === focusNode.value?.id) {
      selectedKeys.value = [key];

      // --- [原版] 节点树滚动逻辑 (完整保留，防止冲突) ---
      if (!treeContainer.value) return;
      const nodeRef = treeContainer.value.querySelector(
        `[data-node-id="${key}"]`,
      );
      if (nodeRef) {
        nodeRef.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else {
        await delay(300);
        treeRef.value?.scrollTo({ key, behavior: 'smooth', debounce: true });
      }
      // ---------------------------------------------------
    }
  });

  // [原版] 展开所有父节点
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
  ) {
    return;
  }
  expandedKeys.value = [...s];
});

const treeData = computed<TreeOption[]>(() => {
  return rootNode.value ? [rootNode.value as unknown as TreeOption] : [];
});

const treeFilter: NonNullable<TreeProps['filter']> = (_pattern, node) => {
  const rawNode = node as unknown as RawNode;
  return rawNode.id === focusNode.value?.id;
};

const treeNodeProps: NonNullable<TreeProps['nodeProps']> = (info) => {
  const option = info.option as unknown as RawNode;

  // 1. [原版] 基础样式与事件
  const style = getNodeStyle(option, focusNode.value);
  const props = {
    onClick: () => {
      lastClickId = option.id;
      updateFocusNode(option);
    },
    style: {
      '--n-node-text-color': style.color,
      ...style,
    } as Record<string, string | number | undefined>,
    class: 'whitespace-nowrap',
    'data-node-id': String(option.id),
  };

  // 2. [扩展插件] 追加 Quick Find 的透明度处理
  const meta = quickFindMeta.value.get(option.id);
  if (meta && !meta.has && props.style.opacity === undefined) {
    props.style.opacity = 0.7;
  }

  return props;
};

const renderLabel: NonNullable<TreeProps['renderLabel']> = (info) => {
  const option = info.option as unknown as RawNode;
  const label = getNodeLabel(option); // [原版] 获取 label
  const meta = quickFindMeta.value.get(option.id);

  // [扩展插件] 如果没有 QF 数据，直接返回原版 label
  if (!meta || !meta.has) {
    return label;
  }

  // [扩展插件] 有 QF 数据，使用 h 函数渲染带有 Icon 的 label
  return h(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: '4px' } },
    [
      label,
      h(SvgIcon, {
        name: 'ok',
        class: 'quickfind-icon',
        style: {
          width: '14px',
          height: '14px',
          color: 'var(--n-success-color, var(--accent-success-color))',
          fill: 'var(--n-success-color, var(--accent-success-color))',
          opacity: meta.self ? '1' : '0.4',
          stroke: 'var(--n-success-color, var(--accent-success-color))',
          strokeWidth: '2',
          display: 'inline-block',
          verticalAlign: 'middle',
          marginLeft: '2px',
        },
      }),
    ],
  );
};

// ==========================================
// 5. 顶栏信息计算区 (原版)
// ==========================================
const deviceName = computed(
  () =>
    `${getDevice(snapshot.value).manufacturer} Android ${getDevice(snapshot.value).release || ``}`,
);
const isSystem = computed(() => getAppInfo(snapshot.value).isSystem);
const activityId = computed(() => {
  const v = snapshot.value.activityId;
  const appId = snapshot.value.appId;
  if (!v || !appId) return '';
  if (v.startsWith(appId) && v[appId.length] === '.') {
    return v.substring(appId.length);
  }
  return v;
});
const gkdVersionName = computed(() => {
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
  <div flex flex-col overflow-hidden>
    <div flex items-center px-8px>
      <GapList class="flex flex-wrap items-center gap-8px gkd_code">
        <template #gap>
          <div w-1px bg-gray h-12px />
        </template>
        <NTooltip>
          <template #trigger>
            <div @click="copy(deviceName)">{{ deviceName }}</div>
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

    <div h-1px mt-4px style="background-color: var(--divider-color)" />

    <div ref="treeContainerRef" flex-1 min-h-0>
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
