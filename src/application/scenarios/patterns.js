import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { ChartPattern } from '../../domain/analysis/ChartPattern.js';
import { significantSwings } from './trend.js';

/** チャートパターンの図。 */
export const patternFigures = {
  'double-top': ({ repository }) => {
    const series = repository.find('double-top');
    const [pattern] = ChartPattern.doubleTop(series, { lookback: 3, tolerance: 0.3 });

    const b = new FigureSpecBuilder('double-top')
      .title('ダブルトップ')
      .candles(series)
      .height(240)
      .digits(4)
      .yPad(0.12);

    if (pattern) {
      b.marker([pattern.first.index, pattern.first.price], 'dot', { color: 'down' })
        .marker([pattern.second.index, pattern.second.price], 'dot', { color: 'down' })
        .segment([pattern.first.index, pattern.first.price], [pattern.second.index, pattern.second.price],
          { color: 'down', dash: '5 4' })
        .level(pattern.neckline, { label: 'ネックライン', color: 'warn' })
        .level(pattern.neckline - pattern.height, {
          label: '目標（山の高さぶん）', color: 'accent', dash: '3 4'
        })
        .arrow([pattern.second.index + 6, pattern.neckline],
          [pattern.second.index + 6, pattern.neckline - pattern.height], { color: 'accent' });
    }

    return b.caption(
      '2 つ目の山で高値を更新できず、ネックラインを割って完成する。'
      + '「山が 2 つある」だけでは何も起きていない — 割れて初めてパターンになる。'
    ).build();
  },

  'head-shoulders': ({ repository }) => {
    const series = repository.find('head-shoulders');
    const [pattern] = ChartPattern.headAndShoulders(series, { lookback: 3, tolerance: 0.6 });

    const b = new FigureSpecBuilder('head-shoulders')
      .title('ヘッドアンドショルダー')
      .candles(series)
      .height(240)
      .yPad(0.12);

    if (pattern) {
      const labels = [[pattern.leftShoulder, '左肩'], [pattern.head, '頭'], [pattern.rightShoulder, '右肩']];
      labels.forEach(([swing, label]) => {
        b.marker([swing.index, swing.price], 'dot', { color: 'down' })
          .note([swing.index, swing.price], label, { dy: -12, color: 'down' });
      });
      const [n1, n2] = pattern.neckline;
      b.segment([n1.index, n1.price], [series.length - 1, n2.price], { color: 'warn', dash: '5 4' })
        .note([n1.index + 3, n1.price], 'ネックライン', { dy: 20, anchor: 'start', color: 'warn' });
    } else {
      b.note([series.length / 2, series.highest()], '（この系列では条件を満たさなかった）', { dy: -8 });
    }

    return b.caption(
      '高値の更新が止まり、右肩で戻りきれない形。左右の肩の高さが揃っている必要はなく、'
      + '大事なのは「頭を超えられないままネックラインを割った」という順序のほう。'
    ).build();
  },

  'triangle': ({ repository }) => {
    const series = repository.find('triangle');
    const swings = significantSwings(series, 2, 0.12);
    const highs = swings.filter((s) => s.kind === 'high');
    const lows = swings.filter((s) => s.kind === 'low');

    const b = new FigureSpecBuilder('triangle')
      .title('三角保ち合い — 値幅が尽きるまで待つ')
      .candles(series)
      .height(230)
      .yPad(0.1);

    if (highs.length >= 2 && lows.length >= 2) {
      const end = series.length - 1;
      const upper = lineThrough(highs[0], highs[highs.length - 1], end);
      const lower = lineThrough(lows[0], lows[lows.length - 1], end);
      b.segment(upper.from, upper.to, { color: 'down', width: 1.5 })
        .segment(lower.from, lower.to, { color: 'up', width: 1.5 });
    }
    b.zone(58, 68, { label: '値幅が尽きる', fill: 'muted', opacity: 0.16 })
      .arrow([70, series.at(70).low], [78, series.at(78).high], { color: 'accent' });

    return b.caption(
      '高値が切り下がり安値が切り上がる＝どちらの側も決め手を欠いている状態。'
      + '抜けた方向にそのまま伸びやすいが、抜けたと見せて戻す動きも同じくらい多い。'
    ).build();
  }
};

function lineThrough(a, b, endIndex) {
  const slope = (b.price - a.price) / (b.index - a.index || 1);
  return { from: [a.index, a.price], to: [endIndex, a.price + slope * (endIndex - a.index)] };
}
