import {
  normalizeLooseJsonLikeText,
  tryParseJSON5Tolerant,
} from '@/utils/plus/json';

export type RuleGroupLike = Record<string, unknown> & {
  key: number;
  name?: string;
  rules?: unknown[];
};

export type RuleAppLike = Record<string, unknown> & {
  id: string;
  name?: string;
  groups?: RuleGroupLike[];
};

export type SubscriptionPayload = {
  categories?: unknown[];
  globalGroups?: RuleGroupLike[];
  apps?: RuleAppLike[];
};

export type CandidateKind = 'app' | 'globalGroup' | 'category';

export interface SubscriptionCandidate {
  key: string;
  label: string;
  kind: CandidateKind;
  payload: SubscriptionPayload;
}

export interface SnapshotAppHeader {
  id: string;
  name: string;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v != null;

export const isRuleGroupLike = (v: unknown): v is RuleGroupLike =>
  isObj(v) && typeof v.key === 'number';

export const isRuleAppLike = (v: unknown): v is RuleAppLike =>
  isObj(v) && typeof v.id === 'string';

const isSubscriptionLike = (v: unknown): v is SubscriptionPayload =>
  isObj(v) &&
  (Array.isArray(v.categories) ||
    Array.isArray(v.globalGroups) ||
    Array.isArray(v.apps));

const normalizeLabel = (text: unknown, fallback: string) =>
  String(text || '').trim() || fallback;

const createAppPayload = (
  appHeader: SnapshotAppHeader,
  groups: RuleGroupLike[],
): SubscriptionPayload => ({
  apps: [
    {
      id: appHeader.id,
      name: appHeader.name,
      groups,
    },
  ],
});

const appendAppCandidates = (
  candidates: SubscriptionCandidate[],
  app: RuleAppLike,
  prefix: string,
) => {
  const appName = normalizeLabel(app.name, app.id);
  const groups = (Array.isArray(app.groups) ? app.groups : []).filter(
    isRuleGroupLike,
  );
  if (groups.length) {
    groups.forEach((group, idx) => {
      candidates.push({
        key: `${prefix}:app:${app.id}:group:${group.key}:${idx}`,
        kind: 'app',
        label: `AppGroup: ${appName} / ${normalizeLabel(group.name, `key=${group.key}`)}`,
        payload: {
          apps: [
            {
              ...app,
              groups: [group],
            },
          ],
        },
      });
    });
    return;
  }
  candidates.push({
    key: `${prefix}:app:${app.id}`,
    kind: 'app',
    label: `App: ${appName} (${app.id})`,
    payload: { apps: [app] },
  });
};

const appendFromSubscription = (
  candidates: SubscriptionCandidate[],
  payload: SubscriptionPayload,
  prefix: string,
) => {
  (payload.apps || []).forEach((app, idx) => {
    if (!isRuleAppLike(app)) return;
    appendAppCandidates(candidates, app, `${prefix}:${idx}`);
  });
  (payload.globalGroups || []).forEach((group, idx) => {
    if (!isRuleGroupLike(group)) return;
    candidates.push({
      key: `${prefix}:group:${idx}:${group.key}`,
      kind: 'globalGroup',
      label: `GlobalGroup: ${normalizeLabel(group.name, `key=${group.key}`)}`,
      payload: { globalGroups: [group] },
    });
  });
  (payload.categories || []).forEach((category, idx) => {
    const cName = isObj(category)
      ? normalizeLabel(category.name, String(category.key || `#${idx + 1}`))
      : `#${idx + 1}`;
    candidates.push({
      key: `${prefix}:category:${idx}`,
      kind: 'category',
      label: `Category: ${cName}`,
      payload: { categories: [category] },
    });
  });
};

export const normalizeSubscriptionImportText = (text: string) =>
  normalizeLooseJsonLikeText(text.trim());

/**
 * Build import candidates from a loose JSON/TS-like input.
 * This keeps parsing decisions in a neutral helper so the composable can focus
 * on view state, messages and API coordination.
 */
export const buildSubscriptionCandidates = async (
  data: unknown,
  getSnapshotAppHeader: () => Promise<SnapshotAppHeader>,
): Promise<SubscriptionCandidate[]> => {
  const candidates: SubscriptionCandidate[] = [];

  if (isSubscriptionLike(data)) {
    appendFromSubscription(candidates, data, 'root');
    return candidates;
  }

  if (isRuleAppLike(data)) {
    appendAppCandidates(candidates, data, 'root');
    return candidates;
  }

  if (isRuleGroupLike(data)) {
    const appHeader = await getSnapshotAppHeader();
    candidates.push({
      key: `root:auto-app-group:${data.key}`,
      kind: 'app',
      label: `App(auto): ${appHeader.name} / Group(${normalizeLabel(data.name, `key=${data.key}`)})`,
      payload: createAppPayload(appHeader, [data]),
    });
    return candidates;
  }

  if (Array.isArray(data) && data.length) {
    if (data.every((item) => isRuleAppLike(item))) {
      data.forEach((app, idx) => {
        appendAppCandidates(candidates, app, `root:${idx}`);
      });
      return candidates;
    }
    if (data.every((item) => isRuleGroupLike(item))) {
      const appHeader = await getSnapshotAppHeader();
      data.forEach((group) => {
        candidates.push({
          key: `root:auto-app-group:${group.key}`,
          kind: 'app',
          label: `App(auto): ${appHeader.name} / Group(${normalizeLabel(group.name, `key=${group.key}`)})`,
          payload: createAppPayload(appHeader, [group]),
        });
      });
      return candidates;
    }
    for (const [idx, item] of data.entries()) {
      if (isSubscriptionLike(item)) {
        appendFromSubscription(candidates, item, `list-${idx}`);
        continue;
      }
      if (isRuleAppLike(item)) {
        appendAppCandidates(candidates, item, `list-${idx}`);
        continue;
      }
      if (isRuleGroupLike(item)) {
        candidates.push({
          key: `list-${idx}:group:${item.key}`,
          kind: 'globalGroup',
          label: `GlobalGroup: ${normalizeLabel(item.name, `key=${item.key}`)}`,
          payload: { globalGroups: [item] },
        });
      }
    }
    return candidates;
  }

  if (isObj(data) && Array.isArray(data.groups) && !('id' in data)) {
    const appHeader = await getSnapshotAppHeader();
    data.groups.forEach((group) => {
      if (!isRuleGroupLike(group)) return;
      candidates.push({
        key: `root:auto-app-group:${group.key}`,
        kind: 'app',
        label: `App(auto): ${appHeader.name} / Group(${normalizeLabel(group.name, `key=${group.key}`)})`,
        payload: createAppPayload(appHeader, [group]),
      });
    });
  }

  return candidates;
};

export const mergeSubscriptionPayload = (
  candidates: SubscriptionCandidate[],
): SubscriptionPayload => {
  const result: SubscriptionPayload = {};
  const appMap = new Map<string, RuleAppLike>();
  const globalGroups: RuleGroupLike[] = [];
  const categories: unknown[] = [];

  candidates.forEach((item) => {
    (item.payload.globalGroups || []).forEach((group) => {
      if (isRuleGroupLike(group)) globalGroups.push(group);
    });
    (item.payload.categories || []).forEach((category) => {
      categories.push(category);
    });
    (item.payload.apps || []).forEach((app) => {
      if (!isRuleAppLike(app)) return;
      const prev = appMap.get(app.id);
      if (!prev) {
        appMap.set(app.id, {
          ...app,
          groups: Array.isArray(app.groups) ? [...app.groups] : [],
        });
        return;
      }
      const groups = Array.isArray(app.groups) ? app.groups : [];
      prev.groups = [...(prev.groups || []), ...groups];
    });
  });

  const apps = [...appMap.values()];
  if (apps.length) result.apps = apps;
  if (globalGroups.length) result.globalGroups = globalGroups;
  if (categories.length) result.categories = categories;
  return result;
};

export const parseSubscriptionImportText = async (
  rawText: string,
  getSnapshotAppHeader: () => Promise<SnapshotAppHeader>,
) => {
  const normalizedText = normalizeSubscriptionImportText(rawText);
  const parsed = tryParseJSON5Tolerant(normalizedText);
  if (parsed.error) {
    throw parsed.error;
  }
  if (parsed.value == null) {
    throw new Error('无法识别的订阅文本');
  }
  const candidates = await buildSubscriptionCandidates(
    parsed.value,
    getSnapshotAppHeader,
  );
  if (!candidates.length) {
    throw new Error('无法识别的订阅文本');
  }
  return {
    normalizedText,
    candidates,
  };
};
