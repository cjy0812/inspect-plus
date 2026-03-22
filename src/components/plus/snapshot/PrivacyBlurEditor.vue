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
  canUndo,
  canRedo,
  isReady,
  canvasStyle,
  toolbarStyle,
  toolbarOrientation,
  activeSliderLabel,
  activeSliderValue,
  activeSliderRange,
  showColorControl,
  activeColorValue,
  startToolbarDrag,
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
      :class="`plus-privacy-editor__toolbar--${toolbarOrientation}`"
      :style="toolbarStyle"
    >
      <div
        class="plus-privacy-editor__drag-handle"
        title="拖动工具栏"
        @pointerdown="startToolbarDrag"
      >
        <span />
        <span />
        <span />
      </div>

      <div class="plus-privacy-editor__divider" />

      <div class="plus-privacy-editor__group plus-privacy-editor__tools">
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'select' ? 'primary' : 'default'"
          title="选择 (V)"
          @click="setTool('select')"
          >选择</NButton
        >
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'brush' ? 'primary' : 'default'"
          title="画笔 (B)"
          @click="setTool('brush')"
          >画笔</NButton
        >
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'eraser' ? 'primary' : 'default'"
          title="橡皮 (E)"
          @click="setTool('eraser')"
          >橡皮</NButton
        >
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'blur' ? 'primary' : 'default'"
          title="高斯 (G)"
          @click="setTool('blur')"
          >高斯</NButton
        >
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'rect' ? 'primary' : 'default'"
          title="矩形 (R)"
          @click="setTool('rect')"
          >矩形</NButton
        >
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'arrow' ? 'primary' : 'default'"
          title="箭头 (A)"
          @click="setTool('arrow')"
          >箭头</NButton
        >
        <NButton
          size="small"
          class="plus-privacy-editor__tool-btn"
          :type="toolMode === 'text' ? 'primary' : 'default'"
          title="文本 (T)"
          @click="setTool('text')"
          >文本</NButton
        >
      </div>

      <div class="plus-privacy-editor__divider" />

      <div class="plus-privacy-editor__group plus-privacy-editor__controls">
        <div class="plus-privacy-editor__control-caption">
          {{ activeSliderLabel }}
        </div>
        <label
          v-if="showColorControl"
          class="plus-privacy-editor__color-control"
          title="颜色"
        >
          <span class="plus-privacy-editor__sr-only">颜色</span>
          <input v-model="activeColorValue" type="color" />
        </label>
        <NSlider
          v-model:value="activeSliderValue"
          class="plus-privacy-editor__slider"
          :min="activeSliderRange.min"
          :max="activeSliderRange.max"
          :step="activeSliderRange.step"
        />
        <div class="plus-privacy-editor__control-value">
          {{ activeSliderValue }}
        </div>
      </div>

      <div class="plus-privacy-editor__divider" />

      <div class="plus-privacy-editor__group plus-privacy-editor__actions">
        <NButton
          size="small"
          quaternary
          title="撤销 (Ctrl+Z)"
          :disabled="!canUndo"
          @click="undo"
          >撤销</NButton
        >
        <NButton
          size="small"
          quaternary
          title="重做 (Ctrl+Shift+Z / Ctrl+Y)"
          :disabled="!canRedo"
          @click="redo"
          >重做</NButton
        >
        <NButton
          size="small"
          quaternary
          title="清空所有标注"
          @click="clearAnnotations"
          >还原</NButton
        >
        <NButton size="small" title="关闭编辑器" @click="close">关闭</NButton>
        <NButton
          size="small"
          type="primary"
          title="保存当前编辑结果"
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
  max-width: calc(100vw - 16px);
  overflow: auto;
  border: 1px solid var(--plus-privacy-toolbar-border);
  border-radius: 14px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--plus-privacy-toolbar-bg);
  backdrop-filter: blur(10px);
  color: var(--plus-privacy-toolbar-text);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
}

.plus-privacy-editor__toolbar--column {
  flex-direction: column;
  align-items: stretch;
  width: auto;
}

.plus-privacy-editor__group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.plus-privacy-editor__tools {
  white-space: nowrap;
  flex-wrap: wrap;
}

.plus-privacy-editor__tool-btn {
  min-width: 52px;
}

.plus-privacy-editor__drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 18px;
  min-height: 18px;
  padding: 2px 0;
  color: var(--plus-privacy-toolbar-muted);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.plus-privacy-editor__drag-handle:active {
  cursor: grabbing;
}

.plus-privacy-editor__drag-handle span {
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
}

.plus-privacy-editor__divider {
  width: 1px;
  align-self: stretch;
  background: var(--plus-privacy-toolbar-border);
}

.plus-privacy-editor__controls {
  min-width: 0;
  flex: 1 1 auto;
  gap: 6px;
  flex-wrap: wrap;
}

.plus-privacy-editor__control-caption {
  font-size: 12px;
  color: var(--plus-privacy-toolbar-muted);
  white-space: nowrap;
}

.plus-privacy-editor__color-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid var(--plus-privacy-toolbar-border);
  background: transparent;
  flex-shrink: 0;
}

.plus-privacy-editor__color-control input {
  appearance: none;
  width: 36px;
  height: 36px;
  margin: -3px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.plus-privacy-editor__slider {
  width: 128px;
  min-width: 96px;
}

.plus-privacy-editor__control-value {
  min-width: 28px;
  font-size: 12px;
  color: var(--plus-privacy-toolbar-muted);
  text-align: right;
  white-space: nowrap;
}

.plus-privacy-editor__actions {
  margin-left: auto;
  flex-wrap: wrap;
}

.plus-privacy-editor__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

html[data-inspect-theme='light'] .plus-privacy-editor {
  --plus-privacy-toolbar-bg: color-mix(in srgb, #ffffff 86%, transparent);
  --plus-privacy-toolbar-border: color-mix(in srgb, #cbd5e1 85%, transparent);
  --plus-privacy-toolbar-text: #0f172a;
  --plus-privacy-toolbar-muted: color-mix(in srgb, #0f172a 62%, transparent);
}

.plus-privacy-editor__toolbar--column .plus-privacy-editor__divider {
  width: auto;
  height: 1px;
}

.plus-privacy-editor__toolbar--column .plus-privacy-editor__drag-handle {
  justify-content: center;
}

.plus-privacy-editor__toolbar--column .plus-privacy-editor__group {
  width: 100%;
  justify-content: flex-start;
}

.plus-privacy-editor__toolbar--column .plus-privacy-editor__actions {
  margin-left: 0;
}

@media (max-width: 768px) {
  .plus-privacy-editor__toolbar {
    gap: 8px;
    padding: 8px;
  }

  .plus-privacy-editor__tool-btn {
    min-width: 46px;
  }

  .plus-privacy-editor__slider {
    width: 96px;
  }
}
</style>
