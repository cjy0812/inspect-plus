<script setup lang="ts">
import DraggableCard from '@/components/DraggableCard.vue';
import SelectorText from '@/components/SelectorText.vue';
import { buildEmptyFn } from '@/utils/others';
import { gkdWidth, vw } from '@/utils/size';
import {
  AstNode,
  GkdException,
  Selector,
  SyntaxException,
} from '@gkd-kit/selector';

withDefaults(
  defineProps<{
    show: boolean;
    onUpdateShow?: (data: boolean) => void;
  }>(),
  {
    onUpdateShow: buildEmptyFn,
  },
);

const inputText = shallowRef('');
const lazyText = useDebounce(inputText, 300);
const text = computed(() => {
  return (inputText.value && lazyText.value).trim();
});

const result = computed(() => {
  if (!text.value) return;
  try {
    return Selector.Companion.parseAst(text.value);
  } catch (e) {
    return e as GkdException;
  }
});

const ast = computed(() => {
  if (result.value instanceof AstNode) {
    return result.value;
  }
  return undefined;
});

const error = computed(() => {
  const e = result.value;
  const t = text.value;
  if (e instanceof SyntaxException) {
    return {
      headText: t.substring(0, e.index),
      errorText: t.substring(e.index, e.index + 1),
      tailText: t.substring(e.index + 1),
      message: e.outMessage,
    };
  }
  return undefined;
});
</script>

<template>
  <DraggableCard
    v-slot="{ onRef }"
    :initialValue="{
      top: 40,
      right: Math.max(315, 12 * vw + 135),
      width: Math.max(520, gkdWidth * 0.35),
    }"
    :minWidth="360"
    sizeDraggable
    class="box-shadow-dim"
    :show="show"
  >
    <div
      class="snapshot-floating-panel"
      b-1px
      b-solid
      b-gray-200
      rounded-4px
      p-8px
    >
      <div flex m-b-4px pr-4px>
        <div>测试选择器</div>
        <div :ref="onRef" flex-1 cursor-move />
        <NButton text title="最小化" @click="onUpdateShow(!show)">
          <template #icon>
            <SvgIcon name="minus" />
          </template>
        </NButton>
      </div>
      <NInput
        v-model:value="inputText"
        type="textarea"
        placeholder="请输入选择器 语法高亮/错误解析"
        class="gkd_code py-4px"
        :autosize="{
          minRows: 3,
          maxRows: 8,
        }"
      />
      <div h-10px />
      <div
        max-w-full
        mb-8px
        p-4px
        gkd_code
        transition-colors
        class="selector-ast-view"
        :class="error ? `selector-ast-view-error` : ``"
      >
        <div v-if="ast" overflow-x-scroll scrollbar-hidden>
          <SelectorText :source="text" :node="ast" />
        </div>
        <span v-else-if="error" whitespace-pre-wrap>
          <span v-if="error.headText">{{ error.headText }}</span>
          <span bg-red relative>
            <span v-if="error.errorText">{{ error.errorText }}</span>
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
          <span v-if="error.tailText">{{ error.tailText }}</span>
        </span>
      </div>
      <div v-if="error" p-4px gkd_code class="selector-error-box">
        {{ error.message }}
      </div>
    </div>
  </DraggableCard>
</template>
