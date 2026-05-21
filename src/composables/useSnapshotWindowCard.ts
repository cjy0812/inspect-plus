import {
  computed,
  nextTick,
  shallowRef,
  watch,
  type HTMLAttributes,
  type Ref,
  type ShallowRef,
  type VNode,
} from 'vue';
import type { TreeInst, TreeOption, TreeProps } from 'naive-ui';
import {
  getAppInfo,
  getDevice,
  getGkdAppInfo,
  getNodeLabel,
  getNodeStyle,
} from '@/utils/node';
import { delay } from '@/utils/others';

type RenderLabelOverride = (props: {
  option: RawNode;
  label: string | VNode;
}) => VNode | string;

export function useSnapshotWindowCard(options: {
  snapshot: ShallowRef<Snapshot | undefined>;
  rootNode: ShallowRef<RawNode | undefined>;
  focusNode: ShallowRef<RawNode | undefined>;
  focusTime: Ref<number>;
  updateFocusNode: (node: RawNode) => void;
  treeContainer?: Readonly<ShallowRef<HTMLElement | null>>;
}) {
  let lastClickId = Number.NaN;
  const expandedKeys = shallowRef<number[]>([]);
  const selectedKeys = shallowRef<number[]>([]);
  const treeRef = shallowRef<TreeInst>();
  const toRawNode = (option: TreeOption): RawNode =>
    option as unknown as RawNode;
  const rootTreeData = computed<TreeOption[]>(() =>
    options.rootNode.value
      ? [options.rootNode.value as unknown as TreeOption]
      : [],
  );

  watch(
    [() => options.focusNode.value, () => options.focusTime.value],
    async () => {
      if (!options.focusNode.value) return;
      const key = options.focusNode.value.id;
      nextTick().then(async () => {
        await delay(300);
        if (key !== options.focusNode.value?.id) return;
        if (lastClickId === key) {
          lastClickId = Number.NaN;
          return;
        }
        selectedKeys.value = [key];
        const nodeRef = options.treeContainer?.value?.querySelector(
          `[data-node-id="${key}"]`,
        );
        if (nodeRef) {
          nodeRef.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          return;
        }
        await delay(options.treeContainer ? 300 : 0);
        treeRef.value?.scrollTo({ key, behavior: 'smooth', debounce: true });
      });

      let parent = options.focusNode.value.parent;
      if (!parent) return;
      const nextExpandedKeys = new Set(expandedKeys.value);
      while (parent) {
        nextExpandedKeys.add(parent.id);
        parent = parent.parent;
      }
      if (
        nextExpandedKeys.size == expandedKeys.value.length &&
        expandedKeys.value.every((v) => nextExpandedKeys.has(v))
      )
        return;
      expandedKeys.value = [...nextExpandedKeys];
    },
  );

  const treeFilter: NonNullable<TreeProps['filter']> = (_pattern, node) =>
    toRawNode(node).id === options.focusNode.value?.id;

  const treeNodeProps: NonNullable<TreeProps['nodeProps']> = ({
    option,
  }): HTMLAttributes & Record<string, unknown> => {
    const rawNode = toRawNode(option);
    const style = getNodeStyle(rawNode, options.focusNode.value);
    return {
      onClick: () => {
        lastClickId = rawNode.id;
        options.updateFocusNode(rawNode);
      },
      style: { '--n-node-text-color': style.color, ...style },
      class: 'whitespace-nowrap',
      'data-node-id': String(rawNode.id),
    };
  };

  const createRenderLabel =
    (override?: RenderLabelOverride): NonNullable<TreeProps['renderLabel']> =>
    ({ option }) => {
      const rawNode = toRawNode(option);
      const label = getNodeLabel(rawNode);
      return override?.({ option: rawNode, label }) ?? label;
    };

  const app = computed(() =>
    options.snapshot.value ? getAppInfo(options.snapshot.value) : null,
  );

  const deviceName = computed(() => {
    if (!options.snapshot.value) return '';
    const device = getDevice(options.snapshot.value);
    return `${device.manufacturer} Android ${device.release || ''}`;
  });

  const activityId = computed(() => {
    const snapshot = options.snapshot.value;
    if (!snapshot) return '';
    const { activityId: value, appId } = snapshot;
    if (!value || !appId) return '';
    return value.startsWith(appId) && value[appId.length] === '.'
      ? value.substring(appId.length)
      : value;
  });

  const gkdVersionName = computed(() => {
    if (!options.snapshot.value) return undefined;
    const versionName = getGkdAppInfo(options.snapshot.value).versionName;
    return versionName ? `GKD@${versionName}` : undefined;
  });

  const appVersionCodeText = computed(() => {
    const versionCode = app.value?.versionCode;
    return versionCode == null ? '' : String(versionCode);
  });

  const isSystem = computed(() => app.value?.isSystem ?? false);

  return {
    expandedKeys,
    selectedKeys,
    treeRef,
    rootTreeData,
    treeFilter,
    treeNodeProps,
    createRenderLabel,
    app,
    deviceName,
    activityId,
    gkdVersionName,
    appVersionCodeText,
    isSystem,
  };
}
