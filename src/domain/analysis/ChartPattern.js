import { SwingDetector } from './SwingDetector.js';

/**
 * チャートパターンの判定。
 *
 * パターンは「スイング点の並び」で定義できるものだけを扱う。
 * 目で見て似ている、を実装に持ち込むと後付けで何とでも言えてしまうため、
 * 許容誤差 tolerance を必ず引数に出して、恣意性を呼び出し側に見せる。
 */
export const ChartPattern = {
  /** ダブルトップ／ボトム: 同じ水準の山（谷）が 2 つ、間にネックライン。 */
  doubleTop(series, { lookback = 2, tolerance = 0.15 } = {}) {
    const swings = SwingDetector.detect(series, { lookback });
    const highs = swings.filter((s) => s.kind === 'high');
    const lows = swings.filter((s) => s.kind === 'low');
    const found = [];
    for (let i = 1; i < highs.length; i++) {
      const a = highs[i - 1], b = highs[i];
      const neck = lows.find((l) => l.index > a.index && l.index < b.index);
      if (!neck) continue;
      const height = Math.max(a.price, b.price) - neck.price;
      if (height <= 0) continue;
      if (Math.abs(a.price - b.price) / height <= tolerance) {
        found.push({ kind: 'doubleTop', first: a, second: b, neckline: neck.price, height });
      }
    }
    return found;
  },

  /**
   * ヘッドアンドショルダー: 山・より高い山・山、の 3 つ。
   * ネックラインは 2 つの谷を結んだ線で、水平とは限らない。
   */
  headAndShoulders(series, { lookback = 2, tolerance = 0.25 } = {}) {
    const swings = SwingDetector.detect(series, { lookback });
    const highs = swings.filter((s) => s.kind === 'high');
    const lows = swings.filter((s) => s.kind === 'low');
    const found = [];
    for (let i = 2; i < highs.length; i++) {
      const [l, h, r] = [highs[i - 2], highs[i - 1], highs[i]];
      if (!(h.price > l.price && h.price > r.price)) continue;
      const shoulderGap = Math.abs(l.price - r.price) / (h.price - Math.min(l.price, r.price));
      if (shoulderGap > tolerance) continue;
      const troughs = lows.filter((x) => x.index > l.index && x.index < r.index);
      if (troughs.length < 2) continue;
      found.push({
        kind: 'headAndShoulders',
        leftShoulder: l, head: h, rightShoulder: r,
        neckline: [troughs[0], troughs[troughs.length - 1]]
      });
    }
    return found;
  }
};
