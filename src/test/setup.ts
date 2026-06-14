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
    setup(
      _: unknown,
      { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
    ) {
      return () => h('div', [slots.trigger?.(), slots.default?.()]);
    },
  }),
  NButton: defineComponent({
    name: 'NButtonStub',
    emits: ['click'],
    setup(
      _: unknown,
      {
        emit,
        slots,
      }: {
        emit: (e: string) => void;
        slots: Record<string, () => ReturnType<typeof h>>;
      },
    ) {
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
    setup(
      _: unknown,
      { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
    ) {
      return () => h('div', { 'data-testid': 'modal' }, slots.default?.());
    },
  }),
  NSpin: defineComponent({
    name: 'NSpinStub',
    setup(
      _: unknown,
      { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
    ) {
      return () => h('div', { 'data-testid': 'spin' }, slots.default?.());
    },
  }),
  NSpace: defineComponent({
    name: 'NSpaceStub',
    setup(
      _: unknown,
      { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
    ) {
      return () => h('div', { 'data-testid': 'space' }, slots.default?.());
    },
  }),
  NCheckbox: defineComponent({
    name: 'NCheckboxStub',
    props: {
      modelValue: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(
      props: { modelValue: boolean },
      { emit }: { emit: (e: string, v: boolean) => void },
    ) {
      return () =>
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          onChange: (e: Event) =>
            emit('update:modelValue', (e.target as HTMLInputElement).checked),
        });
    },
  }),
  NInput: defineComponent({
    name: 'NInputStub',
    props: {
      modelValue: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(
      props: { modelValue: string },
      { emit }: { emit: (e: string, v: string) => void },
    ) {
      return () =>
        h('input', {
          type: 'text',
          value: props.modelValue,
          onChange: (e: Event) =>
            emit('update:modelValue', (e.target as HTMLInputElement).value),
        });
    },
  }),
  NSelect: defineComponent({
    name: 'NSelectStub',
    props: {
      modelValue: { type: [String, Number], default: '' },
      options: {
        type: Array,
        default: () => [] as Array<{ label: string; value: string }>,
      },
    },
    emits: ['update:modelValue'],
    setup(
      props: {
        modelValue: string | number;
        options: Array<{ label: string; value: string }>;
      },
      { emit }: { emit: (e: string, v: string) => void },
    ) {
      return () =>
        h(
          'select',
          {
            value: props.modelValue,
            onChange: (e: Event) =>
              emit('update:modelValue', (e.target as HTMLSelectElement).value),
          },
          props.options.map((option: { label: string; value: string }) =>
            h('option', { value: option.value }, option.label),
          ),
        );
    },
  }),
  NMessageProvider: defineComponent({
    name: 'NMessageProviderStub',
    setup(
      _: unknown,
      { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
    ) {
      return () =>
        h('div', { 'data-testid': 'message-provider' }, slots.default?.());
    },
  }),
  NDialogProvider: defineComponent({
    name: 'NDialogProviderStub',
    setup(
      _: unknown,
      { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
    ) {
      return () =>
        h('div', { 'data-testid': 'dialog-provider' }, slots.default?.());
    },
  }),
}));

vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn(() => ({
    value: '',
  })),
  useEventListener: vi.fn(),
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
