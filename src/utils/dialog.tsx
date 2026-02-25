/* eslint-disable vue/multi-word-component-names */
import { message, modal, dialog as discreteDialog } from './discrete';
import ConnectSvg from '@/assets/svg/Connect.svg';
import { getImportId } from './url';
import { settingsStore } from '@/store/storage';
import { defineComponent, h, computed } from 'vue';
import {
  NConfigProvider,
  NCard,
  NSpace,
  NButton,
  NInput,
  NGrid,
  NGi,
  NCheckbox,
} from 'naive-ui';
import { discreteAppTheme } from '@/theme';

const ShareDialogContent = defineComponent({
  props: {
    title: { type: String, default: '批量分享链接' },
    officialUrl: { type: String, required: true },
    currentOriginUrl: { type: String, required: true },
    extraTitle: { type: String, default: '自定义域链接' },
    quickPick: { type: Boolean, default: false },
    onClose: { type: Function, required: true },
  },
  setup(props) {
    // 鲁棒性判定：只要 discreteAppTheme.value 存在，即视为深色模式
    const isDark = computed(() => {
      const _isDark = !!discreteAppTheme.value;
      console.log('[DialogDebug] 响应式状态:', _isDark ? '深色' : '亮色');
      return _isDark;
    });

    const copyText = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        message.success('复制成功');
      } catch {
        message.error('复制失败');
      }
    };

    return () => (
      <NConfigProvider theme={discreteAppTheme.value}>
        <NCard
          class="snapshot-floating-panel snapshot-floating-panel--passthrough"
          size="small"
          style={{
            width: props.quickPick ? '520px' : '500px',
            overflow: 'hidden',
            backgroundColor: isDark.value ? '#18181c' : '#ffffff',
            transition: 'background-color 0.3s ease',
          }}
        >
          {{
            header: () => (
              <NSpace
                class="n-draggable"
                align="center"
                justify="space-between"
                style={{ width: '100%', cursor: 'move' }}
              >
                <NSpace align="center" size={8}>
                  <img
                    src={ConnectSvg}
                    style={{ width: '30px', height: '30px' }}
                  />
                  <span
                    style={{
                      fontWeight: '500',
                      color: isDark.value ? '#ffffff' : 'inherit',
                    }}
                  >
                    {props.title}
                  </span>
                </NSpace>
                <NButton
                  text
                  style={{ fontSize: '20px' }}
                  onClick={() => props.onClose()}
                >
                  {' '}
                  ×{' '}
                </NButton>
              </NSpace>
            ),
            default: () => (
              <NSpace vertical size={10}>
                <div class="flex flex-col gap-1">
                  <div
                    class="text-11px opacity-40 ml-1"
                    style={{ color: 'var(--n-text-color-disabled)' }}
                  >
                    {' '}
                    官方域 (i.gkd.li){' '}
                  </div>
                  <NInput
                    type="textarea"
                    autosize={{ minRows: 2, maxRows: 3 }}
                    inputProps={{
                      class: 'gkd_code',
                      readonly: 'true',
                      style: 'white-space: pre; font-size: 13px; padding: 6px;',
                    }}
                    value={props.officialUrl}
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <div
                    class="text-11px opacity-40 ml-1"
                    style={{ color: 'var(--n-text-color-disabled)' }}
                  >
                    {' '}
                    {props.extraTitle}{' '}
                  </div>
                  <NInput
                    type="textarea"
                    autosize={{ minRows: 2, maxRows: 3 }}
                    inputProps={{
                      class: 'gkd_code',
                      readonly: 'true',
                      style: 'white-space: pre; font-size: 13px; padding: 6px;',
                    }}
                    value={props.currentOriginUrl}
                  />
                </div>
              </NSpace>
            ),
            footer: () => (
              <NGrid cols={2} xGap={12}>
                <NGi>
                  <NButton
                    block
                    style={{
                      borderRadius: '7px',
                      fontWeight: 600,
                      // 【修正核心】：只要是选中的 success 状态，强制白色并加 !important
                      color: !settingsStore.shareUseOfficialImportDomain
                        ? '#ffffff !important'
                        : isDark.value
                          ? '#ffffff'
                          : '#000000',
                    }}
                    type={
                      !settingsStore.shareUseOfficialImportDomain
                        ? 'success'
                        : 'tertiary'
                    }
                    onClick={() => {
                      settingsStore.shareUseOfficialImportDomain = false;
                      void copyText(props.currentOriginUrl);
                      if (props.quickPick)
                        setTimeout(() => props.onClose(), 220);
                    }}
                  >
                    {' '}
                    当前域链接{' '}
                  </NButton>
                </NGi>
                <NGi>
                  <NButton
                    block
                    style={{
                      borderRadius: '7px',
                      fontWeight: 600,
                      // 【修正核心】：只要是选中的 success 状态，强制白色并加 !important
                      color: settingsStore.shareUseOfficialImportDomain
                        ? '#ffffff !important'
                        : isDark.value
                          ? '#ffffff'
                          : '#000000',
                    }}
                    type={
                      settingsStore.shareUseOfficialImportDomain
                        ? 'success'
                        : 'tertiary'
                    }
                    onClick={() => {
                      settingsStore.shareUseOfficialImportDomain = true;
                      void copyText(props.officialUrl);
                      if (props.quickPick)
                        setTimeout(() => props.onClose(), 220);
                    }}
                  >
                    {' '}
                    官方链接{' '}
                  </NButton>
                </NGi>
              </NGrid>
            ),
          }}
        </NCard>
      </NConfigProvider>
    );
  },
});

export const showTextDLg = (params: any) => {
  const { content = '', extraContent = '' } = params;
  const importId = getImportId(content) || getImportId(extraContent);
  const officialUrl = importId ? `https://i.gkd.li/i/${importId}` : content;
  const currentOriginUrl =
    extraContent ||
    (importId ? `${window.location.origin}/i/${importId}` : content);

  let reactiveModal: any = null;
  const close = () => reactiveModal?.destroy();

  reactiveModal = modal.create({
    draggable: true,
    showMask: false,
    maskClosable: false,
    closeOnEsc: true,
    render: () =>
      h(ShareDialogContent, {
        ...params,
        officialUrl,
        currentOriginUrl,
        onClose: close,
      }),
  });
};

const ShareNoticeCheckbox = defineComponent(() => {
  return () => (
    <NCheckbox
      checked={settingsStore.ignoreUploadWarn}
      onUpdateChecked={(val: boolean) => {
        settingsStore.ignoreUploadWarn = val;
      }}
      focusable={false}
    >
      {' '}
      不再提醒{' '}
    </NCheckbox>
  );
});

export const waitShareAgree = async () => {
  if (settingsStore.ignoreUploadWarn) return;
  return new Promise((resolve, reject) => {
    discreteDialog.warning({
      class: 'snapshot-floating-panel',
      title: '生成分享链接须知',
      content() {
        return (
          <div class="snapshot-floating-panel">
            <div>所有快照上传分享链接均为公开链接，任何人均可访问。</div>
            <div>请确保快照不包含隐私信息，请勿分享任何敏感信息。</div>
            <ShareNoticeCheckbox class="mt-10px" />
          </div>
        );
      },
      positiveText: '继续上传',
      negativeText: '取消分享',
      onPositiveClick: resolve,
      onNegativeClick: reject,
    });
  });
};
