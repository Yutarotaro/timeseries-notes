/**
 * スイングハイ／スイングローの検出と、そこから読むトレンド。
 *
 * 重要（リーク）: フラクタル法のスイング点は「右側 lookback 本」が
 * 出揃うまで確定しない。チャートを後から眺めると当たり前に見える高値も、
 * リアルタイムでは lookback 本遅れて分かる。バックテストでこの遅れを
 * 入れ忘れると、成績が跳ね上がって現実には再現しない。
 * confirmedAt がその遅れを表している。
 */
export const SwingDetector = {
  detect(series, { lookback = 2 } = {}) {
    const c = series.candles;
    const swings = [];
    for (let i = lookback; i < c.length - lookback; i++) {
      const left = c.slice(i - lookback, i);
      const right = c.slice(i + 1, i + 1 + lookback);
      const isHigh = left.every((x) => x.high < c[i].high) && right.every((x) => x.high <= c[i].high);
      const isLow = left.every((x) => x.low > c[i].low) && right.every((x) => x.low >= c[i].low);
      if (isHigh) swings.push({ index: i, price: c[i].high, kind: 'high', confirmedAt: i + lookback });
      if (isLow) swings.push({ index: i, price: c[i].low, kind: 'low', confirmedAt: i + lookback });
    }
    return swings;
  },

  /**
   * ダウ理論のトレンド判定。
   * 高値と安値がそろって切り上がっていれば上昇、そろって切り下がれば下降、
   * どちらでもなければレンジ。「高値だけ更新」はトレンドとは呼ばない。
   */
  trend(swings) {
    const highs = swings.filter((s) => s.kind === 'high').slice(-2);
    const lows = swings.filter((s) => s.kind === 'low').slice(-2);
    if (highs.length < 2 || lows.length < 2) return 'unknown';
    const higherHigh = highs[1].price > highs[0].price;
    const higherLow = lows[1].price > lows[0].price;
    if (higherHigh && higherLow) return 'up';
    if (!higherHigh && !higherLow) return 'down';
    return 'range';
  },

  /**
   * ダイバージェンス: 価格の高値／安値の更新に対して、
   * オシレータが同じ方向へ更新できていない状態。
   */
  divergences(series, indicator, { lookback = 2 } = {}) {
    const swings = SwingDetector.detect(series, { lookback });
    const out = [];
    ['high', 'low'].forEach((kind) => {
      const points = swings.filter((s) => s.kind === kind);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const ia = indicator.at(a.index), ib = indicator.at(b.index);
        if (ia == null || ib == null) continue;
        if (kind === 'high' && b.price > a.price && ib < ia) {
          out.push({ kind: 'bearish', from: a, to: b, indicatorFrom: ia, indicatorTo: ib });
        }
        if (kind === 'low' && b.price < a.price && ib > ia) {
          out.push({ kind: 'bullish', from: a, to: b, indicatorFrom: ia, indicatorTo: ib });
        }
      }
    });
    return out;
  }
};
