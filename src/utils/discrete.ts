import { createDiscreteApi, type ConfigProviderProps } from 'naive-ui';
import { computed } from 'vue';
import { discreteAppTheme } from '@/theme';

const configProviderProps = computed<ConfigProviderProps>(() => ({
  theme: discreteAppTheme.value,
}));

const { message, dialog, loadingBar, modal } = createDiscreteApi(
  ['message', 'dialog', 'loadingBar', 'modal'],
  {
    configProviderProps,
  },
);
export { message, dialog, loadingBar, modal };
