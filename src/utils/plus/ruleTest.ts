import { tryParseJSON5Tolerant } from '@/utils/plus/json';
import { parseSelector } from '@/utils/selector';

export interface ResolvedData {
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
  [k: string]: unknown;
}

export type ValidateStage = 'json' | 'structure' | 'selector' | 'execute';

export type RuleCheckResultSuccess = {
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
    matchedRuleKey?: number;
  };
};

export type RuleCheckResultFailure = {
  success: false;
  error: string;
  stage: ValidateStage;
  field?: string;
  index?: number;
  node?: RawNode;
  start?: number;
  end?: number;
  line?: number;
  column?: number;
};

export type RuleCheckResult = RuleCheckResultSuccess | RuleCheckResultFailure;

type RuleCandidate = {
  rule: unknown;
  key?: number;
};

export const RULE_PREVIEW_CONTEXT_CHARS = 120;

const toArray = (v: unknown): string[] | undefined => {
  if (v === undefined || v === null) return [];
  if (typeof v === 'string') return [v];
  if (Array.isArray(v) && v.every((s) => typeof s === 'string')) {
    return [...v];
  }
  return undefined;
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const collectRuleCandidates = (input: unknown): RuleCandidate[] => {
  const out: RuleCandidate[] = [];
  const pushRule = (rule: unknown) => {
    if (!isObj(rule)) return;
    out.push({
      rule,
      key: Number.isInteger(rule.key) ? (rule.key as number) : undefined,
    });
  };
  const fromGroup = (group: unknown) => {
    if (!isObj(group)) return;
    if (Array.isArray(group.rules)) group.rules.forEach(pushRule);
  };
  const fromApp = (app: unknown) => {
    if (!isObj(app)) return;
    if (Array.isArray(app.groups)) app.groups.forEach(fromGroup);
  };

  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (!isObj(item)) return;
      if (Array.isArray(item.rules)) {
        item.rules.forEach(pushRule);
        return;
      }
      if (Array.isArray(item.groups)) {
        item.groups.forEach(fromGroup);
        return;
      }
      if (Array.isArray(item.apps)) {
        item.apps.forEach(fromApp);
        return;
      }
      pushRule(item);
    });
    return out;
  }

  if (isObj(input)) {
    if (Array.isArray(input.rules)) {
      input.rules.forEach(pushRule);
      return out;
    }
    if (Array.isArray(input.groups)) {
      input.groups.forEach(fromGroup);
      return out;
    }
    if (Array.isArray(input.apps)) {
      input.apps.forEach(fromApp);
      return out;
    }
    pushRule(input);
  }

  return out;
};

const indexToLineCol = (
  text: string,
  index: number,
): { line: number; column: number } => {
  const normalizedIndex = Math.max(0, index);
  const upto = text.slice(0, normalizedIndex);
  const lines = upto.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
};

const findFirstOccurrence = (rawText: string, needle: string): number => {
  if (!needle) return -1;
  let idx = rawText.indexOf(needle);
  if (idx >= 0) return idx;
  idx = rawText.indexOf(`"${needle}"`);
  if (idx >= 0) return idx + 1;
  idx = rawText.indexOf(`'${needle}'`);
  if (idx >= 0) return idx + 1;
  return rawText.indexOf(needle.replace(/"/g, '\\"'));
};

const expandActivityIds = (
  arr: string[] | undefined,
  appId?: string,
): string[] => {
  if (!arr) return [];
  if (!appId) return [...arr];
  return arr.map((id) => (id.startsWith('.') ? `${appId}${id}` : id));
};

const isActivityMatched = (
  currentActivityId: string,
  normalizedActivityId: string,
): boolean => {
  if (!normalizedActivityId) return false;
  if (currentActivityId.startsWith(normalizedActivityId)) return true;
  if (normalizedActivityId.startsWith('.')) {
    return currentActivityId.endsWith(normalizedActivityId);
  }
  return false;
};

const validateAndNormalizeRuleCandidate = (
  obj: unknown,
): { success: true; rule: ResolvedData } | RuleCheckResultFailure => {
  if (!isObj(obj)) {
    return {
      success: false,
      error: '非法格式: 规则不是对象',
      stage: 'structure',
    };
  }

  const normalizeStringOrArrayField = (fieldName: string) => {
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
      if (typeof obj.fastQuery !== 'boolean') {
        return {
          success: false,
          error: '非法字段: fastQuery 必须为 boolean',
          stage: 'structure',
          field: 'fastQuery',
        };
      }
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
      if (!(Number.isInteger(v) && v >= 0)) {
        return {
          success: false,
          error: '非法字段: actionMaximum 必须为非负整数',
          stage: 'structure',
          field: 'actionMaximum',
        };
      }
      result.actionMaximum = v;
    }

    if ('preKeys' in obj) {
      if (
        !Array.isArray(obj.preKeys) ||
        !obj.preKeys.every((n) => Number.isInteger(n))
      ) {
        return {
          success: false,
          error: '非法字段: preKeys 必须为整数数组',
          stage: 'structure',
          field: 'preKeys',
        };
      }
      result.preKeys = [...obj.preKeys];
    }

    try {
      const act = normalizeStringOrArrayField('activityIds');
      if (act !== undefined) result.activityIds = act;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stage: 'structure',
        field: 'activityIds',
      };
    }

    const urlFields = ['snapshotUrls', 'excludeSnapshotUrls', 'exampleUrls'];
    for (const field of urlFields) {
      try {
        const arr = normalizeStringOrArrayField(field);
        if (arr !== undefined) result[field] = arr;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stage: 'structure',
          field,
        };
      }
    }

    const selectorFields = [
      'matches',
      'anyMatches',
      'excludeMatches',
      'excludeAllMatches',
    ] as const;
    for (const field of selectorFields) {
      try {
        const arr = normalizeStringOrArrayField(field);
        if (arr !== undefined) {
          result[field] = arr;
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stage: 'structure',
          field,
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

    for (const field of selectorFields) {
      const arr = result[field];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        try {
          parseSelector(arr[i]);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return {
            success: false,
            error: `非法选择器: ${field}[${i}] 错误: ${message}`,
            stage: 'selector',
            field,
            index: i,
          };
        }
      }
    }

    return { success: true, rule: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stage: 'structure',
    };
  }
};

const checkRule = (
  obj: ResolvedData,
  root: RawNode | undefined,
  options?: {
    appId?: string;
    currentActivityId?: string;
    simulatedPreKeys?: number[];
    ignoreActivityCheck?: boolean;
  },
): RuleCheckResult => {
  if (!root) {
    return {
      success: false,
      error: '当前无可用 rootNode',
      stage: 'execute',
    };
  }

  const expanded = expandActivityIds(obj.activityIds ?? [], options?.appId);
  if (
    !options?.ignoreActivityCheck &&
    expanded.length > 0 &&
    options?.currentActivityId
  ) {
    const matched = expanded.some((aid) =>
      isActivityMatched(options.currentActivityId!, aid),
    );
    if (!matched) {
      return {
        success: false,
        error: 'activityIds 未匹配当前界面',
        stage: 'execute',
        field: 'activityIds',
      };
    }
  }

  const simulatedPreKeys = options?.simulatedPreKeys ?? [];
  if (
    Array.isArray(obj.preKeys) &&
    obj.preKeys.length &&
    simulatedPreKeys.length
  ) {
    const unmet = obj.preKeys.some((k) => !simulatedPreKeys.includes(k));
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
    if (!selectors?.length) return [] as RawNode[][];
    return selectors
      .map((selector) => parseSelector(selector))
      .map((resolved) => resolved.querySelfOrSelectorAll(root));
  };

  const excludeArr = obj.excludeMatches ?? [];
  if (excludeArr.length) {
    const excludeResults = resolveSelectorsToNodes(excludeArr);
    const index = excludeResults.findIndex((nodes) => nodes.length > 0);
    if (index >= 0) {
      return {
        success: false,
        error: `excludeMatches[${index}] 命中（规则被排除）`,
        stage: 'execute',
        field: 'excludeMatches',
        index,
        node: excludeResults[index]?.[0],
      };
    }
  }

  const excludeAllArr = obj.excludeAllMatches ?? [];
  if (excludeAllArr.length) {
    const excludeAllResults = resolveSelectorsToNodes(excludeAllArr);
    const allMatched =
      excludeAllResults.length > 0 &&
      excludeAllResults.every((nodes) => nodes.length > 0);
    if (allMatched) {
      return {
        success: false,
        error: 'excludeAllMatches 全部命中（规则被排除）',
        stage: 'execute',
        field: 'excludeAllMatches',
        node: excludeAllResults.find((nodes) => nodes.length > 0)?.[0],
      };
    }
  }

  const matchesArr = obj.matches ?? [];
  const matchesResults = resolveSelectorsToNodes(matchesArr);
  const anyArr = obj.anyMatches ?? [];
  const anyResults = resolveSelectorsToNodes(anyArr);

  if (matchesArr.length) {
    const notIndex = matchesResults.findIndex((nodes) => nodes.length === 0);
    if (notIndex >= 0) {
      const anyHitIndex = matchesResults.findIndex(
        (nodes, index) => index !== notIndex && nodes.length > 0,
      );
      if (anyHitIndex >= 0) {
        return {
          success: false,
          error: `matches[${notIndex}] 未命中，但 matches[${anyHitIndex}] 可命中（建议改用 anyMatches 语义）`,
          stage: 'execute',
          field: 'matches',
          index: notIndex,
          node: matchesResults[anyHitIndex]?.[0],
        };
      }
      const anyHitIndex2 = anyResults.findIndex((nodes) => nodes.length > 0);
      if (anyHitIndex2 >= 0) {
        return {
          success: false,
          error: `matches[${notIndex}] 未命中，但 anyMatches[${anyHitIndex2}] 可命中（建议改用 anyMatches 语义）`,
          stage: 'execute',
          field: 'matches',
          index: notIndex,
          node: anyResults[anyHitIndex2]?.[0],
        };
      }
      return {
        success: false,
        error: `无法匹配: matches[${notIndex}] 查找结果为空`,
        stage: 'execute',
        field: 'matches',
        index: notIndex,
      };
    }
    const lastNodes = matchesResults.at(-1) ?? [];
    return {
      success: true,
      node: lastNodes[0],
      matched: {
        matches: matchesArr.map((selector, index) => ({
          selector,
          nodes: matchesResults[index],
        })),
      },
      meta: {
        expandedActivityIds: expanded,
        usedFastQuery: !!obj.fastQuery,
      },
    };
  }

  if (anyArr.length) {
    if (anyResults.every((nodes) => nodes.length === 0)) {
      return {
        success: false,
        error: '无法匹配: anyMatches 查找结果为空',
        stage: 'execute',
        field: 'anyMatches',
      };
    }
    for (let i = 0; i < anyResults.length; i++) {
      const nodes = anyResults[i];
      if (nodes.length > 0) {
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

  return {
    success: false,
    error: '规则无有效匹配选择器',
    stage: 'execute',
  };
};

const getCandidateFieldValue = (
  rule: unknown,
  field: string,
): string | string[] | undefined => {
  if (!isObj(rule) || !(field in rule)) return undefined;
  const value = rule[field];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }
  return undefined;
};

export const evaluateRuleText = (
  rawText: string,
  options: {
    rootNode?: RawNode;
    appId?: string;
    currentActivityId?: string;
    simulatedPreKeys?: number[];
    ignoreActivityCheck?: boolean;
  },
): RuleCheckResult | null => {
  if (!rawText) return null;
  const rawNormalized = rawText.replace(/\r\n?/g, '\n');
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
        const safeLine = Math.max(1, Math.min(line, lines.length));
        for (let i = 0; i < safeLine - 1; i++) {
          acc += lines[i].length + 1;
        }
        idx = acc + Math.max(0, column - 1);
      }
    }
    if (idx === undefined || Number.isNaN(idx)) idx = 0;
    const { line, column } = indexToLineCol(rawNormalized, idx);
    return {
      success: false,
      error: `解析失败: ${msg}`,
      stage: 'json',
      start: Math.max(0, idx),
      end: Math.min(rawNormalized.length, idx + 1),
      line,
      column,
    };
  }

  const candidates = collectRuleCandidates(parsedAttempt.value);
  if (!candidates.length) {
    return {
      success: false,
      error:
        '未识别到可测试规则（请提供 rule 或包含 rules/groups/apps 的结构）',
      stage: 'structure',
      line: 1,
      column: 1,
      start: 0,
      end: Math.min(rawNormalized.length, 20),
    };
  }

  let firstFailure: RuleCheckResultFailure | null = null;
  for (const candidate of candidates) {
    const validated = validateAndNormalizeRuleCandidate(candidate.rule);
    if (!validated.success) {
      firstFailure ??= validated;
      continue;
    }
    const executed = checkRule(validated.rule, options.rootNode, options);
    if (executed.success) {
      return {
        ...executed,
        meta: {
          ...executed.meta,
          matchedRuleKey: candidate.key,
        },
      };
    }
    firstFailure ??= executed;
  }

  if (!firstFailure) {
    return {
      success: false,
      error: '规则测试失败（未命中任何候选规则）',
      stage: 'execute',
    };
  }

  let start = 0;
  let end = Math.min(200, rawNormalized.length);
  let line = 1;
  let column = 1;

  if (
    firstFailure.stage === 'selector' &&
    firstFailure.field &&
    firstFailure.index !== undefined
  ) {
    const fieldValue = getCandidateFieldValue(
      candidates[0]?.rule,
      firstFailure.field,
    );
    const selectorString = Array.isArray(fieldValue)
      ? fieldValue[firstFailure.index]
      : firstFailure.index === 0
        ? fieldValue
        : undefined;
    if (selectorString) {
      const pos = findFirstOccurrence(rawNormalized, selectorString);
      start = pos >= 0 ? pos : 0;
      end =
        pos >= 0
          ? pos + selectorString.length
          : Math.min(rawNormalized.length, start + 10);
      ({ line, column } = indexToLineCol(rawNormalized, start));
    }
  } else if (firstFailure.stage === 'structure' && firstFailure.field) {
    const pos = findFirstOccurrence(rawNormalized, firstFailure.field);
    start = pos >= 0 ? Math.max(0, pos - 10) : 0;
    end =
      pos >= 0
        ? Math.min(rawNormalized.length, pos + firstFailure.field.length + 10)
        : Math.min(rawNormalized.length, start + 20);
    ({ line, column } = indexToLineCol(rawNormalized, start));
  }

  return { ...firstFailure, start, end, line, column };
};
