import { shallowReactive } from 'vue';
import { createGlobalState } from '@vueuse/core';

interface DialogOptions {
  title?: string;
  content?: string;
  extraContent?: string;
  extraTitle?: string;
  quickPick?: boolean;
  [key: string]: any;
}

interface DialogState {
  visible: boolean;
  options: DialogOptions;
  resolve?: (value: any) => void;
  reject?: (reason?: any) => void;
}

export interface DialogStoreState {
  shareLink: DialogState;
  riskNotice: DialogState;
  [key: string]: DialogState;
}

export const useDialogStore = createGlobalState(() => {
  const state = shallowReactive<DialogStoreState>({
    shareLink: {
      visible: false,
      options: {
        title: '批量分享链接',
        content: '',
        extraContent: '',
        extraTitle: '自定义域链接',
        quickPick: false,
      },
    },
    riskNotice: {
      visible: false,
      options: {},
    },
  });

  const open = (dialogName: string, options: DialogOptions = {}) => {
    if (!state[dialogName]) {
      state[dialogName] = {
        visible: false,
        options: {},
      };
    }

    state[dialogName].options = { ...state[dialogName].options, ...options };
    state[dialogName].visible = true;

    // 返回 Promise 以便调用者可以等待用户操作
    return new Promise((resolve, reject) => {
      state[dialogName].resolve = resolve;
      state[dialogName].reject = reject;
    });
  };

  const close = (dialogName: string) => {
    if (state[dialogName]) {
      // 确保异步链路闭环，防止内存泄漏
      if (state[dialogName].reject) {
        state[dialogName].reject('cancel');
      }
      state[dialogName].visible = false;
      // 清理 resolve/reject
      state[dialogName].resolve = undefined;
      state[dialogName].reject = undefined;
    }
  };

  const resolve = (dialogName: string, value: any) => {
    if (state[dialogName]?.resolve) {
      state[dialogName].resolve(value);
    }
    // 自动关闭
    close(dialogName);
  };

  const reject = (dialogName: string, reason?: any) => {
    if (state[dialogName]?.reject) {
      state[dialogName].reject(reason);
    }
    // 自动关闭
    close(dialogName);
  };

  return {
    state,
    open,
    close,
    resolve,
    reject,
  };
});
