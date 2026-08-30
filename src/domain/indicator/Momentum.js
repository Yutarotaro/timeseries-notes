import { IndicatorSeries } from './IndicatorSeries.js';
import { MovingAverage } from './MovingAverage.js';

/**
 * 勢いを測る指標のまとまり。
 *
 * どれも「今の価格を、少し前の価格や平均と比べる」だけの計算で、
 * 比べ方と正規化の仕方が違うだけ。だから同じ画面に 3 つ並べても
 * ほぼ同じ形になり、確認しているつもりで同じ情報を数えていることになる。
 */
export const Momentum = {
  /** 変化率（％）。最も素朴な勢いの測り方。 */
  rateOfChange(values, period = 10) {
    const out = values.map((v, i) => (i < period ? null : (v / values[i - period] - 1) * 100));
    return new IndicatorSeries(`ROC(${period})`, out);
  },

  /** 移動平均からの乖離率（％）。「行き過ぎ」を平均との距離で見る。 */
  disparity(values, period = 25) {
    const ma = MovingAverage.simple(values, period);
    return new IndicatorSeries(`乖離率(${period})`, values.map((v, i) => {
      const m = ma.at(i);
      return m == null ? null : (v / m - 1) * 100;
    }));
  },

  /**
   * CCI。代表値と平均の差を、平均偏差で正規化する。
   * 0.015 は「大半が ±100 に収まるように」置かれた定数で、理論値ではない。
   */
  cci(series, period = 20) {
    const typical = series.typicalPrices();
    const ma = MovingAverage.simple(typical, period);
    const out = typical.map((v, i) => {
      const m = ma.at(i);
      if (m == null) return null;
      let deviation = 0;
      for (let j = i - period + 1; j <= i; j++) deviation += Math.abs(typical[j] - m);
      deviation /= period;
      return deviation === 0 ? 0 : (v - m) / (0.015 * deviation);
    });
    return new IndicatorSeries(`CCI(${period})`, out);
  },

  /**
   * Williams %R。直近レンジの中での終値の位置を 0 〜 -100 で表す。
   * ストキャスティクスの %K を上下ひっくり返しただけ（%R = %K - 100）。
   */
  williamsR(series, period = 14) {
    const c = series.candles;
    const out = new Array(c.length).fill(null);
    for (let i = period - 1; i < c.length; i++) {
      const window = c.slice(i - period + 1, i + 1);
      const highest = Math.max(...window.map((x) => x.high));
      const lowest = Math.min(...window.map((x) => x.low));
      out[i] = highest === lowest ? -50 : ((c[i].close - highest) / (highest - lowest)) * 100;
    }
    return new IndicatorSeries(`Williams %R(${period})`, out);
  },

  /**
   * RCI。時間の順位と価格の順位の相関（スピアマン）。
   * 値そのものではなく順位だけを見るので、急騰の大きさは反映されず、
   * 「上げ続けているか」だけが出る。
   */
  rci(values, period = 9) {
    const out = new Array(values.length).fill(null);
    for (let i = period - 1; i < values.length; i++) {
      const window = values.slice(i - period + 1, i + 1);
      // 時間の順位: 新しいほど 1
      const timeRanks = window.map((_, j) => period - j);
      // 価格の順位: 高いほど 1
      const sorted = [...window].sort((a, b) => b - a);
      const priceRanks = window.map((v) => sorted.indexOf(v) + 1);
      let squared = 0;
      for (let j = 0; j < period; j++) squared += (timeRanks[j] - priceRanks[j]) ** 2;
      out[i] = (1 - (6 * squared) / (period ** 3 - period)) * 100;
    }
    return new IndicatorSeries(`RCI(${period})`, out);
  }
};
