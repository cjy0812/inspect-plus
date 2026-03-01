import { ExtensionCategory, register } from '@antv/g6';
import { AntQuadratic } from '@/utils/g6';

/**
 * 操作符边类型（Plus 增强）。
 * 继承自官方 AntQuadratic，实现自定义图标绘制。
 */
export class OperatorEdge extends AntQuadratic {
  // 注意：此处建议跟随项目习惯，如果官方基类用 tyoe，这里也可以考虑兼容
  static type = 'operator-edge';

  onCreate() {
    super.onCreate();
    this.drawOperatorIcon();
  }

  onUpdate() {
    super.onUpdate();
    this.drawOperatorIcon();
  }

  onLayoutEnd() {
    this.drawOperatorIcon();
  }

  private drawOperatorIcon() {
    const attr = this.attributes as any;
    const edgeModel = this.context.model.getEdgeData(this.id as any) as any;
    const operatorKey =
      attr.operatorKey ||
      attr.data?.operatorKey ||
      edgeModel?.data?.operatorKey;

    if (!operatorKey) return;

    const keyShape = this.shapeMap.key;
    if (!keyShape) return;

    // --- 修复 ESLint no-useless-assignment ---
    // 不再赋初始值 0，而是直接在 try-catch 结构中定义
    let centerX: number;
    let centerY: number;

    try {
      const bbox = keyShape.getBBox();
      centerX = (bbox.left + bbox.right) / 2;
      centerY = (bbox.top + bbox.bottom) / 2;
    } catch {
      // 这里的 sourceNode 和 targetNode 假设已在基类定义
      const sourcePos = (this as any).sourceNode.getPosition();
      const targetPos = (this as any).targetNode.getPosition();
      centerX = (sourcePos[0] + targetPos[0]) / 2;
      centerY = (sourcePos[1] + targetPos[1]) / 2;
    }

    if (isNaN(centerX) || isNaN(centerY)) return;

    // --- 修复 ESLint no-useless-assignment ---
    // 使用变量直接获取 switch 的结果，不赋初始空值
    const iconPath = (() => {
      switch (operatorKey) {
        case '->':
          return 'M 0 -4 L 8 0 L 0 4 Z';
        case '-':
          return 'M -4 0 L 4 0';
        case '+':
          return 'M -4 0 L 4 0 M 0 -4 L 0 4';
        case '~':
          return 'M -4 0 Q 0 -3 4 0';
        default:
          return null;
      }
    })();

    if (!iconPath) return;

    this.upsert(
      'operator-icon',
      'path',
      {
        path: iconPath,
        stroke: attr.stroke || '#888',
        fill: attr.stroke || '#888',
        lineWidth: 1,
        transform: `translate(${centerX}, ${centerY}) scale(1.1)`,
        zIndex: 10,
      },
      this,
    );
  }
}

register(ExtensionCategory.EDGE, OperatorEdge.type, OperatorEdge);
