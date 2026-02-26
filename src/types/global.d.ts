import '@gkd-kit/selector';

declare module '@gkd-kit/selector' {
  export interface QueryPath<T> {
    source: T;
    target: T;
    formatConnectOffset: string; // 必须保持为 string，与原定义一致
    operator?: {
      key: string;
    };
  }
}

declare global {
  interface RawNode {
    id: number;
    pid: number;
    quickFind?: boolean;
    attr: RawAttr;
    parent?: RawNode;
    children: RawNode[];
  }

  interface DeviceInfo {
    device: string;
    model: string;
    manufacturer: string;
    brand: string;
    sdkInt: number;
    release: string;
    gkdVersionCode?: number;
    gkdVersionName?: string;
  }

  interface ServerInfo {
    device: DeviceInfo;
    gkdAppInfo: AppInfo;
  }

  interface RawNode {
    id: number;
    pid: number;
    quickFind?: boolean;
    idQf?: boolean;
    textQf?: boolean;
    attr: RawAttr;
    parent?: RawNode;
    children: RawNode[];
  }

  interface RawAttr {
    id?: string;
    vid?: string;
    name: string;
    text?: string;
    desc?: string;
    isClickable: boolean;
    clickable?: boolean;
    focusable?: boolean;
    checkable?: boolean;
    checked?: boolean;
    editable?: boolean;
    longClickable?: boolean;
    visibleToUser?: boolean;
    childCount?: number;
    index?: number;
    depth?: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  }

  interface Overview {
    id: number;
    appId: string;
    activityId: string;
    screenWidth: number;
    screenHeight: number;
    isLandscape: boolean;
    appInfo: AppInfo;
    gkdAppInfo: AppInfo;
    appName?: string;
    appVersionName?: string;
    appVersionCode?: number;
  }

  interface Snapshot extends Overview {
    device: DeviceInfo;
    nodes: RawNode[];
  }

  interface AppInfo {
    id: string;
    name: string;
    versionCode: number;
    versionName?: string;
    isSystem: boolean;
    mtime: number;
    hidden: boolean;
  }

  interface RectX {
    bottom: number;
    left: number;
    right: number;
    top: number;
  }

  interface SizeExt {
    height: number;
    width: number;
  }

  interface Position {
    x: number;
    y: number;
  }

  interface TrackCardProps {
    nodes: RawNode[];
    queryResult: import('@gkd-kit/selector').QueryResult<RawNode>;
    selector: import('@/utils/selector').ResolvedSelector;
  }

  interface SelectorSearchResult {
    gkd: true;
    key: number;
    selector: import('@/utils/selector').ResolvedSelector;
    nodes: RawNode[];
    // 修复这里的泛型参数
    results: import('@gkd-kit/selector').QueryResult<RawNode>;
  }

  interface StringSearchResult {
    gkd: false;
    key: number;
    selector: string;
    nodes: RawNode[];
  }

  type SearchResult = SelectorSearchResult | StringSearchResult;

  interface SettingsStore {
    autoUploadImport: boolean;
    ignoreUploadWarn: boolean;
    ignoreWasmWarn: boolean;
    maxShowNodeSize: number;
    lowMemoryMode: boolean;
    themeMode: 'auto' | 'light' | 'dark';
    darkModeStart: string;
    darkModeEnd: string;
    autoExpandSnapshots: boolean;
    groupRemarks: Record<string, string>;
    shareUseOfficialImportDomain: boolean;
    shareCustomImportDomain: string;
    locale: 'zh' | 'en';
    debugMode?: boolean;
    showDebugTools?: boolean;
    focusNodeColor?: string;
    randomFocusNodeColorOnOpen: boolean;
    filterRandomVidQf: boolean;
  }

  interface GlobalStore {
    networkErrorDlgVisible: boolean;
    githubErrorDlgVisible: boolean;
    wasmErrorDlgVisible: boolean;
    wasmSupported?: boolean;
  }
}

// 必须导出空对象，使文件成为模块以支持 declare module 和 declare global
export {};
