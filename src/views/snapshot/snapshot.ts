import {
  detectSnapshot,
  exportSnapshotAsImageId,
  exportSnapshotAsImportId,
} from '@/utils/export';
import { gmOk } from '@/utils/gm';
import { findNodesByXy, getAppInfo, listToTree } from '@/utils/node';
import { toFixedNumber, toInteger } from '@/utils/others';
import type { ResolvedSelector } from '@/utils/selector';
import { screenshotStorage, snapshotStorage } from '@/utils/snapshot';
import { useTask } from '@/utils/task';
import type { QueryResult } from '@gkd-kit/selector';

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    location.reload();
  });
}

const getRemoteImportId = async (id: number): Promise<number> => {
  return fetch('https://detect.gkd.li/api/getImportId?id=' + id)
    .then((r) => r.json())
    .catch(() => 0);
};

export const useSnapshotStore = createSharedComposable(() => {
  const route = useRoute();
  const router = useRouter();
  const {
    snapshotViewedTime,
    snapshotImportId,
    snapshotImageId,
    importSnapshotId,
    settingsStore,
  } = useStorageStore();
  const randomizeFocusColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 58;
    const lightness = 52;
    const c = (1 - Math.abs(2 * (lightness / 100) - 1)) * (saturation / 100);
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness / 100 - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (hue < 60) {
      r = c;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = c;
    } else if (hue < 180) {
      g = c;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const to255 = (v: number) => Math.round((v + m) * 255);
    settingsStore.focusNodeColor = `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
  };

  const snapshotId = shallowRef<number>();
  watchImmediate(
    () => route.params.snapshotId,
    (v) => {
      snapshotId.value = toInteger(v);
    },
  );
  watchImmediate(
    () => snapshotId.value,
    (v) => {
      if (v && settingsStore.randomFocusNodeColorOnOpen) {
        randomizeFocusColor();
      }
    },
  );
  const importId = computed(() => {
    if (snapshotId.value) return snapshotImportId[snapshotId.value];
    return undefined;
  });
  const imageId = computed(() => {
    if (snapshotId.value) return snapshotImageId[snapshotId.value];
    return undefined;
  });
  const snapshot = shallowRef<Snapshot>();
  watchEffect(() => {
    if (snapshot.value) {
      document.title =
        '快照-' + (getAppInfo(snapshot.value).name || snapshot.value.appId);
    }
  });
  const screenshot = shallowRef<ArrayBuffer>();
  const screenshotUrl = computed(() => {
    if (screenshot.value) {
      return URL.createObjectURL(
        new Blob([screenshot.value], {
          type: 'image/png',
        }),
      );
    }
    return undefined;
  });
  const redirected = shallowRef(false);
  const update = useTask(async (id: number | undefined) => {
    redirected.value = false;
    if (!id) {
      snapshot.value = undefined;
      screenshot.value = undefined;
      return;
    }
    await Promise.all([
      snapshotStorage.getItem(id).then((r) => {
        snapshot.value = r || undefined;
      }),
      screenshotStorage.getItem(id).then((r) => {
        screenshot.value = r || undefined;
      }),
    ]);
    if (!snapshot.value) {
      const remoteImportId =
        snapshotImportId[id] || (await getRemoteImportId(id));
      if (remoteImportId && Number.isSafeInteger(remoteImportId)) {
        redirected.value = true;
        router.replace({
          path: '/i/' + remoteImportId,
          query: route.query,
        });
        return;
      }
    }
    if (snapshot.value?.id) {
      snapshotViewedTime[snapshot.value.id] = Date.now();
    }
  });
  const loading = computed(() => update.loading);
  watchImmediate(() => snapshotId.value, update.invoke);
  watchEffect(() => {
    if (
      importId.value &&
      !importSnapshotId[importId.value] &&
      snapshotId.value
    ) {
      fetch(
        `https://detect.gkd.li/api/detectSnapshot?importId=` + importId.value,
      );
    }
  });
  const autoUpload = computed(() => {
    return gmOk() && settingsStore.autoUploadImport;
  });
  watchEffect(() => {
    if (autoUpload.value && snapshot.value && !imageId.value) {
      exportSnapshotAsImageId(snapshot.value);
    }
    if (autoUpload.value && snapshot.value && !importId.value) {
      exportSnapshotAsImportId(snapshot.value);
    }
    if (autoUpload.value && snapshot.value && importId.value) {
      detectSnapshot(snapshot.value.id, importId.value);
    }
  });
  const nodes = computed(() => {
    if (snapshot.value) {
      if (snapshot.value.nodes.length <= settingsStore.maxShowNodeSize) {
        return structuredClone(snapshot.value.nodes);
      } else {
        return structuredClone(
          snapshot.value.nodes.slice(0, settingsStore.maxShowNodeSize),
        );
      }
    }
    return [];
  });
  const rootNode = computed(() => {
    if (nodes.value.length) {
      return listToTree(nodes.value);
    }
    return undefined;
  });
  const missNodeSize = computed(() => {
    if (snapshot.value) {
      return snapshot.value.nodes.length - settingsStore.maxShowNodeSize;
    }
    return 0;
  });
  const focusNode = shallowRef<RawNode>();
  const focusTime = shallowRef(0);
  const focusPosition = shallowRef<Position>();
  const overlapNodes = shallowRef<RawNode[]>();
  const updateFocusNode = async (node: RawNode) => {
    focusNode.value = node;
    focusTime.value = Date.now();
    await nextTick();
    if (overlapNodes.value && !overlapNodes.value.includes(node)) {
      focusPosition.value = undefined;
      overlapNodes.value = undefined;
    }
  };
  watchEffect(() => {
    if (rootNode.value) {
      updateFocusNode(rootNode.value);
    }
  });
  const updatePosition = (position: Position) => {
    focusPosition.value = position;
    const resultNodes = findNodesByXy(nodes.value, focusPosition.value);
    if (resultNodes.length) {
      updateFocusNode(resultNodes[0]);
    }
    if (resultNodes.length > 1) {
      overlapNodes.value = resultNodes;
    } else {
      overlapNodes.value = undefined;
    }
  };

  const trackShow = shallowRef(false);
  const trackData = shallowRef<TrackCardProps>();
  const showTrack = (
    selector: ResolvedSelector,
    result: QueryResult<RawNode>,
  ) => {
    trackShow.value = true;
    trackData.value = {
      selector,
      nodes: nodes.value,
      queryResult: result,
    };
  };

  return {
    snapshotId,
    snapshot,
    rootNode,
    screenshotUrl,
    loading,
    redirected,
    importId,
    imageId,
    focusNode,
    updateFocusNode,
    focusTime,
    overlapNodes,
    missNodeSize,
    focusPosition,
    updatePosition,
    trackData,
    trackShow,
    showTrack,
  };
});

export const useSharedSnapshotHoverImg = createSharedComposable(() => {
  const { updatePosition, focusNode } = useSnapshotStore();

  const imgRef = shallowRef<HTMLImageElement>();
  const imgBounding = useElementBounding(imgRef);
  const imgLoadTime = shallowRef(false);

  const clickImg = (ev: MouseEvent) => {
    const img = imgRef.value;
    if (!img) {
      return;
    }

    const imgRect = img.getBoundingClientRect();

    const innerHeight = (imgRect.width / img.naturalWidth) * img.naturalHeight;
    const offsetTop = (imgRect.height - innerHeight) / 2;

    const x = ((ev.clientX - imgRect.left) / imgRect.width) * img.naturalWidth;
    const y =
      ((ev.clientY - imgRect.top - offsetTop) / innerHeight) *
      img.naturalHeight;

    updatePosition({ x, y });
  };

  const percent = (n: number) => {
    return `${n * 100}%`;
  };

  const imgSize = useElementSize(imgRef);

  const positionStyle = computed(() => {
    const img = imgRef.value;

    const attr = focusNode.value?.attr;
    if (!focusNode.value || !img || !attr || !imgLoadTime.value) {
      return ``;
    }
    const imgWidth = imgSize.width.value;
    const imgHeight = imgSize.height.value;
    const innerHeight = (imgWidth / img.naturalWidth) * img.naturalHeight;
    return {
      left: `calc(${percent(attr.left / img.naturalWidth)} - 2px)`,
      width: `calc(${percent(
        (attr.right - attr.left) / img.naturalWidth,
      )} + 2px)`,

      top: `calc(${percent(
        ((attr.top / img.naturalHeight) * innerHeight +
          (imgHeight - innerHeight) / 2) /
          imgHeight,
      )} - 2px)`,
      height: `calc(${percent(
        (((attr.bottom - attr.top) / img.naturalHeight) * innerHeight) /
          imgHeight,
      )} + 2px)`,
    };
  });
  const imgHover = shallowRef(false);
  const hoverPosition = shallowRef({ ox: 0, oy: 0 });
  const boxHoverPosition = computed(() => {
    const attr = focusNode.value?.attr;
    if (!attr) {
      return;
    }
    const { ox, oy } = hoverPosition.value;
    return {
      left: ox - attr.left,
      right: attr.right - ox,
      top: oy - attr.top,
      bottom: attr.bottom - oy,
    };
  });
  const boxHoverPerPosition = computed(() => {
    const attr = focusNode.value?.attr;
    if (!attr || !boxHoverPosition.value) {
      return;
    }
    if (attr.width <= 0 || attr.height <= 0) {
      return;
    }
    const { bottom, left, right, top } = boxHoverPosition.value;
    return {
      left: toFixedNumber(left / (right + left), 3),
      right: toFixedNumber(right / (right + left), 3),
      top: toFixedNumber(top / (top + bottom), 3),
      bottom: toFixedNumber(bottom / (top + bottom), 3),
    };
  });
  const hoverBgImgWidth = 1000;
  const hoverPositionStyle = shallowRef({
    left: '0',
    top: '0',
    width: hoverBgImgWidth + 'px',
  });

  const imgMove = (ev: MouseEvent) => {
    const img = imgRef.value;
    if (!img) return;
    const imgRect = img.getBoundingClientRect();

    const innerHeight = (imgRect.width / img.naturalWidth) * img.naturalHeight;
    const offsetTop = (imgRect.height - innerHeight) / 2;

    const ox = ((ev.clientX - imgRect.left) / imgRect.width) * img.naturalWidth;
    const oy =
      ((ev.clientY - imgRect.top - offsetTop) / innerHeight) *
      img.naturalHeight;
    hoverPosition.value = { ox, oy };
    hoverPositionStyle.value = {
      left:
        (-(ox - 0.1 * img.naturalWidth) / img.naturalWidth) * hoverBgImgWidth +
        'px',
      top:
        (-(oy - 0.1 * img.naturalWidth) / img.naturalWidth) * hoverBgImgWidth +
        'px',
      width: hoverBgImgWidth + 'px',
    };
  };
  return {
    imgRef,
    imgBounding,
    clickImg,
    positionStyle,
    imgHover,
    imgMove,
    hoverPositionStyle,
    boxHoverPerPosition,
    imgLoadTime,
    hoverPosition,
    boxHoverPosition,
  };
});
