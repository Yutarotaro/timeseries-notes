import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Pivot } from '../../domain/analysis/Pivot.js';

/** ピボットポイントの図。 */
export const pivotFigures = {
  'pivot-points': ({ repository }) => {
    const series = repository.find('pivot');
    const barsPerDay = 24;
    const previousDay = [barsPerDay, barsPerDay * 2 - 1];  // 前日ぶんの範囲
    const today = barsPerDay * 2;

    const input = Pivot.fromRange(series, previousDay[0], previousDay[1]);
    const levels = Pivot.classic(input);

    const b = new FigureSpecBuilder('pivot-points')
      .title('ピボットポイント — 前日の値から機械的に引く')
      .candles(series)
      .height(260)
      .yPad(0.08)
      .zone(previousDay[0], previousDay[1], { label: '前日', fill: 'muted', opacity: 0.12 });

    b.level(levels.pivot, { label: 'P（中心）', color: 'accent', dash: null, from: today });
    levels.resistance.slice(0, 2).forEach((price, i) => {
      b.level(price, { label: `R${i + 1}`, color: 'down', from: today });
    });
    levels.support.slice(0, 2).forEach((price, i) => {
      b.level(price, { label: `S${i + 1}`, color: 'up', from: today });
    });

    return b.caption(
      'P =（前日の高値＋安値＋終値）÷ 3。そこから値幅を足し引きして R1・S1 を出す。'
      + '計算に当日の値を一切使わないので、寄り付き前にその日の線が確定する。'
      + '誰が計算しても同じ数字になることが、この水準が効く理由のほとんどを占める。'
    ).build();
  }
};
