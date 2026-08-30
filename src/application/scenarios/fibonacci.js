import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Fibonacci } from '../../domain/analysis/Fibonacci.js';

/** フィボナッチの図。 */
export const fibonacciFigures = {
  'fibonacci-retracement': ({ repository }) => {
    const series = repository.find('fibonacci');
    // 起点と終点を明示する。ここを変えれば線は全部動く、というのが要点。
    const swingLow = series.at(0).low;
    const swingHigh = Math.max(...series.candles.slice(0, 40).map((c) => c.high));
    const levels = Fibonacci.retracement(swingLow, swingHigh);

    const b = new FigureSpecBuilder('fibonacci-retracement')
      .title('フィボナッチ・リトレースメント')
      .candles(series)
      .height(260)
      .yPad(0.08);

    levels.forEach(({ ratio, price }) => {
      const major = ratio === 0.382 || ratio === 0.5 || ratio === 0.618;
      b.level(price, {
        label: `${(ratio * 100).toFixed(1)}%`,
        color: major ? 'accent' : 'muted',
        dash: major ? '6 3' : '2 4'
      });
    });
    b.marker([0, swingLow], 'dot', { color: 'up' })
      .note([2, swingLow], '起点', { dy: 16, anchor: 'start', color: 'up' })
      .marker([30, swingHigh], 'dot', { color: 'down' })
      .note([30, swingHigh], '終点', { dy: -12, color: 'down' });

    return b.caption(
      '38.2% / 50% / 61.8% がよく見られる。数字自体に力があるのではなく、'
      + '多くの参加者が同じ起点・終点で同じ線を引くから機能する。'
      + '起点をどこに取るかで線は全部ずれるので、「よく効いた線」を後から選ぶのは後付け。'
    ).build();
  }
};
