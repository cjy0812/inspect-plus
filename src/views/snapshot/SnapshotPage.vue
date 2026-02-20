<script lang="ts" setup>
import FullScreenDialog from '@/components/FullScreenDialog.vue';
import TrackCard from '@/components/TrackCard.vue';
import { loadingBar } from '@/utils/discrete';
import { useI18n } from '@/utils/i18n';
import AttrCard from './AttrCard.vue';
import OverlapCard from './OverlapCard.vue';
import RuleCard from './RuleCard.vue';
import ScreenshotCard from './ScreenshotCard.vue';
import SearchCard from './SearchCard.vue';
import { useSnapshotStore } from './snapshot';
import WindowCard from './WindowCard.vue';

const { snapshot, rootNode, loading, redirected, trackData, trackShow } =
  useSnapshotStore();

watchEffect(() => {
  if (loading.value) loadingBar.start();
  else loadingBar.finish();
});

const { settingsStore } = useStorageStore();
const { t } = useI18n();
const searchShow = useStorage('searchShow', true, sessionStorage);
const ruleShow = useStorage('ruleShow', false, sessionStorage);
const attrShow = useStorage('attrShow', true, sessionStorage);
const settingsDlgShow = shallowRef(false);

const normalizeClock = (value: string) => {
  const v = value.trim();
  if (!/^\d{1,2}:\d{1,2}$/.test(v)) return null;
  const [hText, mText] = v.split(':');
  const h = Number(hText);
  const m = Number(mText);
  if (
    !Number.isInteger(h) ||
    !Number.isInteger(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
const updateDarkModeStart = () => {
  settingsStore.darkModeStart =
    normalizeClock(settingsStore.darkModeStart) || '18:00';
};
</script>

<template>
  <template v-if="snapshot && rootNode">
    <div page-size flex gap-5px>
      <div
        w-40px
        py-12px
        flex
        flex-col
        items-center
        gap-16px
        class="[--svg-h:24px]"
      >
        <NTooltip placement="right">
          <template #trigger>
            <NButton text>
              <RouterLink to="/"><SvgIcon name="home" /></RouterLink>
            </NButton>
          </template>
          回到首页
        </NTooltip>
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="settingsDlgShow = true"
              ><SvgIcon name="settings"
            /></NButton>
          </template>
          设置
        </NTooltip>
        <div />
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="searchShow = !searchShow"
              ><SvgIcon name="search-list"
            /></NButton>
          </template>
          搜索面板
        </NTooltip>
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="attrShow = !attrShow"
              ><SvgIcon name="prop"
            /></NButton>
          </template>
          属性面板
        </NTooltip>
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="ruleShow = !ruleShow"
              ><SvgIcon name="test"
            /></NButton>
          </template>
          测试规则
        </NTooltip>
        <div />
        <NTooltip placement="right">
          <template #trigger>
            <a
              flex
              justify-center
              href="https://github.com/orgs/gkd-kit/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <NButton text><SvgIcon name="discussion" /></NButton>
            </a>
          </template>
          讨论交流
        </NTooltip>
        <NTooltip placement="right">
          <template #trigger>
            <a
              flex
              justify-center
              href="https://gkd.li/guide/snapshot#share-note"
              target="_blank"
              rel="noopener noreferrer"
            >
              <NButton text><SvgIcon name="warn" /></NButton>
            </a>
          </template>
          分享须知
        </NTooltip>
      </div>
      <ScreenshotCard />
      <WindowCard class="flex-1" />
    </div>

    <SearchCard :show="searchShow" @updateShow="searchShow = $event" />
    <RuleCard :show="ruleShow" @updateShow="ruleShow = $event" />
    <AttrCard :show="attrShow" @updateShow="attrShow = $event" />
    <OverlapCard />
    <FullScreenDialog v-model:show="trackShow" @closed="trackData = undefined">
      <TrackCard
        v-if="trackData"
        class="snapshot-floating-panel"
        v-bind="trackData"
        @close="trackShow = false"
      />
    </FullScreenDialog>

    <NModal
      v-model:show="settingsDlgShow"
      preset="dialog"
      title="设置"
      :showIcon="false"
      positiveText="关闭"
      style="width: 620px"
      @positiveClick="settingsDlgShow = false"
    >
      <NCheckbox v-model:checked="settingsStore.ignoreUploadWarn"
        >关闭生成分享链接弹窗提醒</NCheckbox
      >
      <div h-1px my-10px bg="#eee" />
      <NCheckbox v-model:checked="settingsStore.ignoreWasmWarn"
        >关闭浏览器版本正则表达式 WASM(GC) 提醒</NCheckbox
      >
      <div h-1px my-10px bg="#eee" />
      <div flex gap-10px>
        <NSwitch v-model:value="settingsStore.autoUploadImport" />
        <div>打开快照页面自动生成分享链接（请确保不含隐私）</div>
      </div>
      <div h-1px my-10px bg="#eee" />
      <div flex gap-10px items-center>
        <NSwitch v-model:value="settingsStore.lowMemoryMode" />
        <div>低内存模式（限制预览缓存、减少动画、降低实时更新开销）</div>
      </div>
      <div h-1px my-10px bg="#eee" />
      <div flex gap-10px items-center>
        <NSwitch v-model:value="settingsStore.autoExpandSnapshots" />
        <div>{{ t('settings.autoExpandSnapshots') }}</div>
      </div>
      <div h-1px my-10px bg="#eee" />
      <div flex gap-10px items-center>
        <div class="w-100px">{{ t('settings.locale') }}</div>
        <NRadioGroup v-model:value="settingsStore.locale">
          <NSpace>
            <NRadio value="zh">{{ t('settings.localeZh') }}</NRadio>
            <NRadio value="en">{{ t('settings.localeEn') }}</NRadio>
          </NSpace>
        </NRadioGroup>
      </div>
      <div h-1px my-10px bg="#eee" />
      <div flex flex-col gap-10px>
        <div>主题模式</div>
        <NRadioGroup v-model:value="settingsStore.themeMode">
          <NSpace>
            <NRadio value="auto">自动</NRadio>
            <NRadio value="light">强制日间</NRadio>
            <NRadio value="dark">强制夜间</NRadio>
          </NSpace>
        </NRadioGroup>
        <div flex items-center gap-10px>
          <div class="w-100px">自动切换时间</div>
          <NInput
            v-model:value="settingsStore.darkModeStart"
            placeholder="18:00"
            class="w-120px"
            @blur="updateDarkModeStart"
          />
        </div>
      </div>
    </NModal>
  </template>
  <div
    v-else-if="!loading && !redirected"
    page-size
    pt-80px
    flex
    flex-col
    items-center
    justify-center
  >
    <div mb-8px>
      <span>快照数据缺失</span>
      <a
        href="https://gkd.li/guide/snapshot#share-note"
        target="_blank"
        referrerpolicy="no-referrer"
      >
        分享须知
      </a>
    </div>
  </div>
</template>
