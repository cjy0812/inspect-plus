<script setup lang="ts">
import { formatClock, normalizeClock } from '@/utils/clock';
import { normalizeOriginText } from '@/utils/url';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

const { settingsStore } = useStorageStore();

const updateDarkModeStart = () => {
  settingsStore.darkModeStart = formatClock(
    normalizeClock(settingsStore.darkModeStart) ?? 18 * 60,
  );
};

const updateDarkModeEnd = () => {
  settingsStore.darkModeEnd = formatClock(
    normalizeClock(settingsStore.darkModeEnd) ?? 6 * 60,
  );
};

const updateCustomDomain = () => {
  settingsStore.shareCustomImportDomain = normalizeOriginText(
    settingsStore.shareCustomImportDomain,
  );
};
</script>

<template>
  <NModal
    :show="props.show"
    preset="dialog"
    title="设置"
    :showIcon="false"
    positiveText="关闭"
    style="width: 620px"
    @update:show="emit('update:show', $event)"
    @positiveClick="emit('update:show', false)"
  >
    <NCheckbox v-model:checked="settingsStore.ignoreUploadWarn"
      >关闭生成分享链接弹窗提醒</NCheckbox
    >
    <div h-1px my-10px bg="#eee" />
    <NCheckbox v-model:checked="settingsStore.ignoreWasmWarn"
      >关闭浏览器版本正则表达式 WASM(GC) 提醒</NCheckbox
    >
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px>
      <NSwitch v-model:value="settingsStore.autoUploadImport" />
      <div>打开快照页面自动生成分享链接（请确保不含隐私）</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px items-center>
      <NSwitch v-model:value="settingsStore.shareUseOfficialImportDomain" />
      <div>分享快照链接默认使用官方域名 i.gkd.li</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex items-center gap-10px>
      <div class="w-120px">自定义分享域</div>
      <NInput
        v-model:value="settingsStore.shareCustomImportDomain"
        placeholder="https://li.chenge.eu.org"
        class="w-320px"
        @blur="updateCustomDomain"
      />
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px items-center>
      <NSwitch v-model:value="settingsStore.lowMemoryMode" />
      <div>低内存模式（限制预览缓存、减少动画、降低实时更新开销）</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex gap-10px items-center>
      <NSwitch v-model:value="settingsStore.autoExpandSnapshots" />
      <div>自动展开快照</div>
    </div>
    <div h-1px my-10px bg="#eee" />
    <div flex flex-col gap-10px>
      <div>主题模式</div>
      <NRadioGroup v-model:value="settingsStore.themeMode">
        <NSpace>
          <NRadio value="auto">自动</NRadio>
          <NRadio value="light">强制日间</NRadio>
          <NRadio value="dark">强制夜间</NRadio>
        </NSpace>
      </NRadioGroup>
      <div flex items-center gap-10px>
        <div class="w-100px">开始时间</div>
        <NInput
          v-model:value="settingsStore.darkModeStart"
          placeholder="18:00"
          class="w-120px"
          @blur="updateDarkModeStart"
        />
      </div>
      <div flex items-center gap-10px>
        <div class="w-100px">结束时间</div>
        <NInput
          v-model:value="settingsStore.darkModeEnd"
          placeholder="06:00"
          class="w-120px"
          @blur="updateDarkModeEnd"
        />
      </div>
    </div>
  </NModal>
</template>
