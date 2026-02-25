<template>
  <div class="dialog-container">
    <!-- 分享链接弹窗 -->
    <NModal
      v-if="dialogState.shareLink.visible"
      v-model:show="dialogState.shareLink.visible"
      :draggable="true"
      :show-mask="false"
      :block-scroll="false"
      :auto-focus="false"
      :trap-focus="false"
      :mask-closable="false"
      :close-on-esc="true"
      class="snapshot-floating-panel"
      :width="400"
    >
      <template #header>
        <div class="n-modal-header">
          <div class="n-modal-title">
            {{ dialogState.shareLink.options.title }}
          </div>
          <div class="n-modal-header__right">
            <NButton text @click="close('shareLink')">
              <SvgIcon name="close" />
            </NButton>
          </div>
        </div>
      </template>
      <div class="p-10px">
        <div class="mb-8px">
          <div class="text-sm text-muted mb-4px">官方域名链接</div>
          <NInput :value="officialUrl" readonly class="gkd_code" />
          <NButton text size="small" class="mt-4px" @click="copy(officialUrl)">
            复制链接
          </NButton>
        </div>
        <div v-if="currentOriginUrl" class="mb-8px">
          <div class="text-sm text-muted mb-4px">自定义域链接</div>
          <NInput :value="currentOriginUrl" readonly class="gkd_code" />
          <NButton
            text
            size="small"
            class="mt-4px"
            @click="copy(currentOriginUrl)"
          >
            复制链接
          </NButton>
        </div>
        <div v-if="dialogState.shareLink.options.quickPick" class="mt-12px">
          <NButton type="primary" block @click="copy(officialUrl)">
            快速复制官方链接
          </NButton>
        </div>
      </div>
    </NModal>

    <!-- 风险提示弹窗 -->
    <NModal
      v-if="dialogState.riskNotice.visible"
      v-model:show="dialogState.riskNotice.visible"
      :draggable="true"
      :show-mask="true"
      :block-scroll="true"
      :auto-focus="true"
      :trap-focus="true"
      :mask-closable="false"
      :close-on-esc="false"
      class="snapshot-floating-panel"
      :width="400"
    >
      <template #header>
        <div class="n-modal-header">
          <div class="n-modal-title">生成分享链接须知</div>
        </div>
      </template>
      <div class="p-10px">
        <div class="mb-8px">
          所有快照上传分享链接均为公开链接，任何人均可访问。
        </div>
        <div class="mb-12px">
          请确保快照不包含隐私信息，请勿分享任何敏感信息。
        </div>
        <NCheckbox v-model:checked="ignoreWarn" class="mb-12px">
          不再提醒
        </NCheckbox>
        <div class="flex justify-end gap-8px">
          <NButton @click="rejectRiskNotice">取消分享</NButton>
          <NButton type="primary" @click="acceptRiskNotice">继续上传</NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { message } from '@/utils/discrete';
import SvgIcon from './SvgIcon.vue';
import { getImportId } from '@/utils/url';
import { settingsStore } from '@/store/storage';
import { useDialogStore } from '@/store/dialog';
import { NModal, NButton, NInput, NCheckbox } from 'naive-ui';

const dialogStore = useDialogStore();
const dialogState = computed(() => dialogStore.state);

const officialUrl = computed(() => {
  const options = dialogState.value.shareLink.options;
  const content = options.content || '';
  const extraContent = options.extraContent || '';
  const importId = getImportId(content) || getImportId(extraContent);
  return importId ? `https://i.gkd.li/i/${importId}` : content;
});

const currentOriginUrl = computed(() => {
  const options = dialogState.value.shareLink.options;
  const content = options.content || '';
  const extraContent = options.extraContent || '';
  const importId = getImportId(content) || getImportId(extraContent);
  return options.extraContent
    ? options.extraContent
    : importId
      ? `${window.location.origin}/i/${importId}`
      : content;
});

const ignoreWarn = computed({
  get: () => settingsStore.ignoreUploadWarn,
  set: (value) => {
    settingsStore.ignoreUploadWarn = value;
  },
});

const close = (dialogName: string) => {
  dialogStore.close(dialogName);
};

const copy = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
};

const acceptRiskNotice = () => {
  dialogStore.resolve('riskNotice', true);
};

const rejectRiskNotice = () => {
  dialogStore.reject('riskNotice', 'cancel');
};
</script>

<style scoped>
.dialog-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
}

.dialog-container > * {
  pointer-events: auto;
}

.text-muted {
  color: var(--text-muted-color);
}

/* 确保可拖拽区域样式正确 */
.n-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: move;
}

.n-modal-title {
  font-size: 16px;
  font-weight: 500;
}

.n-modal-header__right {
  flex-shrink: 0;
}

/* 确保弹窗可见 */
.snapshot-floating-panel {
  z-index: 10000;
}
</style>
