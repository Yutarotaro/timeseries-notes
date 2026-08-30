import { IndicatorSeries } from './IndicatorSeries.js';
import { Volatility } from './Volatility.js';

/**
 * DMI と ADX（Wilder）。
 *
 * この 2 つは役割が違う。+DI / -DI が「どちらが優勢か」を、
 * ADX が「そもそも方向が出ているか」を答える。ADX には向きの情報がない
 * （下降トレンドでも上がる）ので、単独で売買方向を決める道具ではない。
 */
export const Directional = {
  compute(series, period = 14) {
    const c = series.candles;
    const trueRange = Volatility.trueRange(series);

    // 方向性の動き。上下どちらか大きいほうだけを採り、同時には立てない。
    const plusDm = [0];
    const minusDm = [0];
    for (let i = 1; i < c.length; i++) {
      const up = c[i].high - c[i - 1].high;
      const down = c[i - 1].low - c[i].low;
      plusDm.push(up > down && up > 0 ? up : 0);
      minusDm.push(down > up && down > 0 ? down : 0);
    }

    const smoothPlus = wilder(plusDm, period);
    const smoothMinus = wilder(minusDm, period);
    const smoothTr = wilder(trueRange, period);

    const plusDi = smoothPlus.map((v, i) => (
      v == null || smoothTr[i] == null || smoothTr[i] === 0 ? null : (v / smoothTr[i]) * 100
    ));
    const minusDi = smoothMinus.map((v, i) => (
      v == null || smoothTr[i] == null || smoothTr[i] === 0 ? null : (v / smoothTr[i]) * 100
    ));

    const dx = plusDi.map((p, i) => {
      const m = minusDi[i];
      if (p == null || m == null || p + m === 0) return null;
      return (Math.abs(p - m) / (p + m)) * 100;
    });

    // ADX は DX をさらに平滑したもの。計算できた区間だけで平滑して添字を戻す。
    const defined = dx.filter((v) => v != null);
    const offset = dx.length - defined.length;
    const smoothedDx = wilder(defined, period);
    const adx = new Array(dx.length).fill(null);
    smoothedDx.forEach((v, i) => { adx[i + offset] = v; });

    return {
      plusDi: new IndicatorSeries('+DI', plusDi),
      minusDi: new IndicatorSeries('-DI', minusDi),
      adx: new IndicatorSeries(`ADX(${period})`, adx)
    };
  }
};

/** Wilder の平滑（最初の period 本は単純平均、以降は 1/period ずつ入れ替える）。 */
function wilder(values, period) {
  const out = new Array(values.length).fill(null);
  let previous = null;
  for (let i = 0; i < values.length; i++) {
    if (i === period - 1) {
      previous = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out[i] = previous;
    } else if (i >= period) {
      previous = (previous * (period - 1) + values[i]) / period;
      out[i] = previous;
    }
  }
  return out;
}
