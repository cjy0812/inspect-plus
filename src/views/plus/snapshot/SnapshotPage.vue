<script lang="ts" setup>
import DeviceControlTools from '@/components/DeviceControlTools.vue';
import FullScreenDialog from '@/components/FullScreenDialog.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import TrackCard from '@/components/TrackCard.vue';
import { usesnapshot } from '@/composables/plus/usesnapshot';
import AttrCard from './AttrCard.vue';
import OverlapCard from './OverlapCard.vue';
import RuleCard from './RuleCard.vue';
import ScreenshotCard from './ScreenshotCard.vue';
import SearchCard from './SearchCard.vue';
import WindowCard from './WindowCard.vue';

const {
  snapshot,
  rootNode,
  loading,
  redirected,
  trackData,
  trackShow,
  searchShow,
  ruleShow,
  attrShow,
  settingsDlgShow,
  openSettings,
  onTrackDialogClosed,
  openBlurEditor,
} = usesnapshot();
</script>

<template>
  <template v-if="snapshot && rootNode">
    <div page-size flex gap-5px class="snapshot-page">
      <div py-12px flex flex-col items-center gap-16px class="snapshot-sidebar">
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
            <RouterLink to="/device">
              <NButton text><SvgIcon name="device" /></NButton>
            </RouterLink>
          </template>
          连接设备
        </NTooltip>
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="openSettings"
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
        <DeviceControlTools />
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
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="openBlurEditor">
              <SvgIcon name="Photo-edit" />
            </NButton>
          </template>
          编辑图片
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
      <ScreenshotCard v-if="snapshot" />
      <WindowCard v-if="snapshot" class="flex-1" />
    </div>

    <SearchCard
      v-if="snapshot"
      :show="searchShow"
      @updateShow="searchShow = $event"
    />
    <RuleCard
      v-if="snapshot"
      :show="ruleShow"
      @updateShow="ruleShow = $event"
    />
    <AttrCard
      v-if="snapshot"
      :show="attrShow"
      @updateShow="attrShow = $event"
    />
    <OverlapCard v-if="snapshot" />
    <FullScreenDialog v-model:show="trackShow" @closed="onTrackDialogClosed">
      <TrackCard
        v-if="trackData"
        class="snapshot-floating-panel snapshot-window window-anim"
        v-bind="trackData"
        @close="trackShow = false"
      />
    </FullScreenDialog>

    <SettingsModal v-model:show="settingsDlgShow" />
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

<style scoped>
.snapshot-page {
  min-width: 0;
}

@media (max-width: 900px) {
  .snapshot-page {
    flex-direction: column;
    gap: 8px;
  }

  .snapshot-sidebar {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    padding: 8px 10px;
    overflow-x: auto;
    overflow-y: hidden;
    border-bottom: 1px solid var(--n-border-color);
  }
}
</style>
