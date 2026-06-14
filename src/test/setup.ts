/* eslint-disable vue/one-component-per-file */
import { vi } from 'vitest';
import { defineComponent, h } from 'vue';

globalThis.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/components/SvgIcon.vue', () => ({
  default: defineComponent({
    name: 'SvgIconStub',
    props: {
      name: { type: String, required: true },
    },
    setup(props: { name: string }) {
      return () => h('span', { 'data-testid': `svg-${props.name}` });
    },
  }),
}));

vi.mock('naive-ui', () => ({
  NTooltip: defineComponent({
    name: 'NTooltipStub',
    setup(_: unknown, { slots }: any) {
      return () => h('div', [slots.trigger?.(), slots.default?.()]);
    },
  }),
  NButton: defineComponent({
    name: 'NButtonStub',
    emits: ['click'],
    setup(_: unknown, { emit, slots }: any) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        );
    },
  }),
  NModal: defineComponent({
    name: 'NModalStub',
    props: {
      show: { type: Boolean, default: false },
    },
    setup(_: unknown, { slots }: any) {
      return () => h('div', { 'data-testid': 'modal' }, slots.default?.());
    },
  }),
  NSpin: defineComponent({
    name: 'NSpinStub',
    setup(_: unknown, { slots }: any) {
      return () => h('div', { 'data-testid': 'spin' }, slots.default?.());
    },
  }),
  NSpace: defineComponent({
    name: 'NSpaceStub',
    setup(_: unknown, { slots }: any) {
      return () => h('div', { 'data-testid': 'space' }, slots.default?.());
    },
  }),
  // 完美符合 Naive UI 契约的表单桩
  NCheckbox: defineComponent({
    name: 'NCheckboxStub',
    props: {
      checked: { type: Boolean, default: false },
    },
    emits: ['update:checked'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          type: 'checkbox',
          checked: props.checked,
          onChange: (e: Event) =>
            emit('update:checked', (e.target as HTMLInputElement).checked),
        });
    },
  }),
  NInput: defineComponent({
    name: 'NInputStub',
    props: {
      value: { type: String, default: '' },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          type: 'text',
          value: props.value,
          onInput: (e: Event) =>
            emit('update:value', (e.target as HTMLInputElement).value),
        });
    },
  }),
  NSelect: defineComponent({
    name: 'NSelectStub',
    props: {
      value: { type: [String, Number], default: '' },
      options: {
        type: Array,
        default: () => [] as any[],
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h(
          'select',
          {
            value: props.value as any,
            onChange: (e: Event) =>
              emit('update:value', (e.target as HTMLSelectElement).value),
          },
          (props.options as any[]).map((option: any) =>
            h('option', { value: option.value }, option.label),
          ),
        );
    },
  }),
  NMessageProvider: defineComponent({
    name: 'NMessageProviderStub',
    setup(_: unknown, { slots }: any) {
      return () =>
        h('div', { 'data-testid': 'message-provider' }, slots.default?.());
    },
  }),
  NDialogProvider: defineComponent({
    name: 'NDialogProviderStub',
    setup(_: unknown, { slots }: any) {
      return () =>
        h('div', { 'data-testid': 'dialog-provider' }, slots.default?.());
    },
  }),
}));

vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn(() => ({
    value: '',
  })),
  useEventListener: vi.fn(() => vi.fn()),
  useDebounceFn: vi.fn((fn: (...args: unknown[]) => void) => fn),
}));

vi.mock('@/store/global', () => ({
  useGlobalStore: vi.fn(() => ({
    ruleTest: {
      enabled: false,
      setEnabled: vi.fn(),
    },
  })),
}));

vi.mock('@/store/storage', () => ({
  useStorageStore: vi.fn(() => ({
    snapshots: [],
    selectedSnapshotId: null,
  })),
}));
