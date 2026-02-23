<script setup lang="ts">
import { showTextDLg } from '@/utils/dialog';
import { formatClock, normalizeClock } from '@/utils/clock';
import { normalizeOriginText } from '@/utils/url';
import { message } from '@/utils/discrete';
import {
  screenshotStorage,
  shallowSnapshotStorage,
  snapshotStorage,
} from '@/utils/snapshot';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

const {
  settingsStore,
  snapshotViewedTime,
  snapshotImportTime,
  snapshotImageId,
  snapshotImportId,
  importSnapshotId,
} = useStorageStore();
const showDebugMenu = ref(false);

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

const triggerDebugShareDialog = () => {
  showTextDLg({
    title: '调试 - 链接复制窗口',
    content: 'https://i.gkd.li/i/123456',
    extraContent: `${window.location.origin}/i/123456`,
    extraTitle: '当前域链接',
  });
};

const clearRecord = (record: Record<string, any>) => {
  Object.keys(record).forEach((k) => {
    delete record[k];
  });
};
const clearStorage = async (
  storage: Pick<typeof snapshotStorage, 'keys' | 'removeItem'>,
) => {
  const keys = await storage.keys();
  await Promise.all(keys.map((k) => storage.removeItem(k)));
};
const clearIndexCache = async () => {
  clearRecord(snapshotViewedTime);
  clearRecord(snapshotImportTime);
  clearRecord(snapshotImageId);
  clearRecord(snapshotImportId);
  clearRecord(importSnapshotId);
  message.success('已清理索引缓存');
};
const clearSnapshots = async () => {
  await Promise.all([
    clearStorage(snapshotStorage),
    clearStorage(shallowSnapshotStorage),
    clearStorage(screenshotStorage),
  ]);
  await clearIndexCache();
  message.success('已清理快照数据');
};
const resetAllLocal = () => {
  localStorage.removeItem('settings');
  message.success('已重置设置，正在刷新');
  setTimeout(() => {
    location.reload();
  }, 300);
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
    class="settings-modal"
    @update:show="emit('update:show', $event)"
    @positiveClick="emit('update:show', false)"
  >
    <template #header>
      <div flex items-center>
        <SvgIcon name="settings" class="mr-6px" style="color: #22c55e" />
        <span>设置</span>
        <div flex-1 />
      </div>
    </template>
    <div class="settings-layout">
      <div class="settings-section">
        <div class="settings-title">分享与导入</div>
        <div class="settings-row">
          <NSwitch v-model:value="settingsStore.autoUploadImport" />
          <div>打开快照页面自动生成分享链接（请确保不含隐私）</div>
        </div>
        <div class="settings-row">
          <NSwitch v-model:value="settingsStore.shareUseOfficialImportDomain" />
          <div>分享快照链接默认复制官方域名 i.gkd.li</div>
        </div>
        <div class="settings-row">
          <div class="w-120px">自定义分享域</div>
          <NInput
            v-model:value="settingsStore.shareCustomImportDomain"
            placeholder="https://li.chenge.eu.org"
            class="w-320px"
            @blur="updateCustomDomain"
          />
        </div>
        <div class="settings-row">
          <NCheckbox v-model:checked="settingsStore.ignoreUploadWarn">
            关闭生成分享链接弹窗提醒
          </NCheckbox>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">性能与显示</div>
        <div class="settings-row">
          <NSwitch v-model:value="settingsStore.lowMemoryMode" />
          <div>低内存模式（限制预览缓存、减少动画、降低实时更新开销）</div>
        </div>
        <div class="settings-row">
          <NSwitch v-model:value="settingsStore.autoExpandSnapshots" />
          <div>自动展开快照</div>
        </div>
        <div class="settings-row">
          <NSwitch v-model:value="settingsStore.randomFocusNodeColorOnOpen" />
          <div>每次打开随机节点高亮颜色（中等亮度）</div>
        </div>
        <div class="settings-row">
          <NCheckbox v-model:checked="settingsStore.ignoreWasmWarn">
            关闭浏览器版本正则表达式 WASM(GC) 提醒
          </NCheckbox>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">主题模式</div>
        <NRadioGroup v-model:value="settingsStore.themeMode">
          <NSpace>
            <NRadio value="auto">自动</NRadio>
            <NRadio value="light">强制日间</NRadio>
            <NRadio value="dark">强制夜间</NRadio>
          </NSpace>
        </NRadioGroup>
        <div class="settings-row">
          <div class="w-100px">开始时间</div>
          <NInput
            v-model:value="settingsStore.darkModeStart"
            placeholder="18:00"
            class="w-120px"
            @blur="updateDarkModeStart"
          />
        </div>
        <div class="settings-row">
          <div class="w-100px">结束时间</div>
          <NInput
            v-model:value="settingsStore.darkModeEnd"
            placeholder="06:00"
            class="w-120px"
            @blur="updateDarkModeEnd"
          />
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-row settings-debug">
          <div
            class="text-12px"
            :style="{ color: settingsStore.debugMode ? '#d03050' : '#999' }"
          >
            调试模式
          </div>
          <NSwitch
            v-model:value="settingsStore.debugMode"
            size="small"
            @update:value="
              (value) => {
                if (!value) showDebugMenu = false;
              }
            "
          />
        </div>
        <div v-if="settingsStore.debugMode" mt-8px>
          <NButton
            text
            size="tiny"
            :type="showDebugMenu ? 'error' : 'default'"
            @click="showDebugMenu = !showDebugMenu"
          >
            {{ showDebugMenu ? '隐藏调试菜单' : '展开调试菜单' }}
          </NButton>
          <NCard
            v-if="showDebugMenu"
            embedded
            size="small"
            class="mt-8px"
            style="border-radius: 8px"
          >
            <NSpace vertical size="small">
              <div class="text-12px opacity-65">预留后续调试工具入口</div>
              <div flex items-center gap-10px>
                <span>选中节点高亮颜色:</span>
                <NColorPicker
                  v-model:value="settingsStore.focusNodeColor"
                  :modes="['rgb']"
                  size="small"
                />
              </div>
              <div flex gap-8px flex-wrap>
                <NButton size="small" secondary @click="clearIndexCache">
                  清理索引缓存
                </NButton>
                <NButton
                  size="small"
                  secondary
                  type="warning"
                  @click="clearSnapshots"
                >
                  清理快照数据
                </NButton>
                <NButton
                  size="small"
                  secondary
                  type="error"
                  @click="resetAllLocal"
                >
                  重置本地设置
                </NButton>
              </div>
              <NButton
                size="small"
                secondary
                type="error"
                @click="triggerDebugShareDialog"
              >
                触发链接弹窗测试
              </NButton>
            </NSpace>
          </NCard>
        </div>
      </div>
    </div>
  </NModal>
</template>
