import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { SwingDetector } from '../../domain/analysis/SwingDetector.js';

/** トレンドの構造（ダウ理論）を扱う図。 */
export const trendFigures = {
  'trend-structure': ({ repository }) => {
    const series = repository.find('trend-structure');
    const swings = significantSwings(series, 3, 0.12);
    const b = new FigureSpecBuilder('trend-structure')
      .title('上昇トレンドの定義 — 高値も安値も切り上がっている')
      .candles(series)
      .height(260)
      .yPad(0.14);

    const highs = swings.filter((s) => s.kind === 'high');
    const lows = swings.filter((s) => s.kind === 'low');

    highs.forEach((s, i) => {
      b.marker([s.index, s.price], 'dot', { color: 'down' })
        .note([s.index, s.price], `高値${circled(i + 1)}`, { dy: -12, color: 'down' });
    });
    lows.forEach((s, i) => {
      b.marker([s.index, s.price], 'dot', { color: 'up' })
        .note([s.index, s.price], `安値${circled(i + 1)}`, { dy: 18, color: 'up' });
    });
    for (let i = 1; i < highs.length; i++) {
      b.segment([highs[i - 1].index, highs[i - 1].price], [highs[i].index, highs[i].price],
        { color: 'down', dash: '5 4' });
    }
    for (let i = 1; i < lows.length; i++) {
      b.segment([lows[i - 1].index, lows[i - 1].price], [lows[i].index, lows[i].price],
        { color: 'up', dash: '5 4' });
    }

    const trend = SwingDetector.trend(swings);
    return b.caption(
      `検出したスイングから判定したトレンド: ${{ up: '上昇', down: '下降', range: 'レンジ', unknown: '判定不能' }[trend]}。`
      + '高値だけ更新して安値が切り下がっているならトレンドではなく、ただ荒れているだけ。'
    ).build();
  },

  'trend-break': ({ repository }) => {
    const series = repository.find('trend-break');
    const swings = significantSwings(series, 3, 0.12);
    const lows = swings.filter((s) => s.kind === 'low');
    const b = new FigureSpecBuilder('trend-break')
      .title('トレンドが終わる瞬間 — 押し安値を割る')
      .candles(series)
      .height(250)
      .yPad(0.12);

    lows.forEach((s) => b.marker([s.index, s.price], 'dot', { color: 'up' }));
    const lastLow = lows[lows.length - 1] ?? null;
    const priorLow = lows[lows.length - 2] ?? null;
    if (priorLow) {
      b.level(priorLow.price, { label: '直近の押し安値', color: 'warn', dash: '5 4', from: priorLow.index });
    }
    if (lastLow && priorLow && lastLow.price < priorLow.price) {
      b.zone(lastLow.index - 2, Math.min(lastLow.index + 4, series.length - 1),
        { label: '安値切り下げ', fill: 'danger', opacity: 0.14 });
    }
    b.note([series.length - 6, series.lowest()], 'ここで「上昇トレンド」という前提は失効する',
      { dy: 20, anchor: 'end' });

    return b.caption(
      '天井を当てる必要はない。「上がり続ける前提が崩れた」ことだけ確認できれば、'
      + '少なくとも買い続ける理由は消える。'
    ).build();
  }
};

/**
 * 検出したスイングのうち、値幅として意味のあるものだけ残す。
 * 生の検出結果はノイズを拾うので、系列全体の値幅に対する比で足切りする。
 * しきい値は恣意的で、ここを動かせば図の見え方も変わる — それが実態でもある。
 */
export function significantSwings(series, lookback, ratio) {
  const swings = SwingDetector.detect(series, { lookback });
  const scale = (series.highest() - series.lowest()) * ratio;
  const kept = [];
  swings.forEach((s) => {
    const last = kept[kept.length - 1];
    if (!last) { kept.push(s); return; }
    if (last.kind === s.kind) {
      // 同じ種類が続いたら、より極端なほうを残す
      const better = s.kind === 'high' ? s.price > last.price : s.price < last.price;
      if (better) kept[kept.length - 1] = s;
      return;
    }
    if (Math.abs(s.price - last.price) >= scale) kept.push(s);
  });
  return kept;
}

function circled(n) { return '①②③④⑤⑥⑦⑧'[n - 1] ?? `(${n})`; }
