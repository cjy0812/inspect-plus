import '@gkd-kit/selector';

type FastQueryIndicatorMeta = {
  support: boolean;
  local: boolean;
};

declare module '@gkd-kit/selector' {
  // The generic parameter comes from the upstream declaration we are merging.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface QueryPath<T> {
    // Keep the selector path formatting hook in the Plus layer so base typings
    // stay close to upstream.
    formatConnectOffset: string;
    operator?: {
      key: string;
    };
  }
}

declare global {
  interface SelectorSearchResult {
    fastQueryMeta?: FastQueryIndicatorMeta | null;
  }

  interface StringSearchResult {
    fastQueryMeta?: FastQueryIndicatorMeta | null;
  }

  interface SettingsStore {
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
}

export {};
