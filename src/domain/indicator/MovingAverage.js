import { IndicatorSeries } from './IndicatorSeries.js';

/**
 * 移動平均。ドメインサービス（純粋関数のまとまり）。
 *
 * すべて「その足までの値だけ」で計算する。中心化移動平均のように
 * 未来を含む平滑化はここには置かない。可視化には綺麗でも、
 * 売買判断に使った瞬間にリークになるため。
 */
export const MovingAverage = {
  /** 単純移動平均 */
  simple(values, period) {
    const out = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= period) sum -= values[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return new IndicatorSeries(`SMA(${period})`, out);
  },

  /** 指数平滑移動平均。最初の period 本の単純平均を種にする。 */
  exponential(values, period) {
    const out = new Array(values.length).fill(null);
    const k = 2 / (period + 1);
    let prev = null;
    for (let i = 0; i < values.length; i++) {
      if (i === period - 1) {
        prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
        out[i] = prev;
      } else if (i >= period) {
        prev = values[i] * k + prev * (1 - k);
        out[i] = prev;
      }
    }
    return new IndicatorSeries(`EMA(${period})`, out);
  },

  /**
   * パーフェクトオーダー: 短期・中期・長期がこの順に並び、かつ
   * 長期線が向きを揃えている状態。トレンドの「強さ」を語る言葉。
   */
  isPerfectOrder(short, mid, long, i) {
    const s = short.at(i), m = mid.at(i), l = long.at(i), lPrev = long.at(i - 1);
    if ([s, m, l, lPrev].some((v) => v == null)) return null;
    if (s > m && m > l && l > lPrev) return 'up';
    if (s < m && m < l && l < lPrev) return 'down';
    return null;
  }
};
