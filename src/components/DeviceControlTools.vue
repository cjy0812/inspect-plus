<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { useDeviceControlTools } from '@/composables/plus/useDeviceControlTools';
import type { TooltipProps } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    iconSize?: string;
    tooltipPlacement?: TooltipProps['placement'];
  }>(),
  { iconSize: 'var(--app-icon-size)', tooltipPlacement: 'right' },
);

const {
  showSubsModel,
  subsText,
  parsedCandidates,
  selectedCandidateKeys,
  selectAllCandidates,
  clearCandidateSelection,
  invertCandidateSelection,
  parseCandidates,
  updateSubs,
  showSelectorModel,
  actionOptions,
  clickAction,
  execSelector,
} = useDeviceControlTools();

type CandidateTreeOption = {
  key: string;
  label: string;
  children?: CandidateTreeOption[];
  checkboxDisabled?: boolean;
};

const candidateTreeOptions = computed<CandidateTreeOption[]>(() => {
  const appRoot: CandidateTreeOption = {
    key: '__branch__:apps',
    label: 'Apps',
    children: [],
  };
  const globalRoot: CandidateTreeOption = {
    key: '__branch__:global',
    label: 'GlobalGroups',
    checkboxDisabled: true,
    children: [],
  };
  const categoryRoot: CandidateTreeOption = {
    key: '__branch__:categories',
    label: 'Categories',
    checkboxDisabled: true,
    children: [],
  };
  const appMap = new Map<string, CandidateTreeOption>();

  const normalizeLeafLabel = (text: string) => {
    if (text.startsWith('AppGroup: ')) {
      const idx = text.indexOf(' / ');
      return idx >= 0 ? text.substring(idx + 3) : text;
    }
    return text;
  };

  parsedCandidates.value.forEach((item) => {
    if (item.kind === 'app') {
      const app = item.payload.apps?.[0];
      const appId = app?.id || '(unknown)';
      const appName = app?.name || appId;
      const appKey = `__branch__:app:${appId}`;
      let appNode = appMap.get(appKey);
      if (!appNode) {
        appNode = {
          key: appKey,
          label: `${appName} (${appId})`,
          children: [],
        };
        appMap.set(appKey, appNode);
        appRoot.children!.push(appNode);
      }
      appNode.children!.push({
        key: item.key,
        label: normalizeLeafLabel(item.label),
      });
      return;
    }
    if (item.kind === 'globalGroup') {
      globalRoot.children!.push({
        key: item.key,
        label: item.label.replace(/^GlobalGroup:\s*/, ''),
      });
      return;
    }
    categoryRoot.children!.push({
      key: item.key,
      label: item.label.replace(/^Category:\s*/, ''),
    });
  });

  return [appRoot, globalRoot, categoryRoot].filter(
    (node) => (node.children || []).length > 0,
  );
});

const candidateTreeBranchToLeaves = computed(() => {
  const map = new Map<string, string[]>();
  const walk = (node: CandidateTreeOption): string[] => {
    if (!node.children?.length) return [node.key];
    const leaves = node.children.flatMap((child) => walk(child));
    map.set(node.key, leaves);
    return leaves;
  };
  candidateTreeOptions.value.forEach((node) => {
    walk(node);
  });
  return map;
});

const onCandidateTreeChecked = (keys: Array<string | number>) => {
  const allow = new Set(parsedCandidates.value.map((item) => item.key));
  const selected = new Set<string>();
  keys.forEach((key) => {
    if (typeof key !== 'string') return;
    if (allow.has(key)) {
      selected.add(key);
      return;
    }
    const leafKeys = candidateTreeBranchToLeaves.value.get(key) || [];
    leafKeys.forEach((leaf) => {
      if (allow.has(leaf)) selected.add(leaf);
    });
  });
  selectedCandidateKeys.value = [...selected];
};

const subsPlaceholder = `
示例-单个应用的规则:
{
  id: 'cn.dxy.clinmaster',
  name: '临床决策',
  groups: [
    {
      key: 1,
      name: '示例',
      rules: [
        {
          fastQuery: true,
          activityIds: 'cn.dxy.clinmaster.home.MainActivity',
          matches:
            '@[vid="iv_close"] -2 [text="立即更新"]',
          snapshotUrls: 'https://i.gkd.li/i/25459821',
        },
      ],
    },
  ],
}
`.trim();
</script>

<template>
  <NTooltip :placement="props.tooltipPlacement">
    <template #trigger>
      <NButton
        text
        :style="{ '--n-icon-size': props.iconSize, '--svg-h': props.iconSize }"
        @click="showSubsModel = !showSubsModel"
      >
        <template #icon>
          <SvgIcon name="CacheSub" style="color: var(--icon-contrast-color)" />
        </template>
      </NButton>
    </template>
    修改内存订阅
  </NTooltip>
  <NTooltip :placement="props.tooltipPlacement">
    <template #trigger>
      <NButton
        text
        :style="{ '--n-icon-size': props.iconSize, '--svg-h': props.iconSize }"
        @click="showSelectorModel = !showSelectorModel"
      >
        <template #icon>
          <SvgIcon name="Exe-Sel" style="color: var(--icon-contrast-color)" />
        </template>
      </NButton>
    </template>
    执行选择器
  </NTooltip>

  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 84, left: 120 }"
    class="box-shadow-dim window-anim"
    :show="showSubsModel"
  >
    <NCard
      size="small"
      closable
      class="floating-panel"
      style="width: min(720px, 80vw); max-height: 73vh"
      :content-style="{ overflow: 'auto' }"
      @close="showSubsModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <SvgIcon
            name="CacheSub"
            class="mr-6px"
            style="color: var(--accent-success-color)"
          />
          <span>修改内存订阅</span>
          <div flex-1 />
        </div>
      </template>
      <NInput
        v-model:value="subsText"
        :disabled="updateSubs.loading"
        type="textarea"
        class="gkd_code"
        :autosize="{ minRows: 16, maxRows: 22 }"
        :placeholder="subsPlaceholder"
        aria-label="订阅文本输入框"
      />
      <NAlert mt-10px type="info" title="导入说明">
        1.点击“解析”可自动清洗非法 TS/残缺文本并识别多条规则 2.若无
        app头,快照审查页会自动补全 3.支持 TS转JSON5 语法格式
      </NAlert>
      <NCard
        v-if="parsedCandidates.length"
        mt-10px
        size="small"
        :bordered="true"
        title="解析结果（树形可选导入）"
      >
        <div mb-8px flex justify-end gap-8px>
          <NButton size="tiny" tertiary @click="selectAllCandidates"
            >全选</NButton
          >
          <NButton size="tiny" tertiary @click="invertCandidateSelection"
            >反选</NButton
          >
          <NButton size="tiny" tertiary @click="clearCandidateSelection"
            >清空</NButton
          >
        </div>
        <NTree
          block-line
          checkable
          cascade
          expand-on-click
          :data="candidateTreeOptions"
          :checked-keys="selectedCandidateKeys"
          @update:checkedKeys="onCandidateTreeChecked"
        />
      </NCard>
      <div
        :class="{
          'mt-10px': parsedCandidates.length,
          'mt-5px': !parsedCandidates.length,
        }"
        flex
        justify-end
        gap-8px
      >
        <NButton @click="showSubsModel = false">取消</NButton>
        <NButton
          :loading="parseCandidates.loading"
          :disabled="updateSubs.loading"
          @click="parseCandidates.invoke"
        >
          解析
        </NButton>
        <NButton
          type="primary"
          :loading="updateSubs.loading"
          @click="updateSubs.invoke"
        >
          确认导入
        </NButton>
      </div>
    </NCard>
  </DraggableCard>

  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{ top: 120, left: 180 }"
    class="box-shadow-dim window-anim"
    :show="showSelectorModel"
  >
    <NCard
      size="small"
      closable
      class="floating-panel"
      style="width: min(720px, 90vw)"
      :content-style="{ maxHeight: '70vh', overflow: 'auto' }"
      @close="showSelectorModel = false"
    >
      <template #header>
        <div :ref="onRef" flex items-center cursor-move>
          <SvgIcon
            name="Exe-Sel"
            class="mr-6px"
            style="color: var(--accent-success-color)"
          />
          <span>执行选择器</span>
          <div flex-1 />
        </div>
      </template>
      <NInput
        v-model:value="clickAction.selector"
        :disabled="execSelector.loading"
        type="textarea"
        class="gkd_code"
        :autosize="{ minRows: 4, maxRows: 10 }"
        placeholder="请输入合法选择器"
        aria-label="选择器输入框"
      />
      <div h-15px />
      <NSpace>
        <NCheckbox v-model:checked="clickAction.quickFind">快速查询</NCheckbox>
        <a
          href="https://gkd.li/api/interfaces/RawCommonProps.html#quickfind"
          target="_blank"
          rel="noopener noreferrer"
        >
          查找说明
        </a>
      </NSpace>
      <div h-10px />
      <div flex gap-10px flex-items-center>
        <NSelect
          v-model:value="clickAction.action"
          :options="actionOptions"
          class="w-150px"
        />
        <a
          href="https://gkd.li/api/interfaces/RawRuleProps#action"
          target="_blank"
          rel="noopener noreferrer"
        >
          操作说明
        </a>
      </div>
      <div mt-10px flex justify-end gap-8px>
        <NButton @click="showSelectorModel = false">取消</NButton>
        <NButton
          type="primary"
          :loading="execSelector.loading"
          @click="execSelector.invoke"
        >
          确认
        </NButton>
      </div>
    </NCard>
  </DraggableCard>
</template>
