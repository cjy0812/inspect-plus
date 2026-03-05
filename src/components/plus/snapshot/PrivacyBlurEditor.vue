<script setup lang="ts">
type ToolMode = 'select' | 'brush' | 'blur' | 'rect' | 'text';
type Point = { x: number; y: number };

type StrokeObj = {
  id: string;
  kind: 'stroke';
  mode: 'brush' | 'blur';
  size: number;
  color: string;
  points: Point[];
};
type RectObj = {
  id: string;
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lineWidth: number;
};
type TextObj = {
  id: string;
  kind: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
};
type DrawObj = StrokeObj | RectObj | TextObj;

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

const drawCanvasRef = shallowRef<HTMLCanvasElement>();
const textInputRef = shallowRef<HTMLTextAreaElement>();
const imageRef = shallowRef<HTMLImageElement>();
const blurDisplayRef = shallowRef<HTMLCanvasElement>();

const stageRect = shallowRef({ left: 0, top: 0, width: 0, height: 0 });
const drawW = computed(() => Math.max(1, Math.round(stageRect.value.width)));
const drawH = computed(() => Math.max(1, Math.round(stageRect.value.height)));
const naturalW = shallowRef(0);
const naturalH = shallowRef(0);

const toolMode = shallowRef<ToolMode>('blur');
const brushSize = shallowRef(12);
const blurSize = shallowRef(20);
const rectWidth = shallowRef(2);
const textSize = shallowRef(16);
const brushColor = shallowRef('#6ee7ff');
const textColor = shallowRef('#ffffff');

const objects = shallowRef<DrawObj[]>([]);
const selectedId = shallowRef<string>();
const undoStack = shallowRef<DrawObj[][]>([]);
const redoStack = shallowRef<DrawObj[][]>([]);

const drawing = shallowRef(false);
const currentStroke = shallowRef<StrokeObj>();
const rectStart = shallowRef<Point>();
const rectCurrent = shallowRef<Point>();
const dragStart = shallowRef<Point>();
const dragOrigin = shallowRef<DrawObj>();
const textDraft = shallowRef<{ x: number; y: number; value: string }>();
let rafId = 0;

const cursorStyle = computed(() => {
  if (toolMode.value === 'text') return 'text';
  if (toolMode.value === 'select') return 'move';
  return 'crosshair';
});

const toolbarStyle = computed(() => {
  const gap = 8;
  const w = 228;
  const left = Math.min(
    window.innerWidth - w - 8,
    Math.max(8, stageRect.value.left + stageRect.value.width + gap),
  );
  const top = Math.min(
    Math.max(8, stageRect.value.top),
    Math.max(8, window.innerHeight - 320),
  );
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${w}px`,
  };
});

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const cloneObjects = (v: DrawObj[]) => structuredClone(v);
const close = () => emit('update:show', false);

const syncStageFromHost = () => {
  const img = props.hostImage;
  if (!img) return;
  const rect = img.getBoundingClientRect();
  if (rect.width <= 1 || rect.height <= 1) return;
  const oldW = drawW.value;
  const oldH = drawH.value;
  stageRect.value = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  if (drawCanvasRef.value && (oldW !== drawW.value || oldH !== drawH.value)) {
    drawCanvasRef.value.width = drawW.value;
    drawCanvasRef.value.height = drawH.value;
    rebuildBlurDisplay();
    renderDrawing();
  }
};

const startSyncLoop = () => {
  cancelAnimationFrame(rafId);
  const tick = () => {
    if (!props.show) return;
    syncStageFromHost();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
};

const stopSyncLoop = () => {
  cancelAnimationFrame(rafId);
};

const getCanvasPoint = (ev: PointerEvent) => {
  const c = drawCanvasRef.value;
  if (!c) return { x: 0, y: 0 };
  const rect = c.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(rect.width, ev.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, ev.clientY - rect.top)),
  };
};

const pushUndo = () => {
  undoStack.value = [
    ...undoStack.value.slice(-29),
    cloneObjects(objects.value),
  ];
  redoStack.value = [];
};

const undo = () => {
  if (!undoStack.value.length) return;
  const prev = undoStack.value[undoStack.value.length - 1];
  undoStack.value = undoStack.value.slice(0, -1);
  redoStack.value = [
    ...redoStack.value.slice(-29),
    cloneObjects(objects.value),
  ];
  objects.value = cloneObjects(prev);
  selectedId.value = undefined;
  renderDrawing();
};

const redo = () => {
  if (!redoStack.value.length) return;
  const next = redoStack.value[redoStack.value.length - 1];
  redoStack.value = redoStack.value.slice(0, -1);
  undoStack.value = [
    ...undoStack.value.slice(-29),
    cloneObjects(objects.value),
  ];
  objects.value = cloneObjects(next);
  selectedId.value = undefined;
  renderDrawing();
};

const normalizeRect = (a: Point, b: Point) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(a.x - b.x),
  h: Math.abs(a.y - b.y),
});

const distToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (!len2) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2),
  );
  const qx = a.x + t * dx;
  const qy = a.y + t * dy;
  return Math.hypot(p.x - qx, p.y - qy);
};

const hitTest = (p: Point) => {
  const list = [...objects.value].reverse();
  for (const obj of list) {
    if (obj.kind === 'rect') {
      if (
        p.x >= obj.x - 6 &&
        p.x <= obj.x + obj.w + 6 &&
        p.y >= obj.y - 6 &&
        p.y <= obj.y + obj.h + 6
      ) {
        return obj.id;
      }
      continue;
    }
    if (obj.kind === 'text') {
      const w = obj.text.length * obj.fontSize * 0.62 + 8;
      const h = obj.fontSize * 1.4;
      if (
        p.x >= obj.x - 4 &&
        p.x <= obj.x + w &&
        p.y >= obj.y - h &&
        p.y <= obj.y + 4
      ) {
        return obj.id;
      }
      continue;
    }
    const r = obj.size / 2 + 5;
    for (let i = 1; i < obj.points.length; i++) {
      if (distToSegment(p, obj.points[i - 1], obj.points[i]) <= r)
        return obj.id;
    }
  }
  return undefined;
};

const drawStrokePath = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  lineWidth: number,
  color: string,
) => {
  if (!points.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
};

const createGaussianBlurCanvas = (
  source: CanvasImageSource,
  width: number,
  height: number,
  radius: number,
) => {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = 'none';
  return c;
};

const rebuildBlurDisplay = () => {
  const img = imageRef.value;
  if (!img) return;
  blurDisplayRef.value = createGaussianBlurCanvas(
    img,
    drawW.value,
    drawH.value,
    blurSize.value,
  );
};

const drawObjects = (
  ctx: CanvasRenderingContext2D,
  list: DrawObj[],
  ratio: number,
  withSelection: boolean,
) => {
  const blurStrokes = list.filter(
    (o): o is StrokeObj => o.kind === 'stroke' && o.mode === 'blur',
  );
  if (blurStrokes.length) {
    const w = Math.max(1, Math.round(drawW.value * ratio));
    const h = Math.max(1, Math.round(drawH.value * ratio));
    const blurMask = document.createElement('canvas');
    blurMask.width = w;
    blurMask.height = h;
    const mctx = blurMask.getContext('2d');
    if (mctx) {
      blurStrokes.forEach((s) =>
        drawStrokePath(
          mctx,
          s.points.map((p) => ({ x: p.x * ratio, y: p.y * ratio })),
          s.size * ratio,
          '#fff',
        ),
      );
      const blurSource =
        ratio === 1 && blurDisplayRef.value
          ? blurDisplayRef.value
          : createGaussianBlurCanvas(
              imageRef.value as CanvasImageSource,
              w,
              h,
              blurSize.value * ratio,
            );
      const layer = document.createElement('canvas');
      layer.width = w;
      layer.height = h;
      const lctx = layer.getContext('2d');
      if (lctx) {
        lctx.drawImage(blurSource, 0, 0, w, h);
        lctx.globalCompositeOperation = 'destination-in';
        lctx.drawImage(blurMask, 0, 0);
        lctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(layer, 0, 0);
      }
    }
  }

  list.forEach((obj) => {
    if (obj.kind === 'stroke' && obj.mode === 'brush') {
      drawStrokePath(
        ctx,
        obj.points.map((p) => ({ x: p.x * ratio, y: p.y * ratio })),
        obj.size * ratio,
        obj.color,
      );
      if (withSelection && selectedId.value === obj.id) {
        drawStrokePath(
          ctx,
          obj.points.map((p) => ({ x: p.x * ratio, y: p.y * ratio })),
          obj.size * ratio + 2,
          '#ffffffaa',
        );
      }
      return;
    }
    if (obj.kind === 'rect') {
      ctx.save();
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.lineWidth * ratio;
      ctx.strokeRect(
        obj.x * ratio,
        obj.y * ratio,
        obj.w * ratio,
        obj.h * ratio,
      );
      if (withSelection && selectedId.value === obj.id) {
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#ffffffcc';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          obj.x * ratio,
          obj.y * ratio,
          obj.w * ratio,
          obj.h * ratio,
        );
      }
      ctx.restore();
      return;
    }
    if (obj.kind === 'text') {
      ctx.save();
      ctx.fillStyle = obj.color;
      ctx.font = `${obj.fontSize * ratio}px sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(obj.text, obj.x * ratio, obj.y * ratio);
      if (withSelection && selectedId.value === obj.id) {
        const width = ctx.measureText(obj.text).width;
        const height = obj.fontSize * ratio;
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#ffffffcc';
        ctx.strokeRect(
          obj.x * ratio - 2,
          obj.y * ratio - height,
          width + 4,
          height + 4,
        );
      }
      ctx.restore();
    }
  });
};

const renderDrawing = () => {
  const c = drawCanvasRef.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  drawObjects(ctx, objects.value, 1, true);
  if (
    drawing.value &&
    toolMode.value === 'rect' &&
    rectStart.value &&
    rectCurrent.value
  ) {
    const r = normalizeRect(rectStart.value, rectCurrent.value);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#3f8cff';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }
};

const initEditor = async () => {
  if (!props.show || !props.src) return;
  const img = new Image();
  img.src = props.src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('图片加载失败'));
  });
  imageRef.value = img;
  naturalW.value = img.naturalWidth;
  naturalH.value = img.naturalHeight;
  objects.value = [];
  selectedId.value = undefined;
  undoStack.value = [];
  redoStack.value = [];
  textDraft.value = undefined;
  syncStageFromHost();
  await nextTick();
  if (drawCanvasRef.value) {
    drawCanvasRef.value.width = drawW.value;
    drawCanvasRef.value.height = drawH.value;
  }
  rebuildBlurDisplay();
  renderDrawing();
  startSyncLoop();
};

const commitTextDraft = () => {
  const d = textDraft.value;
  if (!d) return;
  const text = d.value.trim();
  if (text) {
    pushUndo();
    objects.value = [
      ...objects.value,
      {
        id: uid(),
        kind: 'text',
        x: d.x,
        y: d.y,
        text,
        color: textColor.value,
        fontSize: textSize.value,
      },
    ];
  }
  textDraft.value = undefined;
  renderDrawing();
};

const cancelTextDraft = () => {
  textDraft.value = undefined;
  renderDrawing();
};

const onPointerDown = (ev: PointerEvent) => {
  if (textDraft.value) return;
  const p = getCanvasPoint(ev);
  drawing.value = true;
  (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);

  if (toolMode.value === 'text') {
    drawing.value = false;
    textDraft.value = { x: p.x, y: p.y, value: '' };
    nextTick(() => textInputRef.value?.focus());
    return;
  }
  if (toolMode.value === 'select') {
    const id = hitTest(p);
    selectedId.value = id;
    if (id) {
      pushUndo();
      dragStart.value = p;
      dragOrigin.value = cloneObjects(objects.value).find((o) => o.id === id);
    }
    renderDrawing();
    return;
  }

  pushUndo();
  selectedId.value = undefined;

  if (toolMode.value === 'rect') {
    rectStart.value = p;
    rectCurrent.value = p;
    renderDrawing();
    return;
  }

  const mode = toolMode.value === 'brush' ? 'brush' : 'blur';
  const stroke: StrokeObj = {
    id: uid(),
    kind: 'stroke',
    mode,
    size: brushSize.value,
    color: brushColor.value,
    points: [p],
  };
  currentStroke.value = stroke;
  objects.value = [...objects.value, stroke];
  renderDrawing();
};

const onPointerMove = (ev: PointerEvent) => {
  if (!drawing.value) return;
  const p = getCanvasPoint(ev);

  if (
    toolMode.value === 'select' &&
    selectedId.value &&
    dragStart.value &&
    dragOrigin.value
  ) {
    const dx = p.x - dragStart.value.x;
    const dy = p.y - dragStart.value.y;
    objects.value = objects.value.map((o) => {
      if (o.id !== selectedId.value) return o;
      const origin = dragOrigin.value!;
      if (origin.kind === 'stroke' && o.kind === 'stroke') {
        return {
          ...o,
          points: origin.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
        };
      }
      if (origin.kind === 'rect' && o.kind === 'rect')
        return { ...o, x: origin.x + dx, y: origin.y + dy };
      if (origin.kind === 'text' && o.kind === 'text')
        return { ...o, x: origin.x + dx, y: origin.y + dy };
      return o;
    });
    renderDrawing();
    return;
  }

  if (toolMode.value === 'rect') {
    rectCurrent.value = p;
    renderDrawing();
    return;
  }

  if (currentStroke.value) {
    currentStroke.value.points.push(p);
    objects.value = [...objects.value];
    renderDrawing();
  }
};

const onPointerUp = (ev: PointerEvent) => {
  if (toolMode.value === 'rect' && rectStart.value && rectCurrent.value) {
    const r = normalizeRect(rectStart.value, rectCurrent.value);
    if (r.w > 2 && r.h > 2) {
      objects.value = [
        ...objects.value,
        {
          id: uid(),
          kind: 'rect',
          x: r.x,
          y: r.y,
          w: r.w,
          h: r.h,
          color: '#ffe066',
          lineWidth: rectWidth.value,
        },
      ];
    } else {
      undoStack.value = undoStack.value.slice(0, -1);
    }
  }
  drawing.value = false;
  currentStroke.value = undefined;
  rectStart.value = undefined;
  rectCurrent.value = undefined;
  dragStart.value = undefined;
  dragOrigin.value = undefined;
  renderDrawing();
  (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
};

const onKeydown = (ev: KeyboardEvent) => {
  if (!props.show) return;
  if (ev.ctrlKey && ev.key.toLowerCase() === 'z') {
    ev.preventDefault();
    undo();
    return;
  }
  if (ev.key.toLowerCase() === 'b') toolMode.value = 'brush';
  if (ev.key.toLowerCase() === 't') toolMode.value = 'text';
};

const finish = () => {
  const img = imageRef.value;
  if (!img || !drawW.value) return;
  const result = document.createElement('canvas');
  result.width = naturalW.value;
  result.height = naturalH.value;
  const ctx = result.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, result.width, result.height);
  const ratio = naturalW.value / drawW.value;
  drawObjects(ctx, objects.value, ratio, false);
  emit('apply', result.toDataURL('image/png'));
  close();
};

watch(
  () => [props.show, props.src] as const,
  ([show]) => {
    if (show) initEditor().catch(() => undefined);
    else {
      textDraft.value = undefined;
      stopSyncLoop();
    }
  },
  { immediate: true },
);

watch(blurSize, () => {
  if (!props.show) return;
  rebuildBlurDisplay();
  renderDrawing();
});

watch(
  () => props.show,
  (show) => {
    if (show) window.addEventListener('keydown', onKeydown);
    else window.removeEventListener('keydown', onKeydown);
  },
  { immediate: true },
);

onScopeDispose(() => {
  window.removeEventListener('keydown', onKeydown);
  stopSyncLoop();
});
</script>

<template>
  <div v-if="show && src" class="fixed inset-0 z-40 pointer-events-none">
    <canvas
      ref="drawCanvasRef"
      class="absolute z-2 pointer-events-auto"
      :style="{
        left: `${stageRect.left}px`,
        top: `${stageRect.top}px`,
        width: `${stageRect.width}px`,
        height: `${stageRect.height}px`,
        cursor: cursorStyle,
      }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    />
    <textarea
      v-if="textDraft"
      ref="textInputRef"
      v-model="textDraft.value"
      rows="2"
      class="absolute z-5 pointer-events-auto min-w-120px max-w-220px bg-black/65 text-white border border-solid rounded-6px px-6px py-4px outline-none resize"
      :style="{
        left: `${stageRect.left + textDraft.x}px`,
        top: `${stageRect.top + textDraft.y - textSize}px`,
        fontSize: `${textSize}px`,
        borderColor: 'var(--n-border-color)',
      }"
      @blur="commitTextDraft"
      @keydown.enter.exact.prevent="commitTextDraft"
      @keydown.esc.prevent="cancelTextDraft"
    />

    <div
      class="absolute z-6 pointer-events-auto max-h-[calc(100vh-40px)] overflow-auto rounded-10px px-8px py-8px flex flex-col gap-8px text-12px text-white"
      :style="toolbarStyle"
      style="
        background: color-mix(in srgb, #000 60%, transparent);
        backdrop-filter: blur(6px);
      "
    >
      <div class="grid grid-cols-2 gap-6px">
        <NButton
          size="small"
          :type="toolMode === 'select' ? 'primary' : 'default'"
          @click="toolMode = 'select'"
          >选择</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'brush' ? 'primary' : 'default'"
          @click="toolMode = 'brush'"
          >画笔</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'blur' ? 'primary' : 'default'"
          @click="toolMode = 'blur'"
          >高斯</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'rect' ? 'primary' : 'default'"
          @click="toolMode = 'rect'"
          >矩形</NButton
        >
        <NButton
          size="small"
          :type="toolMode === 'text' ? 'primary' : 'default'"
          @click="toolMode = 'text'"
          >文本</NButton
        >
        <NButton size="small" quaternary @click="undo">撤销</NButton>
        <NButton size="small" quaternary @click="redo">重做</NButton>
        <NButton size="small" quaternary @click="emit('reset')">还原</NButton>
      </div>

      <div class="opacity-85">笔刷</div>
      <NSlider v-model:value="brushSize" :min="4" :max="40" :step="1" />
      <div class="opacity-85">模糊强度</div>
      <NSlider v-model:value="blurSize" :min="8" :max="48" :step="1" />
      <div class="opacity-85">矩形线宽</div>
      <NSlider v-model:value="rectWidth" :min="1" :max="8" :step="1" />
      <div class="opacity-85">文字大小</div>
      <NSlider v-model:value="textSize" :min="10" :max="40" :step="1" />

      <div class="opacity-70 whitespace-nowrap">B 画笔 / T 文本 / Ctrl+Z</div>
      <div class="mt-4px flex gap-6px">
        <NButton size="small" class="flex-1" @click="close">关闭</NButton>
        <NButton size="small" type="primary" class="flex-1" @click="finish"
          >完成</NButton
        >
      </div>
    </div>
  </div>
</template>
