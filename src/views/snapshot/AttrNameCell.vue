<script setup lang="ts">
import type { PropType } from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';

type AttrTip = {
  desc: string;
  type: 'info' | 'quickFind';
};

defineProps({
  name: {
    type: String,
    required: true,
  },
  explain: {
    type: String,
    required: true,
  },
  tip: {
    type: Object as PropType<AttrTip | undefined>,
    default: undefined,
  },
});
</script>

<template>
  <NTooltip
    :delay="300"
    placement="top-start"
    :show-arrow="true"
    :keep-alive-on-hover="true"
  >
    <template #trigger>
      <div flex justify-between items-center gap-4px>
        <span>{{ name }}</span>
        <NIcon
          v-if="tip"
          size="14"
          :style="{
            color:
              tip.type == 'quickFind'
                ? 'var(--quickfind-color)'
                : 'var(--info-color)',
          }"
          class="cursor-help transition-all hover:scale-110"
          @click.stop
        >
          <SvgIcon v-if="tip.type == 'info'" name="info" />
          <SvgIcon
            v-else-if="tip.type == 'quickFind'"
            name="ok"
            class="quickfind-icon"
          />
        </NIcon>
      </div>
    </template>
    <div class="p-2px">
      <div>{{ explain }}</div>
      <div v-if="tip" class="mt-4px">
        {{ tip.desc }}
      </div>
    </div>
  </NTooltip>
</template>
