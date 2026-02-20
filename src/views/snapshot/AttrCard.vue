<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { getNodeSelectorText } from '@/utils/node';
import { buildEmptyFn, copy } from '@/utils/others';
import { useSnapshotStore } from './snapshot';

withDefaults(
  defineProps<{
    show: boolean;
    onUpdateShow?: (data: boolean) => void;
  }>(),
  {
    onUpdateShow: buildEmptyFn,
  },
);

const { focusNode } = useSnapshotStore();

type AttrTipMap = Record<
  string,
  { desc: string; type: 'info' | 'quickFind'; show?: boolean }
>;

const attrTip = computed<AttrTipMap>(() => {
  const node = focusNode.value;
  if (!node) return {};
  return {
    _id: {
      desc: `虚拟属性(真机不可用):生成快照访问节点顺序`,
      type: 'info',
      show: true,
    },
    _pid: {
      desc: `虚拟属性(真机不可用):父节点的 _id`,
      type: 'info',
      show: true,
    },
    _selector: {
      desc: `自动生成的选择器, 点击“_selector”可直接复制内容, 用于定位`,
      type: 'info',
      show: true,
    },
    depth: {
      desc: `使用此属性在某些应用上可能造成无限节点错误`,
      type: 'info',
      show: true,
    },
    id: {
      desc: `可快速查找`,
      type: 'quickFind',
      show: Boolean((node.quickFind || node.idQf) && node.attr.id),
    },
    vid: {
      desc: `可快速查找`,
      type: 'quickFind',
      show: Boolean((node.quickFind || node.idQf) && node.attr.vid),
    },
    text: {
      desc: `可快速查找`,
      type: 'quickFind',
      show: Boolean((node.quickFind || node.textQf) && node.attr.text),
    },
  } as AttrTipMap;
});

const lenAttrNames = [`text`, `desc`];
const attrs = computed(() => {
  if (!focusNode.value) return [];
  return Object.entries(focusNode.value.attr)
    .map(([name, value]) => {
      const attr = {
        name,
        value,
        desc: JSON.stringify(value),
        tip: attrTip.value[name]?.show ? attrTip.value[name] : undefined,
      };
      if (lenAttrNames.includes(name)) {
        return [
          attr,
          {
            name: name + `.length`,
            value: (value as string)?.length ?? null,
            desc: JSON.stringify((value as string)?.length ?? null),
            tip: undefined,
          },
        ];
      }
      return attr;
    })
    .flat();
});

const selectText = computed(() => {
  if (!focusNode.value) return '';
  return getNodeSelectorText(focusNode.value);
});

const attrExplainMap: Record<string, string> = {
  id: '控件资源 ID，通常最稳定，常用于构建精准选择器。',
  vid: '虚拟 ID，部分场景可辅助定位同类控件。',
  name: '控件类型名，表示当前节点的组件/类名。',
  text: '控件文本内容，适合定位按钮、标题等可见文案。',
  textLen: '文本长度，便于快速过滤长文本节点。',
  desc: '无障碍描述信息，常见于图标按钮。',
  descLen: '描述文本长度，用于补充筛选条件。',
  isClickable: '是否可点击，可用于判断交互节点。',
  childCount: '子节点数量，用于识别容器节点结构。',
  index: '在父节点中的序号，结构变动时稳定性一般。',
  depth: '节点深度，层级过深时通常更脆弱。',
  left: '节点左边界像素坐标。',
  top: '节点上边界像素坐标。',
  right: '节点右边界像素坐标。',
  bottom: '节点下边界像素坐标。',
  width: '节点宽度（像素）。',
  height: '节点高度（像素）。',
  _id: '快照生成时的遍历序号，仅用于本地分析。',
  _pid: '父节点的 _id，用于还原树结构。',
  'text.length': 'text 字段的字符数量。',
  'desc.length': 'desc 字段的字符数量。',
  _selector: '自动生成的节点选择器表达式。',
};

const getAttrExplain = (name: string) => {
  return (
    attrExplainMap[name] || '该属性用于描述节点特征，可结合其他字段一起定位。'
  );
};
</script>

<template>
  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 40, right: 10 }"
    class="box-shadow-dim"
    :show="show && Boolean(focusNode)"
  >
    <div absolute top-0 right-0 pt-4px pr-8px>
      <NButton text title="最小化" @click="onUpdateShow(!show)">
        <template #icon>
          <SvgIcon name="minus" />
        </template>
      </NButton>
    </div>
    <NTable
      v-if="focusNode"
      size="small"
      striped
      :singleLine="false"
      class="gkd_code"
      :themeOverrides="{
        thPaddingSmall: '1px 3px',
        tdPaddingSmall: '0px 3px',
      }"
    >
      <thead>
        <tr :ref="onRef" cursor-move>
          <th>Name</th>
          <th>Value</th>
        </tr>
      </thead>
      <NTbody>
        <NTr v-for="attrx in attrs" :key="attrx.name">
          <NTd @click="copy(`${attrx.name}=${attrx.desc}`)">
            <NTooltip :delay="2000" placement="top-start">
              <template #trigger>
                <div v-if="attrx.tip" flex justify-between items-center>
                  <div>
                    {{ attrx.name }}
                  </div>
                  <NTooltip>
                    <template #trigger>
                      <NIcon size="16">
                        <SvgIcon v-if="attrx.tip.type == 'info'" name="info" />
                        <SvgIcon
                          v-else-if="attrx.tip.type == 'quickFind'"
                          name="ok"
                        />
                      </NIcon>
                    </template>
                    {{ attrx.tip.desc }}
                  </NTooltip>
                </div>
                <template v-else>
                  {{ attrx.name }}
                </template>
              </template>
              {{ getAttrExplain(attrx.name) }}
            </NTooltip>
          </NTd>
          <NTd>
            <NEllipsis
              class="w-[calc(var(--gkd-w)*0.12)]"
              :class="{
                'text-left direction-rtl': attrx.name == 'id',
                'opacity-50': attrx.value === null,
              }"
            >
              {{ attrx.desc }}
            </NEllipsis>
          </NTd>
        </NTr>
        <NTr>
          <NTd colspan="2">
            <div flex items-center h-24px px-2px>
              <NTooltip>
                <template #trigger>
                  <NButton text @click="copy(selectText)">
                    <template #icon>
                      <NIcon size="20">
                        <SvgIcon name="path" />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div max-w-500px>
                  {{ selectText }}
                </div>
              </NTooltip>
            </div>
          </NTd>
        </NTr>
      </NTbody>
    </NTable>
  </DraggableCard>
</template>
