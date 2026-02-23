import { message, modal, dialog } from './discrete';
import ConnectSvg from '@/assets/svg/Connect.svg';
import { getImportId } from './url';
import { settingsStore } from '@/store/storage';
import { defineComponent } from 'vue';

// 1. 分享链接弹窗 (使用 modal 实现非阻塞)
export const showTextDLg = ({
  title = '批量分享链接',
  content = '',
  extraContent = '',
  extraTitle = '自定义域链接',
  quickPick = false,
}: {
  title?: string;
  content?: string;
  extraContent?: string;
  extraTitle?: string;
  quickPick?: boolean;
}) => {
  const copyText = async (text: string) => {
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success('复制成功');
      })
      .catch(() => {
        message.error('复制失败');
      });
  };

  const importId = getImportId(content) || getImportId(extraContent);
  const officialUrl = importId ? `https://i.gkd.li/i/${importId}` : content;
  const currentOriginUrl = extraContent
    ? extraContent
    : importId
      ? `${window.location.origin}/i/${importId}`
      : content;

  let reactive: ReturnType<typeof modal.create> | null = null;
  const close = () => {
    reactive?.destroy();
  };

  reactive = modal.create({
    draggable: true,
    showMask: false,
    blockScroll: false,
    autoFocus: false,
    trapFocus: false,
    maskClosable: false,
    closeOnEsc: true,
    render: () => (
      <NCard
        class="snapshot-floating-panel snapshot-floating-panel--passthrough"
        size="small"
        style={{
          width: quickPick ? '520px' : '500px',
          borderRadius: '10px',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
          overflow: 'hidden',
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
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: '500' }}>{title}</span>
              </NSpace>
              <NButton text style={{ fontSize: '20px' }} onClick={close}>
                ×
              </NButton>
            </NSpace>
          ),
          default: () => (
            <NSpace vertical size={10}>
              <div class="flex flex-col gap-1">
                <div class="text-11px opacity-40 ml-1">官方域 (i.gkd.li)</div>
                <NInput
                  type="textarea"
                  autosize={{ minRows: 2, maxRows: 3 }}
                  inputProps={{
                    class: 'gkd_code',
                    wrap: 'off',
                    spellcheck: false,
                    readonly: true,
                    style: 'white-space: pre; font-size: 13px; padding: 6px;',
                  }}
                  value={officialUrl}
                />
              </div>
              <div class="flex flex-col gap-1">
                <div class="text-11px opacity-40 ml-1">{extraTitle}</div>
                <NInput
                  type="textarea"
                  autosize={{ minRows: 2, maxRows: 3 }}
                  inputProps={{
                    class: 'gkd_code',
                    wrap: 'off',
                    spellcheck: false,
                    readonly: true,
                    style: 'white-space: pre; font-size: 13px; padding: 6px;',
                  }}
                  value={currentOriginUrl}
                />
              </div>
            </NSpace>
          ),
          footer: () => (
            <NGrid cols={2} xGap={12}>
              <NGi>
                <NButton
                  block
                  style={{ borderRadius: '7px', fontWeight: 600 }}
                  type={
                    !settingsStore.shareUseOfficialImportDomain
                      ? 'success'
                      : 'tertiary'
                  }
                  onClick={() => {
                    settingsStore.shareUseOfficialImportDomain = false;
                    void copyText(currentOriginUrl);
                    if (quickPick) setTimeout(close, 220);
                  }}
                >
                  当前域链接
                </NButton>
              </NGi>
              <NGi>
                <NButton
                  block
                  style={{ borderRadius: '7px', fontWeight: 600 }}
                  type={
                    settingsStore.shareUseOfficialImportDomain
                      ? 'success'
                      : 'tertiary'
                  }
                  onClick={() => {
                    settingsStore.shareUseOfficialImportDomain = true;
                    void copyText(officialUrl);
                    if (quickPick) setTimeout(close, 220);
                  }}
                >
                  官方链接
                </NButton>
              </NGi>
            </NGrid>
          ),
        }}
      </NCard>
    ),
  });
};

// 2. 配套勾选框组件
const NoticeCheckbox = defineComponent(() => {
  return () => (
    <NCheckbox
      checked={settingsStore.ignoreUploadWarn}
      onUpdateChecked={(val: boolean) => {
        settingsStore.ignoreUploadWarn = val;
      }}
      focusable={false}
    >
      不再提醒
    </NCheckbox>
  );
});

// 3. 风险提示弹窗 (改回使用 dialog.warning，确保强制阻断)
export const waitShareAgree = async () => {
  if (settingsStore.ignoreUploadWarn) return;
  return new Promise((resolve, reject) => {
    dialog.warning({
      class: 'snapshot-floating-panel',
      title: '生成分享链接须知',
      content() {
        return (
          <div class="snapshot-floating-panel">
            <div>所有快照上传分享链接均为公开链接，任何人均可访问。</div>
            <div>请确保快照不包含隐私信息，请勿分享任何敏感信息。</div>
            <NoticeCheckbox class="mt-10px" />
          </div>
        );
      },
      closable: false,
      closeOnEsc: false,
      maskClosable: false,
      positiveText: '继续上传',
      negativeText: '取消分享',
      onPositiveClick: resolve,
      onNegativeClick: reject,
    });
  });
};
