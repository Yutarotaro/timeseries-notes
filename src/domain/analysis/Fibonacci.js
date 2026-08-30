/**
 * フィボナッチ。値幅の何割戻したか、を語るための水準。
 *
 * 起点と終点をどこに取るかで水準はいくらでも動く。だから「当たる線」ではなく
 * 「候補を絞る道具」として扱う。ここでは起点・終点を必ず明示させる。
 */
export const RETRACEMENT_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
export const EXTENSION_RATIOS = [1.272, 1.618, 2.0];

export const Fibonacci = {
  /** 押し目・戻り目の水準。swingStart → swingEnd の値幅に対する戻り。 */
  retracement(swingStart, swingEnd, ratios = RETRACEMENT_RATIOS) {
    const span = swingEnd - swingStart;
    return ratios.map((r) => ({ ratio: r, price: swingEnd - span * r }));
  },

  /** 伸びきった先の目標水準。 */
  extension(swingStart, swingEnd, ratios = EXTENSION_RATIOS) {
    const span = swingEnd - swingStart;
    return ratios.map((r) => ({ ratio: r, price: swingStart + span * r }));
  }
};
