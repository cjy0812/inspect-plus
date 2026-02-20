import zh from './zh.json';
import en from './en.json';

type Locale = 'zh' | 'en';
type Dict = Record<string, string>;

const dictMap: Record<Locale, Dict> = {
  zh: zh as Dict,
  en: en as Dict,
};

export const useI18n = () => {
  const { settingsStore } = useStorageStore();
  const locale = computed<Locale>(() => {
    return settingsStore.locale || 'zh';
  });
  const t = (key: string) => {
    const active = dictMap[locale.value] || dictMap.zh;
    return active[key] || dictMap.zh[key] || key;
  };
  return {
    locale,
    t,
  };
};
