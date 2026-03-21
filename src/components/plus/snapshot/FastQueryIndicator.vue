<script setup lang="ts">
import type { FastQueryMeta } from '@/composables/plus/useFastQueryIndicator';

const props = withDefaults(
  defineProps<{
    meta?: FastQueryMeta | null;
  }>(),
  {
    meta: null,
  },
);

const indicatorColor = computed(() => {
  if (!props.meta) return '';
  if (!props.meta.support) return '#ef4444';
  return props.meta.local ? '#facc15' : '#22c55e';
});

const indicatorText = computed(() => {
  if (!props.meta) return '';
  if (!props.meta.support) return '不满足快查';
  return props.meta.local ? '局部快速查询' : '支持快速查询';
});
</script>

<template>
  <NTooltip
    v-if="meta"
    trigger="hover"
    placement="top"
    class="fast-query-indicator-wrap"
  >
    <template #trigger>
      <SvgIcon
        :name="meta.support ? 'ok' : 'warn'"
        class="fast-query-indicator"
        :style="{
          color: indicatorColor,
          '--svg-w': '16px',
          '--svg-h': '16px',
        }"
      />
    </template>
    {{ indicatorText }}
  </NTooltip>
</template>

<style scoped>
.fast-query-indicator-wrap {
  display: inline-flex;
  align-items: center;
}
</style>
