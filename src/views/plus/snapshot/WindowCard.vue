<script setup lang="tsx">
import { h, type ShallowRef } from 'vue';
import BaseWindowCard from '@/views/snapshot/WindowCard.vue'; // 引用刚才重构的基础版
import SvgIcon from '@/components/SvgIcon.vue';
import { useWindowQuickFind } from '@/composables/plus/useWindowQuickFind';
import { useSnapshotStore } from '@/views/snapshot/snapshot';

const snapshotStore = useSnapshotStore();
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;

/**
 * Plus 专属逻辑：快速查找元数据
 */
const { getNodeQuickFindMeta } = useWindowQuickFind(rootNode);

/**
 * 渲染增强标签：在原有 label 后追加 QuickFind 图标
 */
const renderPlusLabel = ({
  option,
  label,
}: {
  option: RawNode;
  label: any;
}) => {
  const meta = getNodeQuickFindMeta(option);
  if (!meta?.has) {
    return label;
  }
  return h(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center' } },
    [
      label,
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
</script>

<template>
  <BaseWindowCard>
    <template #renderLabel="slotProps">
      <component :is="renderPlusLabel(slotProps)" />
    </template>
  </BaseWindowCard>
</template>
