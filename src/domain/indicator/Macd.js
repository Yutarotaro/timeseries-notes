import { IndicatorSeries } from './IndicatorSeries.js';
import { MovingAverage } from './MovingAverage.js';

/**
 * MACD。2 本の EMA の差（＝トレンドの傾き）と、その平滑線。
 * シグナル線は「MACD 線が計算できた区間だけ」で平滑するので、
 * 添字を戻すときにずらす必要がある。ここを間違えると 26 本ぶん未来にずれる。
 */
export const Macd = {
  compute(values, { fast = 12, slow = 26, signal = 9 } = {}) {
    const fastEma = MovingAverage.exponential(values, fast);
    const slowEma = MovingAverage.exponential(values, slow);
    const macdLine = IndicatorSeries.difference(`MACD(${fast},${slow})`, fastEma, slowEma);

    const defined = macdLine.values.filter((v) => v != null);
    const offset = macdLine.length - defined.length;
    const smoothed = MovingAverage.exponential(defined, signal);
    const signalValues = new Array(macdLine.length).fill(null);
    smoothed.values.forEach((v, i) => { signalValues[i + offset] = v; });
    const signalLine = new IndicatorSeries(`Signal(${signal})`, signalValues);

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: IndicatorSeries.difference('Histogram', macdLine, signalLine)
    };
  }
};
