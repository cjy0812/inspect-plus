import { ExtensionCategory, Quadratic, register } from '@antv/g6';

/**
 * 蚂蚁线动画曲线边
 */
export class AntQuadratic extends Quadratic {
  static type = 'ant-quadratic';
  static lineDashGap = 5;

  onCreate() {
    this.updateAnimation();
  }

  onUpdate() {
    this.updateAnimation();
  }

  private updateAnimation() {
    const shape = this.shapeMap.key;
    if (shape) {
      shape.animate(
        [
          { lineDashOffset: AntQuadratic.lineDashGap * 2 },
          { lineDashOffset: 0 },
        ],
        {
          duration: 500,
          iterations: Infinity,
          delay: 0,
        },
      );
    }
  }
}

/**
 * 操作符边类型
 */
export class OperatorEdge extends AntQuadratic {
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

    // 获取 operatorKey
    const edgeModel = this.context.model.getEdgeData(this.id as any) as any;
    const operatorKey =
      attr.operatorKey ||
      attr.data?.operatorKey ||
      edgeModel?.data?.operatorKey;

    if (!operatorKey) return;

    const keyShape = this.shapeMap.key;
    if (!keyShape) return;

    let centerX = 0;
    let centerY = 0;

    try {
      // 修正：使用标准 DOMRect 的 left, right, top, bottom 属性
      // left = minX, right = maxX, top = minY, bottom = maxY
      const bbox = keyShape.getBBox();
      centerX = (bbox.left + bbox.right) / 2;
      centerY = (bbox.top + bbox.bottom) / 2;
    } catch {
      // 修正：去掉未使用的变量 e 以满足 ESLint
      const sourcePos = this.sourceNode.getPosition();
      const targetPos = this.targetNode.getPosition();
      centerX = (sourcePos[0] + targetPos[0]) / 2;
      centerY = (sourcePos[1] + targetPos[1]) / 2;
    }

    if (isNaN(centerX) || isNaN(centerY)) return;

    let iconPath = '';
    switch (operatorKey) {
      case '->':
        iconPath = 'M 0 -4 L 8 0 L 0 4 Z';
        break;
      case '-':
        iconPath = 'M -4 0 L 4 0';
        break;
      case '+':
        iconPath = 'M -4 0 L 4 0 M 0 -4 L 0 4';
        break;
      case '~':
        iconPath = 'M -4 0 Q 0 -3 4 0';
        break;
      default:
        return;
    }

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

register(ExtensionCategory.EDGE, AntQuadratic.type, AntQuadratic);
register(ExtensionCategory.EDGE, OperatorEdge.type, OperatorEdge);
