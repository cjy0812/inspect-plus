<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import SelectorText from '@/components/SelectorText.vue';
import FastQueryIndicator from '@/components/plus/snapshot/FastQueryIndicator.vue';
import SelectorSyntaxPreview from '@/components/plus/snapshot/SelectorSyntaxPreview.vue';
import { useSearchCardPlus } from '@/composables/plus/useSearchCardPlus';
import { useSnapshotSearchCard } from '@/composables/useSnapshotSearchCard';
import { getNodeLabel, getNodeStyle } from '@/utils/node';
import { buildEmptyFn } from '@/utils/others';
import { gkdWidth, vw } from '@/utils/size';
import type { ShallowRef } from 'vue';
import { useSnapshotStore } from './snapshot';
import { buildFastQueryMeta } from '@/composables/plus/useFastQueryIndicator';

withDefaults(
  defineProps<{
    show: boolean;
    onUpdateShow?: (data: boolean) => void;
  }>(),
  {
    onUpdateShow: buildEmptyFn,
  },
);

const snapshotStore = useSnapshotStore();
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;
const { focusNode, updateFocusNode } = snapshotStore;

const searchText = shallowRef(``);
const enableSearchBySelector = shallowRef(true);
const {
  selectorSyntaxText,
  selectorSyntaxAst,
  selectorSyntaxError,
  handleTextareaKeyDown,
  resolveImportUrl,
} = useSearchCardPlus({
  searchText,
  enableSearchBySelector,
});
const {
  selectorResults,
  expandedKeys,
  searchBySelector,
  generateRules,
  hasZipId,
  shareResult,
} = useSnapshotSearchCard({
  snapshot,
  rootNode,
  updateFocusNode,
  searchText,
  enableSearchBySelector,
  resolveImportUrl,
  decorateSelectorResult: (result) => {
    result.fastQueryMeta = buildFastQueryMeta(result);
  },
  decorateStringResult: (result) => {
    result.fastQueryMeta = null;
  },
});
</script>

<template>
  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{
      top: 40,
      right: Math.max(348, 12 * vw + 135),
      width: Math.max(480, gkdWidth * 0.3),
    }"
    :minWidth="300"
    sizeDraggable
    class="box-shadow-dim snapshot-window window-anim"
    :show="show"
  >
    <div
      class="snapshot-floating-panel"
      b-1px
      b-solid
      b-gray-200
      rounded-12px
      p-8px
    >
      <div flex m-b-4px pr-4px>
        <NRadioGroup v-model:value="enableSearchBySelector">
          <NSpace>
            <NRadio :value="false"> 字符搜索 </NRadio>
            <NRadio :value="true"> 选择器查询 </NRadio>
          </NSpace>
        </NRadioGroup>
        <div :ref="onRef" flex-1 cursor-move />
        <NButton text title="最小化" @click="onUpdateShow(!show)">
          <template #icon>
            <SvgIcon name="minus" />
          </template>
        </NButton>
      </div>
      <NInputGroup>
        <NInput
          v-model:value="searchText"
          type="textarea"
          :placeholder="enableSearchBySelector ? `请输入选择器` : `请输入字符`"
          :autosize="{ minRows: 1, maxRows: 6 }"
          :inputProps="{ class: 'selector-textarea' }"
          @keydown="handleTextareaKeyDown($event, searchBySelector)"
        />
        <NButton @click="searchBySelector">
          <template #icon>
            <SvgIcon name="search" />
          </template>
        </NButton>
      </NInputGroup>
      <SelectorSyntaxPreview
        :enable-search-by-selector="enableSearchBySelector"
        :syntax-text="selectorSyntaxText"
        :syntax-ast="selectorSyntaxAst"
        :syntax-error="selectorSyntaxError"
      />
      <div p-5px />
      <NCollapse v-model:expandedNames="expandedKeys">
        <NCollapseItem
          v-for="(result, index) in selectorResults"
          :key="result.key"
          :name="result.key"
        >
          <template #header>
            <div class="selector-header">
              <span
                v-if="result.nodes.length > 1"
                underline
                leading-20px
                decoration-1
                m-r-4px
                gkd_code
                title="查询数量"
              >
                {{ result.nodes.length }}
              </span>
              <span
                break-all
                px-4px
                leading-20px
                class="snapshot-token"
                gkd_code
                :title="result.gkd ? `选择器` : `搜索字符`"
              >
                <SelectorText
                  v-if="result.gkd"
                  :node="result.selector.ast"
                  :source="result.selector.source"
                />
                <template v-else>{{ result.selector }}</template>
              </span>
              <span pl-4px />
            </div>
          </template>
          <template #header-extra>
            <NButtonGroup>
              <NButton
                v-if="result.gkd && result.selector.canCopy"
                size="small"
                title="复制规则"
                @click.stop="generateRules(result as SelectorSearchResult)"
              >
                <template #icon>
                  <SvgIcon name="copy" />
                </template>
              </NButton>
              <NButton
                v-if="hasZipId"
                size="small"
                :title="result.gkd ? `复制查询链接` : `复制搜索链接`"
                @click.stop="shareResult(result)"
              >
                <template #icon>
                  <SvgIcon name="share" />
                </template>
              </NButton>
              <NButton
                size="small"
                title="删除记录"
                @click.stop="selectorResults.splice(index, 1)"
              >
                <template #icon>
                  <SvgIcon name="delete" />
                </template>
              </NButton>
            </NButtonGroup>
          </template>
          <NScrollbar xScrollable style="max-height: 400px">
            <div flex gap-8px flex-wrap>
              <template
                v-if="!result.gkd || result.selector.connectKeys.length === 0"
              >
                <span
                  v-for="resultNode in result.nodes"
                  :key="resultNode.id"
                  class="node-fastquery-wrap"
                >
                  <NButton
                    size="small"
                    :style="getNodeStyle(resultNode, focusNode)"
                    @click="updateFocusNode(resultNode)"
                  >
                    <span>{{ getNodeLabel(resultNode) }}</span>
                  </NButton>
                  <FastQueryIndicator :meta="result.fastQueryMeta ?? null" />
                </span>
              </template>
              <template v-else>
                <span
                  v-for="(resultNode, i) in result.nodes"
                  :key="i"
                  class="node-fastquery-wrap"
                >
                  <NButtonGroup>
                    <NButton
                      size="small"
                      @click="
                        snapshotStore.showTrack(
                          result.selector,
                          result.results[i],
                        )
                      "
                    >
                      <NIcon>
                        <SvgIcon name="path" />
                      </NIcon>
                    </NButton>
                    <NButton
                      size="small"
                      :style="getNodeStyle(resultNode, focusNode)"
                      @click="updateFocusNode(resultNode)"
                    >
                      <span>{{ getNodeLabel(resultNode) }}</span>
                    </NButton>
                  </NButtonGroup>
                  <FastQueryIndicator :meta="result.fastQueryMeta ?? null" />
                </span>
              </template>
            </div>
            <div un="h-10px" />
          </NScrollbar>
        </NCollapseItem>
      </NCollapse>
    </div>
  </DraggableCard>
</template>

<style scoped>
:deep(.selector-textarea) {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  resize: none;
}

.selector-header {
  display: flex;
  align-items: center;
}

.node-fastquery-wrap {
  display: inline-flex;
  align-items: center;
  column-gap: 6px;
}

.fast-query-indicator-wrap {
  display: inline-flex;
  align-items: center;
}
</style>
