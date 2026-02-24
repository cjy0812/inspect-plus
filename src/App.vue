<script setup lang="ts">
import { darkTheme, dateZhCN, zhCN, type GlobalThemeOverrides } from 'naive-ui';
import { RouterView } from 'vue-router';
import ErrorDlg from './components/ErrorDlg.vue';
import { isInDarkRange, parseClock } from './utils/clock';
import { ScrollbarWrapper } from './utils/others';
import { debounce } from 'lodash-es';

const themeOverrides: GlobalThemeOverrides = {
  common: {
    lineHeight: '20px',
  },
};

const freeActiveElement = debounce(() => {
  if (document.activeElement instanceof HTMLButtonElement) {
    document.activeElement.blur();
  }
}, 1000);
useEventListener('click', () => {
  freeActiveElement();
});

const { settingsStore } = useStorageStore();
const now = useNow({ interval: 60_000 });

const appTheme = computed(() => {
  if (settingsStore.themeMode == 'dark') {
    return darkTheme;
  }
  if (settingsStore.themeMode == 'light') {
    return null;
  }
  const darkStart = parseClock(settingsStore.darkModeStart) ?? 18 * 60;
  const darkEnd = parseClock(settingsStore.darkModeEnd) ?? 6 * 60;
  const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes();
  return isInDarkRange(currentMinutes, darkStart, darkEnd) ? darkTheme : null;
});

const isDarkModeActive = computed(() => Boolean(appTheme.value));

watch(
  [() => settingsStore.lowMemoryMode, () => isDarkModeActive.value],
  ([lowMemoryMode, darkModeActive]) => {
    document.documentElement.classList.toggle('low-memory-mode', lowMemoryMode);
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
</script>
<template>
  <NConfigProvider
    abstract
    :locale="zhCN"
    :dateLocale="dateZhCN"
    :theme="appTheme"
    :themeOverrides="themeOverrides"
  >
    <ErrorDlg />
    <RouterView />
  </NConfigProvider>
  <ScrollbarWrapper />
</template>
