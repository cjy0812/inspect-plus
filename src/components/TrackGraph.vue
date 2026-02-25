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
import { ref, computed, shallowRef, watch, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    nodes: RawNode[];
    queryResult: QueryResult<RawNode>;
    showUnitResults: QueryResult.UnitResult<RawNode>[];
    filterUnitResults?: QueryResult.UnitResult<RawNode>[];
  }>(),
  {},
);

const el = ref<HTMLElement>();

const getNode = (id: string | number): RawNode => {
  return props.nodes[id as number];
};

const subNodes = computed(() => {
  return uniqBy(
    props.queryResult.unitResults
      .asJsReadonlyArrayView()
      .flatMap((v) => v.context.toArray()),
    (n) => n.id,
  );
});

const treeCtx = computed(() => {
  return getTrackTreeContext(props.nodes, subNodes.value);
});

const toTreeData = (node: RawNode): TreeData => {
  const data: TreeData = {
    id: node.id.toString(),
    children: treeCtx.value.getChildren(node).map(toTreeData),
  };
  return data;
};

const treeGraphData = computed(() => {
  return treeToGraphData(toTreeData(treeCtx.value.topNode));
});

const hasChildren = (node: RawNode): boolean => {
  return treeCtx.value.getChildren(node).length > 0;
};

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
}

const edgeCtx = computed<EdgeContext>(() => {
  const countMap: Record<string, number> = {};
  // 这里不再存储 QueryPath，而是存储提取出来的纯字符串数据
  const edgeSafeDataMap: Record<
    string,
    { label: string; operatorKey: string }
  > = {};

  const getNodeEdge = (path: QueryPath<RawNode>): EdgeData => {
    const key = `#${path.source.id}-${path.target.id}`;
    const count = countMap[key] || 0;
    countMap[key] = count + 1;
    const id = key + (count > 0 ? `-${count}` : '');

    // --- 核心修复：立即提取数据，不要把 path 对象传出去 ---
    let operatorKey = '';
    let label = '';
    try {
      // 访问属性时立刻捕获可能抛出的 Failed requirement
      operatorKey = path.operator?.key || '';
      label = path.formatConnectOffset || '';
    } catch {
      console.warn(`无法从路径 ${id} 提取 GKD 数据`);
    }

    edgeSafeDataMap[id] = { label, operatorKey };

    return {
      id,
      source: String(path.source.id),
      target: String(path.target.id),
      data: {
        operatorKey, // 给自定义边用的
      },
    };
  };

  const groupList = props.showUnitResults.map((result) => {
    let edgeGroup: EdgeData[] = [];
    try {
      // 核心修复点：连 pathList 的生成也保护起来
      const paths = result
        .getNodeConnectPath(transform)
        .asJsReadonlyArrayView();
      edgeGroup = paths.map((v) => getNodeEdge(v));
    } catch {
      console.error('GKD 路径生成失败，已拦截崩溃');
    }
    return { result, edgeGroup };
  });

  const edgeList = groupList.flatMap((v) => v.edgeGroup);

  // --- 这里的函数现在只操作普通 JS 对象，不再触发 GKD 引擎 ---
  const getLabel = (edge: EdgeData): string => {
    return edgeSafeDataMap[edge.id!]?.label || '';
  };

  const getOperatorKey = (edge: EdgeData): string => {
    return edgeSafeDataMap[edge.id!]?.operatorKey || '';
  };

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

  return {
    groupList,
    edgeList,
    getLabel,
    getColor,
    getGroupIndex,
    getOperatorIcon: (edge) => connectOperatorIcons[getOperatorKey(edge)] || '', // 简化
    getOperatorKey,
  };
});

const isCurveEdge = (edge: EdgeData): boolean => {
  return edge.id?.[0] === '#';
};

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

// 核心修复点 3：防止 G6 初始渲染时找不到节点导致崩溃
const getEdgeDistance = (g: Graph, d: EdgeData): number => {
  try {
    const n1 = g.getNodeData(d.source as string);
    const n2 = g.getNodeData(d.target as string);
    if (!n1?.style || !n2?.style) return 50; // 安全回退距离
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

const graphRef = shallowRef<Graph>();
const { themeTokens } = useTheme();

const redrawGraph = async () => {
  if (!graphRef.value) return;
  try {
    await graphRef.value.draw();
  } catch (e) {
    console.warn('图表重绘失败:', e);
  }
};

watch(themeTokens, () => {
  redrawGraph();
});

onUnmounted(() => {
  if (graphRef.value) {
    graphRef.value.destroy();
  }
});

watch(el, async () => {
  if (!el.value) {
    return;
  }
  const graph = new Graph({
    container: el.value,
    data: treeGraphData.value,
    autoFit: 'view',
    padding: [24, 48],
    animation: false,
    node: {
      type(d) {
        const node = getNode(d.id);
        return hasChildren(node) ? 'triangle' : 'rect';
      },
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
          labelPointerEvents: 'none',
          labelStroke: isTarget
            ? themeTokens.value.graphTargetLabelStroke
            : undefined,
        };
      },
    },
    edge: {
      type(d) {
        return isCurveEdge(d) ? OperatorEdge.type : 'polyline';
      },
      style(d) {
        if (isCurveEdge(d)) {
          const distance = getEdgeDistance(graph, d);
          const labelText = edgeCtx.value.getLabel(d) || '';
          const hasNum = labelText.match(numReg);
          return {
            curveOffset: 30 * (Number(d.source) > Number(d.target) ? 1 : -1),
            stroke: edgeCtx.value.getColor(d),
            zIndex: 1 + edgeCtx.value.getGroupIndex(d),
            pointerEvents: 'none',
            endArrow: true,
            endArrowOpacity: 0.5,
            endArrowPointerEvents: 'none',
            labelText,
            labelFill: themeTokens.value.graphEdgeLabelColor,
            labelFontSize: hasNum ? (distance < 50 ? 8 : 12) : 12,
            labelBackground: true,
            labelBackgroundStroke: themeTokens.value.graphEdgeLabelBgStroke,
            labelPadding: hasNum ? [0, 1, -2, 0] : [0, 0, -1, 0],
            labelBackgroundLineWidth: 1,
            labelBackgroundRadius: 2,
            labelBackgroundPointerEvents: 'none',
            labelOffsetX: distance < 50 ? -5 : 0,
            labelPointerEvents: 'none',
            // 确保透传 operatorKey
            operatorKey: edgeCtx.value.getOperatorKey(d),
            lineDash: [AntQuadratic.lineDashGap, AntQuadratic.lineDashGap],
          };
        }
        return {
          router: {
            type: 'orth',
          },
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
