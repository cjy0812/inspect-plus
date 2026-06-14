/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const spies = vi.hoisted(() => ({
  setCheckedRowKeys: vi.fn(),
  refreshSnapshots: vi.fn(),
}));

vi.mock('@/views/home/HomePage.vue', () => ({
  default: defineComponent({
    name: 'BaseHomePageStub',
    setup(_, { slots }) {
      return () =>
        h(
          'section',
          { 'data-testid': 'base-home-page' },
          slots.content?.({
            checkedRowKeys: [1],
            setCheckedRowKeys: spies.setCheckedRowKeys,
            filterSnapshots: [{ id: 1 }, { id: 2 }],
            loading: false,
            updateSnapshots: vi.fn(),
          }),
        );
    },
  }),
}));

vi.mock('@/views/DevicePage.vue', () => ({
  default: defineComponent({
    name: 'BaseDevicePageStub',
    setup(_, { slots }) {
      const captureSnapshot = { loading: false, invoke: vi.fn() };
      const downloadAllSnapshot = { loading: false, invoke: vi.fn() };
      const previewSnapshot = { loading: {}, invoke: vi.fn() };
      const deleteSnapshot = { loading: {}, invoke: vi.fn() };
      return () =>
        h('section', { 'data-testid': 'base-device-page' }, [
          h(
            'div',
            { 'data-testid': 'device-server-actions' },
            slots['server-actions']?.({
              captureSnapshot,
              downloadAllSnapshot,
            }),
          ),
          h(
            'div',
            { 'data-testid': 'device-content' },
            slots.content?.({
              snapshots: [{ id: 10 }, { id: 20 }],
              refreshSnapshots: spies.refreshSnapshots,
              previewSnapshot,
              deleteSnapshot,
            }),
          ),
        ]);
    },
  }),
}));

vi.mock('@/components/plus/home/HomeSnapshotGroups.vue', () => ({
  default: defineComponent({
    name: 'HomeSnapshotGroupsStub',
    props: {
      checkedRowKeys: { type: Array, required: true },
      snapshots: { type: Array, required: true },
      loading: { type: Boolean, required: true },
      updateSnapshots: { type: Function, required: true },
    },
    emits: ['update:checkedRowKeys'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            'data-testid': 'home-snapshot-groups',
            onClick: () => emit('update:checkedRowKeys', [7, 8]),
          },
          `home:${props.snapshots.length}:${props.checkedRowKeys.length}:${props.loading}`,
        );
    },
  }),
}));

vi.mock('@/components/plus/device/DeviceControlTools.vue', () => ({
  default: defineComponent({
    name: 'DeviceControlToolsStub',
    setup() {
      return () => h('div', { 'data-testid': 'device-control-tools' });
    },
  }),
}));

vi.mock('@/components/plus/device/DeviceSnapshotGroups.vue', () => ({
  default: defineComponent({
    name: 'DeviceSnapshotGroupsStub',
    props: {
      checkedRowKeys: { type: Array, required: true },
      snapshots: { type: Array, required: true },
      refreshSnapshots: { type: Function, required: true },
      previewSnapshot: { type: Object, required: true },
      deleteSnapshot: { type: Object, required: true },
    },
    emits: ['update:checkedRowKeys'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            'data-testid': 'device-snapshot-groups',
            onClick: () => emit('update:checkedRowKeys', [10, 20]),
          },
          `device:${props.snapshots.length}:${props.checkedRowKeys.length}`,
        );
    },
  }),
}));

vi.mock('@/components/plus/settings/SettingsModal.vue', () => ({
  default: defineComponent({
    name: 'SettingsModalStub',
    props: {
      show: { type: Boolean, required: true },
    },
    setup(props) {
      return () =>
        h('div', { 'data-testid': 'settings-modal' }, `settings:${props.show}`);
    },
  }),
}));

vi.mock('@/components/SvgIcon.vue', () => ({
  default: defineComponent({
    name: 'SvgIconStub',
    props: {
      name: { type: String, required: true },
    },
    setup(props) {
      return () => h('span', { 'data-testid': `svg-${props.name}` });
    },
  }),
}));

const globalStubs = {
  NTooltip: defineComponent({
    name: 'NTooltipStub',
    setup(_, { slots }) {
      return () => h('div', [slots.trigger?.(), slots.default?.()]);
    },
  }),
  NButton: defineComponent({
    name: 'NButtonStub',
    emits: ['click'],
    setup(_, { emit, slots }) {
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
};

describe('Plus route adapters', () => {
  it('wires HomePage content slot into the base home page', async () => {
    const { default: HomePage } =
      await import('@/views/plus/home/HomePage.vue');
    const wrapper = mount(HomePage, {
      global: {
        stubs: globalStubs,
      },
    });

    expect(wrapper.find('[data-testid="base-home-page"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="home-snapshot-groups"]').text()).toBe(
      'home:2:1:false',
    );

    await wrapper.get('[data-testid="home-snapshot-groups"]').trigger('click');
    expect(spies.setCheckedRowKeys).toHaveBeenCalledWith([7, 8]);
  });

  it('wires DevicePage action and content slots into the base device page', async () => {
    const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
    const wrapper = mount(DevicePage, {
      global: {
        stubs: globalStubs,
      },
    });

    expect(wrapper.find('[data-testid="base-device-page"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="device-control-tools"]').exists()).toBe(
      true,
    );
    expect(wrapper.get('[data-testid="settings-modal"]').text()).toBe(
      'settings:false',
    );
    expect(wrapper.get('[data-testid="device-snapshot-groups"]').text()).toBe(
      'device:2:0',
    );

    await wrapper
      .get('[data-testid="device-snapshot-groups"]')
      .trigger('click');
    expect(wrapper.text()).toContain('已选中 2 个快照');
  });
});
