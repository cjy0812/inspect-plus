<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { getNodeLabel, getNodeStyle } from '@/utils/node';
import { buildEmptyFn } from '@/utils/others';
import { parseSelector, type ResolvedSelector } from '@/utils/selector';
import { gkdWidth, vw } from '@/utils/size';
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

const snapshotStore = useSnapshotStore();
const { rootNode, focusNode } = snapshotStore;
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot>;

const text = shallowRef('');
// 使用防抖，项目里若没有 refDebounced 请替换为合适的 debounce 工具
const lazyText = refDebounced(text, 500);

/* -------------------------
   类型定义
   ------------------------- */

interface ResolvedData {
  matches?: string[];
  anyMatches?: string[];
  excludeMatches?: string[];
  excludeAllMatches?: string[];
  activityIds?: string[]; // already normalized
  snapshotUrls?: string[];
  excludeSnapshotUrls?: string[];
  // 其他允许的 RawAppRule 字段（非必须）
  [k: string]: any;
}

type ValidateStage = 'json' | 'structure' | 'selector' | 'execute';

type RuleCheckResultSuccess = {
  success: true;
  node: RawNode;
  matched: {
    matches?: { selector: string; nodes: RawNode[] }[];
    anyMatches?: { selector: string; nodes: RawNode[] }[];
    excludeMatches?: { selector: string; nodes: RawNode[] }[];
    excludeAllMatches?: { selector: string; nodes: RawNode[] }[];
  };
  meta?: {
    expandedActivityIds?: string[];
    usedFastQuery?: boolean;
  };
};

type RuleCheckResultFailure = {
  success: false;
  error: string;
  stage: ValidateStage;
  field?: string;
  index?: number;
};

type RuleCheckResult = RuleCheckResultSuccess | RuleCheckResultFailure;

/* -------------------------
   容错 JSON5 解析：尽量从杂乱文本中提取第一个 JSON 块
   ------------------------- */

function tryParseJSON5Tolerant(rawText: string): {
  value?: any;
  error?: Error;
} {
  const text = String(rawText ?? '').trim();
  if (!text) return { error: new Error('空输入') };

  // 1) 先直接解析
  try {
    return { value: JSON5.parse(text) };
  } catch {
    // 继续容错
  }

  // 2) 尝试提取第一个 { ... } 或 [ ... ] 块
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const starts: { i: number; c: '{' | '[' }[] = [];
  if (firstBrace !== -1) starts.push({ i: firstBrace, c: '{' });
  if (firstBracket !== -1) starts.push({ i: firstBracket, c: '[' });
  if (starts.length) {
    starts.sort((a, b) => a.i - b.i);
    for (const s of starts) {
      const open = s.c;
      const close = open === '{' ? '}' : ']';
      let depth = 0;
      let inStr = false;
      let strChar = '';
      let escaped = false;
      let startIndex = s.i;
      let endIndex = -1;

      for (let i = startIndex; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === strChar) {
            inStr = false;
            strChar = '';
          }
          continue;
        } else {
          if (ch === '"' || ch === "'") {
            inStr = true;
            strChar = ch;
            continue;
          }
        }

        if (!inStr) {
          if (ch === open) depth++;
          else if (ch === close) {
            depth--;
            if (depth === 0) {
              endIndex = i;
              break;
            }
          }
        }
      }

      if (endIndex > 0) {
        const candidate = text.substring(startIndex, endIndex + 1);
        try {
          return { value: JSON5.parse(candidate) };
        } catch {
          // continue to next candidate
        }
      }
    }
  }

  // 3) 尝试把全文当成多项顶层值，用数组包裹解析
  try {
    return { value: JSON5.parse(`[${text}]`) };
  } catch (e) {
    return { error: e as Error };
  }
}

/* -------------------------
   基本工具函数
   ------------------------- */

const toArray = (v: any): string[] | undefined => {
  if (v === undefined || v === null) return [];
  if (typeof v === 'string') return [v];
  if (Array.isArray(v) && v.every((s) => typeof s === 'string')) return v;
  return undefined;
};

const isObj = (v: any): v is Record<string, any> => {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
};

/* -------------------------
   normalize & validate（严格按 API，但对单 string 做兼容）
   返回 { ok: true, rule: ResolvedData } 或 { ok: false, error... }
   ------------------------- */

function expandActivityIds(
  arr: string[] | undefined,
  appId?: string,
): string[] {
  if (!arr) return [];
  if (!appId) return arr.slice();
  return arr.map((id) => (id.startsWith('.') ? `${appId}${id}` : id));
}

function validateAndNormalizeRuleCandidate(
  obj: any,
): { ok: true; rule: ResolvedData } | { ok: false; error: string } {
  if (!isObj(obj)) {
    return { ok: false, error: '非法格式: 规则不是对象' };
  }

  // Helper to normalize allowed string|array fields into string[]
  const normalizeStringOrArrayField = (
    fieldName: string,
  ): string[] | undefined => {
    if (!(fieldName in obj)) return undefined;
    const arr = toArray(obj[fieldName]);
    if (arr === undefined) {
      // Not a string or string[] -> error
      throw new Error(`非法字段: ${fieldName} 必须为字符串或字符串数组`);
    }
    return arr;
  };

  try {
    const result: ResolvedData = {};

    // fastQuery (optional boolean)
    if ('fastQuery' in obj) {
      if (typeof obj.fastQuery !== 'boolean')
        return { ok: false, error: '非法字段: fastQuery 必须为 boolean' };
      result.fastQuery = obj.fastQuery;
    }

    // resetMatch
    if ('resetMatch' in obj) {
      const v = obj.resetMatch;
      if (!(v === 'activity' || v === 'match' || v === 'app')) {
        return {
          ok: false,
          error: "非法字段: resetMatch 必须为 'activity' | 'match' | 'app'",
        };
      }
      result.resetMatch = v;
    }

    // actionMaximum
    if ('actionMaximum' in obj) {
      const v = obj.actionMaximum;
      if (!(Number.isInteger(v) && v >= 0))
        return { ok: false, error: '非法字段: actionMaximum 必须为非负整数' };
      result.actionMaximum = v;
    }

    // preKeys (optional integer array)
    if ('preKeys' in obj) {
      if (
        !Array.isArray(obj.preKeys) ||
        !obj.preKeys.every((n: any) => Number.isInteger(n))
      ) {
        return { ok: false, error: '非法字段: preKeys 必须为整数数组' };
      }
      result.preKeys = obj.preKeys.slice();
    }

    // activityIds (accept string or string[])
    try {
      const act = normalizeStringOrArrayField('activityIds');
      if (act !== undefined) result.activityIds = act;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }

    // url-like fields
    const urlFields = ['snapshotUrls', 'excludeSnapshotUrls', 'exampleUrls'];
    for (const f of urlFields) {
      try {
        const arr = normalizeStringOrArrayField(f);
        if (arr !== undefined) (result as any)[f] = arr;
      } catch (e: any) {
        return { ok: false, error: e.message };
      }
    }

    // selector fields: matches / anyMatches / excludeMatches / excludeAllMatches
    const selectorFields = [
      'matches',
      'anyMatches',
      'excludeMatches',
      'excludeAllMatches',
    ];
    let hasSelector = false;
    for (const f of selectorFields) {
      try {
        const arr = normalizeStringOrArrayField(f);
        if (arr !== undefined) {
          (result as any)[f] = arr;
          if (Array.isArray(arr) && arr.length > 0) hasSelector = true;
        }
      } catch (e: any) {
        return { ok: false, error: e.message };
      }
    }

    if (!hasSelector) {
      return {
        ok: false,
        error: '非法规则: matches 和 anyMatches 至少存在一个',
      };
    }

    // Selector syntax check (parseSelector) — just syntax, no execution
    for (const f of selectorFields) {
      const arr: string[] | undefined = (result as any)[f];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        if (typeof s !== 'string')
          return { ok: false, error: `非法字段: ${f}[${i}] 必须为字符串` };
        try {
          parseSelector(s); // if error, will throw
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return {
            ok: false,
            error: `非法选择器: ${f}[${i}] 错误: ${message}`,
          };
        }
      }
    }

    return { ok: true, rule: result };
  } catch (e: any) {
    return { ok: false, error: e.message ?? String(e) };
  }
}

/* -------------------------
   checkRule：执行匹配（纯函数）
   - obj 已由 validateAndNormalizeRuleCandidate 保证 selector 语法正确
   - 支持 preKeys 模拟参数（可传入数组）
   ------------------------- */

function checkRule(
  obj: ResolvedData,
  root: RawNode | undefined,
  options?: {
    appId?: string;
    currentActivityId?: string;
    simulatedPreKeys?: number[];
    ignoreActivityCheck?: boolean;
  },
): RuleCheckResult {
  if (!root)
    return { success: false, error: '当前无可用 rootNode', stage: 'execute' };

  const appId = options?.appId;
  const currentActivityId = options?.currentActivityId;
  const simulatedPreKeys = options?.simulatedPreKeys ?? [];
  const ignoreActivityCheck = options?.ignoreActivityCheck ?? false;

  // 1) activityIds check (if provided)
  const normalizedActivityIds = obj.activityIds ?? [];
  const expanded = expandActivityIds(normalizedActivityIds, appId);
  if (!ignoreActivityCheck && expanded.length > 0 && currentActivityId) {
    const matched = expanded.some((aid) => currentActivityId.startsWith(aid));
    if (!matched) {
      return {
        success: false,
        error: 'activityIds 未匹配当前界面',
        stage: 'execute',
        field: 'activityIds',
      };
    }
  }

  // 2) preKeys check (if provided)
  if (Array.isArray(obj.preKeys) && obj.preKeys.length) {
    const unmet = obj.preKeys.some(
      (k: number) => !simulatedPreKeys.includes(k),
    );
    if (unmet) {
      return {
        success: false,
        error: 'preKeys 未满足',
        stage: 'execute',
        field: 'preKeys',
      };
    }
  }

  // Helper: resolve selectors to nodes
  const resolveSelectorsToNodes = (selectors?: string[]) => {
    if (!selectors || !selectors.length) return [] as RawNode[][];
    const resolved: ResolvedSelector[] = selectors.map((s) => parseSelector(s));
    return resolved.map((r) => r.querySelfOrSelectorAll(root));
  };

  // excludeMatches check (任一匹配 -> 失败)
  const excludeArr = obj.excludeMatches ?? [];
  if (excludeArr.length) {
    const excludeResults = resolveSelectorsToNodes(excludeArr);
    const index = excludeResults.findIndex(
      (nodes) => Array.isArray(nodes) && nodes.length > 0,
    );
    if (index >= 0) {
      return {
        success: false,
        error: `excludeMatches[${index}] 命中（规则被排除）`,
        stage: 'execute',
        field: 'excludeMatches',
        index,
      };
    }
  }

  // excludeAllMatches check (如果所有 selector 都匹配 -> 失败)
  const excludeAllArr = obj.excludeAllMatches ?? [];
  if (excludeAllArr.length) {
    const excludeAllResults = resolveSelectorsToNodes(excludeAllArr);
    const allMatched =
      excludeAllResults.length > 0 &&
      excludeAllResults.every(
        (nodes) => Array.isArray(nodes) && nodes.length > 0,
      );
    if (allMatched) {
      return {
        success: false,
        error: `excludeAllMatches 全部命中（规则被排除）`,
        stage: 'execute',
        field: 'excludeAllMatches',
      };
    }
  }

  // matches: 所有 selector 都必须匹配，target = 最后一个 selector 的第一个匹配项
  const matchesArr = obj.matches ?? [];
  const matchesResults = resolveSelectorsToNodes(matchesArr);
  if (matchesArr.length) {
    const notIndex = matchesResults.findIndex(
      (nodes) => !Array.isArray(nodes) || nodes.length === 0,
    );
    if (notIndex >= 0) {
      return {
        success: false,
        error: `无法匹配: matches[${notIndex}] 查找结果为空`,
        stage: 'execute',
        field: 'matches',
        index: notIndex,
      };
    }
    const lastNodes = matchesResults.at(-1) ?? [];
    const target = lastNodes[0];
    return {
      success: true,
      node: target,
      matched: {
        matches: matchesArr.map((sel, i) => ({
          selector: sel,
          nodes: matchesResults[i],
        })),
      },
      meta: { expandedActivityIds: expanded, usedFastQuery: !!obj.fastQuery },
    };
  }

  // anyMatches: 任一 selector 匹配即可（matches 为空时）
  const anyArr = obj.anyMatches ?? [];
  const anyResults = resolveSelectorsToNodes(anyArr);
  if (anyArr.length) {
    if (
      anyResults.every((nodes) => !Array.isArray(nodes) || nodes.length === 0)
    ) {
      return {
        success: false,
        error: '无法匹配: anyMatches 查找结果为空',
        stage: 'execute',
        field: 'anyMatches',
      };
    }
    // find first non-empty
    for (let i = 0; i < anyResults.length; i++) {
      const nodes = anyResults[i];
      if (Array.isArray(nodes) && nodes.length > 0) {
        return {
          success: true,
          node: nodes[0],
          matched: { anyMatches: [{ selector: anyArr[i], nodes }] },
          meta: {
            expandedActivityIds: expanded,
            usedFastQuery: !!obj.fastQuery,
          },
        };
      }
    }
  }

  // 如果既没有 matches 又没有 anyMatches，理论上 validate 阶段会阻止到这一步
  return { success: false, error: '规则无有效匹配选择器', stage: 'execute' };
}

/* -------------------------
   dataRef：从输入文本 -> 解析 -> validate -> 执行 checkRule
   返回 RuleCheckResult 或 ''（空）
   ------------------------- */

const dataRef = computed<RuleCheckResult | ''>(() => {
  if (!lazyText.value) return '';

  // 解析容错
  const parsedAttempt = tryParseJSON5Tolerant(lazyText.value);
  if (parsedAttempt.error) {
    return {
      success: false,
      error: `非法格式: ${parsedAttempt.error.message}`,
      stage: 'json',
    };
  }

  const parsed = parsedAttempt.value;
  // 如果解析结果为数组，取第一个元素作为候选（兼容粘多段的情形）
  const candidate = Array.isArray(parsed) && parsed.length ? parsed[0] : parsed;

  // validate & normalize
  const validated = validateAndNormalizeRuleCandidate(candidate);
  if (!validated.ok) {
    return { success: false, error: validated.error, stage: 'structure' };
  }

  // 执行匹配
  const execResult = checkRule(validated.rule, rootNode.value, {
    appId: snapshot.value?.appId,
    currentActivityId: snapshot.value?.activityId,
    simulatedPreKeys: [], // UI 可扩展传入模拟 preKeys
    ignoreActivityCheck: false,
  });

  return execResult;
});

/* -------------------------
   视图层状态
   ------------------------- */

const errorText = computed(() => {
  if (typeof dataRef.value === 'object' && !dataRef.value.success) {
    return dataRef.value.error ?? '';
  }
  return '';
});

const targetNode = computed(() => {
  if (typeof dataRef.value === 'object' && dataRef.value.success) {
    return dataRef.value.node;
  }
  return null;
});
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
        <SvgIcon
          name="test"
          class="mr-6px"
          style="color: var(--accent-success-color)"
        />
        <div>测试规则</div>
        <div :ref="onRef" flex-1 cursor-move />
        <NButton text title="最小化" @click="onUpdateShow(!show)">
          <template #icon>
            <SvgIcon name="minus" />
          </template>
        </NButton>
      </div>

      <NInput
        v-model:value="text"
        type="textarea"
        placeholder="请输入单个规则测试（支持 JSON5，允许 string 或 string[]，会自动 normalize）"
        size="small"
        class="gkd_code m-b-4px"
        :autosize="{
          minRows: 10,
          maxRows: 20,
        }"
      />

      <div min-h-24px>
        <div v-if="errorText" color-red whitespace-pre>
          {{ errorText }}
        </div>

        <NButton
          v-else-if="targetNode"
          size="small"
          :style="getNodeStyle(targetNode, focusNode)"
          @click="snapshotStore.updateFocusNode(targetNode)"
        >
          {{ getNodeLabel(targetNode) }}
        </NButton>
      </div>
    </div>
  </DraggableCard>
</template>
