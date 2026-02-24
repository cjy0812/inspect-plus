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

const subsPlaceholder = `
请输入订阅文本(JSON5语法):
示例1-单个应用的规则:
{
  id: 'cn.dxy.clinmaster',
  name: '临床决策',
  groups: [
    {
      key: 1,
      name: '更新提示',
      matchTime: 10000,
      actionMaximum: 1,
      resetMatch: 'app',
      rules: [
        {
          fastQuery: true,
          activityIds: 'cn.dxy.clinmaster.home.MainActivity',
          matches:
            '@[vid="iv_close"][clickable=true][visibleToUser=true] -2 [text="立即更新"]',
          snapshotUrls: 'https://i.gkd.li/i/25459821',
        },
      ],
    },
  ],
}
`.trim();
</script>

<template>
  <NTooltip :placement="props.tooltipPlacement">
    <template #trigger>
      <NButton
        text
        :style="{ '--n-icon-size': props.iconSize, '--svg-h': props.iconSize }"
        @click="showSubsModel = !showSubsModel"
      >
        <template #icon>
          <SvgIcon name="CacheSub" class="dark:fill-[#ffffff]" />
        </template>
      </NButton>
    </template>
    修改内存订阅
  </NTooltip>
  <NTooltip :placement="props.tooltipPlacement">
    <template #trigger>
      <NButton
        text
        :style="{ '--n-icon-size': props.iconSize, '--svg-h': props.iconSize }"
        @click="showSelectorModel = !showSelectorModel"
      >
        <template #icon>
          <SvgIcon name="Exe-Sel" class="dark:fill-[#ffffff]" />
        </template>
      </NButton>
    </template>
    执行选择器
  </NTooltip>

  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 84, left: 120 }"
    class="box-shadow-dim window-anim"
    :show="showSubsModel"
  >
    <NCard
      size="small"
      closable
      class="floating-panel"
      style="width: min(720px, 90vw)"
      :content-style="{ maxHeight: '70vh', overflow: 'auto' }"
      @close="showSubsModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <SvgIcon name="CacheSub" class="mr-6px" style="color: #22c55e" />
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
        :placeholder="subsPlaceholder"
        aria-label="订阅文本输入框"
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
    class="box-shadow-dim window-anim"
    :show="showSelectorModel"
  >
    <NCard
      size="small"
      closable
      class="floating-panel"
      style="width: min(720px, 90vw)"
      :content-style="{ maxHeight: '70vh', overflow: 'auto' }"
      @close="showSelectorModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <SvgIcon name="Exe-Sel" class="mr-6px" style="color: #22c55e" />
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
        aria-label="选择器输入框"
      />
      <div h-15px />
      <NSpace>
        <NCheckbox v-model:checked="clickAction.quickFind">快速查询</NCheckbox>
        <a
          href="https://gkd.li/api/interfaces/RawCommonProps.html#quickfind"
          target="_blank"
          rel="noopener noreferrer"
        >
          查找说明
        </a>
      </NSpace>
      <div h-10px />
      <div flex gap-10px flex-items-center>
        <NSelect
          v-model:value="clickAction.action"
          :options="actionOptions"
          class="w-150px"
        />
        <a
          href="https://gkd.li/api/interfaces/RawRuleProps#action"
          target="_blank"
          rel="noopener noreferrer"
        >
          操作说明
        </a>
      </div>
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
