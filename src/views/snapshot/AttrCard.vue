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
  id: '控件资源 ID(R.id.xxx)',
  vid: '虚拟 ID,用于区分同类动态控件',
  name: '控件类名(如 TextView、ImageView)',
  text: '控件显示文本内容',
  textLen: 'text 的字符数量',
  desc: '无障碍描述(content-desc)',
  descLen: 'desc 的字符数量',
  isClickable: '控件是否可点击',
  childCount: '子节点数量',
  index: '在父节点中的位置序号',
  depth: '在控件树中的层级深度',
  left: '左边界坐标(像素)',
  top: '上边界坐标(像素)',
  right: '右边界坐标(像素)',
  bottom: '下边界坐标(像素)',
  width: '控件宽度(像素)',
  height: '控件高度(像素)',
  _id: '快照遍历序号',
  _pid: '父节点的遍历序号',
  'text.length': 'text 字段长度',
  'desc.length': 'desc 字段长度',
  _selector: '自动生成的选择器表达式',
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
            <NTooltip :delay="1600" placement="top-start">
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
