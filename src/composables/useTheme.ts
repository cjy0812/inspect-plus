import { darkTheme } from 'naive-ui';

export const useTheme = () => {
  const { settingsStore } = useStorageStore();
  const prefersDark = usePreferredDark();

  const isDarkModeActive = computed(() => {
    if (settingsStore.themeMode == 'dark') return true;
    if (settingsStore.themeMode == 'light') return false;
    return prefersDark.value;
  });

  const appTheme = computed(() => (isDarkModeActive.value ? darkTheme : null));

  const themeTokens = shallowRef({
    graphNodeFill: '',
    graphLeafFill: '',
    graphLabelColor: '',
    graphTargetLabelStroke: '',
    graphEdgeStroke: '',
    graphEdgeFallbackStroke: '',
    graphEdgeLabelColor: '',
    graphEdgeLabelBgStroke: '',
    palette: [] as string[],
  });

  const readThemeTokens = () => {
    if (typeof document === 'undefined') return;
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string) => styles.getPropertyValue(name).trim();
    const palette: string[] = [];
    for (let i = 1; i <= 16; i++) {
      const v = read(`--palette-${i}`);
      if (v) palette.push(v);
    }
    themeTokens.value = {
      graphNodeFill: read('--graph-node-fill'),
      graphLeafFill: read('--graph-leaf-fill'),
      graphLabelColor: read('--graph-label-color'),
      graphTargetLabelStroke: read('--graph-target-label-stroke'),
      graphEdgeStroke: read('--graph-edge-stroke'),
      graphEdgeFallbackStroke: read('--graph-edge-fallback-stroke'),
      graphEdgeLabelColor: read('--graph-edge-label-color'),
      graphEdgeLabelBgStroke: read('--graph-edge-label-bg-stroke'),
      palette,
    };
  };

  watch(
    [() => settingsStore.lowMemoryMode, () => isDarkModeActive.value],
    ([lowMemoryMode, darkModeActive]) => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      root.classList.toggle('low-memory-mode', lowMemoryMode);
      root.classList.toggle('dark-mode-active', darkModeActive);
      root.dataset.theme = darkModeActive ? 'dark' : 'light';
      root.style.colorScheme = darkModeActive ? 'dark' : 'light';
    },
    { immediate: true, flush: 'sync' },
  );
  watch(isDarkModeActive, readThemeTokens, { immediate: true, flush: 'sync' });

  return {
    appTheme,
    isDarkModeActive,
    themeTokens,
  };
};
