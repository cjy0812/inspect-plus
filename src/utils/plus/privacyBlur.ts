import { FabricObject, StaticCanvas } from 'fabric';

export type PrivacyObjectKind = 'brush' | 'blur' | 'rect' | 'text' | 'arrow';

export const PRIVACY_OBJECT_KIND = 'privacyObjectKind';

type PrivacyFabricObject = FabricObject & {
  [PRIVACY_OBJECT_KIND]?: PrivacyObjectKind;
};

let customPropertiesReady = false;

export const ensurePrivacyCustomProperties = () => {
  if (customPropertiesReady) return;
  const props = FabricObject.customProperties ?? [];
  if (!props.includes(PRIVACY_OBJECT_KIND)) {
    FabricObject.customProperties = [...props, PRIVACY_OBJECT_KIND];
  }
  customPropertiesReady = true;
};

export const setPrivacyObjectKind = <T extends FabricObject>(
  object: T,
  kind: PrivacyObjectKind,
) => {
  (object as PrivacyFabricObject)[PRIVACY_OBJECT_KIND] = kind;
  return object;
};

export const getPrivacyObjectKind = (object?: FabricObject | null) => {
  return (object as PrivacyFabricObject | undefined)?.[PRIVACY_OBJECT_KIND];
};

export const isBlurObject = (object: FabricObject) => {
  return getPrivacyObjectKind(object) === 'blur';
};

export const createGaussianBlurCanvas = (
  source: CanvasImageSource,
  width: number,
  height: number,
  radius: number,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = 'none';
  return canvas;
};

const createRenderedCanvas = async (
  objects: FabricObject[],
  width: number,
  height: number,
  mutate?: (object: FabricObject) => void,
) => {
  const canvas = new StaticCanvas(undefined, {
    width,
    height,
    renderOnAddRemove: false,
    enableRetinaScaling: false,
  });
  for (const object of objects) {
    const clone = await object.clone([PRIVACY_OBJECT_KIND]);
    clone.set({
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    });
    mutate?.(clone);
    canvas.add(clone);
  }
  canvas.renderAll();
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const outputCtx = output.getContext('2d');
  if (outputCtx) {
    outputCtx.drawImage(canvas.lowerCanvasEl, 0, 0);
  }
  canvas.dispose();
  return output;
};

export const buildBlurPreviewCanvas = async (
  source: CanvasImageSource,
  width: number,
  height: number,
  radius: number,
  blurObjects: FabricObject[],
) => {
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  if (!blurObjects.length) return output;
  const previewCtx = output.getContext('2d');
  if (!previewCtx) return output;
  const blurredSource = createGaussianBlurCanvas(source, width, height, radius);
  const maskCanvas = await createRenderedCanvas(
    blurObjects,
    width,
    height,
    (clone) => {
      clone.set({
        stroke: '#ffffff',
        fill: '',
        opacity: 1,
      });
    },
  );
  previewCtx.drawImage(blurredSource, 0, 0);
  previewCtx.globalCompositeOperation = 'destination-in';
  previewCtx.drawImage(maskCanvas, 0, 0);
  previewCtx.globalCompositeOperation = 'source-over';
  return output;
};

export const exportPrivacyEditorImage = async (
  source: CanvasImageSource,
  width: number,
  height: number,
  objects: FabricObject[],
  blurPreviewCanvas?: HTMLCanvasElement,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, width, height);
  if (blurPreviewCanvas) {
    ctx.drawImage(blurPreviewCanvas, 0, 0);
  }
  const overlayObjects = objects.filter((object) => !isBlurObject(object));
  if (overlayObjects.length) {
    const overlayCanvas = await createRenderedCanvas(
      overlayObjects,
      width,
      height,
    );
    ctx.drawImage(overlayCanvas, 0, 0);
  }
  return canvas.toDataURL('image/png');
};
