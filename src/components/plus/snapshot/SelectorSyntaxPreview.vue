<script setup lang="ts">
import SelectorText from '@/components/SelectorText.vue';
import type { AstNode } from '@gkd-kit/selector';
import type { SelectorSyntaxErrorState } from '@/composables/plus/useSearchCardPlus';

defineProps<{
  enableSearchBySelector: boolean;
  syntaxText: string;
  syntaxAst?: AstNode<any>;
  syntaxError?: SelectorSyntaxErrorState;
}>();
</script>

<template>
  <div
    v-if="enableSearchBySelector && syntaxText"
    mt-6px
    mb-8px
    p-4px
    gkd_code
    transition-colors
    class="selector-ast-view"
    :class="syntaxError ? 'selector-ast-view-error' : ''"
  >
    <div v-if="syntaxAst" overflow-x-scroll scrollbar-hidden>
      <SelectorText :source="syntaxText" :node="syntaxAst" />
    </div>
    <span v-else-if="syntaxError" whitespace-pre-wrap>
      <span v-if="syntaxError.headText">{{ syntaxError.headText }}</span>
      <span bg-red relative>
        <span v-if="syntaxError.errorText">{{ syntaxError.errorText }}</span>
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
      <span v-if="syntaxError.tailText">{{ syntaxError.tailText }}</span>
    </span>
  </div>
  <div
    v-if="syntaxError && !syntaxError.isEof"
    p-4px
    gkd_code
    class="selector-error-box"
  >
    {{ syntaxError.message }}
  </div>
</template>
