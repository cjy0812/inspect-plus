import { dialog, message } from './discrete';

export const showTextDLg = ({
  title = `批量分享链接`,
  content = '',
  extraContent = '',
  extraTitle = '自定义域链接',
}: {
  title?: string;
  content?: string;
  extraContent?: string;
  extraTitle?: string;
}) => {
  const copyText = async (text: string) => {
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success(`复制成功`);
      })
      .catch(() => {
        message.success(`复制失败`);
      });
  };

  dialog.success({
    title,
    class: 'snapshot-floating-panel',
    draggable: true,
    style: {
      width: `560px`,
    },
    content() {
      return (
        <NSpace vertical size={8}>
          <NInput
            type="textarea"
            class="snapshot-floating-panel"
            autosize={{
              minRows: 4,
              maxRows: 10,
            }}
            inputProps={{
              style: `white-space: nowrap;`,
              class: `gkd_code`,
            }}
            value={content}
          />
          {extraContent ? (
            <NSpace vertical size={4}>
              <div class="text-12px opacity-70">{extraTitle}</div>
              <NInput
                type="textarea"
                autosize={{ minRows: 2, maxRows: 6 }}
                inputProps={{
                  style: 'white-space: nowrap;',
                  class: 'gkd_code',
                }}
                value={extraContent}
              />
              <NButton size="small" onClick={() => copyText(extraContent)}>
                复制自定义域链接
              </NButton>
            </NSpace>
          ) : null}
        </NSpace>
      );
    },
    positiveText: `复制主链接`,
    onPositiveClick() {
      copyText(content);
      return false;
    },
  });
};

const NoticeCheckbox = defineComponent(() => {
  return () => {
    return (
      <NCheckbox
        checked={settingsStore.ignoreUploadWarn}
        onUpdateChecked={(value) => {
          settingsStore.ignoreUploadWarn = value;
        }}
        focusable={false}
      >
        不再提醒
      </NCheckbox>
    );
  };
});

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
