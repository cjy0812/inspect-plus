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

register(ExtensionCategory.EDGE, AntQuadratic.type, AntQuadratic);
