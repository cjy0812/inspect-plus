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
// 项目里若存在 refDebounced，请确保已引入；否则替换为你项目的防抖实现
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

const PRE_CHARS_BEFORE = 120;
const PRE_CHARS_AFTER = 120;

/* -------------------------
   容错 JSON5 解析：尽量从杂乱文本中提取第一个 JSON 块
   ------------------------- */

function tryParseJSON5Tolerant(rawText: string): {
  value?: any;
  error?: Error;
} {
  const text = String(rawText ?? '').trim();
  if (!text) return { error: new Error('空输入') };

  // 1) 直接解析
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
          // try next candidate
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
  const lines = upto.split(/\r\n|\r|\n/);
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

/* -------------------------
   normalize & validate（严格按 API，兼容单 string）
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
        return { ok: false, error: '非法字段: fastQuery 必须为 boolean' };
      result.fastQuery = obj.fastQuery;
    }

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

    if ('actionMaximum' in obj) {
      const v = obj.actionMaximum;
      if (!(Number.isInteger(v) && v >= 0))
        return { ok: false, error: '非法字段: actionMaximum 必须为非负整数' };
      result.actionMaximum = v;
    }

    if ('preKeys' in obj) {
      if (
        !Array.isArray(obj.preKeys) ||
        !obj.preKeys.every((n: any) => Number.isInteger(n))
      ) {
        return { ok: false, error: '非法字段: preKeys 必须为整数数组' };
      }
      result.preKeys = obj.preKeys.slice();
    }

    try {
      const act = normalizeStringOrArrayField('activityIds');
      if (act !== undefined) result.activityIds = act;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }

    const urlFields = ['snapshotUrls', 'excludeSnapshotUrls', 'exampleUrls'];
    for (const f of urlFields) {
      try {
        const arr = normalizeStringOrArrayField(f);
        if (arr !== undefined) (result as any)[f] = arr;
      } catch (e: any) {
        return { ok: false, error: e.message };
      }
    }

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

    // Selector syntax check
    for (const f of selectorFields) {
      const arr: string[] | undefined = (result as any)[f];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        if (typeof s !== 'string')
          return { ok: false, error: `非法字段: ${f}[${i}] 必须为字符串` };
        try {
          parseSelector(s);
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
   diagnostics：计算用于 UI 高亮的错误位置与片段
   ------------------------- */

const diagnostics = computed(() => {
  const raw = lazyText.value ?? '';
  if (!raw) return null;

  const parsedAttempt = tryParseJSON5Tolerant(raw);
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
        const lines = raw.split(/\r\n|\r|\n/);
        let acc = 0;
        const L = Math.max(1, Math.min(line, lines.length));
        for (let i = 0; i < L - 1; i++) acc += lines[i].length + 1;
        idx = acc + Math.max(0, column - 1);
      }
    }

    if (idx === undefined || Number.isNaN(idx)) idx = 0;
    const { line, column } = indexToLineCol(raw, idx);
    const start = Math.max(0, idx);
    const end = Math.min(raw.length, idx + 1);
    return { message: msg, stage: 'json' as const, start, end, line, column };
  }

  const parsed = parsedAttempt.value;
  const candidate = Array.isArray(parsed) && parsed.length ? parsed[0] : parsed;
  const validated = validateAndNormalizeRuleCandidate(candidate);
  if (!validated.ok) {
    const msg = validated.error ?? '结构校验失败';
    const selMatch = /^非法选择器:\s*(\w+)\[(\d+)\]\s*错误:\s*(.*)$/u.exec(msg);
    if (selMatch) {
      const field = selMatch[1];
      const idxNum = parseInt(selMatch[2], 10);
      try {
        const fieldValue = (candidate as any)[field];
        let selectorString: string | undefined;
        if (Array.isArray(fieldValue) && fieldValue.length > idxNum)
          selectorString = fieldValue[idxNum];
        else if (typeof fieldValue === 'string' && idxNum === 0)
          selectorString = fieldValue;
        if (selectorString) {
          const pos = findFirstOccurrence(raw, selectorString);
          const start = pos >= 0 ? pos : 0;
          const end =
            pos >= 0
              ? pos + selectorString.length
              : Math.min(raw.length, start + 10);
          const { line, column } = indexToLineCol(raw, start);
          return {
            message: msg,
            stage: 'selector' as const,
            field,
            index: idxNum,
            start,
            end,
            line,
            column,
          };
        }
      } catch {
        // fallback
      }
    }

    const fieldNameMatch = /^非法字段:\s*([\w]+)\b/u.exec(msg);
    if (fieldNameMatch) {
      const fname = fieldNameMatch[1];
      const pos = findFirstOccurrence(raw, fname);
      const start = pos >= 0 ? Math.max(0, pos - 10) : 0;
      const end =
        pos >= 0
          ? Math.min(raw.length, pos + fname.length + 10)
          : Math.min(raw.length, start + 20);
      const { line, column } = indexToLineCol(raw, start);
      return {
        message: msg,
        stage: 'structure' as const,
        field: fname,
        start,
        end,
        line,
        column,
      };
    }

    return {
      message: msg,
      stage: 'structure' as const,
      start: 0,
      end: Math.min(200, raw.length),
      line: 1,
      column: 1,
    };
  }

  return null;
});

/* -------------------------
   dataRef：解析 -> validate -> 执行
   ------------------------- */

const dataRef = computed<RuleCheckResult | ''>(() => {
  if (!lazyText.value) return '';

  const parsedAttempt = tryParseJSON5Tolerant(lazyText.value);
  if (parsedAttempt.error) {
    return {
      success: false,
      error: `非法格式: ${parsedAttempt.error.message}`,
      stage: 'json',
    };
  }

  const parsed = parsedAttempt.value;
  const candidate = Array.isArray(parsed) && parsed.length ? parsed[0] : parsed;

  const validated = validateAndNormalizeRuleCandidate(candidate);
  if (!validated.ok) {
    return { success: false, error: validated.error, stage: 'structure' };
  }

  const execResult = checkRule(validated.rule, rootNode.value, {
    appId: snapshot.value?.appId,
    currentActivityId: snapshot.value?.activityId,
    simulatedPreKeys: [],
    ignoreActivityCheck: false,
  });

  return execResult;
});

/* -------------------------
   视图辅助：error text / target node / errorPreview
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

const errorPreview = computed(() => {
  const d = diagnostics.value;
  if (!d) return null;
  const raw = lazyText.value ?? '';
  const start = Math.max(0, d.start ?? 0);
  const end = Math.min(raw.length, d.end ?? start);
  const preStart = Math.max(0, start - PRE_CHARS_BEFORE);
  const postEnd = Math.min(raw.length, end + PRE_CHARS_AFTER);
  let head = raw.slice(preStart, start);
  let err = raw.slice(start, end) || ' ';
  let tail = raw.slice(end, postEnd);
  if (preStart > 0) head = '...' + head;
  if (postEnd < raw.length) tail = tail + '...';
  return {
    head,
    err,
    tail,
    line: d.line,
    column: d.column,
    message: d.message,
    stage: d.stage,
  };
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

      <!-- 错误预览（与 SearchCard.vue 风格对齐） -->
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
            <span v-if="errorPreview.err">{{ errorPreview.err }}</span>
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

          <span v-if="errorPreview.tail">{{ errorPreview.tail }}</span>
        </span>

        <div mt-6px text-12px class="selector-error-meta">
          <div text-red font-500>
            {{ errorPreview.message }}
          </div>
          <div text-11px opacity-70 mt-2px>
            行 {{ errorPreview.line }} ｜ 列 {{ errorPreview.column }}
            <span v-if="diagnostics?.stage"
              >｜ 阶段: {{ diagnostics.stage }}</span
            >
          </div>
        </div>
      </div>

      <div min-h-24px>
        <div v-if="errorText" color-red whitespace-pre>{{ errorText }}</div>

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
/* 使用项目已有主题变量（与 SearchCard.vue 风格对齐） */
.selector-ast-view {
  max-height: 160px;
  overflow: auto;
  border-radius: 6px;
  color: var(--text-primary, inherit);
}

/* 错误态背景使用项目变量（建议全局主题定义 --selector-ast-error-bg-color2） */
.selector-ast-view-error {
  background: var(--selector-ast-error-bg-color2, rgba(255, 240, 240, 0.9));
  border: 1px solid rgba(255, 80, 80, 0.12);
}

/* 箭头样式，使用项目错误色变量 */
.selector-error-arrow {
  color: var(--accent-error-color, #ff6666);
}

/* 元信息 */
.selector-error-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--neutral-500, #6b6b6b);
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 错误高亮段样式（简洁） */
.selector-ast-view .rc-error,
.selector-ast-view-error .rc-error {
  background: rgba(255, 90, 90, 0.12);
  border-bottom: 2px solid rgba(255, 60, 60, 0.9);
  padding: 0 2px;
  border-radius: 3px;
}

/* 兼容 html.dark-mode-active（项目使用该类作为夜间模式标识） */
html.dark-mode-active .selector-ast-view-error {
  background: var(--selector-ast-error-bg-color2, rgba(40, 40, 40, 0.6));
  border: 1px solid rgba(255, 80, 80, 0.16);
}
</style>
