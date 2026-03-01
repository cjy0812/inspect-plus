import { useDialogStore, type DialogStoreState } from '@/store/dialog';
import { settingsStore } from '@/store/storage';

export class DialogService {
  private static instance: DialogService;
  private dialogStore: ReturnType<typeof useDialogStore>;

  private constructor() {
    // 在构造函数中初始化dialogStore，确保响应式系统已初始化
    this.dialogStore = useDialogStore();
    console.log('[DialogService] 初始化完成，dialogStore:', this.dialogStore);
  }

  public static getInstance(): DialogService {
    if (!DialogService.instance) {
      DialogService.instance = new DialogService();
    }
    return DialogService.instance;
  }

  /**
   * 打开分享链接弹窗
   */
  public async openShareLink(options: {
    title?: string;
    content?: string;
    extraContent?: string;
    extraTitle?: string;
    quickPick?: boolean;
  }) {
    console.log('[DialogService] 打开分享链接弹窗:', options);
    const result = this.dialogStore.open('shareLink', options);
    console.log('[DialogService] 弹窗状态:', this.dialogStore.state.shareLink);
    return result;
  }

  /**
   * 打开风险提示弹窗
   */
  public async openRiskNotice() {
    console.log('[DialogService] 打开风险提示弹窗');
    const result = this.dialogStore.open('riskNotice');
    console.log('[DialogService] 弹窗状态:', this.dialogStore.state.riskNotice);
    return result;
  }

  /**
   * 等待用户确认分享
   */
  public async waitShareAgree() {
    // 检查是否忽略警告
    if (settingsStore.ignoreUploadWarn) {
      console.log('[DialogService] 跳过分享警告：用户已设置忽略');
      return;
    }
    console.log('[DialogService] 显示分享警告弹窗');
    try {
      await this.openRiskNotice();
      console.log('[DialogService] 用户确认分享');
    } catch (error) {
      console.log('[DialogService] 用户取消分享:', error);
      // 重新抛出错误，让调用者知道用户取消了操作
      throw error;
    }
  }

  /**
   * 调试接口：获取当前弹窗状态
   */
  public getState(): DialogStoreState {
    const state = this.dialogStore.state;
    console.log('[DialogService] 当前弹窗状态:', state);
    return state;
  }

  /**
   * 调试接口：重置所有弹窗状态
   */
  public resetState() {
    console.log('[DialogService] 重置所有弹窗状态');
    Object.keys(this.dialogStore.state).forEach((key) => {
      this.dialogStore.state[key].visible = false;
      this.dialogStore.state[key].resolve = undefined;
      this.dialogStore.state[key].reject = undefined;
    });
  }
}

// 导出单例
export const dialogService = DialogService.getInstance();
