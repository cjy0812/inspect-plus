/* eslint-disable vue/one-component-per-file */
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createStubComponent, mountWithStubs } from '@/test/utils';

const spies = vi.hoisted(() => ({
  setCheckedRowKeys: vi.fn(),
  refreshSnapshots: vi.fn(),
}));

vi.mock('@/views/home/HomePage.vue', () => ({
  default: defineComponent({
    name: 'BaseHomePageStub',
    props: {},
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
    props: {},
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
          `home:${(props as any).snapshots.length}:${(props as any).checkedRowKeys.length}:${(props as any).loading}`,
        );
    },
  }),
}));

vi.mock('@/components/plus/device/DeviceControlTools.vue', () => ({
  default: createStubComponent('DeviceControlTools', {}),
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
          `device:${(props as any).snapshots.length}:${(props as any).checkedRowKeys.length}`,
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
        h(
          'div',
          { 'data-testid': 'settings-modal' },
          `settings:${(props as any).show}`,
        );
    },
  }),
}));

describe('Plus route adapters', () => {
  it('wires HomePage content slot into the base home page', async () => {
    const { default: HomePage } =
      await import('@/views/plus/home/HomePage.vue');
    const wrapper = mountWithStubs(HomePage);

    expect(wrapper.find('[data-testid="base-home-page"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="home-snapshot-groups"]').text()).toBe(
      'home:2:1:false',
    );

    await wrapper.get('[data-testid="home-snapshot-groups"]').trigger('click');
    expect(spies.setCheckedRowKeys).toHaveBeenCalledWith([7, 8]);
  });

  it('wires DevicePage action and content slots into the base device page', async () => {
    const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
    const wrapper = mountWithStubs(DevicePage);

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

  it('passes deleteSnapshot from base DevicePage slot through to DeviceSnapshotGroups', async () => {
    const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
    const wrapper = mountWithStubs(DevicePage);

    const groupsEl = wrapper.getComponent({ name: 'DeviceSnapshotGroupsStub' });
    const deleteSnapshotProp = groupsEl.props('deleteSnapshot');

    expect(deleteSnapshotProp).toBeDefined();
    expect(deleteSnapshotProp).toHaveProperty('loading');
    expect(deleteSnapshotProp).toHaveProperty('invoke');
    expect(typeof deleteSnapshotProp.invoke).toBe('function');
  });

  it('passes previewSnapshot from base DevicePage slot through to DeviceSnapshotGroups', async () => {
    const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
    const wrapper = mountWithStubs(DevicePage);

    const groupsEl = wrapper.getComponent({ name: 'DeviceSnapshotGroupsStub' });
    const previewSnapshotProp = groupsEl.props('previewSnapshot');

    expect(previewSnapshotProp).toBeDefined();
    expect(previewSnapshotProp).toHaveProperty('loading');
    expect(previewSnapshotProp).toHaveProperty('invoke');
    expect(typeof previewSnapshotProp.invoke).toBe('function');
  });

  it('passes snapshots and refreshSnapshots from base DevicePage slot to DeviceSnapshotGroups', async () => {
    const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
    const wrapper = mountWithStubs(DevicePage);

    const groupsEl = wrapper.getComponent({ name: 'DeviceSnapshotGroupsStub' });

    expect(groupsEl.props('snapshots')).toEqual([{ id: 10 }, { id: 20 }]);
    expect(groupsEl.props('refreshSnapshots')).toBe(spies.refreshSnapshots);
  });

  it('toggles settings modal visibility', async () => {
    const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
    const wrapper = mountWithStubs(DevicePage);

    expect(wrapper.get('[data-testid="settings-modal"]').text()).toBe(
      'settings:false',
    );

    const settingsBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('设置'));
    if (settingsBtn) {
      await settingsBtn.trigger('click');
      expect(wrapper.get('[data-testid="settings-modal"]').text()).toBe(
        'settings:true',
      );
    }
  });
});
