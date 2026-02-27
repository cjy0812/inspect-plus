<script setup lang="ts">
import { getNodeQf, getTrackTreeContext } from '@/utils/node';
import { transform } from '@/utils/selector';
import type { EdgeData, TreeData } from '@antv/g6';
import { Graph, treeToGraphData } from '@antv/g6';
import { QueryPath, QueryResult } from '@gkd-kit/selector';
import { uniqBy } from 'lodash-es';
import { AntQuadratic, OperatorEdge } from '@/utils/g6';
import { useTheme } from '@/composables/useTheme';

const props = withDefaults(
  defineProps<{
    nodes: RawNode[];
    queryResult: QueryResult<RawNode>;
    showUnitResults: QueryResult.UnitResult<RawNode>[];
    filterUnitResults?: QueryResult.UnitResult<RawNode>[];
  }>(),
  {},
);

const el = shallowRef<HTMLElement>();
const graphRef = shallowRef<Graph>();
const graphError = shallowRef('');
const { themeTokens } = useTheme();

// ==========================================
// 1. 基础数据计算区 (原版保持一致)
// ==========================================
const getNode = (id: string | number): RawNode => props.nodes[id as number];

const subNodes = computed(() => {
  return uniqBy(
    props.queryResult.unitResults
      .asJsReadonlyArrayView()
      .flatMap((v) => v.context.toArray()),
    (n) => n.id,
  );
});

const treeCtx = computed(() =>
  getTrackTreeContext(props.nodes, subNodes.value),
);

const toTreeData = (node: RawNode): TreeData => ({
  id: node.id.toString(),
  children: treeCtx.value.getChildren(node).map(toTreeData),
});

const treeGraphData = computed(() =>
  treeToGraphData(toTreeData(treeCtx.value.topNode)),
);

const hasChildren = (node: RawNode): boolean =>
  treeCtx.value.getChildren(node).length > 0;

// ==========================================
// 2. 边数据处理区 (安全提取 + 原版偏移算法)
// ==========================================
interface EdgeContext {
  groupList: {
    result: QueryResult.UnitResult<RawNode>;
    edgeGroup: EdgeData[];
  }[];
  edgeList: EdgeData[];
  getLabel: (edge: EdgeData) => string;
  getColor: (edge: EdgeData) => string;
  getGroupIndex: (edge: EdgeData) => number;
  getOperatorKey: (edge: EdgeData) => string;
  getCurveOffset: (edge: EdgeData) => number;
}

const edgeCtx = computed<EdgeContext>(() => {
  const countMap: Record<string, number> = {};
  const edgePathMap: Record<string, QueryPath<RawNode>> = {};

  const getNodeEdge = (path: QueryPath<RawNode>): EdgeData => {
    const key = `#${path.source.id}-${path.target.id}`;
    const count = countMap[key] || 0;
    countMap[key] = count + 1;
    const id = key + (count > 0 ? `-${count}` : '');
    edgePathMap[id] = path;
    const operatorKey = path.connectWrapper.segment.operator.key;
    const _isPrevious = operatorKey === '->';

    const _similarId = [path.source.id, path.target.id, Number(_isPrevious)]
      .sort()
      .join('-');

    return {
      id,
      source: String(path.source.id),
      target: String(path.target.id),
      _isPrevious,
      _similarId,
      data: { operatorKey },
    };
  };

  const groupList = props.showUnitResults.map((result) => {
    const paths = Array.from(
      result.getNodeConnectPath(transform).asJsReadonlyArrayView(),
    );
    const edgeGroup = paths.map((v) => getNodeEdge(v));
    return { result, edgeGroup };
  });

  const edgeList = groupList.flatMap((v) => v.edgeGroup);

  const getLabel = (edge: EdgeData) => {
    const path = edgePathMap[edge.id!];
    if (!path) return '';
    try {
      return path.formatConnectOffset || '';
    } catch {
      // gkd selector's formatOffset requires offset >= 0; fallback to raw operator key.
      return path.connectWrapper.segment.operator.key || '';
    }
  };
  const getOperatorKey = (edge: EdgeData) =>
    edgePathMap[edge.id!]?.connectWrapper.segment.operator.key || '';
  const getSimilarId = (edge: EdgeData) => (edge._similarId as string) || '';

  const getGroupIndex = (edge: EdgeData): number => {
    return groupList.findIndex((v) =>
      v.edgeGroup.some((e) => e.id === edge.id),
    );
  };

  // [自定义] 使用 themeTokens 取代原版的 colorList
  const getColor = (edge: EdgeData): string => {
    const group = groupList[getGroupIndex(edge)];
    if (!group) return '#888';
    const i = props.showUnitResults.indexOf(group.result);
    const palette = themeTokens.value.palette || [];
    return (
      palette[i % palette.length] ||
      themeTokens.value.graphEdgeFallbackStroke ||
      '#888'
    );
  };

  // [原版] 核心曲线偏移算法
  const getCurveOffset = (edge: EdgeData): number => {
    const direction =
      (Number(edge.source) > Number(edge.target) ? 1 : -1) *
      (edge._isPrevious ? -1 : 1);
    const firstSimilarIndex = edgeList.findIndex(
      (e) => getSimilarId(e) === getSimilarId(edge),
    );
    const count =
      edgeList
        .filter(
          (e, i) =>
            i >= firstSimilarIndex && getSimilarId(e) === getSimilarId(edge),
        )
        .findIndex((e) => e.id === edge.id) + 1;
    return 30 * direction * Math.sqrt(count);
  };

  return {
    groupList,
    edgeList,
    getLabel,
    getColor,
    getGroupIndex,
    getOperatorKey,
    getCurveOffset,
  };
});

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = Reflect.get(err, 'message');
    if (typeof message === 'string' && message.trim()) {
      return `${fallback}: ${message}`;
    }
  }
  return fallback;
};

const isCurveEdge = (edge: EdgeData): boolean => edge.id?.[0] === '#';

const getDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  return Math.sqrt(
    Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2),
  );
};

const getEdgeDistance = (g: Graph, d: EdgeData): number => {
  try {
    const n1 = g.getNodeData(d.source as string);
    const n2 = g.getNodeData(d.target as string);
    if (!n1?.style || !n2?.style) return 50;
    return getDistance(
      Number(n1.style.x) || 0,
      Number(n1.style.y) || 0,
      Number(n2.style.x) || 0,
      Number(n2.style.y) || 0,
    );
  } catch {
    return 50;
  }
};

const numReg = /\d+/;

// ==========================================
// 3. 生命周期与画布渲染控制
// ==========================================

// [修复]: 补回了原版的销毁逻辑，防止内存泄漏
onUnmounted(() => {
  if (graphRef.value) {
    graphRef.value.destroy();
  }
});

watch(el, async () => {
  if (!el.value) return;
  if (graphRef.value) {
    graphRef.value.destroy();
    graphRef.value = undefined;
  }
  graphError.value = '';
  const graph = new Graph({
    container: el.value,
    data: treeGraphData.value,
    autoFit: 'view',
    padding: [24, 48],
    animation: false,
    node: {
      type: (d) => (hasChildren(getNode(d.id)) ? 'triangle' : 'rect'),
      style(d) {
        const node = getNode(d.id);
        const isTarget = props.queryResult.target.id === node.id;
        const placeholdered = treeCtx.value.isPlaceholder(node);
        const qf = getNodeQf(node);
        return {
          size: hasChildren(node) ? 4 : 1,
          direction: hasChildren(node) ? 'down' : undefined,
          fill: hasChildren(node)
            ? themeTokens.value.graphNodeFill
            : themeTokens.value.graphLeafFill,
          pointerEvents: 'none',
          labelPlacement: 'right',
          labelText: treeCtx.value.getLabel(node),
          labelFill: themeTokens.value.graphLabelColor,
          labelOffsetX: 2,
          labelFontWeight: qf && !placeholdered ? 'bold' : undefined,
          labelOpacity: placeholdered ? 0.5 : undefined,
          labelPointerEvents: 'none', // [修复] 补回：防止标签阻挡画布拖拽
          labelStroke: isTarget
            ? themeTokens.value.graphTargetLabelStroke
            : undefined,
        };
      },
    },
    edge: {
      type: (d) => (isCurveEdge(d) ? OperatorEdge.type : 'polyline'),
      style(d) {
        if (isCurveEdge(d)) {
          const distance = getEdgeDistance(graph, d);
          const labelText = edgeCtx.value.getLabel(d) || '';
          const hasNum = labelText.match(numReg);

          return {
            curveOffset: edgeCtx.value.getCurveOffset(d),
            stroke: edgeCtx.value.getColor(d),
            zIndex: 1 + edgeCtx.value.getGroupIndex(d),
            pointerEvents: 'none',
            endArrow: true,
            endArrowOpacity: 0.5,
            endArrowPointerEvents: 'none', // [修复] 补回

            // [修复] 完美还原原版复杂的 Label 排版，并融合你的主题色
            labelText,
            labelFill: themeTokens.value.graphEdgeLabelColor,
            labelFontSize: hasNum ? (distance < 50 ? 8 : 12) : 12,
            labelBackground: true,
            labelBackgroundStroke: themeTokens.value.graphEdgeLabelBgStroke,
            labelPadding: hasNum ? [0, 1, -2, 0] : [0, 0, -1, 0], // [修复] 补回：精细的数字错位修正
            labelBackgroundLineWidth: 1, // [修复] 补回
            labelBackgroundRadius: 2, // [修复] 补回：圆角标签更好看
            labelBackgroundPointerEvents: 'none', // [修复] 补回
            labelOffsetX: distance < 50 ? -5 : 0, // [修复] 补回：防短线标签重叠
            labelPointerEvents: 'none', // [修复] 补回

            operatorKey: edgeCtx.value.getOperatorKey(d),
            lineDash: [AntQuadratic.lineDashGap, AntQuadratic.lineDashGap],
          };
        }
        return {
          router: { type: 'orth' },
          stroke: themeTokens.value.graphEdgeStroke,
          pointerEvents: 'none',
        };
      },
    },
    layout: {
      type: 'indented',
      direction: 'LR',
      indent: 20,
      getHeight: () => 0,
    },
    behaviors: ['drag-canvas', 'zoom-canvas'],
  });

  try {
    await graph.render();
    graphRef.value = graph;
  } catch (e) {
    graphError.value = getErrorMessage(e, '关系图渲染失败');
    console.error(graphError.value, e);
  }
});

const showEdgeList = computed(() => {
  const list = props.filterUnitResults;
  if (!list?.length) return [];
  return edgeCtx.value.groupList
    .filter((g) => list.includes(g.result))
    .flatMap((v) => v.edgeGroup);
});

watch(
  [graphRef, showEdgeList],
  async ([graph, newEdgeList], [_, oldEdgeList]) => {
    if (!graph) return;
    try {
      if (newEdgeList !== oldEdgeList) {
        const removeEdgeList = oldEdgeList.filter(
          (v) => !newEdgeList.some((e) => e.id === v.id),
        );
        const addEdgeList = newEdgeList.filter(
          (v) => !oldEdgeList.some((e) => e.id === v.id),
        );
        if (!removeEdgeList.length && !addEdgeList.length) return;
        graph.removeEdgeData(removeEdgeList.map((v) => v.id!));
        await graph.draw();
        graph.addEdgeData(addEdgeList);
      } else {
        graph.addEdgeData(newEdgeList);
      }
      await graph.draw();
      graphError.value = '';
    } catch (e) {
      graphError.value = getErrorMessage(e, '关系图更新失败');
      console.warn(graphError.value, e);
    }
  },
);
</script>

<template>
  <div class="TrackGraphWrap">
    <div ref="el" class="TrackGraph" />
    <div v-if="graphError" class="TrackGraphError">
      {{ graphError }}
    </div>
  </div>
</template>

<style scoped>
.TrackGraphWrap {
  position: relative;
}

.TrackGraphError {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  max-width: min(80%, 460px);
  padding: 6px 10px;
  border: 1px solid var(--accent-danger-color);
  border-radius: 6px;
  background: var(--surface-raised-color);
  color: var(--accent-danger-color);
  font-size: 12px;
  line-height: 1.35;
}
</style>
