import {
  Canvas,
  IText,
  PencilBrush,
  Rect,
  type FabricObject,
  type Point,
} from 'fabric';
import {
  PRIVACY_OBJECT_KIND,
  buildBlurPreviewCanvas,
  ensurePrivacyCustomProperties,
  exportPrivacyEditorImage,
  getPrivacyObjectKind,
  isBlurObject,
  setPrivacyObjectKind,
} from '@/utils/plus/privacyBlur';

export type PrivacyToolMode =
  | 'select'
  | 'brush'
  | 'eraser'
  | 'blur'
  | 'rect'
  | 'text';

type StageRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type FabricPointerEvent = {
  e: PointerEvent;
  target?: FabricObject | null;
};

const DEFAULT_STAGE_RECT: StageRect = {
  left: 0,
  top: 0,
  width: 1,
  height: 1,
};

export const usePrivacyFabricEditor = (options: {
  show: Ref<boolean>;
  src: Ref<string | undefined>;
  hostImage: Ref<HTMLImageElement | undefined>;
  onApply: (url: string) => void;
  onReset: () => void;
  onClose: () => void;
}) => {
  const fabricCanvasRef = shallowRef<HTMLCanvasElement>();
  const blurCanvasRef = shallowRef<HTMLCanvasElement>();

  const toolMode = shallowRef<PrivacyToolMode>('blur');
  const brushSize = shallowRef(10);
  const blurSize = shallowRef(26);
  const rectWidth = shallowRef(2);
  const textSize = shallowRef(18);
  const brushColor = shallowRef('#6ee7ff');
  const rectColor = shallowRef('#ffe066');
  const textColor = shallowRef('#ffffff');

  const stageRect = shallowRef<StageRect>(DEFAULT_STAGE_RECT);
  const naturalSize = shallowRef({ width: 0, height: 0 });
  const isReady = shallowRef(false);
  const canUndo = shallowRef(false);
  const canRedo = shallowRef(false);

  const cursorStyle = computed(() => {
    switch (toolMode.value) {
      case 'text':
        return 'text';
      case 'eraser':
        return 'not-allowed';
      case 'select':
        return 'move';
      default:
        return 'crosshair';
    }
  });

  const canvasStyle = computed(() => ({
    left: `${stageRect.value.left}px`,
    top: `${stageRect.value.top}px`,
    width: `${stageRect.value.width}px`,
    height: `${stageRect.value.height}px`,
    cursor: cursorStyle.value,
  }));

  const toolbarStyle = computed(() => {
    const width = 236;
    const gap = 10;
    const left = Math.min(
      window.innerWidth - width - 8,
      Math.max(8, stageRect.value.left + stageRect.value.width + gap),
    );
    const top = Math.min(
      Math.max(8, stageRect.value.top),
      Math.max(8, window.innerHeight - 330),
    );
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
    };
  });

  const activeSliderLabel = computed(() => {
    switch (toolMode.value) {
      case 'brush':
      case 'eraser':
        return '笔刷大小';
      case 'blur':
        return '高斯半径';
      case 'rect':
        return '矩形线宽';
      case 'text':
        return '文字大小';
      default:
        return '工具参数';
    }
  });

  const activeSliderValue = computed({
    get: () => {
      switch (toolMode.value) {
        case 'brush':
        case 'eraser':
          return brushSize.value;
        case 'blur':
          return blurSize.value;
        case 'rect':
          return rectWidth.value;
        case 'text':
          return textSize.value;
        default:
          return brushSize.value;
      }
    },
    set: (value: number) => {
      switch (toolMode.value) {
        case 'brush':
        case 'eraser':
          brushSize.value = value;
          break;
        case 'blur':
          blurSize.value = value;
          break;
        case 'rect':
          rectWidth.value = value;
          break;
        case 'text':
          textSize.value = value;
          break;
        default:
          brushSize.value = value;
      }
    },
  });

  const activeSliderRange = computed(() => {
    switch (toolMode.value) {
      case 'brush':
      case 'eraser':
        return { min: 4, max: 48, step: 1 };
      case 'blur':
        return { min: 8, max: 48, step: 1 };
      case 'rect':
        return { min: 1, max: 8, step: 1 };
      case 'text':
        return { min: 12, max: 42, step: 1 };
      default:
        return { min: 4, max: 48, step: 1 };
    }
  });

  let fabricCanvas: Canvas | undefined;
  let sourceImage: HTMLImageElement | undefined;
  let blurredPreviewCanvas: HTMLCanvasElement | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let rectDraft: Rect | undefined;
  let rectStart: Point | undefined;
  let blurPreviewFrame = 0;
  let blurPreviewRun = 0;
  let isLoadingHistory = false;
  let isCommittingHistory = false;
  let history: string[] = [];
  let historyIndex = -1;
  const boundTextObjects = new WeakSet<FabricObject>();

  const updateHistoryFlags = () => {
    canUndo.value = historyIndex > 0;
    canRedo.value = historyIndex >= 0 && historyIndex < history.length - 1;
  };

  const syncStageRect = () => {
    const hostImage = options.hostImage.value;
    if (!hostImage) return;
    const rect = hostImage.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return;
    stageRect.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    syncFabricViewport();
    fabricCanvas?.calcOffset();
  };

  const syncFabricViewport = () => {
    const lowerCanvas = fabricCanvasRef.value;
    const wrapper = lowerCanvas?.parentElement as HTMLDivElement | null;
    const upperCanvas = wrapper?.querySelector(
      'canvas.upper-canvas',
    ) as HTMLCanvasElement | null;
    if (!lowerCanvas || !wrapper || !upperCanvas) return;

    wrapper.style.position = 'fixed';
    wrapper.style.left = `${stageRect.value.left}px`;
    wrapper.style.top = `${stageRect.value.top}px`;
    wrapper.style.width = `${stageRect.value.width}px`;
    wrapper.style.height = `${stageRect.value.height}px`;
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.zIndex = '3';

    lowerCanvas.style.position = 'absolute';
    lowerCanvas.style.left = '0';
    lowerCanvas.style.top = '0';
    lowerCanvas.style.width = '100%';
    lowerCanvas.style.height = '100%';
    lowerCanvas.style.pointerEvents = 'none';

    upperCanvas.style.position = 'absolute';
    upperCanvas.style.left = '0';
    upperCanvas.style.top = '0';
    upperCanvas.style.width = '100%';
    upperCanvas.style.height = '100%';
    upperCanvas.style.pointerEvents = 'auto';
    upperCanvas.style.cursor = cursorStyle.value;
  };

  const clearBlurPreview = () => {
    const canvas = blurCanvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applyBlurPreview = (canvas?: HTMLCanvasElement) => {
    blurredPreviewCanvas = canvas;
    const target = blurCanvasRef.value;
    if (!target) return;
    const ctx = target.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, target.width, target.height);
    if (canvas) ctx.drawImage(canvas, 0, 0);
  };

  const getSerializedState = () => {
    if (!fabricCanvas) return '';
    return JSON.stringify(fabricCanvas.toJSON([PRIVACY_OBJECT_KIND]));
  };

  const wireTextObject = (object: FabricObject) => {
    if (!(object instanceof IText) || boundTextObjects.has(object)) return;
    boundTextObjects.add(object);
    object.on('editing:exited', () => {
      if (!fabricCanvas || isLoadingHistory) return;
      if (!object.text?.trim()) {
        fabricCanvas.remove(object);
      }
      commitHistory();
      scheduleBlurPreview();
    });
  };

  const wireExistingTextObjects = () => {
    fabricCanvas?.getObjects().forEach(wireTextObject);
  };

  const commitHistory = () => {
    if (!fabricCanvas || isLoadingHistory || isCommittingHistory) return;
    isCommittingHistory = true;
    const nextState = getSerializedState();
    if (history[historyIndex] === nextState) {
      isCommittingHistory = false;
      updateHistoryFlags();
      return;
    }
    history = history.slice(0, historyIndex + 1);
    history.push(nextState);
    if (history.length > 40) {
      history = history.slice(-40);
    }
    historyIndex = history.length - 1;
    isCommittingHistory = false;
    updateHistoryFlags();
  };

  const scheduleBlurPreview = () => {
    if (blurPreviewFrame) return;
    blurPreviewFrame = requestAnimationFrame(() => {
      blurPreviewFrame = 0;
      void renderBlurPreview();
    });
  };

  const renderBlurPreview = async () => {
    if (!fabricCanvas || !sourceImage) {
      clearBlurPreview();
      return;
    }
    const run = ++blurPreviewRun;
    const blurObjects = fabricCanvas.getObjects().filter(isBlurObject);
    if (!blurObjects.length) {
      applyBlurPreview(undefined);
      return;
    }
    const preview = await buildBlurPreviewCanvas(
      sourceImage,
      naturalSize.value.width,
      naturalSize.value.height,
      blurSize.value,
      blurObjects,
    );
    if (run !== blurPreviewRun) return;
    applyBlurPreview(preview);
  };

  const syncBrush = () => {
    if (!fabricCanvas) return;
    if (toolMode.value === 'brush') {
      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = brushSize.value;
      fabricCanvas.freeDrawingBrush.color = brushColor.value;
      return;
    }
    if (toolMode.value === 'blur') {
      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = blurSize.value;
      fabricCanvas.freeDrawingBrush.color = '#ffffff';
    }
  };

  const syncTool = () => {
    if (!fabricCanvas) return;
    const isFreeDrawing =
      toolMode.value === 'brush' || toolMode.value === 'blur';
    fabricCanvas.isDrawingMode = isFreeDrawing;
    fabricCanvas.selection = toolMode.value === 'select';
    fabricCanvas.skipTargetFind =
      toolMode.value !== 'select' && toolMode.value !== 'eraser';
    fabricCanvas.defaultCursor = cursorStyle.value;
    fabricCanvas.hoverCursor = cursorStyle.value;
    fabricCanvas.moveCursor = 'move';
    syncFabricViewport();
    fabricCanvas.getObjects().forEach((object) => {
      object.selectable = toolMode.value === 'select';
      object.evented =
        toolMode.value === 'select' || toolMode.value === 'eraser';
    });
    if (!isFreeDrawing) {
      fabricCanvas.discardActiveObject();
    }
    syncBrush();
    fabricCanvas.requestRenderAll();
  };

  const loadSourceImage = async (src: string) => {
    const image = new Image();
    image.src = src;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('图片加载失败'));
    });
    sourceImage = image;
    naturalSize.value = {
      width: image.naturalWidth || 1,
      height: image.naturalHeight || 1,
    };
  };

  const createCanvas = () => {
    const el = fabricCanvasRef.value;
    if (!el) return;
    fabricCanvas?.dispose();
    fabricCanvas = new Canvas(el, {
      width: naturalSize.value.width || 1,
      height: naturalSize.value.height || 1,
      enableRetinaScaling: false,
      preserveObjectStacking: true,
      selection: true,
    });
    fabricCanvas.defaultCursor = cursorStyle.value;
    fabricCanvas.hoverCursor = cursorStyle.value;
    fabricCanvas.moveCursor = 'move';
    syncFabricViewport();

    fabricCanvas.on('path:created', ({ path }) => {
      if (!path) return;
      if (toolMode.value === 'blur') {
        setPrivacyObjectKind(path, 'blur');
        path.set({
          stroke: 'rgba(255,255,255,0.01)',
          fill: '',
          opacity: 0.01,
        });
      } else {
        setPrivacyObjectKind(path, 'brush');
        path.set({
          stroke: brushColor.value,
          opacity: 1,
        });
      }
      path.selectable = toolMode.value === 'select';
      path.evented = toolMode.value === 'select' || toolMode.value === 'eraser';
      commitHistory();
      scheduleBlurPreview();
      fabricCanvas?.requestRenderAll();
    });

    fabricCanvas.on('mouse:down', (info: FabricPointerEvent) => {
      if (!fabricCanvas) return;
      if (toolMode.value === 'rect') {
        const point = fabricCanvas.getScenePoint(info.e);
        rectStart = point;
        rectDraft = setPrivacyObjectKind(
          new Rect({
            left: point.x,
            top: point.y,
            width: 1,
            height: 1,
            fill: 'transparent',
            stroke: rectColor.value,
            strokeWidth: rectWidth.value,
            selectable: false,
            evented: false,
            objectCaching: false,
          }),
          'rect',
        );
        fabricCanvas.add(rectDraft);
        return;
      }

      if (toolMode.value === 'text') {
        const point = fabricCanvas.getScenePoint(info.e);
        const text = setPrivacyObjectKind(
          new IText('', {
            left: point.x,
            top: point.y,
            fill: textColor.value,
            fontSize: textSize.value,
            fontFamily: 'sans-serif',
            editable: true,
          }),
          'text',
        );
        text.selectable = true;
        text.evented = true;
        wireTextObject(text);
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        fabricCanvas.requestRenderAll();
        return;
      }

      if (toolMode.value === 'eraser') {
        const targets = info.target
          ? [info.target]
          : fabricCanvas.getActiveObjects();
        if (!targets.length) return;
        targets.forEach((target) => fabricCanvas?.remove(target));
        fabricCanvas.discardActiveObject();
        commitHistory();
        scheduleBlurPreview();
        fabricCanvas.requestRenderAll();
      }
    });

    fabricCanvas.on('mouse:move', (info: FabricPointerEvent) => {
      if (!fabricCanvas || !rectDraft || !rectStart) return;
      if (toolMode.value !== 'rect') return;
      const point = fabricCanvas.getScenePoint(info.e);
      rectDraft.set({
        left: Math.min(rectStart.x, point.x),
        top: Math.min(rectStart.y, point.y),
        width: Math.abs(point.x - rectStart.x),
        height: Math.abs(point.y - rectStart.y),
      });
      fabricCanvas.requestRenderAll();
    });

    fabricCanvas.on('mouse:up', () => {
      if (!fabricCanvas || !rectDraft) return;
      const valid = (rectDraft.width ?? 0) > 2 && (rectDraft.height ?? 0) > 2;
      const nextRect = rectDraft;
      rectDraft = undefined;
      rectStart = undefined;
      if (!valid) {
        fabricCanvas.remove(nextRect);
        fabricCanvas.requestRenderAll();
        return;
      }
      nextRect.set({
        selectable: toolMode.value === 'select',
        evented: toolMode.value === 'select' || toolMode.value === 'eraser',
      });
      commitHistory();
    });

    fabricCanvas.on('object:modified', () => {
      wireExistingTextObjects();
      commitHistory();
      scheduleBlurPreview();
    });
  };

  const resetCanvasState = () => {
    history = [];
    historyIndex = -1;
    updateHistoryFlags();
    blurredPreviewCanvas = undefined;
    clearBlurPreview();
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
  };

  const initHistory = () => {
    history = [getSerializedState()];
    historyIndex = 0;
    updateHistoryFlags();
  };

  const bindStageTracking = () => {
    resizeObserver?.disconnect();
    window.removeEventListener('resize', syncStageRect);
    window.removeEventListener('scroll', syncStageRect, true);
    const hostImage = options.hostImage.value;
    if (!hostImage) return;
    resizeObserver = new ResizeObserver(syncStageRect);
    resizeObserver.observe(hostImage);
    window.addEventListener('resize', syncStageRect);
    window.addEventListener('scroll', syncStageRect, true);
  };

  const unbindStageTracking = () => {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    window.removeEventListener('resize', syncStageRect);
    window.removeEventListener('scroll', syncStageRect, true);
  };

  const init = async () => {
    const src = options.src.value;
    if (!options.show.value || !src) return;
    ensurePrivacyCustomProperties();
    await nextTick();
    await loadSourceImage(src);
    syncStageRect();
    if (blurCanvasRef.value) {
      blurCanvasRef.value.width = naturalSize.value.width;
      blurCanvasRef.value.height = naturalSize.value.height;
    }
    createCanvas();
    syncFabricViewport();
    resetCanvasState();
    bindStageTracking();
    syncTool();
    initHistory();
    isReady.value = true;
  };

  const dispose = () => {
    isReady.value = false;
    unbindStageTracking();
    if (blurPreviewFrame) {
      cancelAnimationFrame(blurPreviewFrame);
      blurPreviewFrame = 0;
    }
    fabricCanvas?.dispose();
    fabricCanvas = undefined;
    sourceImage = undefined;
    resetCanvasState();
  };

  const setTool = (tool: PrivacyToolMode) => {
    toolMode.value = tool;
    syncTool();
  };

  const loadHistory = async (nextIndex: number) => {
    if (!fabricCanvas || nextIndex < 0 || nextIndex >= history.length) return;
    isLoadingHistory = true;
    historyIndex = nextIndex;
    await fabricCanvas.loadFromJSON(JSON.parse(history[nextIndex]));
    isLoadingHistory = false;
    wireExistingTextObjects();
    syncTool();
    fabricCanvas.requestRenderAll();
    updateHistoryFlags();
    scheduleBlurPreview();
  };

  const undo = () => {
    if (!canUndo.value) return;
    void loadHistory(historyIndex - 1);
  };

  const redo = () => {
    if (!canRedo.value) return;
    void loadHistory(historyIndex + 1);
  };

  const clearAnnotations = () => {
    resetCanvasState();
    initHistory();
    options.onReset();
  };

  const finish = async () => {
    if (!sourceImage || !fabricCanvas) return;
    const url = await exportPrivacyEditorImage(
      sourceImage,
      naturalSize.value.width,
      naturalSize.value.height,
      fabricCanvas.getObjects(),
      blurredPreviewCanvas,
    );
    if (!url) return;
    options.onApply(url);
    options.onClose();
  };

  const removeSelection = () => {
    if (!fabricCanvas) return;
    const targets = fabricCanvas.getActiveObjects();
    if (!targets.length) return;
    targets.forEach((target) => fabricCanvas?.remove(target));
    fabricCanvas.discardActiveObject();
    commitHistory();
    scheduleBlurPreview();
    fabricCanvas.requestRenderAll();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!options.show.value) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      removeSelection();
      return;
    }
    switch (event.key.toLowerCase()) {
      case 'v':
        setTool('select');
        break;
      case 'b':
        setTool('brush');
        break;
      case 'e':
        setTool('eraser');
        break;
      case 'g':
        setTool('blur');
        break;
      case 'r':
        setTool('rect');
        break;
      case 't':
        setTool('text');
        break;
    }
  };

  watch(
    [toolMode, brushSize, blurSize, rectWidth, textSize],
    () => {
      if (!fabricCanvas) return;
      syncTool();
      fabricCanvas.getObjects().forEach((object) => {
        if (getPrivacyObjectKind(object) === 'rect') {
          object.set({ strokeWidth: rectWidth.value });
        }
      });
      scheduleBlurPreview();
    },
    { flush: 'post' },
  );

  watch(
    [() => options.show.value, () => options.src.value] as const,
    async ([show, src]) => {
      if (!show || !src) {
        dispose();
        return;
      }
      await init();
    },
    { immediate: true },
  );

  watch(
    () => options.show.value,
    (show) => {
      if (show) window.addEventListener('keydown', onKeydown);
      else window.removeEventListener('keydown', onKeydown);
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    window.removeEventListener('keydown', onKeydown);
    dispose();
  });

  return {
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
  };
};
