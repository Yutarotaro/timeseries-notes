import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { significantSwings } from './trend.js';

/**
 * エリオット波動の図。
 *
 * 自動判定は実装していない。波の数え方は一意に決まらず、
 * 「当てはまるように数える」ことがいくらでもできてしまうため、
 * ここでは作った形に人手でラベルを振っている。それがこの理論の性質でもある。
 */
export const waveFigures = {
  'elliott-wave': ({ repository }) => {
    const series = repository.find('elliott');
    const swings = significantSwings(series, 4, 0.18);
    const labels = ['1', '2', '3', '4', '5', 'A', 'B', 'C'];

    // 波の番号は「そこで終わった波」に付く。起点となる最初の安値には
    // 番号が付かないので、そこから数え始める。
    const origin = swings[0]?.kind === 'low' ? 0 : -1;
    const numbered = swings.slice(origin + 1, origin + 1 + labels.length);

    const b = new FigureSpecBuilder('elliott-wave')
      .title('推進 5 波と修正 3 波')
      .candles(series)
      .height(270)
      .yPad(0.12);

    if (origin >= 0) {
      b.marker([swings[0].index, swings[0].price], 'dot', { color: 'muted' })
        .note([swings[0].index, swings[0].price], '起点', { dy: 18, color: 'muted' });
    }

    numbered.forEach((swing, i) => {
      const isCorrection = i >= 5;
      b.marker([swing.index, swing.price], 'dot', { color: isCorrection ? 'warn' : 'accent' })
        .note([swing.index, swing.price], labels[i], {
          dy: swing.kind === 'high' ? -12 : 18,
          color: isCorrection ? 'warn' : 'accent'
        });
    });

    const path = origin >= 0 ? [swings[0], ...numbered] : numbered;
    for (let i = 1; i < path.length; i++) {
      b.segment([path[i - 1].index, path[i - 1].price], [path[i].index, path[i].price],
        { color: i > 5 ? 'warn' : 'accent', dash: '5 4' });
    }

    return b.caption(
      '上げは 5 波、調整は 3 波で進む、という見立て。原則は 3 つ — '
      + '波 2 は波 1 の起点を割らない、波 3 が最短にならない、波 4 は波 1 の高値まで戻らない。'
      + 'ただし、どこを起点に数えるかは後からいくらでも変えられる。'
      + '数え直せば必ず当てはまるという性質があり、検証には向かない。'
    ).build();
  }
};
