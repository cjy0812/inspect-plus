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
}

export interface DialogStoreState {
  shareLink: DialogState;
  riskNotice: DialogState;
  [key: string]: DialogState;
}

export const useDialogStore = createGlobalState(() => {
  const callbacks = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

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
      callbacks.set(dialogName, { resolve, reject });
    });
  };

  const close = (dialogName: string) => {
    if (state[dialogName]) {
      // 确保异步链路闭环，防止内存泄漏
      const callback = callbacks.get(dialogName);
      if (callback) {
        callback.reject('cancel');
        callbacks.delete(dialogName);
      }
      state[dialogName].visible = false;
    }
  };

  const resolve = (dialogName: string, value: any) => {
    const callback = callbacks.get(dialogName);
    if (callback) {
      callback.resolve(value);
      callbacks.delete(dialogName);
    }
    // 自动关闭
    if (state[dialogName]) {
      state[dialogName].visible = false;
    }
  };

  const reject = (dialogName: string, reason?: any) => {
    const callback = callbacks.get(dialogName);
    if (callback) {
      callback.reject(reason);
      callbacks.delete(dialogName);
    }
    // 自动关闭
    if (state[dialogName]) {
      state[dialogName].visible = false;
    }
  };

  return {
    state,
    open,
    close,
    resolve,
    reject,
  };
});
