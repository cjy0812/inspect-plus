<script setup lang="tsx">
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
import type { TreeInst } from 'naive-ui';
import type { HTMLAttributes, ShallowRef } from 'vue';
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

let lastClickId = Number.NaN;
const expandedKeys = shallowRef<number[]>([]);
const selectedKeys = shallowRef<number[]>([]);
watch([() => focusNode.value, () => focusTime.value], async () => {
  if (!focusNode.value) return;
  const key = focusNode.value.id;
  nextTick().then(async () => {
    await delay(300);
    if (key === focusNode.value?.id) {
      if (lastClickId === key) {
        // 当点击节点树中的节点时, 不滚动
        lastClickId = Number.NaN;
        return;
      }
      selectedKeys.value = [key];
      treeRef.value?.scrollTo({ key, behavior: 'smooth', debounce: true });
    }
  });
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

const treeFilter = (pattern: string, node: RawNode) => {
  return node.id === focusNode.value?.id;
};
const treeNodeProps = (info: {
  option: RawNode;
}): HTMLAttributes & Record<string, unknown> => {
  const style = getNodeStyle(info.option, focusNode.value);
  return {
    onClick: () => {
      lastClickId = info.option.id;
      updateFocusNode(info.option);
    },
    style: {
      '--n-node-text-color': style.color,
      ...style,
    },
    class: 'whitespace-nowrap',
    'data-node-id': String(info.option.id),
  };
};

const renderLabel = (info: {
  option: RawNode;
  checked: boolean;
  selected: boolean;
}) => {
  const label = getNodeLabel(info.option);
  const meta = getNodeQuickFindMeta(info.option);
  if (!meta?.has) {
    return label;
  }
  const labelNode = h(
    'span',
    {
      style: meta.self
        ? // 在部分字体下 700 不明显，这里用轻微描边增强“加粗可见性”
          'font-weight:700 !important;text-shadow:0.35px 0 currentColor,-0.35px 0 currentColor;'
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
};

const deviceName = computed(() => {
  // 1. 如果没有快照，返回空字符串或占位符
  if (!snapshot.value) return '';
  const device = getDevice(snapshot.value);
  return `${device.manufacturer} Android ${device.release || ''}`;
});

const isSystem = computed(() => {
  // 2. 增加可选链 ?. 防御，防止 snapshot 为空时调用 getAppInfo 崩溃
  if (!snapshot.value) return false;
  return getAppInfo(snapshot.value)?.isSystem ?? false;
});

const activityId = computed(() => {
  // 3. 这里的 snapshot.value.activityId 在初始状态下会直接报错
  const snap = snapshot.value;
  if (!snap) return '';

  const v = snap.activityId;
  const appId = snap.appId;
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
  if (!snapshot.value) return undefined;
  const v = getGkdAppInfo(snapshot.value).versionName;
  return v ? `GKD@${v}` : undefined;
});
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
          <NTooltip v-if="isSystem && snapshot">
            <template #trigger>
              <SvgIcon
                name="system"
                style="--svg-h: 16px; --svg-w: 16px"
                class="text-yellow-600"
              />
            </template>
            {{ `${getAppInfo(snapshot).name} 是一个系统应用` }}
          </NTooltip>
          <NTooltip>
            <template #trigger>
              <div v-if="snapshot" @click="copy(getAppInfo(snapshot).name)">
                {{ getAppInfo(snapshot).name }}
              </div>
              <div v-else>-</div>
            </template>
            应用名称
          </NTooltip>
        </div>

        <NTooltip>
          <template #trigger>
            <div
              v-if="snapshot"
              @click="copy(getAppInfo(snapshot).versionName)"
            >
              {{ getAppInfo(snapshot).versionName }}
            </div>
            <div v-else>-</div>
          </template>
          版本名称
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <div
              v-if="snapshot"
              @click="copy(getAppInfo(snapshot).versionCode.toString())"
            >
              {{ getAppInfo(snapshot).versionCode }}
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
        :data="[rootNode as any]"
        :filter="(treeFilter as any)"
        :nodeProps="(treeNodeProps as any)"
        :renderLabel="(renderLabel as any)"
      />
    </div>
  </div>
</template>
