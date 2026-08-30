import { IndicatorSeries } from './IndicatorSeries.js';

/**
 * パラボリック SAR（Stop And Reverse）。
 *
 * 常にポジションを持っている前提の指標で、点が価格の反対側に付く。
 * 「損切り位置を機械的に上げていく」道具であって、エントリーの合図ではない。
 * レンジでは価格の上下に付け替わり続けて損切りだけが並ぶ。
 */
export const Parabolic = {
  compute(series, { step = 0.02, max = 0.2 } = {}) {
    const c = series.candles;
    const sar = new Array(c.length).fill(null);
    if (c.length < 2) return new IndicatorSeries('SAR', sar);

    // 最初の 2 本で仮の向きを決める。ここは後の値にほとんど影響しない。
    let rising = c[1].close >= c[0].close;
    let acceleration = step;
    let extreme = rising ? Math.max(c[0].high, c[1].high) : Math.min(c[0].low, c[1].low);
    let current = rising ? Math.min(c[0].low, c[1].low) : Math.max(c[0].high, c[1].high);
    sar[1] = current;

    for (let i = 2; i < c.length; i++) {
      current += acceleration * (extreme - current);

      // SAR は直近 2 本のレンジに食い込ませない（Wilder の但し書き）
      if (rising) current = Math.min(current, c[i - 1].low, c[i - 2].low);
      else current = Math.max(current, c[i - 1].high, c[i - 2].high);

      const reversed = rising ? c[i].low < current : c[i].high > current;
      if (reversed) {
        rising = !rising;
        current = extreme;                       // 反転時は直前の極値から始める
        extreme = rising ? c[i].high : c[i].low;
        acceleration = step;
      } else if (rising && c[i].high > extreme) {
        extreme = c[i].high;
        acceleration = Math.min(acceleration + step, max);
      } else if (!rising && c[i].low < extreme) {
        extreme = c[i].low;
        acceleration = Math.min(acceleration + step, max);
      }
      sar[i] = current;
    }
    return new IndicatorSeries('SAR', sar);
  }
};
