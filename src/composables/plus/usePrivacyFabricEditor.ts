import {
  Canvas,
  IText,
  Path,
  PencilBrush,
  Rect,
  type FabricObject,
  type Point,
} from 'fabric';
import { createGaussianBlurCanvas } from '@/utils/plus/privacyBlur';
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
  | 'arrow'
  | 'text';

type ToolbarOrientation = 'row' | 'column';

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

const createSvgStrokePath = (points: Point[]) => {
  if (!points.length) return '';
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} L ${point.x + 0.01} ${point.y + 0.01}`;
  }
  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(' ');
};

const drawStrokePoints = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  strokeStyle: string,
) => {
  if (!points.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();
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
  const toolbarOffset = shallowRef({ x: 0, y: 0 });

  const stageRect = shallowRef<StageRect>(DEFAULT_STAGE_RECT);
  const naturalSize = shallowRef({ width: 0, height: 0 });
  const isReady = shallowRef(false);
  const canUndo = shallowRef(false);
  const canRedo = shallowRef(false);
  const toolbarOrientation = computed<ToolbarOrientation>(() => {
    return stageRect.value.width > stageRect.value.height ? 'row' : 'column';
  });

  const cursorStyle = computed(() => {
    switch (toolMode.value) {
      case 'text':
        return 'text';
      case 'eraser':
        return 'crosshair';
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
    const gap = 12;
    const isRow = toolbarOrientation.value === 'row';
    const width = isRow
      ? Math.min(
          window.innerWidth - 16,
          Math.max(420, Math.min(820, stageRect.value.width + 120)),
        )
      : 96;
    const height = isRow
      ? 56
      : Math.min(
          window.innerHeight - 16,
          Math.max(280, stageRect.value.height),
        );
    const baseLeft = isRow
      ? Math.min(
          Math.max(8, stageRect.value.left),
          Math.max(8, window.innerWidth - width - 8),
        )
      : (() => {
          const preferRight =
            stageRect.value.left + stageRect.value.width + gap;
          if (preferRight + width <= window.innerWidth - 8) return preferRight;
          return Math.max(8, stageRect.value.left - width - gap);
        })();
    const baseTop = isRow
      ? (() => {
          const preferTop = stageRect.value.top + stageRect.value.height + gap;
          const fallbackTop = stageRect.value.top - height - gap;
          return preferTop + height <= window.innerHeight - 8
            ? preferTop
            : Math.max(8, fallbackTop);
        })()
      : Math.min(
          Math.max(8, stageRect.value.top),
          Math.max(8, window.innerHeight - height - 8),
        );
    const left = Math.min(
      Math.max(8, baseLeft + toolbarOffset.value.x),
      Math.max(8, window.innerWidth - width - 8),
    );
    const top = Math.min(
      Math.max(8, baseTop + toolbarOffset.value.y),
      Math.max(8, window.innerHeight - height - 8),
    );
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `${height}px`,
    };
  });

  const activeSliderLabel = computed(() => {
    switch (toolMode.value) {
      case 'brush':
        return '笔刷大小';
      case 'eraser':
        return '橡皮宽度';
      case 'blur':
        return '高斯半径';
      case 'rect':
      case 'arrow':
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
        case 'arrow':
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
        case 'arrow':
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
      case 'arrow':
        return { min: 1, max: 8, step: 1 };
      case 'text':
        return { min: 12, max: 42, step: 1 };
      default:
        return { min: 4, max: 48, step: 1 };
    }
  });

  const showColorControl = computed(() => {
    return (
      toolMode.value === 'brush' ||
      toolMode.value === 'rect' ||
      toolMode.value === 'arrow' ||
      toolMode.value === 'text'
    );
  });

  const activeColorValue = computed({
    get: () => {
      switch (toolMode.value) {
        case 'brush':
          return brushColor.value;
        case 'rect':
        case 'arrow':
          return rectColor.value;
        case 'text':
          return textColor.value;
        default:
          return brushColor.value;
      }
    },
    set: (value: string) => {
      switch (toolMode.value) {
        case 'brush':
          brushColor.value = value;
          break;
        case 'rect':
        case 'arrow':
          rectColor.value = value;
          break;
        case 'text':
          textColor.value = value;
          break;
      }
    },
  });

  let fabricCanvas: Canvas | undefined;
  let sourceImage: HTMLImageElement | undefined;
  let blurredPreviewCanvas: HTMLCanvasElement | undefined;
  let blurredSourceCanvas: HTMLCanvasElement | undefined;
  let blurredSourceRadius = 0;
  let resizeObserver: ResizeObserver | undefined;
  let rectDraft: Rect | undefined;
  let rectStart: Point | undefined;
  let arrowDraft: Path | undefined;
  let arrowStart: Point | undefined;
  let drawingPoints: Point[] = [];
  let activeDrawMode: 'blur' | 'eraser' | undefined;
  let toolbarDragState:
    | { startX: number; startY: number; originX: number; originY: number }
    | undefined;
  let previewFrame = 0;
  let previewBuildFrame = 0;
  let blurPreviewRun = 0;
  let isLoadingHistory = false;
  let isCommittingHistory = false;
  let settingsCommitTimer: ReturnType<typeof setTimeout> | undefined;
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
    renderPreviewLayer();
  };

  const getBlurredSourceCanvas = () => {
    if (!sourceImage) return undefined;
    if (
      !blurredSourceCanvas ||
      blurredSourceRadius !== blurSize.value ||
      blurredSourceCanvas.width !== naturalSize.value.width ||
      blurredSourceCanvas.height !== naturalSize.value.height
    ) {
      blurredSourceCanvas = createGaussianBlurCanvas(
        sourceImage,
        naturalSize.value.width,
        naturalSize.value.height,
        blurSize.value,
      );
      blurredSourceRadius = blurSize.value;
    }
    return blurredSourceCanvas;
  };

  const renderLiveBlurPoints = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
  ) => {
    if (points.length < 2) return;
    const blurredSource = getBlurredSourceCanvas();
    if (!blurredSource) return;
    const temp = document.createElement('canvas');
    temp.width = naturalSize.value.width;
    temp.height = naturalSize.value.height;
    const tempCtx = temp.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(blurredSource, 0, 0);
    tempCtx.globalCompositeOperation = 'destination-in';
    drawStrokePoints(tempCtx, points, blurSize.value, '#ffffff');
    tempCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(temp, 0, 0);
  };

  const renderLiveEraserPoints = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
  ) => {
    if (points.length < 2) return;
    drawStrokePoints(ctx, points, brushSize.value, 'rgba(110,231,255,0.34)');
  };

  const renderPreviewLayer = () => {
    const target = blurCanvasRef.value;
    if (!target) return;
    const ctx = target.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, target.width, target.height);
    if (blurredPreviewCanvas) ctx.drawImage(blurredPreviewCanvas, 0, 0);
    if (activeDrawMode === 'blur') {
      renderLiveBlurPoints(ctx, drawingPoints);
      return;
    }
    if (activeDrawMode === 'eraser') {
      renderLiveEraserPoints(ctx, drawingPoints);
    }
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

  const rebuildCommittedBlurPreview = async () => {
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

  const schedulePreviewRender = () => {
    if (previewFrame) return;
    previewFrame = requestAnimationFrame(() => {
      previewFrame = 0;
      renderPreviewLayer();
    });
  };

  const scheduleBlurPreview = () => {
    if (previewBuildFrame) return;
    previewBuildFrame = requestAnimationFrame(() => {
      previewBuildFrame = 0;
      void rebuildCommittedBlurPreview();
    });
  };

  const createPathFromPoints = (points: Point[], kind: 'blur' | 'brush') => {
    const pathData = createSvgStrokePath(points);
    const path = setPrivacyObjectKind(
      new Path(pathData, {
        fill: '',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        strokeWidth: kind === 'blur' ? blurSize.value : brushSize.value,
        stroke: kind === 'blur' ? 'rgba(255,255,255,0.01)' : brushColor.value,
        opacity: kind === 'blur' ? 0.01 : 1,
        selectable: false,
        evented: false,
        objectCaching: false,
      }),
      kind,
    );
    return path;
  };

  const startLiveDrawing = (mode: 'blur' | 'eraser', point: Point) => {
    drawingPoints = [point];
    activeDrawMode = mode;
    schedulePreviewRender();
  };

  const pushLiveDrawingPoint = (point: Point) => {
    if (!activeDrawMode) return;
    const lastPoint = drawingPoints[drawingPoints.length - 1];
    if (
      lastPoint &&
      Math.hypot(lastPoint.x - point.x, lastPoint.y - point.y) < 1
    )
      return;
    drawingPoints.push(point);
    schedulePreviewRender();
  };

  const stopLiveDrawing = () => {
    drawingPoints = [];
    activeDrawMode = undefined;
    schedulePreviewRender();
  };

  const queueSettingsCommit = () => {
    if (settingsCommitTimer) clearTimeout(settingsCommitTimer);
    settingsCommitTimer = setTimeout(() => {
      settingsCommitTimer = undefined;
      commitHistory();
    }, 160);
  };

  const stopToolbarDrag = () => {
    toolbarDragState = undefined;
    window.removeEventListener('pointermove', onToolbarDrag);
    window.removeEventListener('pointerup', stopToolbarDrag);
  };

  const onToolbarDrag = (event: PointerEvent) => {
    if (!toolbarDragState) return;
    toolbarOffset.value = {
      x: toolbarDragState.originX + event.clientX - toolbarDragState.startX,
      y: toolbarDragState.originY + event.clientY - toolbarDragState.startY,
    };
  };

  const startToolbarDrag = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    toolbarDragState = {
      startX: event.clientX,
      startY: event.clientY,
      originX: toolbarOffset.value.x,
      originY: toolbarOffset.value.y,
    };
    window.addEventListener('pointermove', onToolbarDrag);
    window.addEventListener('pointerup', stopToolbarDrag);
  };

  const syncControlsFromSelection = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (!activeObject) return;
    const kind = getPrivacyObjectKind(activeObject);
    if (kind === 'brush') {
      if (typeof activeObject.strokeWidth === 'number') {
        brushSize.value = Math.round(activeObject.strokeWidth);
      }
      if (typeof activeObject.stroke === 'string') {
        brushColor.value = activeObject.stroke;
      }
      return;
    }
    if (kind === 'blur') {
      if (typeof activeObject.strokeWidth === 'number') {
        blurSize.value = Math.round(activeObject.strokeWidth);
      }
      return;
    }
    if (kind === 'rect') {
      if (typeof activeObject.strokeWidth === 'number') {
        rectWidth.value = Math.round(activeObject.strokeWidth);
      }
      if (typeof activeObject.stroke === 'string') {
        rectColor.value = activeObject.stroke;
      }
      return;
    }
    if (kind === 'arrow') {
      if (typeof activeObject.strokeWidth === 'number') {
        rectWidth.value = Math.round(activeObject.strokeWidth);
      }
      if (typeof activeObject.stroke === 'string') {
        rectColor.value = activeObject.stroke;
      }
      return;
    }
    if (kind === 'text') {
      if (typeof activeObject.fontSize === 'number') {
        textSize.value = Math.round(activeObject.fontSize);
      }
      if (typeof activeObject.fill === 'string') {
        textColor.value = activeObject.fill;
      }
    }
  };

  const applyControlsToSelection = () => {
    if (!fabricCanvas) return;
    const targets = fabricCanvas.getActiveObjects();
    if (!targets.length) return;
    let changed = false;
    targets.forEach((object) => {
      const kind = getPrivacyObjectKind(object);
      if (kind === 'brush') {
        object.set({
          stroke: brushColor.value,
          strokeWidth: brushSize.value,
        });
        changed = true;
        return;
      }
      if (kind === 'blur') {
        object.set({ strokeWidth: blurSize.value });
        changed = true;
        return;
      }
      if (kind === 'rect') {
        object.set({
          stroke: rectColor.value,
          strokeWidth: rectWidth.value,
        });
        changed = true;
        return;
      }
      if (kind === 'arrow') {
        object.set({
          stroke: rectColor.value,
          strokeWidth: rectWidth.value,
        });
        changed = true;
        return;
      }
      if (kind === 'text') {
        object.set({
          fill: textColor.value,
          fontSize: textSize.value,
        });
        changed = true;
      }
    });
    if (!changed) return;
    fabricCanvas.requestRenderAll();
    scheduleBlurPreview();
    queueSettingsCommit();
  };

  const createArrowDraft = (start: Point, end: Point) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 14 + rectWidth.value * 2;
    const headSpread = Math.PI / 8;
    const leftHead = {
      x: end.x - headLength * Math.cos(angle - headSpread),
      y: end.y - headLength * Math.sin(angle - headSpread),
    };
    const rightHead = {
      x: end.x - headLength * Math.cos(angle + headSpread),
      y: end.y - headLength * Math.sin(angle + headSpread),
    };
    return setPrivacyObjectKind(
      new Path(
        [
          `M ${start.x} ${start.y}`,
          `L ${end.x} ${end.y}`,
          `M ${leftHead.x} ${leftHead.y}`,
          `L ${end.x} ${end.y}`,
          `L ${rightHead.x} ${rightHead.y}`,
        ].join(' '),
        {
          fill: '',
          stroke: rectColor.value,
          strokeWidth: rectWidth.value,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: false,
          evented: false,
          objectCaching: false,
        },
      ),
      'arrow',
    );
  };

  const replaceArrowDraft = (start: Point, end: Point) => {
    if (!fabricCanvas) return;
    if (arrowDraft) {
      fabricCanvas.remove(arrowDraft);
    }
    arrowDraft = createArrowDraft(start, end);
    fabricCanvas.add(arrowDraft);
  };

  const removeIntersectingObjects = (path: FabricObject) => {
    if (!fabricCanvas) return false;
    const targets = fabricCanvas.getObjects().filter((object) => {
      return (
        object !== path &&
        (object.intersectsWithObject(path) ||
          object.isContainedWithinObject(path) ||
          path.isContainedWithinObject(object) ||
          object.containsPoint(path.getCenterPoint()) ||
          path.containsPoint(object.getCenterPoint()))
      );
    });
    if (!targets.length) return false;
    targets.forEach((target) => fabricCanvas.remove(target));
    return true;
  };

  const syncBrush = () => {
    if (!fabricCanvas) return;
    if (toolMode.value === 'brush') {
      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = brushSize.value;
      fabricCanvas.freeDrawingBrush.color = brushColor.value;
    }
  };

  const syncTool = () => {
    if (!fabricCanvas) return;
    const isFreeDrawing = toolMode.value === 'brush';
    fabricCanvas.isDrawingMode = isFreeDrawing;
    fabricCanvas.selection = toolMode.value === 'select';
    fabricCanvas.skipTargetFind = toolMode.value !== 'select';
    fabricCanvas.defaultCursor = cursorStyle.value;
    fabricCanvas.hoverCursor = cursorStyle.value;
    fabricCanvas.moveCursor = 'move';
    syncFabricViewport();
    fabricCanvas.getObjects().forEach((object) => {
      object.selectable = toolMode.value === 'select';
      object.evented = toolMode.value === 'select';
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
      setPrivacyObjectKind(path, 'brush');
      path.set({
        stroke: brushColor.value,
        opacity: 1,
        strokeWidth: brushSize.value,
      });
      path.selectable = toolMode.value === 'select';
      path.evented = toolMode.value === 'select';
      commitHistory();
      scheduleBlurPreview();
      fabricCanvas?.requestRenderAll();
    });

    fabricCanvas.on('mouse:down', (info: FabricPointerEvent) => {
      if (!fabricCanvas) return;
      const point = fabricCanvas.getScenePoint(info.e);
      if (toolMode.value === 'blur') {
        startLiveDrawing('blur', point);
        return;
      }
      if (toolMode.value === 'eraser') {
        startLiveDrawing('eraser', point);
        return;
      }
      if (toolMode.value === 'rect') {
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
      if (toolMode.value === 'arrow') {
        arrowStart = point;
        replaceArrowDraft(point, point);
        fabricCanvas.requestRenderAll();
        return;
      }

      if (toolMode.value === 'text') {
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
    });

    fabricCanvas.on('mouse:move', (info: FabricPointerEvent) => {
      const point = fabricCanvas.getScenePoint(info.e);
      if (activeDrawMode === 'blur') {
        pushLiveDrawingPoint(point);
        return;
      }
      if (activeDrawMode === 'eraser') {
        pushLiveDrawingPoint(point);
        const erasePath = new Path(createSvgStrokePath(drawingPoints), {
          fill: '',
          stroke: 'rgba(255,255,255,0.01)',
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          strokeWidth: brushSize.value,
        });
        const erased = removeIntersectingObjects(erasePath);
        if (erased) {
          fabricCanvas.requestRenderAll();
        }
        return;
      }
      if (!fabricCanvas || !rectDraft || !rectStart) {
        if (toolMode.value === 'arrow' && arrowDraft && arrowStart) {
          replaceArrowDraft(arrowStart, point);
          fabricCanvas.requestRenderAll();
        }
        return;
      }
      if (toolMode.value !== 'rect') return;
      rectDraft.set({
        left: Math.min(rectStart.x, point.x),
        top: Math.min(rectStart.y, point.y),
        width: Math.abs(point.x - rectStart.x),
        height: Math.abs(point.y - rectStart.y),
      });
      fabricCanvas.requestRenderAll();
    });

    fabricCanvas.on('mouse:up', () => {
      if (!fabricCanvas) return;
      if (activeDrawMode === 'blur') {
        const nextPoints = [...drawingPoints];
        stopLiveDrawing();
        if (nextPoints.length > 1) {
          const path = createPathFromPoints(nextPoints, 'blur');
          path.set({
            selectable: toolMode.value === 'select',
            evented: toolMode.value === 'select',
          });
          fabricCanvas.add(path);
          commitHistory();
          scheduleBlurPreview();
          fabricCanvas.requestRenderAll();
        }
        return;
      }
      if (activeDrawMode === 'eraser') {
        stopLiveDrawing();
        commitHistory();
        scheduleBlurPreview();
        fabricCanvas.requestRenderAll();
        return;
      }
      if (toolMode.value === 'arrow' && arrowDraft) {
        const nextArrow = arrowDraft;
        const bounds = nextArrow.getBoundingRect();
        arrowDraft = undefined;
        arrowStart = undefined;
        if (Math.hypot(bounds.width, bounds.height) <= 6) {
          fabricCanvas.remove(nextArrow);
          fabricCanvas.requestRenderAll();
          return;
        }
        nextArrow.set({
          selectable: toolMode.value === 'select',
          evented: toolMode.value === 'select',
        });
        commitHistory();
        fabricCanvas.requestRenderAll();
        return;
      }
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
        evented: toolMode.value === 'select',
      });
      commitHistory();
    });

    fabricCanvas.on('object:modified', () => {
      wireExistingTextObjects();
      commitHistory();
      scheduleBlurPreview();
    });
    fabricCanvas.on('selection:created', syncControlsFromSelection);
    fabricCanvas.on('selection:updated', syncControlsFromSelection);
  };

  const resetCanvasState = () => {
    history = [];
    historyIndex = -1;
    updateHistoryFlags();
    blurredPreviewCanvas = undefined;
    blurredSourceCanvas = undefined;
    blurredSourceRadius = 0;
    drawingPoints = [];
    activeDrawMode = undefined;
    arrowDraft = undefined;
    arrowStart = undefined;
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
    toolbarOffset.value = { x: 0, y: 0 };
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
    stopToolbarDrag();
    if (settingsCommitTimer) {
      clearTimeout(settingsCommitTimer);
      settingsCommitTimer = undefined;
    }
    if (previewFrame) {
      cancelAnimationFrame(previewFrame);
      previewFrame = 0;
    }
    if (previewBuildFrame) {
      cancelAnimationFrame(previewBuildFrame);
      previewBuildFrame = 0;
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
      case 'a':
        setTool('arrow');
        break;
      case 't':
        setTool('text');
        break;
    }
  };

  watch(
    [
      toolMode,
      brushSize,
      blurSize,
      rectWidth,
      textSize,
      brushColor,
      rectColor,
      textColor,
    ],
    () => {
      if (!fabricCanvas) return;
      syncTool();
      applyControlsToSelection();
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
    showColorControl,
    activeColorValue,
    toolbarOrientation,
    startToolbarDrag,
    setTool,
    undo,
    redo,
    clearAnnotations,
    finish,
  };
};
