<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import { getNodeLabel, getNodeStyle } from '@/utils/node';
import { buildEmptyFn } from '@/utils/others';
import {
  evaluateRuleText,
  RULE_PREVIEW_CONTEXT_CHARS,
  type RuleCheckResult,
  type RuleCheckResultFailure,
} from '@/utils/plus/ruleTest';
import { gkdWidth, vw } from '@/utils/size';
import type { ShallowRef } from 'vue';
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
const parsedRuleResult = computed<RuleCheckResult | null>(() =>
  evaluateRuleText(lazyText.value, {
    rootNode: rootNode.value,
    appId: snapshot.value?.appId,
    currentActivityId: snapshot.value?.activityId,
    simulatedPreKeys: [],
    ignoreActivityCheck: false,
  }),
);

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

const matchedRuleKeyText = computed(() => {
  const result = parsedRuleResult.value;
  if (!result || !result.success) return '';
  const key = result.meta?.matchedRuleKey;
  return Number.isInteger(key) ? `命中规则 key=${key}` : '';
});

const errorPreview = computed(() => {
  const d = diagnostics.value;
  if (!d) return null;
  const raw = lazyText.value ? lazyText.value.replace(/\r\n?/g, '\n') : '';
  const start = Math.max(0, d.start ?? 0);
  const end = Math.min(raw.length, d.end ?? start);
  const preStart = Math.max(0, start - RULE_PREVIEW_CONTEXT_CHARS);
  const postEnd = Math.min(raw.length, end + RULE_PREVIEW_CONTEXT_CHARS);

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
        <div>测试规则 GKD引擎模拟器</div>
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
        <!-- 规则成功命中 -->
        <div v-if="parsedRuleResult && parsedRuleResult.success">
          <div flex items-center gap-4px>
            <NTag type="success" size="small" round>规则命中</NTag>
            <NButton
              size="small"
              :style="getNodeStyle(parsedRuleResult.node, focusNode)"
              @click="snapshotStore.updateFocusNode(parsedRuleResult.node)"
            >
              {{ getNodeLabel(parsedRuleResult.node) }}
            </NButton>
          </div>
          <!-- 显示命中详情 -->
          <div
            v-if="parsedRuleResult.matched"
            mt-4px
            pl-4px
            border-l-2
            border-gray-200
          >
            <div
              v-for="(matchInfo, type) in parsedRuleResult.matched"
              :key="type"
              mb-2px
            >
              <div flex items-center gap-2px>
                <NTag
                  :type="type.includes('exclude') ? 'warning' : 'info'"
                  size="small"
                  round
                  >{{ type }} 命中</NTag
                >
                <span text-12px opacity-70
                  >{{ (matchInfo || []).length }}个选择器</span
                >
              </div>
              <div
                v-for="(item, index) in matchInfo"
                :key="index"
                ml-4px
                mt-1px
              >
                <NTooltip trigger="hover">
                  <template #trigger>
                    <div text-12px gkd_code>
                      {{ index }}: {{ item.selector }}
                    </div>
                  </template>
                  <div max-w-400px whitespace-pre-wrap>{{ item.selector }}</div>
                </NTooltip>
              </div>
            </div>
          </div>
        </div>

        <!-- 规则未命中但有可命中的选择器 -->
        <div
          v-else-if="
            parsedRuleResult &&
            !parsedRuleResult.success &&
            parsedRuleResult.node &&
            parsedRuleResult.error.includes('可命中')
          "
        >
          <div color-red whitespace-pre>{{ errorText }}</div>
          <div flex items-center gap-4px mt-2px>
            <NTag type="warning" size="small" round
              >建议改用 anyMatches 语义</NTag
            >
            <NButton
              size="small"
              :style="getNodeStyle(parsedRuleResult.node, focusNode)"
              @click="snapshotStore.updateFocusNode(parsedRuleResult.node)"
            >
              {{ getNodeLabel(parsedRuleResult.node) }}
            </NButton>
          </div>
        </div>

        <!-- 规则因 excludeMatches 而未命中 -->
        <div
          v-else-if="
            parsedRuleResult &&
            !parsedRuleResult.success &&
            parsedRuleResult.node &&
            parsedRuleResult.field &&
            parsedRuleResult.field.includes('exclude')
          "
        >
          <div color-red whitespace-pre>{{ errorText }}</div>
          <div flex items-center gap-4px mt-2px>
            <NTag type="warning" size="small" round
              >{{ parsedRuleResult.field }} 排除命中</NTag
            >
            <NButton
              size="small"
              :style="getNodeStyle(parsedRuleResult.node, focusNode)"
              @click="snapshotStore.updateFocusNode(parsedRuleResult.node)"
            >
              {{ getNodeLabel(parsedRuleResult.node) }}
            </NButton>
          </div>
        </div>

        <!-- 规则完全未命中 -->
        <div v-else-if="parsedRuleResult && !parsedRuleResult.success">
          <div color-red whitespace-pre>{{ errorText }}</div>
          <template v-if="diagnostics">
            <br />
            <span text-11px opacity-70>
              行 {{ diagnostics.line }} ｜ 列 {{ diagnostics.column }} ｜ 阶段:
              {{ diagnostics.stage }}
            </span>
          </template>
        </div>

        <!-- 显示规则 key -->
        <div v-if="matchedRuleKeyText" mt-4px text-12px opacity-75>
          {{ matchedRuleKeyText }}
        </div>
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
