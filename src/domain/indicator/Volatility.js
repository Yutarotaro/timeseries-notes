import { IndicatorSeries } from './IndicatorSeries.js';
import { MovingAverage } from './MovingAverage.js';

/** ボラティリティ系。「どれくらい動くか」を測り、値幅の基準を与える。 */
export const Volatility = {
  /**
   * ボリンジャーバンド。中心線は SMA、幅は標準偏差 × k。
   * 母集団の標準偏差（n で割る）を使う。一般的なチャートソフトに合わせている。
   */
  bollinger(values, { period = 20, k = 2 } = {}) {
    const mid = MovingAverage.simple(values, period);
    const upper = new Array(values.length).fill(null);
    const lower = new Array(values.length).fill(null);
    const width = new Array(values.length).fill(null);
    for (let i = 0; i < values.length; i++) {
      const m = mid.at(i);
      if (m == null) continue;
      let acc = 0;
      for (let j = i - period + 1; j <= i; j++) acc += (values[j] - m) ** 2;
      const sd = Math.sqrt(acc / period);
      upper[i] = m + k * sd;
      lower[i] = m - k * sd;
      width[i] = m === 0 ? null : ((upper[i] - lower[i]) / m) * 100;
    }
    return {
      middle: mid,
      upper: new IndicatorSeries(`+${k}σ`, upper),
      lower: new IndicatorSeries(`-${k}σ`, lower),
      /** バンド幅（％）。スクイーズ／エクスパンションはこの系列で語る。 */
      bandWidth: new IndicatorSeries('BandWidth', width)
    };
  },

  /** 真の値幅（前日終値からの窓開けを含む）。 */
  trueRange(series) {
    const c = series.candles;
    return c.map((x, i) => (i === 0
      ? x.range
      : Math.max(x.high - x.low, Math.abs(x.high - c[i - 1].close), Math.abs(x.low - c[i - 1].close))));
  },

  /** ATR。損切り幅とロットを「値動きの大きさ」に合わせるための物差し。 */
  atr(series, period = 14) {
    const tr = Volatility.trueRange(series);
    const out = new Array(tr.length).fill(null);
    let prev = null;
    for (let i = 0; i < tr.length; i++) {
      if (i === period - 1) {
        prev = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
        out[i] = prev;
      } else if (i >= period) {
        prev = (prev * (period - 1) + tr[i]) / period;
        out[i] = prev;
      }
    }
    return new IndicatorSeries(`ATR(${period})`, out);
  }
};
