<script setup lang="ts">
import { darkTheme, dateZhCN, zhCN, type GlobalThemeOverrides } from 'naive-ui';
import { RouterView } from 'vue-router';
import ErrorDlg from './components/ErrorDlg.vue';
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

const parseClock = (value: string): number | null => {
  const [hourText = '', minuteText = ''] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
};

const appTheme = computed(() => {
  if (settingsStore.themeMode == 'dark') {
    return darkTheme;
  }
  if (settingsStore.themeMode == 'light') {
    return null;
  }
  const darkStart = parseClock(settingsStore.darkModeStart) ?? 18 * 60;
  const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes();
  return currentMinutes >= darkStart ? darkTheme : null;
});

watchEffect(() => {
  document.documentElement.classList.toggle(
    'low-memory-mode',
    settingsStore.lowMemoryMode,
  );
  document.documentElement.classList.toggle(
    'dark-mode-active',
    Boolean(appTheme.value),
  );
});
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
