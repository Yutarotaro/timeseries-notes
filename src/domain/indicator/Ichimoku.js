import { IndicatorSeries } from './IndicatorSeries.js';

/**
 * 一目均衡表。
 *
 * この指標の本質は「時間をずらすこと」なので、ずらしは IndicatorSeries.shift に
 * 任せて、ここでは基準となる中値だけを素直に計算する。
 *   先行スパン → 26 本 未来へ（だから「雲」は右に飛び出す）
 *   遅行スパン → 26 本 過去へ
 */
export const Ichimoku = {
  compute(series, { conversion = 9, base = 26, span = 52, displacement = 26 } = {}) {
    const c = series.candles;
    const midpoint = (period, i) => {
      if (i < period - 1) return null;
      const w = c.slice(i - period + 1, i + 1);
      return (Math.max(...w.map((x) => x.high)) + Math.min(...w.map((x) => x.low))) / 2;
    };

    const tenkan = new IndicatorSeries('転換線', c.map((_, i) => midpoint(conversion, i)));
    const kijun = new IndicatorSeries('基準線', c.map((_, i) => midpoint(base, i)));

    const spanARaw = c.map((_, i) => {
      const t = tenkan.at(i), k = kijun.at(i);
      return t == null || k == null ? null : (t + k) / 2;
    });
    const spanA = new IndicatorSeries('先行スパン1', spanARaw).shift(displacement);
    const spanB = new IndicatorSeries('先行スパン2', c.map((_, i) => midpoint(span, i))).shift(displacement);
    const chikou = new IndicatorSeries('遅行スパン', c.map((x) => x.close)).shift(-displacement);

    return { tenkan, kijun, spanA, spanB, chikou, displacement };
  },

  /**
   * 三役好転: 転換線が基準線を上抜け／価格が雲の上／遅行スパンが価格の上。
   * 3 つ揃って初めて名乗る、というのがこの指標の作法。
   */
  tripleBullish(series, ichimoku, i) {
    const t = ichimoku.tenkan.at(i), k = ichimoku.kijun.at(i);
    const a = ichimoku.spanA.at(i), b = ichimoku.spanB.at(i);
    const price = series.at(i)?.close;
    const lagIdx = i - ichimoku.displacement;
    const lag = ichimoku.chikou.at(lagIdx);
    const pastPrice = series.at(lagIdx)?.close;
    if ([t, k, a, b, price, lag, pastPrice].some((v) => v == null)) return false;
    return t > k && price > Math.max(a, b) && lag > pastPrice;
  }
};
