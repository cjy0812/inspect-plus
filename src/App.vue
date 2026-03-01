<script setup lang="ts">
import { dateZhCN, zhCN, type GlobalThemeOverrides } from 'naive-ui';
import { RouterView } from 'vue-router';
import ErrorDlg from './components/ErrorDlg.vue';
import DialogContainer from './components/DialogContainer.vue';
import { ScrollbarWrapper } from './utils/others';
import { debounce } from 'lodash-es';
import { useTheme } from './composables/plus/useTheme';

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

const { appTheme } = useTheme();
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
    <DialogContainer />
  </NConfigProvider>
  <ScrollbarWrapper />
</template>
