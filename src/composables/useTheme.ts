import { darkTheme } from 'naive-ui';
import { isInDarkRange, parseClock } from '@/utils/clock';

export const useTheme = () => {
  const { settingsStore } = useStorageStore();
  const now = useNow({ interval: 60_000 });
  const prefersDark = usePreferredDark();

  const isTimeDark = computed(() => {
    const darkStart = parseClock(settingsStore.darkModeStart) ?? 18 * 60;
    const darkEnd = parseClock(settingsStore.darkModeEnd) ?? 6 * 60;
    const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes();
    return isInDarkRange(currentMinutes, darkStart, darkEnd);
  });

  const isDarkModeActive = computed(() => {
    if (settingsStore.themeMode == 'dark') return true;
    if (settingsStore.themeMode == 'light') return false;
    return prefersDark.value || isTimeDark.value;
  });

  const appTheme = computed(() => (isDarkModeActive.value ? darkTheme : null));

  watch(
    [() => settingsStore.lowMemoryMode, () => isDarkModeActive.value],
    ([lowMemoryMode, darkModeActive]) => {
      document.documentElement.classList.toggle(
        'low-memory-mode',
        lowMemoryMode,
      );
      document.documentElement.classList.toggle(
        'dark-mode-active',
        darkModeActive,
      );
      document.documentElement.style.colorScheme = darkModeActive
        ? 'dark'
        : 'light';
    },
    { immediate: true, flush: 'sync' },
  );

  return {
    appTheme,
    isDarkModeActive,
  };
};
