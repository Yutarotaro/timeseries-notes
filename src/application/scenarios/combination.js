import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { MovingAverage } from '../../domain/indicator/MovingAverage.js';
import { Oscillator } from '../../domain/indicator/Oscillator.js';
import { Directional } from '../../domain/indicator/Directional.js';

/**
 * 指標の組み合わせ方の図。
 *
 * 役割の違うものを 1 つずつ担当させる、という考え方を可視化する。
 * 同じ性格の指標を並べても確認にならない（oscillator-overlap の図が示すとおり）。
 */
export const combinationFigures = {
  'indicator-stack': ({ repository }) => {
    const series = repository.find('dmi');
    const closes = series.closes();
    const fast = MovingAverage.exponential(closes, 20);
    const slow = MovingAverage.exponential(closes, 50);
    const rsi = Oscillator.rsi(closes, 14);
    const { adx } = Directional.compute(series, 14);

    const b = new FigureSpecBuilder('indicator-stack')
      .title('役割で分担させる — 場・方向・タイミング')
      .candles(series)
      .height(230)
      .line(fast, { color: 'accent', label: 'EMA20' })
      .line(slow, { color: 'accent2', label: 'EMA50' });

    // 3 つの条件が同時に立った足だけを拾う。
    // ここで「条件を増やせば精度が上がる」わけではない点に注意。
    // 条件が増えるほど回数は減り、過去に合わせただけの組み合わせに近づく。
    let lastMarked = -Infinity;
    for (let i = 1; i < series.length; i++) {
      const trending = adx.at(i) != null && adx.at(i) >= 25;                 // 場
      const upward = fast.at(i) != null && slow.at(i) != null && fast.at(i) > slow.at(i); // 方向
      // 順張りなので、中立（50）ではなく勢いがついた側（60）の上抜けを合図にする。
      // 上昇トレンドでは RSI が 50 まで落ちてくること自体が少ない。
      const timing = rsi.at(i - 1) != null && rsi.at(i - 1) < 60 && rsi.at(i) >= 60;
      if (trending && upward && timing && i - lastMarked > 5) {
        b.marker([i, series.at(i).low], 'buy', { color: 'up' });
        lastMarked = i;
      }
    }

    return b
      .pane((p) => p.title('ADX(14) — 場（方向が出ているか）').height(66).range(0, 60)
        .line(adx, { color: 'accent3' })
        .level(25, { label: '25', color: 'muted' }))
      .pane((p) => p.title('RSI(14) — タイミング').height(66).range(0, 100)
        .line(rsi, { color: 'warn' })
        .level(60, { label: '60', color: 'muted', dash: '2 4' }))
      .caption(
        '場の判定を ADX（25 超）、方向を移動平均（EMA20 > EMA50）、'
        + 'タイミングを RSI（60 の上抜け）に割り当てている。'
        + '3 つが別のことを見ているので、揃ったときの意味がある。'
        + 'ただし条件を足すほど回数は減り、過去のデータに合わせただけの組み合わせに近づく。'
        + '増やすなら、増やす前と後で別の期間・別の通貨ペアの成績を比べること。'
      ).build();
  }
};
