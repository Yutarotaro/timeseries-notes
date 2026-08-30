import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { MovingAverage } from '../../domain/indicator/MovingAverage.js';
import { IndicatorSeries } from '../../domain/indicator/IndicatorSeries.js';

/** 移動平均の図。 */
export const movingAverageFigures = {
  'moving-average': ({ repository }) => {
    const series = repository.find('moving-average');
    const closes = series.closes();
    const short = MovingAverage.exponential(closes, 20);
    const mid = MovingAverage.exponential(closes, 50);
    const long = MovingAverage.simple(closes, 100);

    const b = new FigureSpecBuilder('moving-average')
      .title('移動平均線 — 傾きと並び順を見る')
      .candles(series)
      .height(260)
      .yPad(0.1)
      .line(short, { color: 'accent', label: 'EMA20' })
      .line(mid, { color: 'accent2', label: 'EMA50' })
      .line(long, { color: 'accent3', label: 'SMA100' });

    IndicatorSeries.crossovers(short, mid).forEach((i) => {
      b.marker([i, series.at(i).low], 'buy', { color: 'up' })
        .note([i, series.at(i).low], 'ゴールデンクロス', { dy: 26, color: 'up' });
    });
    IndicatorSeries.crossunders(short, mid).forEach((i) => {
      b.marker([i, series.at(i).high], 'sell', { color: 'down' })
        .note([i, series.at(i).high], 'デッドクロス', { dy: -18, color: 'down' });
    });

    // 並び順が揃っている区間を塗る
    let runStart = null;
    let labelled = false;
    const markRun = (from, to) => {
      b.zone(from, to, { label: labelled ? null : 'パーフェクトオーダー', fill: 'up', opacity: 0.08 });
      labelled = true;
    };
    for (let i = 0; i < series.length; i++) {
      const order = MovingAverage.isPerfectOrder(short, mid, long, i);
      if (order === 'up' && runStart == null) runStart = i;
      if (order !== 'up' && runStart != null) {
        if (i - runStart > 6) markRun(runStart, i - 1);
        runStart = null;
      }
    }
    if (runStart != null) markRun(runStart, series.length - 1);

    return b.caption(
      'クロスは常に遅れる。移動平均は過去の平均なので当然で、'
      + '「クロスしたから入る」より「並び順と傾きが崩れていないか」を見るほうが実用的。'
    ).build();
  },

  'granville': ({ repository }) => {
    const series = repository.find('granville');
    const closes = series.closes();
    const ma = MovingAverage.simple(closes, 25);
    const b = new FigureSpecBuilder('granville')
      .title('押し目買いの形 — 上向きの平均線に価格が戻る')
      .candles(series)
      .height(240)
      .yPad(0.1)
      .line(ma, { color: 'accent', label: 'SMA25' });

    // 上向きの平均線まで価格が下げてきて、そこで止まった場面を拾う。
    // 条件を緩めると足のたびに印が付いて「毎回買う」図になってしまうので、
    // 一度拾ったら数本は次を拾わない（同じ押し目を重複して数えない）。
    const tolerance = (series.highest() - series.lowest()) * 0.02;
    let lastMarked = -Infinity;
    for (let i = 26; i < series.length; i++) {
      const value = ma.at(i);
      const slope = value == null ? null : value - ma.at(i - 5);
      if (value == null || slope == null || slope <= 0) continue;
      if (i - lastMarked < 8) continue; // 同じ押し目を何度も数えない
      const candle = series.at(i);
      const touched = candle.low - tolerance <= value && value <= candle.bodyTop;
      const bounced = candle.close > value;
      if (touched && bounced) {
        b.marker([i, candle.low], 'buy', { color: 'up' });
        lastMarked = i;
      }
    }

    return b.caption(
      '平均線が上を向いていることが前提。向きが横ばいの平均線に何度触れても、'
      + 'それは押し目ではなくレンジの往復にすぎない。'
    ).build();
  }
};
