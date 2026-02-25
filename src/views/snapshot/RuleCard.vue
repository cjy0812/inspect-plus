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
const snapshot = snapshotStore.snapshot as ShallowRef<Snapshot | undefined>;

const text = shallowRef('');
const lazyText = refDebounced(text, 500);

/* -------------------------
   类型定义 / 常量
   ------------------------- */

interface ResolvedData {
  matches?: string[];
  anyMatches?: string[];
  excludeMatches?: string[];
  excludeAllMatches?: string[];
  activityIds?: string[];
  snapshotUrls?: string[];
  excludeSnapshotUrls?: string[];
  fastQuery?: boolean;
  resetMatch?: 'activity' | 'match' | 'app';
  actionMaximum?: number;
  preKeys?: number[];
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
  start?: number;
  end?: number;
  line?: number;
  column?: number;
};

type RuleCheckResult = RuleCheckResultSuccess | RuleCheckResultFailure;

const PRE_CHARS_BEFORE = 120;
const PRE_CHARS_AFTER = 120;

/* -------------------------
   容错 JSON5 解析
   ------------------------- */

function tryParseJSON5Tolerant(rawText: string): {
  value?: any;
  error?: Error;
} {
  const text = String(rawText ?? '');
  if (!text.trim()) return { error: new Error('空输入') };

  try {
    return { value: JSON5.parse(text) };
  } catch {
    // 继续容错
  }

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
      let inLineComment = false;
      let inBlockComment = false;
      let startIndex = s.i;
      let endIndex = -1;

      for (let i = startIndex; i < text.length; i++) {
        const ch = text[i];
        const nextCh = text[i + 1] || '';

        if (inBlockComment) {
          if (ch === '*' && nextCh === '/') {
            inBlockComment = false;
            i++;
          }
          continue;
        }

        if (inLineComment) {
          if (ch === '\n') {
            inLineComment = false;
          }
          continue;
        }

        if (inStr) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === strChar) {
            inStr = false;
            strChar = '';
          }
          continue;
        }

        if (ch === '/' && nextCh === '/') {
          inLineComment = true;
          i++;
          continue;
        }
        if (ch === '/' && nextCh === '*') {
          inBlockComment = true;
          i++;
          continue;
        }

        if (ch === '"' || ch === "'") {
          inStr = true;
          strChar = ch;
          continue;
        }

        if (ch === open) depth++;
        else if (ch === close) {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex > 0) {
        const candidate = text.substring(startIndex, endIndex + 1);
        try {
          return { value: JSON5.parse(candidate) };
        } catch {
          // try next
        }
      }
    }
  }

  try {
    return { value: JSON5.parse(`[${text}]`) };
  } catch (e) {
    return { error: e as Error };
  }
}

/* -------------------------
   工具函数
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

function indexToLineCol(
  text: string,
  index: number,
): { line: number; column: number } {
  if (index < 0) index = 0;
  const upto = text.slice(0, index);
  const lines = upto.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function findFirstOccurrence(rawText: string, needle: string): number {
  if (!needle) return -1;
  let idx = rawText.indexOf(needle);
  if (idx >= 0) return idx;
  const withDouble = `"${needle}"`;
  idx = rawText.indexOf(withDouble);
  if (idx >= 0) return idx + 1;
  const withSingle = `'${needle}'`;
  idx = rawText.indexOf(withSingle);
  if (idx >= 0) return idx + 1;
  const esc = needle.replace(/"/g, '\\"');
  idx = rawText.indexOf(esc);
  return idx;
}

function expandActivityIds(
  arr: string[] | undefined,
  appId?: string,
): string[] {
  if (!arr) return [];
  if (!appId) return arr.slice();
  return arr.map((id) => (id.startsWith('.') ? `${appId}${id}` : id));
}

/* -------------------------
   normalize & validate
   ------------------------- */

function validateAndNormalizeRuleCandidate(
  obj: any,
): { success: true; rule: ResolvedData } | RuleCheckResultFailure {
  if (!isObj(obj)) {
    return {
      success: false,
      error: '非法格式: 规则不是对象',
      stage: 'structure',
    };
  }

  const normalizeStringOrArrayField = (
    fieldName: string,
  ): string[] | undefined => {
    if (!(fieldName in obj)) return undefined;
    const arr = toArray(obj[fieldName]);
    if (arr === undefined) {
      throw new Error(`非法字段: ${fieldName} 必须为字符串或字符串数组`);
    }
    return arr;
  };

  try {
    const result: ResolvedData = {};

    if ('fastQuery' in obj) {
      if (typeof obj.fastQuery !== 'boolean')
        return {
          success: false,
          error: '非法字段: fastQuery 必须为 boolean',
          stage: 'structure',
          field: 'fastQuery',
        };
      result.fastQuery = obj.fastQuery;
    }

    if ('resetMatch' in obj) {
      const v = obj.resetMatch;
      if (!(v === 'activity' || v === 'match' || v === 'app')) {
        return {
          success: false,
          error: "非法字段: resetMatch 必须为 'activity' | 'match' | 'app'",
          stage: 'structure',
          field: 'resetMatch',
        };
      }
      result.resetMatch = v;
    }

    if ('actionMaximum' in obj) {
      const v = obj.actionMaximum;
      if (!(Number.isInteger(v) && v >= 0))
        return {
          success: false,
          error: '非法字段: actionMaximum 必须为非负整数',
          stage: 'structure',
          field: 'actionMaximum',
        };
      result.actionMaximum = v;
    }

    if ('preKeys' in obj) {
      if (
        !Array.isArray(obj.preKeys) ||
        !obj.preKeys.every((n: any) => Number.isInteger(n))
      ) {
        return {
          success: false,
          error: '非法字段: preKeys 必须为整数数组',
          stage: 'structure',
          field: 'preKeys',
        };
      }
      result.preKeys = obj.preKeys.slice();
    }

    try {
      const act = normalizeStringOrArrayField('activityIds');
      if (act !== undefined) result.activityIds = act;
    } catch (e: any) {
      return {
        success: false,
        error: e.message,
        stage: 'structure',
        field: 'activityIds',
      };
    }

    const urlFields = ['snapshotUrls', 'excludeSnapshotUrls', 'exampleUrls'];
    for (const f of urlFields) {
      try {
        const arr = normalizeStringOrArrayField(f);
        if (arr !== undefined) result[f] = arr;
      } catch (e: any) {
        return {
          success: false,
          error: e.message,
          stage: 'structure',
          field: f,
        };
      }
    }

    const selectorFields = [
      'matches',
      'anyMatches',
      'excludeMatches',
      'excludeAllMatches',
    ];
    for (const f of selectorFields) {
      try {
        const arr = normalizeStringOrArrayField(f);
        if (arr !== undefined) {
          result[f] = arr;
        }
      } catch (e: any) {
        return {
          success: false,
          error: e.message,
          stage: 'structure',
          field: f,
        };
      }
    }

    const hasMatches = (result.matches?.length ?? 0) > 0;
    const hasAnyMatches = (result.anyMatches?.length ?? 0) > 0;

    if (!hasMatches && !hasAnyMatches) {
      return {
        success: false,
        error: '非法规则: matches 和 anyMatches 至少存在一个',
        stage: 'structure',
      };
    }

    for (const f of selectorFields) {
      const arr: string[] | undefined = result[f];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        try {
          parseSelector(s);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return {
            success: false,
            error: `非法选择器: ${f}[${i}] 错误: ${message}`,
            stage: 'selector',
            field: f,
            index: i,
          };
        }
      }
    }

    return { success: true, rule: result };
  } catch (e: any) {
    return {
      success: false,
      error: e.message ?? String(e),
      stage: 'structure',
    };
  }
}

/* -------------------------
   checkRule：执行匹配
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

  if (
    Array.isArray(obj.preKeys) &&
    obj.preKeys.length &&
    simulatedPreKeys.length > 0
  ) {
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

  const resolveSelectorsToNodes = (selectors?: string[]) => {
    if (!selectors || !selectors.length) return [] as RawNode[][];
    const resolved: ResolvedSelector[] = selectors.map((s) => parseSelector(s));
    return resolved.map((r) => r.querySelfOrSelectorAll(root));
  };

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

  return { success: false, error: '规则无有效匹配选择器', stage: 'execute' };
}

/* -------------------------
   单一解析流与计算
   ------------------------- */

const parsedRuleResult = computed<RuleCheckResult | null>(() => {
  if (!lazyText.value) return null;
  const rawNormalized = lazyText.value.replace(/\r\n?/g, '\n');

  const parsedAttempt = tryParseJSON5Tolerant(rawNormalized);
  if (parsedAttempt.error) {
    const msg = parsedAttempt.error.message ?? String(parsedAttempt.error);
    let idx: number | undefined;
    const posMatch =
      /position\s+(\d+)/i.exec(msg) || /at position\s+(\d+)/i.exec(msg);
    if (posMatch) {
      idx = parseInt(posMatch[1], 10);
    } else {
      const lcMatch =
        /line\s+(\d+)[,:\s]+column\s+(\d+)/i.exec(msg) ||
        /line\s+(\d+)\s+column\s+(\d+)/i.exec(msg);
      if (lcMatch) {
        const line = parseInt(lcMatch[1], 10);
        const column = parseInt(lcMatch[2], 10);
        const lines = rawNormalized.split('\n');
        let acc = 0;
        const L = Math.max(1, Math.min(line, lines.length));
        for (let i = 0; i < L - 1; i++) acc += lines[i].length + 1;
        idx = acc + Math.max(0, column - 1);
      }
    }

    if (idx === undefined || Number.isNaN(idx)) idx = 0;
    const { line, column } = indexToLineCol(rawNormalized, idx);
    const start = Math.max(0, idx);
    const end = Math.min(rawNormalized.length, idx + 1);

    return {
      success: false,
      error: `解析失败: ${msg}`,
      stage: 'json',
      start,
      end,
      line,
      column,
    };
  }

  const parsed = parsedAttempt.value;
  const candidate = Array.isArray(parsed) && parsed.length ? parsed[0] : parsed;
  const validated = validateAndNormalizeRuleCandidate(candidate);

  if (!validated.success) {
    const errorObj = validated;
    let start = 0;
    let end = Math.min(200, rawNormalized.length);
    let line = 1;
    let column = 1;

    if (
      errorObj.stage === 'selector' &&
      errorObj.field &&
      errorObj.index !== undefined
    ) {
      try {
        const fieldValue = (candidate as any)[errorObj.field];
        let selectorString: string | undefined;
        if (Array.isArray(fieldValue) && fieldValue.length > errorObj.index) {
          selectorString = fieldValue[errorObj.index];
        } else if (typeof fieldValue === 'string' && errorObj.index === 0) {
          selectorString = fieldValue;
        }
        if (selectorString) {
          const pos = findFirstOccurrence(rawNormalized, selectorString);
          start = pos >= 0 ? pos : 0;
          end =
            pos >= 0
              ? pos + selectorString.length
              : Math.min(rawNormalized.length, start + 10);
          const lc = indexToLineCol(rawNormalized, start);
          line = lc.line;
          column = lc.column;
        }
      } catch {
        /* fallback */
      }
    } else if (errorObj.stage === 'structure' && errorObj.field) {
      const pos = findFirstOccurrence(rawNormalized, errorObj.field);
      start = pos >= 0 ? Math.max(0, pos - 10) : 0;
      end =
        pos >= 0
          ? Math.min(rawNormalized.length, pos + errorObj.field.length + 10)
          : Math.min(rawNormalized.length, start + 20);
      const lc = indexToLineCol(rawNormalized, start);
      line = lc.line;
      column = lc.column;
    }

    return { ...errorObj, start, end, line, column };
  }

  return checkRule(validated.rule, rootNode.value, {
    appId: snapshot.value?.appId,
    currentActivityId: snapshot.value?.activityId,
    simulatedPreKeys: [],
    ignoreActivityCheck: false,
  });
});

/* -------------------------
   视图辅助
   ------------------------- */

const diagnostics = computed<RuleCheckResultFailure | null>(() => {
  const result = parsedRuleResult.value;
  if (
    result &&
    !result.success &&
    (result.stage === 'json' ||
      result.stage === 'structure' ||
      result.stage === 'selector')
  ) {
    return result as RuleCheckResultFailure;
  }
  return null;
});

const errorText = computed(() => {
  if (parsedRuleResult.value && !parsedRuleResult.value.success) {
    return parsedRuleResult.value.error ?? '';
  }
  return '';
});

const targetNode = computed(() => {
  if (parsedRuleResult.value && parsedRuleResult.value.success) {
    return parsedRuleResult.value.node;
  }
  return null;
});

const errorPreview = computed(() => {
  const d = diagnostics.value;
  if (!d) return null;
  const raw = lazyText.value ? lazyText.value.replace(/\r\n?/g, '\n') : '';
  const start = Math.max(0, d.start ?? 0);
  const end = Math.min(raw.length, d.end ?? start);
  const preStart = Math.max(0, start - PRE_CHARS_BEFORE);
  const postEnd = Math.min(raw.length, end + PRE_CHARS_AFTER);

  let head = raw.slice(preStart, start);
  const err = raw.slice(start, end) || ' ';
  let tail = raw.slice(end, postEnd);

  if (preStart > 0) head = '...' + head;
  if (postEnd < raw.length) tail = tail + '...';

  return { head, err, tail };
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
          <template #icon><SvgIcon name="minus" /></template>
        </NButton>
      </div>

      <NInput
        v-model:value="text"
        type="textarea"
        placeholder="请输入单个规则测试（支持 JSON5，允许 string 或 string[]，会自动 normalize）"
        size="small"
        class="gkd_code m-b-4px"
        :autosize="{ minRows: 10, maxRows: 20 }"
      />

      <div
        v-if="errorPreview"
        mt-6px
        mb-8px
        p-4px
        gkd_code
        transition-colors
        class="selector-ast-view selector-ast-view-error"
      >
        <span whitespace-pre-wrap>
          <span v-if="errorPreview.head">{{ errorPreview.head }}</span>
          <span bg-red relative>
            <span v-if="errorPreview.err" class="rc-error">{{
              errorPreview.err
            }}</span>
            <span v-else pl-20px class="rc-error" />
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
          <span v-if="errorPreview.tail">{{ errorPreview.tail }}</span>
        </span>
      </div>

      <div min-h-24px mt-4px>
        <div v-if="errorText" color-red whitespace-pre>
          {{ errorText }}
          <template v-if="diagnostics">
            <br />
            <span text-11px opacity-70>
              行 {{ diagnostics.line }} ｜ 列 {{ diagnostics.column }} ｜ 阶段:
              {{ diagnostics.stage }}
            </span>
          </template>
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

<style scoped>
.selector-ast-view {
  max-height: 160px;
  overflow: auto;
  border-radius: 6px;
  color: var(--text-primary, inherit);
}

.selector-ast-view-error {
  background: var(--selector-ast-error-bg-color2, rgba(255, 240, 240, 0.9));
  border: 1px solid rgba(255, 80, 80, 0.12);
}

.selector-error-arrow {
  color: var(--accent-error-color, #ff6666);
}

.selector-ast-view .rc-error,
.selector-ast-view-error .rc-error {
  background: rgba(255, 90, 90, 0.12);
  border-bottom: 2px solid rgba(255, 60, 60, 0.9);
  padding: 0 2px;
  border-radius: 3px;
}

:global(html.dark-mode-active .selector-ast-view-error) {
  background: var(--selector-ast-error-bg-color2, rgba(40, 40, 40, 0.6));
  border: 1px solid rgba(255, 80, 80, 0.16);
}
</style>
