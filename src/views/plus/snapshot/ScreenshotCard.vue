<script setup lang="ts">
import dayjs from 'dayjs';
import PrivacyBlurEditor from '@/components/plus/snapshot/PrivacyBlurEditor.vue';
import MiniHoverImg from './MiniHoverImg.vue';
import { useSharedSnapshotHoverImg, useSnapshotStore } from './snapshot';

const {
  snapshot,
  displayScreenshotUrl,
  blurEditorShow,
  applyBlurredScreenshot,
  resetBlurredScreenshot,
  showRegenerateTip,
  dismissRegenerateTip,
} = useSnapshotStore();
const { clickImg, imgHover, imgMove, imgLoadTime, positionStyle, imgRef } =
  useSharedSnapshotHoverImg();
</script>

<template>
  <div
    v-if="snapshot && displayScreenshotUrl"
    flex
    flex-col
    relative
    h-full
    p-2px
    overflow-hidden
  >
    <img
      ref="imgRef"
      :src="displayScreenshotUrl"
      cursor-crosshair
      object-contain
      h-full
      class="max-w-[calc(var(--gkd-w)*0.35)]"
      @click="clickImg"
      @mouseover="imgHover = true"
      @mouseleave="imgHover = false"
      @mousemove="imgMove"
      @load="imgLoadTime = true"
    />
    <div pointer-events-none absolute left-2px top-2px size="[calc(100%-4px)]">
      <div
        :style="positionStyle"
        absolute
        transition-all-300
        b-1px
        b-solid
        style="border-color: var(--screenshot-focus-border-color)"
      >
        <div
          absolute
          left-0
          top-0
          bottom-0
          right-0
          b-solid
          b-1px
          style="border-color: var(--screenshot-focus-border-inner-color)"
        />
      </div>
    </div>
    <div
      absolute
      z-4
      left-4px
      top-4px
      text-12px
      leading="100%"
      flex
      gap-4px
      items-center
    >
      <div
        py-1px
        px-2px
        style="
          background-color: var(--screenshot-card-bg-color);
          color: var(--screenshot-card-text-color);
        "
        title="尺寸"
      >
        {{ `${snapshot.screenWidth}x${snapshot.screenHeight}` }}
      </div>
      <div
        py-1px
        px-2px
        style="
          background-color: var(--screenshot-card-bg-color);
          color: var(--screenshot-card-text-color);
        "
        title="创建时间"
      >
        {{ dayjs(snapshot.id).format('YYYY-MM-DD HH:mm:ss') }}
      </div>
    </div>
    <MiniHoverImg v-if="imgRef" />
    <PrivacyBlurEditor
      :show="blurEditorShow"
      :src="displayScreenshotUrl"
      :host-image="imgRef"
      @update:show="blurEditorShow = $event"
      @apply="applyBlurredScreenshot"
      @reset="resetBlurredScreenshot"
    />

    <NAlert
      v-if="showRegenerateTip"
      type="warning"
      size="small"
      closable
      class="absolute left-4px right-4px top-4px z-12"
      style="--n-border-radius: 10px"
      @close="dismissRegenerateTip"
    >
      图片已编辑：如你之前已经生成过链接，请重新生成链接后再分享。
    </NAlert>
  </div>
</template>
