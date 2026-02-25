<script setup lang="ts">
import SvgIcon from '@/components/SvgIcon.vue';

type AttrTip = {
  desc: string;
  type: 'info' | 'quickFind';
};

defineProps<{
  name: string;
  explain: string;
  tip?: AttrTip;
}>();
</script>

<template>
  <div flex justify-between items-center gap-4px>
    <NTooltip
      :delay="300"
      placement="top-start"
      :show-arrow="true"
      :keep-alive-on-hover="true"
    >
      <template #trigger>
        <span>{{ name }}</span>
      </template>
      <div class="p-2px">
        <div>{{ explain }}</div>
      </div>
    </NTooltip>
    <NTooltip
      v-if="tip"
      :delay="300"
      placement="top-start"
      :show-arrow="true"
      :keep-alive-on-hover="true"
    >
      <template #trigger>
        <NIcon
          size="14"
          :style="{
            color:
              tip.type === 'quickFind'
                ? 'var(--quickfind-color)'
                : 'var(--info-color)',
          }"
          class="cursor-help transition-all hover:scale-110"
          @click.stop
        >
          <SvgIcon v-if="tip.type === 'info'" name="info" />
          <SvgIcon
            v-else-if="tip.type === 'quickFind'"
            name="ok"
            class="quickfind-icon"
          />
        </NIcon>
      </template>
      <div class="p-2px">
        <div>{{ tip.desc }}</div>
      </div>
    </NTooltip>
  </div>
</template>
