import { IndicatorSeries } from './IndicatorSeries.js';

/**
 * VWAP（出来高加重平均価格）。
 *
 * 「その区間に参加した人たちの平均コスト」を近似する。単純な移動平均と違い、
 * 起点を決めないと値が決まらない — 起点からの累積だからだ。
 * 株の日中取引ではその日の寄り付きが起点になるが、24 時間動く為替では
 * 「どこを起点に置くか」を人間が決める必要がある（アンカード VWAP）。
 */
export const Vwap = {
  /**
   * @param {CandleSeries} series
   * @param {number[]} anchors 起点にする添字（昇順）。空なら先頭から通し。
   */
  compute(series, anchors = [0]) {
    if (!series.hasVolume()) {
      throw new Error('Vwap: 出来高のない系列では計算できない');
    }
    const c = series.candles;
    const starts = anchors.length ? [...anchors].sort((a, b) => a - b) : [0];
    const out = new Array(c.length).fill(null);

    let cumulativePv = 0;
    let cumulativeVolume = 0;
    let nextAnchor = 0;
    for (let i = 0; i < c.length; i++) {
      if (nextAnchor < starts.length && i === starts[nextAnchor]) {
        cumulativePv = 0;               // 起点で積み上げをリセットする
        cumulativeVolume = 0;
        nextAnchor += 1;
      }
      if (i < starts[0]) continue;
      cumulativePv += c[i].typicalPrice * c[i].volume;
      cumulativeVolume += c[i].volume;
      out[i] = cumulativeVolume === 0 ? null : cumulativePv / cumulativeVolume;
    }
    return new IndicatorSeries('VWAP', out);
  }
};
