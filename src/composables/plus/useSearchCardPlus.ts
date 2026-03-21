import { computed } from 'vue';
import type { Ref } from 'vue';
import {
  AstNode,
  GkdException,
  Selector,
  SyntaxException,
} from '@gkd-kit/selector';
import { getImportUrl } from '@/utils/url';
import { getOfficialImportUrl } from '@/utils/plus/url';

export interface SelectorSyntaxErrorState {
  isEof: boolean;
  headText: string;
  errorText: string;
  tailText: string;
  message: string;
}

interface UseSearchCardPlusOptions {
  searchText: Ref<string>;
  enableSearchBySelector: Ref<boolean>;
}

export function useSearchCardPlus(options: UseSearchCardPlusOptions) {
  const { settingsStore } = useStorageStore();
  const searchTextLazy = useDebounce(options.searchText, 220);

  const selectorSyntaxText = computed(() => {
    if (!options.enableSearchBySelector.value) return '';
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

  const selectorSyntaxError = computed<SelectorSyntaxErrorState | undefined>(
    () => {
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
    },
  );

  const handleTextareaKeyDown = (event: KeyboardEvent, submit: () => void) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const resolveImportUrl = (importId: string | number) =>
    settingsStore.shareUseOfficialImportDomain
      ? getOfficialImportUrl(String(importId))
      : getImportUrl(String(importId));

  return {
    selectorSyntaxText,
    selectorSyntaxAst,
    selectorSyntaxError,
    handleTextareaKeyDown,
    resolveImportUrl,
  };
}
