<script setup lang="ts">
import { usePrivacyFabricEditor } from '@/composables/plus/usePrivacyFabricEditor';

const props = withDefaults(
  defineProps<{
    show: boolean;
    src?: string;
    hostImage?: HTMLImageElement;
  }>(),
  { src: '' },
);

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'apply', value: string): void;
  (e: 'reset'): void;
}>();

const showRef = toRef(props, 'show');
const srcRef = toRef(props, 'src');
const hostImageRef = toRef(props, 'hostImage');

const close = () => emit('update:show', false);

const {
  fabricCanvasRef,
  blurCanvasRef,
  toolMode,
  brushSize,
  blurSize,
  rectWidth,
  textSize,
  canUndo,
  canRedo,
  isReady,
  canvasStyle,
  toolbarStyle,
  activeSliderLabel,
  activeSliderValue,
  activeSliderRange,
  setTool,
  undo,
  redo,
  clearAnnotations,
  finish,
} = usePrivacyFabricEditor({
  show: showRef,
  src: srcRef,
  hostImage: hostImageRef,
  onApply: (url) => emit('apply', url),
  onReset: () => emit('reset'),
  onClose: close,
});
</script>

<template>
  <div v-if="show && src" class="plus-privacy-editor">
    <canvas
      ref="blurCanvasRef"
      class="plus-privacy-editor__canvas plus-privacy-editor__blur-layer"
      :style="canvasStyle"
    />
    <canvas
      ref="fabricCanvasRef"
      class="plus-privacy-editor__canvas plus-privacy-editor__fabric-layer"
    />

    <div
      class="plus-privacy-editor__toolbar pointer-events-auto"
      :style="toolbarStyle"
    >
      <div class="plus-privacy-editor__toolbar-grid">
        <NButton
          size="small"
          :type="toolMode === 'select' ? 'primary' : 'default'"
          @click="setTool('select')"
          >选择</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'brush' ? 'primary' : 'default'"
          @click="setTool('brush')"
          >画笔</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'eraser' ? 'primary' : 'default'"
          @click="setTool('eraser')"
          >橡皮</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'blur' ? 'primary' : 'default'"
          @click="setTool('blur')"
          >高斯</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'rect' ? 'primary' : 'default'"
          @click="setTool('rect')"
          >矩形</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'text' ? 'primary' : 'default'"
          @click="setTool('text')"
          >文本</NButton
        >
      </div>

      <div class="plus-privacy-editor__slider-block">
        <div class="plus-privacy-editor__slider-label">
          {{ activeSliderLabel }}
        </div>
        <NSlider
          v-model:value="activeSliderValue"
          :min="activeSliderRange.min"
          :max="activeSliderRange.max"
          :step="activeSliderRange.step"
        />
        <div class="plus-privacy-editor__slider-value">
          <span>笔刷 {{ brushSize }}</span>
          <span>高斯 {{ blurSize }}</span>
          <span>线宽 {{ rectWidth }}</span>
          <span>文字 {{ textSize }}</span>
        </div>
      </div>

      <div class="plus-privacy-editor__hint">
        V 选择 / B 画笔 / E 橡皮 / G 高斯 / R 矩形 / T 文本 / Ctrl+Z
      </div>

      <div class="plus-privacy-editor__actions">
        <NButton size="small" quaternary :disabled="!canUndo" @click="undo"
          >撤销</NButton
        >
        <NButton size="small" quaternary :disabled="!canRedo" @click="redo"
          >重做</NButton
        >
        <NButton size="small" quaternary @click="clearAnnotations"
          >还原</NButton
        >
      </div>

      <div class="plus-privacy-editor__actions">
        <NButton size="small" class="flex-1" @click="close">关闭</NButton>
        <NButton
          size="small"
          type="primary"
          class="flex-1"
          :disabled="!isReady"
          @click="finish"
          >完成</NButton
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.plus-privacy-editor {
  --plus-privacy-toolbar-bg: color-mix(in srgb, #060b16 84%, transparent);
  --plus-privacy-toolbar-border: color-mix(in srgb, #334155 70%, transparent);
  --plus-privacy-toolbar-text: #f8fafc;
  --plus-privacy-toolbar-muted: color-mix(in srgb, #f8fafc 68%, transparent);
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

.plus-privacy-editor__canvas {
  position: fixed;
  transform-origin: top left;
}

.plus-privacy-editor__blur-layer {
  z-index: 2;
  pointer-events: none;
}

.plus-privacy-editor__fabric-layer {
  z-index: 3;
  pointer-events: auto;
}

.plus-privacy-editor__toolbar {
  position: fixed;
  z-index: 4;
  max-height: calc(100vh - 32px);
  overflow: auto;
  border: 1px solid var(--plus-privacy-toolbar-border);
  border-radius: var(--card-radius-lg, 12px);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--plus-privacy-toolbar-bg);
  backdrop-filter: blur(10px);
  color: var(--plus-privacy-toolbar-text);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
}

.plus-privacy-editor__toolbar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.plus-privacy-editor__slider-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plus-privacy-editor__slider-label {
  font-size: 12px;
  color: var(--plus-privacy-toolbar-muted);
}

.plus-privacy-editor__slider-value {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
  color: var(--plus-privacy-toolbar-muted);
  white-space: nowrap;
}

.plus-privacy-editor__hint {
  font-size: 11px;
  line-height: 1.35;
  color: var(--plus-privacy-toolbar-muted);
}

.plus-privacy-editor__actions {
  display: flex;
  gap: 6px;
}

html[data-inspect-theme='light'] .plus-privacy-editor {
  --plus-privacy-toolbar-bg: color-mix(in srgb, #ffffff 86%, transparent);
  --plus-privacy-toolbar-border: color-mix(in srgb, #cbd5e1 85%, transparent);
  --plus-privacy-toolbar-text: #0f172a;
  --plus-privacy-toolbar-muted: color-mix(in srgb, #0f172a 62%, transparent);
}
</style>
