<script setup lang="ts">
import { getNodeQf, getTrackTreeContext } from '@/utils/node';
import { transform, connectOperatorIcons } from '@/utils/selector';
import type { EdgeData, TreeData } from '@antv/g6';
import { Graph, treeToGraphData } from '@antv/g6';
import type { QueryPath } from '@gkd-kit/selector';
import { QueryResult } from '@gkd-kit/selector';
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
const { themeTokens } = useTheme();

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

interface EdgeContext {
  groupList: {
    result: QueryResult.UnitResult<RawNode>;
    edgeGroup: EdgeData[];
  }[];
  edgeList: EdgeData[];
  getLabel: (edge: EdgeData) => string;
  getColor: (edge: EdgeData) => string;
  getGroupIndex: (edge: EdgeData) => number;
  getOperatorIcon: (edge: EdgeData) => string;
  getOperatorKey: (edge: EdgeData) => string;
  getCurveOffset: (edge: EdgeData) => number;
}

const edgeCtx = computed<EdgeContext>(() => {
  const countMap: Record<string, number> = {};
  // 扩展存储：增加原版需要的 _isPrevious 和 _similarId
  const edgeSafeDataMap: Record<
    string,
    {
      label: string;
      operatorKey: string;
      _isPrevious: boolean;
      _similarId: string;
    }
  > = {};

  const getNodeEdge = (path: QueryPath<RawNode>): EdgeData => {
    const key = `#${path.source.id}-${path.target.id}`;
    const count = countMap[key] || 0;
    countMap[key] = count + 1;
    const id = key + (count > 0 ? `-${count}` : '');

    let operatorKey = '';
    let label = '';
    let _isPrevious = false;

    try {
      operatorKey = path.operator?.key || '';
      label = path.formatConnectOffset || '';
      // 原版逻辑：根据操作符判断方向
      _isPrevious = path.connectWrapper.segment.operator.key === '->';
    } catch {
      console.warn(`无法从路径 ${id} 提取 GKD 数据`);
    }

    // 原版逻辑：生成相似 ID 用于计算 offset
    const _similarId = [path.source.id, path.target.id, Number(_isPrevious)]
      .sort()
      .join('-');

    edgeSafeDataMap[id] = { label, operatorKey, _isPrevious, _similarId };

    return {
      id,
      source: String(path.source.id),
      target: String(path.target.id),
      _isPrevious, // 必须传出，用于 getCurveOffset 内部计算
      _similarId, // 必须传出，用于 getCurveOffset 内部计算
      data: {
        operatorKey,
      },
    };
  };

  const groupList = props.showUnitResults.map((result) => {
    let edgeGroup: EdgeData[] = [];
    try {
      const paths = result
        .getNodeConnectPath(transform)
        .asJsReadonlyArrayView();
      edgeGroup = paths.map((v) => getNodeEdge(v));
    } catch {
      console.error('GKD 路径生成失败');
    }
    return { result, edgeGroup };
  });

  const edgeList = groupList.flatMap((v) => v.edgeGroup);

  const getLabel = (edge: EdgeData) => edgeSafeDataMap[edge.id!]?.label || '';
  const getOperatorKey = (edge: EdgeData) =>
    edgeSafeDataMap[edge.id!]?.operatorKey || '';
  const getSimilarId = (edge: EdgeData) => (edge._similarId as string) || '';

  const getGroupIndex = (edge: EdgeData): number => {
    return groupList.findIndex((v) =>
      v.edgeGroup.some((e) => e.id === edge.id),
    );
  };

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

  // --- 合并原版核心算法：精准计算曲线偏移 ---
  const getCurveOffset = (edge: EdgeData): number => {
    const direction =
      (Number(edge.source) > Number(edge.target) ? 1 : -1) *
      (edge._isPrevious ? -1 : 1);

    const firstSimilarIndex = edgeList.findIndex(
      (e) => getSimilarId(e) === getSimilarId(edge),
    );

    const count =
      edgeList
        .filter((e, i) => {
          return (
            i >= firstSimilarIndex && getSimilarId(e) === getSimilarId(edge)
          );
        })
        .findIndex((e) => e.id === edge.id) + 1;

    return 30 * direction * Math.sqrt(count);
  };

  return {
    groupList,
    edgeList,
    getLabel,
    getColor,
    getGroupIndex,
    getOperatorIcon: (edge) => connectOperatorIcons[getOperatorKey(edge)] || '',
    getOperatorKey,
    getCurveOffset,
  };
});

// ... 保持你原有的 getEdgeDistance, isCurveEdge, redrawGraph 函数不变 ...

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

// ... Watchers 和 Graph 初始化保持你的风格，确保使用了 themeTokens 和 OperatorEdge ...

watch(el, async () => {
  if (!el.value) return;
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
            endArrow: true,
            endArrowOpacity: 0.5,
            labelText,
            labelFill: themeTokens.value.graphEdgeLabelColor,
            labelFontSize: hasNum ? (distance < 50 ? 8 : 12) : 12,
            labelBackground: true,
            labelBackgroundStroke: themeTokens.value.graphEdgeLabelBgStroke,
            operatorKey: edgeCtx.value.getOperatorKey(d),
            lineDash: [AntQuadratic.lineDashGap, AntQuadratic.lineDashGap],
            pointerEvents: 'none',
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
    console.error('G6 渲染初始化失败:', e);
  }
});

const showEdgeList = computed(() => {
  const list = props.filterUnitResults;
  if (!list?.length) {
    return [];
  }
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
        if (!removeEdgeList.length && !addEdgeList.length) {
          return;
        }
        graph.removeEdgeData(removeEdgeList.map((v) => v.id!));
        await graph.draw();
        graph.addEdgeData(addEdgeList);
      } else {
        graph.addEdgeData(newEdgeList);
      }
      await graph.draw();
    } catch (e) {
      console.warn('更新图表边数据时出错:', e);
    }
  },
);
</script>

<template>
  <div ref="el" class="TrackGraph" />
</template>
