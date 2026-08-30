import { IndicatorSeries } from './IndicatorSeries.js';
import { MovingAverage } from './MovingAverage.js';

/** 買われすぎ・売られすぎを 0〜100 で語る指標のまとまり。 */
export const Oscillator = {
  /**
   * RSI（Wilder 式）。値幅の上昇分と下落分の比。
   * 初期値は最初の period 本の単純平均、以降は Wilder の平滑。
   */
  rsi(values, period = 14) {
    const out = new Array(values.length).fill(null);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      if (i <= period) {
        avgGain += gain / period;
        avgLoss += loss / period;
        if (i === period) out[i] = toRsi(avgGain, avgLoss);
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        out[i] = toRsi(avgGain, avgLoss);
      }
    }
    return new IndicatorSeries(`RSI(${period})`, out);

    function toRsi(g, l) {
      if (l === 0) return g === 0 ? 50 : 100;
      return 100 - 100 / (1 + g / l);
    }
  },

  /** ストコ %K / %D。直近 period 本のレンジの中で終値がどこにいるか。 */
  stochastic(series, { k = 14, d = 3 } = {}) {
    const candles = series.candles;
    const kValues = new Array(candles.length).fill(null);
    for (let i = k - 1; i < candles.length; i++) {
      const window = candles.slice(i - k + 1, i + 1);
      const hh = Math.max(...window.map((c) => c.high));
      const ll = Math.min(...window.map((c) => c.low));
      kValues[i] = hh === ll ? 50 : ((candles[i].close - ll) / (hh - ll)) * 100;
    }
    const kLine = new IndicatorSeries(`%K(${k})`, kValues);
    const defined = kValues.filter((v) => v != null);
    const offset = kValues.length - defined.length;
    const smoothed = MovingAverage.simple(defined, d);
    const dValues = new Array(kValues.length).fill(null);
    smoothed.values.forEach((v, i) => { dValues[i + offset] = v; });
    return { k: kLine, d: new IndicatorSeries(`%D(${d})`, dValues) };
  }
};
