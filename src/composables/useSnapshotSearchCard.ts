import {
  computed,
  onMounted,
  shallowReactive,
  shallowRef,
  type ShallowRef,
} from 'vue';
import { FastQuery, GkdException, type QueryResult } from '@gkd-kit/selector';
import dayjs from 'dayjs';
import JSON5 from 'json5';
import * as base64url from 'universal-base64url';
import { message } from '@/utils/discrete';
import { errorTry, errorWrap } from '@/utils/error';
import { getAppInfo, getNodeLabel } from '@/utils/node';
import { copy } from '@/utils/others';
import { parseSelector, wasmLoadTask } from '@/utils/selector';
import { getImagUrl, getImportUrl } from '@/utils/url';

interface UseSnapshotSearchCardOptions {
  snapshot: ShallowRef<Snapshot | undefined>;
  rootNode: ShallowRef<RawNode | undefined>;
  updateFocusNode: (node: RawNode) => void;
  searchText?: ShallowRef<string>;
  enableSearchBySelector?: ShallowRef<boolean>;
  resolveImportUrl?: (importId: string | number) => string;
  decorateSelectorResult?: (result: SelectorSearchResult) => void;
  decorateStringResult?: (result: StringSearchResult) => void;
}

const toStringArray = (param: unknown): string[] => {
  if (Array.isArray(param)) {
    return param.filter((item): item is string => typeof item === 'string');
  }
  if (typeof param === 'string') {
    return [param];
  }
  return [];
};

export function useSnapshotSearchCard(options: UseSnapshotSearchCardOptions) {
  const route = useRoute();
  const { snapshotImportId, snapshotImageId } = useStorageStore();
  const searchText = options.searchText ?? shallowRef('');
  const enableSearchBySelector =
    options.enableSearchBySelector ?? shallowRef(true);
  const selectorResults = shallowReactive<SearchResult[]>([]);
  const expandedKeys = shallowRef<number[]>([]);
  const resolveImportUrl = options.resolveImportUrl ?? getImportUrl;

  const searchSelector = (
    text: string,
    skipDuplicateCheck: boolean = false,
  ) => {
    if (!options.rootNode.value) {
      message.error('当前无可用节点树, 请尝试刷新页面');
      return;
    }
    const selector = errorWrap(
      () => parseSelector(text),
      (e) => {
        if (typeof e == 'string') return e;
        if (e instanceof GkdException) return `非法选择器:` + e.outMessage;
        return `非法选择器:` + (e instanceof Error ? e.message : e);
      },
    );
    if (
      !skipDuplicateCheck &&
      selectorResults.find(
        (s) =>
          typeof s.selector == 'object' &&
          s.selector.toString() == selector.toString(),
      )
    ) {
      message.warning(`不可重复选择`);
      return;
    }

    const results = selector.querySelfOrSelectorAllContext(
      options.rootNode.value,
    );
    const resultsArray = Array.from<QueryResult<RawNode>>(results);

    if (resultsArray.length == 0) {
      message.success(`没有选择到节点`);
      return;
    }
    message.success(`选择到 ${resultsArray.length} 个节点`);
    const result: SelectorSearchResult = {
      selector,
      nodes: resultsArray.map((r) => r.target),
      results: resultsArray,
      key: Date.now(),
      gkd: true,
    };
    options.decorateSelectorResult?.(result);
    selectorResults.unshift(result);
    return resultsArray.length;
  };

  const searchString = (text: string) => {
    if (!options.rootNode.value) {
      message.error('当前无可用节点树');
      return;
    }
    if (
      selectorResults.find(
        (s) => typeof s.selector == 'string' && s.selector.toString() == text,
      )
    ) {
      message.warning(`不可重复搜索`);
      return;
    }
    const results: RawNode[] = [];
    const stack: RawNode[] = [options.rootNode.value];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (getNodeLabel(node).includes(text)) {
        results.push(node);
      }
      stack.push(...[...node.children].reverse());
    }
    if (results.length == 0) {
      message.success(`没有搜索到节点`);
      return;
    }
    message.success(`搜索到 ${results.length} 个节点`);
    const result: StringSearchResult = {
      gkd: false,
      selector: text,
      nodes: results,
      key: Date.now(),
    };
    options.decorateStringResult?.(result);
    selectorResults.unshift(result);
    return results.length;
  };

  const refreshExpandedKeys = () => {
    const newResult = selectorResults[0];
    const newNode = newResult.nodes[0];
    if (!Array.isArray(newNode)) {
      options.updateFocusNode(newNode);
    } else if (typeof newResult.selector == 'object') {
      options.updateFocusNode(newNode);
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

  onMounted(async () => {
    await wasmLoadTask;
    let count = 0;

    const gkdParams = [...new Set(toStringArray(route.query.gkd))];
    for (const item of gkdParams) {
      try {
        const decoded = base64url.decode(item);
        count += searchSelector(decoded, true) || 0;
      } catch (e) {
        console.warn('Invalid gkd parameter:', item, e);
      }
    }

    const strParams = [...new Set(toStringArray(route.query.str))];
    for (const item of strParams) {
      count += searchString(item) || 0;
    }

    if (count > 0) {
      refreshExpandedKeys();
    }
  });

  const generateRules = errorTry(async (result: SelectorSearchResult) => {
    if (!options.snapshot.value) {
      message.error('当前无可用快照数据');
      return;
    }
    const imageId = snapshotImageId[options.snapshot.value.id];
    const importId = snapshotImportId[options.snapshot.value.id];
    const snapshotUrls = importId ? resolveImportUrl(importId) : undefined;
    const exampleUrls = imageId ? getImagUrl(imageId) : undefined;

    const selector = result.selector;
    const target = result.results[0]?.context.toArray().at(-1);
    if (!target) {
      message.error('无法提取选择器路径信息');
      return;
    }

    const fastQuery = [
      (target.quickFind ?? target.idQf) &&
        target.attr.id &&
        selector.fastQueryList.some(
          (v) => v instanceof FastQuery.Id && v.acceptText(target.attr.id!),
        ),
      (target.quickFind ?? target.idQf) &&
        target.attr.vid &&
        selector.fastQueryList.some(
          (v) => v instanceof FastQuery.Vid && v.acceptText(target.attr.vid!),
        ),
      (target.quickFind ?? target.textQf) &&
        target.attr.text &&
        selector.fastQueryList.some(
          (v) => v instanceof FastQuery.Text && v.acceptText(target.attr.text!),
        ),
    ].some(Boolean);
    const rule = {
      id: options.snapshot.value.appId,
      name: getAppInfo(options.snapshot.value).name,
      groups: [
        {
          key: 1,
          name: `[ChangeMe]规则名称-${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
          desc: `[ChangeMe]本规则由GKD网页端审查工具生成`,
          rules: [
            {
              fastQuery: fastQuery || undefined,
              activityIds: options.snapshot.value.activityId,
              matches: selector.toString(),
              exampleUrls,
              snapshotUrls,
            },
          ],
        },
      ],
    };

    copy(JSON5.stringify(rule, undefined, 2));
  });

  const hasZipId = computed(() => {
    if (!options.snapshot.value) return false;
    return Boolean(snapshotImportId[options.snapshot.value.id]);
  });

  const shareResult = (result: SearchResult) => {
    if (!hasZipId.value || !options.snapshot.value) return;
    const importUrl = new URL(
      resolveImportUrl(snapshotImportId[options.snapshot.value.id]),
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

  return {
    searchText,
    selectorResults,
    expandedKeys,
    enableSearchBySelector,
    searchSelector,
    searchString,
    refreshExpandedKeys,
    searchBySelector,
    generateRules,
    hasZipId,
    shareResult,
  };
}
