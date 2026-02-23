<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { useDeviceControlTools } from '@/composables/useDeviceControlTools';
import type { TooltipProps } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    iconSize?: string;
    tooltipPlacement?: TooltipProps['placement'];
  }>(),
  { iconSize: 'var(--app-icon-size)', tooltipPlacement: 'right' },
);

const {
  showSubsModel,
  subsText,
  updateSubs,
  showSelectorModel,
  actionOptions,
  clickAction,
  execSelector,
} = useDeviceControlTools();
</script>

<template>
  <NTooltip :placement="props.tooltipPlacement">
    <template #trigger>
      <NButton
        text
        :style="{ '--n-icon-size': props.iconSize }"
        @click="showSubsModel = true"
      >
        <SvgIcon name="CacheSub" />
      </NButton>
    </template>
    修改内存订阅
  </NTooltip>
  <NTooltip :placement="props.tooltipPlacement">
    <template #trigger>
      <NButton
        text
        :style="{ '--n-icon-size': props.iconSize }"
        @click="showSelectorModel = true"
      >
        <SvgIcon name="Exe-Sel" />
      </NButton>
    </template>
    执行选择器
  </NTooltip>

  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 84, left: 120 }"
    class="box-shadow-dim"
    :show="showSubsModel"
  >
    <NCard
      size="small"
      closable
      style="width: 90vw; max-width: 800px"
      @close="showSubsModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <span>修改内存订阅</span>
          <div flex-1 />
        </div>
      </template>
      <NInput
        v-model:value="subsText"
        :disabled="updateSubs.loading"
        type="textarea"
        class="gkd_code"
        :autosize="{ minRows: 20, maxRows: 25 }"
        placeholder="请输入订阅文本(JSON5)"
      />
      <div mt-10px flex justify-end gap-8px>
        <NButton @click="showSubsModel = false">取消</NButton>
        <NButton
          type="primary"
          :loading="updateSubs.loading"
          @click="updateSubs.invoke"
        >
          确认
        </NButton>
      </div>
    </NCard>
  </DraggableCard>

  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 120, left: 180 }"
    class="box-shadow-dim"
    :show="showSelectorModel"
  >
    <NCard
      size="small"
      closable
      style="width: 90vw; max-width: 800px"
      @close="showSelectorModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <span>执行选择器</span>
          <div flex-1 />
        </div>
      </template>
      <NInput
        v-model:value="clickAction.selector"
        :disabled="execSelector.loading"
        type="textarea"
        class="gkd_code"
        :autosize="{ minRows: 4, maxRows: 10 }"
        placeholder="请输入合法选择器"
      />
      <div h-15px />
      <NSpace>
        <NCheckbox v-model:checked="clickAction.quickFind">快速查询</NCheckbox>
      </NSpace>
      <div h-10px />
      <NSelect
        v-model:value="clickAction.action"
        :options="actionOptions"
        class="w-150px"
      />
      <div mt-10px flex justify-end gap-8px>
        <NButton @click="showSelectorModel = false">取消</NButton>
        <NButton
          type="primary"
          :loading="execSelector.loading"
          @click="execSelector.invoke"
        >
          确认
        </NButton>
      </div>
    </NCard>
  </DraggableCard>
</template>
