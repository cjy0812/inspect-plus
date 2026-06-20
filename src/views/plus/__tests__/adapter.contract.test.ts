/* eslint-disable vue/one-component-per-file */
/**
 * 适配器契约测试 — Plus 层路由适配器
 *
 * 验证目标：Plus 适配器是否忠实地将基座层 slot 暴露的数据/方法，
 * 透传给 Plus 子组件的 props。
 *
 * 测试策略：
 * - 用 stub 替换基座层和子组件层，只保留中间的 Plus 适配器为真实代码
 * - 检查 stub 基座吐出的数据是否原封不动地到达了 stub 子组件
 * - 不测试子组件内部逻辑，只测试"接线"是否正确
 */
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createStubComponent, mountWithStubs } from '@/test/utils';

// ============================================================
// Spies — 跨 stub 共享的 spy，用于验证事件是否正确传递
// ============================================================

const spies = vi.hoisted(() => ({
  setCheckedRowKeys: vi.fn(),
  refreshSnapshots: vi.fn(),
}));

// ============================================================
// Base Stubs — 模拟基座层组件，只暴露 slot 契约
// ============================================================

/**
 * 基座首页 stub
 * 契约：#content slot → { checkedRowKeys, setCheckedRowKeys, filterSnapshots, loading, updateSnapshots }
 */
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

/**
 * 基座设备页 stub
 * 契约：
 *   #server-actions slot → { captureSnapshot, downloadAllSnapshot }
 *   #content slot → { snapshots, refreshSnapshots, previewSnapshot, deleteSnapshot }
 */
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

// ============================================================
// Child Stubs — 模拟 Plus 子组件，只声明 prop 契约
// ============================================================

/**
 * HomeSnapshotGroups stub
 * 契约：props { checkedRowKeys, snapshots, loading, updateSnapshots }
 *       emits: update:checkedRowKeys
 */
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

/**
 * DeviceSnapshotGroups stub
 * 契约：props { checkedRowKeys, snapshots, refreshSnapshots, previewSnapshot, deleteSnapshot }
 *       emits: update:checkedRowKeys
 */
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

/**
 * SettingsModal stub
 * 契约：props { show: boolean }
 */
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

// ============================================================
// Helpers — 减少测试用例中的重复代码
// ============================================================

/**
 * 挂载 Plus DevicePage 并返回 wrapper + DeviceSnapshotGroupsStub 组件引用
 */
async function mountPlusDevicePage() {
  const { default: DevicePage } = await import('@/views/plus/DevicePage.vue');
  const wrapper = mountWithStubs(DevicePage);
  const groupsEl = wrapper.getComponent({ name: 'DeviceSnapshotGroupsStub' });
  return { wrapper, groupsEl };
}

/**
 * 断言某个 prop 符合批量任务结构 { loading: Record, invoke: Function }
 */
function expectBatchTaskProp(props: any, propName: string) {
  expect(props, `${propName} should be defined`).toBeDefined();
  expect(props, `${propName} should have 'loading'`).toHaveProperty('loading');
  expect(props, `${propName} should have 'invoke'`).toHaveProperty('invoke');
  expect(typeof props.invoke, `${propName}.invoke should be a function`).toBe(
    'function',
  );
}

// ============================================================
// Tests — 适配器契约验证
// ============================================================

describe('Plus route adapters', () => {
  // ---- HomePage 适配器 ----

  describe('HomePage adapter', () => {
    it('wires base HomePage content slot into HomeSnapshotGroups', async () => {
      const { default: HomePage } =
        await import('@/views/plus/home/HomePage.vue');
      const wrapper = mountWithStubs(HomePage);

      expect(wrapper.find('[data-testid="base-home-page"]').exists()).toBe(
        true,
      );
      expect(wrapper.get('[data-testid="home-snapshot-groups"]').text()).toBe(
        'home:2:1:false',
      );
    });

    it('forwards update:checkedRowKeys event from HomeSnapshotGroups to base setCheckedRowKeys', async () => {
      const { default: HomePage } =
        await import('@/views/plus/home/HomePage.vue');
      const wrapper = mountWithStubs(HomePage);

      await wrapper
        .get('[data-testid="home-snapshot-groups"]')
        .trigger('click');

      expect(spies.setCheckedRowKeys).toHaveBeenCalledWith([7, 8]);
    });
  });

  // ---- DevicePage 适配器 ----

  describe('DevicePage adapter', () => {
    it('renders base DevicePage with server-actions and content slots', async () => {
      const { wrapper } = await mountPlusDevicePage();

      expect(wrapper.find('[data-testid="base-device-page"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="device-control-tools"]').exists(),
      ).toBe(true);
      expect(wrapper.get('[data-testid="settings-modal"]').text()).toBe(
        'settings:false',
      );
      expect(wrapper.get('[data-testid="device-snapshot-groups"]').text()).toBe(
        'device:2:0',
      );
    });

    it('updates checkedRowKeys display when DeviceSnapshotGroups emits', async () => {
      const { wrapper } = await mountPlusDevicePage();

      await wrapper
        .get('[data-testid="device-snapshot-groups"]')
        .trigger('click');

      expect(wrapper.text()).toContain('已选中 2 个快照');
    });

    // ---- 批量任务 prop 透传验证 ----

    it('passes deleteSnapshot from base slot through to DeviceSnapshotGroups', async () => {
      const { groupsEl } = await mountPlusDevicePage();
      expectBatchTaskProp(groupsEl.props('deleteSnapshot'), 'deleteSnapshot');
    });

    it('passes previewSnapshot from base slot through to DeviceSnapshotGroups', async () => {
      const { groupsEl } = await mountPlusDevicePage();
      expectBatchTaskProp(groupsEl.props('previewSnapshot'), 'previewSnapshot');
    });

    // ---- 数据 prop 透传验证 ----

    it('passes snapshots array and refreshSnapshots function by reference', async () => {
      const { groupsEl } = await mountPlusDevicePage();

      expect(groupsEl.props('snapshots')).toEqual([{ id: 10 }, { id: 20 }]);
      expect(groupsEl.props('refreshSnapshots')).toBe(spies.refreshSnapshots);
    });

    // ---- 设置弹窗交互 ----

    it('toggles settings modal visibility on button click', async () => {
      const { wrapper } = await mountPlusDevicePage();

      expect(wrapper.get('[data-testid="settings-modal"]').text()).toBe(
        'settings:false',
      );

      const icon = wrapper.find('[data-testid="svg-settings"]');
      expect(icon.exists(), 'should find settings icon').toBe(true);
      const btn = icon.element.parentElement!;
      btn.click();
      await wrapper.vm.$nextTick();

      expect(wrapper.get('[data-testid="settings-modal"]').text()).toBe(
        'settings:true',
      );
    });
  });
});
