<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import SelectorText from '@/components/SelectorText.vue';
import { message } from '@/utils/discrete';
import { errorTry, errorWrap } from '@/utils/error';
import { getAppInfo, getNodeLabel, getNodeStyle } from '@/utils/node';
import { buildEmptyFn, copy } from '@/utils/others';
import { parseSelector, wasmLoadTask } from '@/utils/selector';
import { gkdWidth, vw } from '@/utils/size';
import { getImagUrl, getImportUrl, getOfficialImportUrl } from '@/utils/url';
import {
  AstNode,
  FastQuery,
  GkdException,
  Selector,
  SyntaxException,
} from '@gkd-kit/selector';
import dayjs from 'dayjs';
import * as base64url from 'universal-base64url';
import type { ShallowRef } from 'vue';
import JSON5 from 'json5';
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

const route = useRoute();
const { settingsStore, snapshotImportId, snapshotImageId } = useStorageStore();

const snapshotStore = useSnapshotStore();
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;
const rootNode = snapshotStore.rootNode as ShallowRef<RawNode>;
const { focusNode, updateFocusNode } = snapshotStore;

const searchText = shallowRef(``);
const searchTextLazy = useDebounce(searchText, 220);

const selectorResults = shallowReactive<SearchResult[]>([]);
const expandedKeys = shallowRef<number[]>([]);

const searchSelector = (text: string) => {
  const selector = errorWrap(
    () => parseSelector(text),
    (e) => {
      if (typeof e == 'string') return e;
      if (e instanceof GkdException) return `非法选择器:` + e.outMessage;
      return `非法选择器:` + (e instanceof Error ? e.message : e);
    },
  );
  if (
    selectorResults.find(
      (s) =>
        typeof s.selector == 'object' &&
        s.selector.toString() == selector.toString(),
    )
  ) {
    message.warning(`不可重复选择`);
    return;
  }

  const results = selector.querySelfOrSelectorAllContext(rootNode.value);
  // 修正 1: 将 QueryResult 转换为真正的数组以适配 TS 和后续的 map 操作
  const resultsArray = Array.from(results);

  if (resultsArray.length == 0) {
    message.success(`没有选择到节点`);
    return;
  }
  message.success(`选择到 ${resultsArray.length} 个节点`);
  selectorResults.unshift({
    selector,
    nodes: resultsArray.map((r) => r.target),
    results: resultsArray as any,
    key: Date.now(),
    gkd: true,
  });
  return resultsArray.length;
};

const searchString = (text: string) => {
  if (
    selectorResults.find(
      (s) => typeof s.selector == 'string' && s.selector.toString() == text,
    )
  ) {
    message.warning(`不可重复搜索`);
    return;
  }
  const results: RawNode[] = [];
  const stack: RawNode[] = [rootNode.value];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (getNodeLabel(n).includes(text)) {
      results.push(n);
    }
    stack.push(...[...n.children].reverse());
  }
  if (results.length == 0) {
    message.success(`没有搜索到节点`);
    return;
  }
  message.success(`搜索到 ${results.length} 个节点`);
  selectorResults.unshift({
    gkd: false,
    selector: text,
    nodes: results,
    key: Date.now(),
  });
  return results.length;
};

const refreshExpandedKeys = () => {
  const newResult = selectorResults[0];
  const newNode = newResult.nodes[0];
  if (!Array.isArray(newNode)) {
    updateFocusNode(newNode);
  } else if (typeof newResult.selector == 'object') {
    updateFocusNode(newNode);
  }
  const allKeys = new Set(selectorResults.map((s) => s.key));
  const newKeys = expandedKeys.value.filter((k) => allKeys.has(k));
  newKeys.push(newResult.key);
  expandedKeys.value = newKeys;
};

const searchBySelector = errorTry(() => {
  const text = searchText.value.trim();
  if (!text) return;
  if (enableSearchBySelector.value) {
    if (!searchSelector(text)) return;
  } else {
    if (!searchString(text)) return;
  }
  refreshExpandedKeys();
});

const handleTextareaKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    searchBySelector();
  }
};

onMounted(async () => {
  await wasmLoadTask;
  let count = 0;
  if (route.query.gkd) {
    count += searchSelector(base64url.decode(route.query.gkd as string)) || 0;
  }
  if (route.query.str) {
    count += searchString(route.query.str as string) || 0;
  }
  if (count > 0) {
    refreshExpandedKeys();
  }
});

const generateRules = errorTry(async (result: SelectorSearchResult) => {
  const imageId = snapshotImageId[snapshot.value.id];
  const importId = snapshotImportId[snapshot.value.id];
  const snapshotUrls = importId
    ? settingsStore.shareUseOfficialImportDomain
      ? getOfficialImportUrl(importId)
      : getImportUrl(importId)
    : undefined;
  const exampleUrls = imageId ? getImagUrl(imageId) : undefined;

  const s = result.selector;
  // 修正 2: 显式类型转换以修复 .map 报错
  // 使用 Array.from 配合 unknown 转换，这是最符合 TS 规范的绕过方式
  const t = Array.from(result.results as unknown as Iterable<any>).map(
    (v: any) => v.context.toArray().at(-1)!,
  )[0];

  const fastQuery = [
    (t.quickFind ?? t.idQf) &&
      t.attr.id &&
      s.fastQueryList.some(
        (v) => v instanceof FastQuery.Id && v.acceptText(t.attr.id!),
      ),
    (t.quickFind ?? t.idQf) &&
      t.attr.vid &&
      s.fastQueryList.some(
        (v) => v instanceof FastQuery.Vid && v.acceptText(t.attr.vid!),
      ),
    (t.quickFind ?? t.textQf) &&
      t.attr.text &&
      s.fastQueryList.some(
        (v) => v instanceof FastQuery.Text && v.acceptText(t.attr.text!),
      ),
  ].some(Boolean);
  const rule = {
    id: snapshot.value.appId,
    name: getAppInfo(snapshot.value).name,
    groups: [
      {
        key: 1,
        name: `[ChangeMe]规则名称-${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
        desc: `[ChangeMe]本规则由GKD网页端审查工具生成`,
        rules: [
          {
            fastQuery: fastQuery || undefined,
            activityIds: snapshot.value.activityId,
            matches: s.toString(),
            exampleUrls,
            snapshotUrls,
          },
        ],
      },
    ],
  };

  copy(JSON5.stringify(rule, undefined, 2));
});

const enableSearchBySelector = shallowRef(true);
const selectorSyntaxText = computed(() => {
  if (!enableSearchBySelector.value) return '';
  return searchTextLazy.value.trim();
});

const selectorSyntaxResult = computed(() => {
  const text = selectorSyntaxText.value;
  if (!text) return;
  try {
    return Selector.Companion.parseAst(text);
  } catch (e) {
    return e as GkdException;
  }
});

const selectorSyntaxAst = computed(() => {
  if (selectorSyntaxResult.value instanceof AstNode) {
    return selectorSyntaxResult.value;
  }
  return undefined;
});

const selectorSyntaxError = computed(() => {
  const result = selectorSyntaxResult.value;
  const text = selectorSyntaxText.value;
  if (result instanceof SyntaxException) {
    const hasErrorChar = result.index < text.length;
    const eofLike =
      !hasErrorChar || /expect\s+eof/i.test(result.outMessage || '');
    return {
      isEof: eofLike,
      headText: text.substring(0, result.index),
      errorText: hasErrorChar
        ? text.substring(result.index, result.index + 1)
        : '',
      tailText: hasErrorChar ? text.substring(result.index + 1) : '',
      message: result.outMessage,
    };
  }
  if (result && !(result instanceof AstNode)) {
    const msg =
      typeof (result as any).outMessage == 'string'
        ? (result as any).outMessage
        : typeof (result as any).message == 'string'
          ? (result as any).message
          : '';
    return {
      isEof: /expect\s+eof/i.test(msg),
      headText: '',
      errorText: '',
      tailText: '',
      message: msg,
    };
  }
  return undefined;
});

const hasZipId = computed(() => {
  return snapshotImportId[snapshot.value.id];
});

const shareResult = (result: SearchResult) => {
  if (!hasZipId.value) return;
  const importUrl = new URL(
    settingsStore.shareUseOfficialImportDomain
      ? getOfficialImportUrl(snapshotImportId[snapshot.value.id])
      : getImportUrl(snapshotImportId[snapshot.value.id]),
  );
  if (typeof result.selector == 'object') {
    importUrl.searchParams.set(
      'gkd',
      base64url.encode(result.selector.toString()),
    );
  } else {
    importUrl.searchParams.set('str', result.selector.toString());
  }
  copy(importUrl.toString());
};
</script>

<template>
  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{
      top: 40,
      right: Math.max(315, 12 * vw + 135),
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
          @keydown="handleTextareaKeyDown"
        />
        <NButton @click="searchBySelector">
          <template #icon>
            <SvgIcon name="search" />
          </template>
        </NButton>
      </NInputGroup>

      <div
        v-if="enableSearchBySelector && selectorSyntaxText"
        mt-6px
        mb-8px
        p-4px
        gkd_code
        transition-colors
        class="selector-ast-view"
        :class="selectorSyntaxError ? `selector-ast-view-error` : ``"
      >
        <div v-if="selectorSyntaxAst" overflow-x-scroll scrollbar-hidden>
          <SelectorText
            :source="selectorSyntaxText"
            :node="selectorSyntaxAst"
          />
        </div>
        <span v-else-if="selectorSyntaxError" whitespace-pre-wrap>
          <span v-if="selectorSyntaxError.headText">{{
            selectorSyntaxError.headText
          }}</span>
          <span bg-red relative>
            <span v-if="selectorSyntaxError.errorText">{{
              selectorSyntaxError.errorText
            }}</span>
            <span v-else pl-20px />
            <div
              absolute
              left-0
              right-0
              top--12px
              flex
              flex-col
              items-center
              animate-bounce
              pointer-events-none
            >
              <SvgIcon name="arrow" class="selector-error-arrow" />
            </div>
          </span>
          <span v-if="selectorSyntaxError.tailText">{{
            selectorSyntaxError.tailText
          }}</span>
        </span>
      </div>
      <div
        v-if="selectorSyntaxError && !selectorSyntaxError.isEof"
        p-4px
        gkd_code
        class="selector-error-box"
      >
        {{ selectorSyntaxError.message }}
      </div>
      <div p-5px />
      <NCollapse v-model:expandedNames="expandedKeys">
        <NCollapseItem
          v-for="(result, index) in selectorResults"
          :key="result.key"
          :name="result.key"
        >
          <template #header>
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
                <NButton
                  v-for="resultNode in result.nodes"
                  :key="resultNode.id"
                  size="small"
                  :style="getNodeStyle(resultNode, focusNode)"
                  @click="updateFocusNode(resultNode)"
                >
                  {{ getNodeLabel(resultNode) }}
                </NButton>
              </template>
              <template v-else>
                <NButtonGroup v-for="(resultNode, i) in result.nodes" :key="i">
                  <NButton
                    size="small"
                    @click="
                      snapshotStore.showTrack(
                        result.selector,
                        (result.results as any)[i],
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
                    {{ getNodeLabel(resultNode) }}
                  </NButton>
                </NButtonGroup>
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
</style>
