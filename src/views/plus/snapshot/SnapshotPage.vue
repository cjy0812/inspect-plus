<script lang="ts" setup>
import BaseSnapshotPage from '@/views/snapshot/SnapshotPage.vue';
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
  <BaseSnapshotPage>
    <template #sidebar>
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
            <NButton text @click="openSettings">
              <SvgIcon name="settings" />
            </NButton>
          </template>
          设置
        </NTooltip>
        <div />
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="searchShow = !searchShow">
              <SvgIcon name="search-list" />
            </NButton>
          </template>
          搜索面板
        </NTooltip>
        <DeviceControlTools />
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="attrShow = !attrShow">
              <SvgIcon name="prop" />
            </NButton>
          </template>
          属性面板
        </NTooltip>
        <NTooltip placement="right">
          <template #trigger>
            <NButton text @click="ruleShow = !ruleShow">
              <SvgIcon name="test" />
            </NButton>
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
    </template>

    <template #screenshot-card>
      <ScreenshotCard v-if="snapshot" />
    </template>
    <template #window-card>
      <WindowCard v-if="snapshot" class="flex-1" />
    </template>

    <template #search-card>
      <SearchCard
        v-if="snapshot"
        :show="searchShow"
        @updateShow="searchShow = $event"
      />
    </template>
    <template #rule-card>
      <RuleCard
        v-if="snapshot"
        :show="ruleShow"
        @updateShow="ruleShow = $event"
      />
    </template>
    <template #attr-card>
      <AttrCard
        v-if="snapshot"
        :show="attrShow"
        @updateShow="attrShow = $event"
      />
    </template>
    <template #overlap-card>
      <OverlapCard v-if="snapshot" />
    </template>

    <template #track-dialog>
      <FullScreenDialog v-model:show="trackShow" @closed="onTrackDialogClosed">
        <TrackCard
          v-if="trackData"
          class="snapshot-floating-panel snapshot-window window-anim"
          v-bind="trackData"
          @close="trackShow = false"
        />
      </FullScreenDialog>
    </template>

    <template #extra-modals>
      <SettingsModal v-model:show="settingsDlgShow" />
    </template>
  </BaseSnapshotPage>
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
