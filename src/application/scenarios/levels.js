import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { PriceLevel } from '../../domain/model/PriceLevel.js';
import { significantSwings } from './trend.js';

/** 水平線・トレンドラインの図。 */
export const levelFigures = {
  'support-resistance': ({ repository }) => {
    const series = repository.find('support-resistance');
    const tolerance = 0.06;
    const touchedIndexes = [];

    // 何回止められたかは数える。連続して触れている足はひとまとまりで 1 回
    // （そうしないと「止められた回数」が足の本数になってしまう）。
    // 印もまとまりごとに 1 つだけ打つ。数字と点の数が合わないと図が嘘をつく。
    let level = new PriceLevel(149.6, 'resistance', 0);
    let previousTouch = null;
    series.candles.forEach((candle, i) => {
      if (!level.isTouchedBy(candle, tolerance)) return;
      if (previousTouch == null || i - previousTouch > 3) {
        level = level.touchedAgain();
        touchedIndexes.push(i);
      }
      previousTouch = i;
    });
    const flipped = level.flipped();

    const b = new FigureSpecBuilder('support-resistance')
      .title('抜けた天井は床になる（ロールリバーサル）')
      .candles(series)
      .height(250)
      .yPad(0.12);

    b.priceZone(level.price + 0.08, level.price - 0.08,
      { label: `${level.touches} 回止められた水準`, fill: 'level', opacity: 0.18 });
    touchedIndexes.forEach((i) => b.marker([i, level.price], 'dot', { color: 'level' }));

    b.note([26, level.price], 'レジスタンス', { dy: -14, color: 'down' })
      .note([76, flipped.price], 'サポートに反転', { dy: 22, color: 'up' })
      .zone(62, 70, { label: '押し目', fill: 'up', opacity: 0.1 });

    return b.caption(
      '同じ値段で何度も止まると、そこに指値が溜まっていることが多い。'
      + '抜けたあとは、そこで買い損ねた側と売って損した側の注文が入れ替わり、役割が反転する。'
    ).build();
  },

  'trendline-channel': ({ repository }) => {
    const series = repository.find('trendline-channel');
    const swings = significantSwings(series, 3, 0.12);
    const lows = swings.filter((s) => s.kind === 'low');
    const highs = swings.filter((s) => s.kind === 'high');
    const b = new FigureSpecBuilder('trendline-channel')
      .title('トレンドラインとチャネル')
      .candles(series)
      .height(250)
      .digits(4)
      .yPad(0.12);

    if (lows.length >= 2) {
      const [a, c] = [lows[0], lows[lows.length - 1]];
      const slope = (c.price - a.price) / (c.index - a.index);
      const end = series.length - 1;
      b.segment([a.index, a.price], [end, a.price + slope * (end - a.index)],
        { color: 'up', width: 1.6 })
        .note([a.index + 4, a.price], '安値どうしを結ぶ＝支持線', { dy: 20, anchor: 'start', color: 'up' });

      // 平行にずらしたものがチャネル上限。等間隔で動く、という仮定を可視化する。
      // 最大乖離に合わせると線が上に浮いて価格に触れないので、
      // 高値の乖離の上位 4 分の 1 の位置に置く（少数の超過は許容する）。
      if (highs.length) {
        const gaps = highs
          .map((h) => h.price - (a.price + slope * (h.index - a.index)))
          .sort((x, z) => x - z);
        const offset = gaps[Math.floor((gaps.length - 1) * 0.75)];
        b.segment([a.index, a.price + offset], [end, a.price + slope * (end - a.index) + offset],
          { color: 'accent2', dash: '6 4' })
          .note([end - 6, a.price + slope * (end - a.index) + offset], 'チャネル上限', { dy: -10, anchor: 'end', color: 'accent2' });
      }
    }
    lows.forEach((s) => b.marker([s.index, s.price], 'dot', { color: 'up' }));

    return b.caption(
      'ラインは 2 点で引けてしまうので、3 点目で反応して初めて意味を持つ。'
      + '角度が急なラインほど早く割れる — 上げ続けるには毎回もっと速く上げる必要があるため。'
    ).build();
  },

  'round-numbers': ({ repository }) => {
    const series = repository.find('support-resistance');
    const b = new FigureSpecBuilder('round-numbers')
      .title('キリ番 — 誰の目にも同じに見える水準')
      .candles(series)
      .height(200)
      .yPad(0.1)
      .noAxis(); // 引いた線そのものが目盛りなので、右側の価格軸は邪魔になる

    // 系列のレンジに入る 0.5 円刻みの節目を機械的に引く
    const from = Math.ceil(series.lowest() * 2) / 2;
    for (let price = from; price <= series.highest(); price += 0.5) {
      const isMajor = Number.isInteger(price);
      b.level(price, {
        label: isMajor ? `${price.toFixed(2)}` : null,
        color: isMajor ? 'level' : 'muted',
        dash: isMajor ? '6 4' : '2 5'
      });
    }
    return b.caption(
      '指値・逆指値はキリのいい数字に集まりやすい。テクニカルの根拠というより、'
      + '「他の参加者がそこを見ている」という理由で効く。'
    ).build();
  }
};
