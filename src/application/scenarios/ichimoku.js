import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Ichimoku } from '../../domain/indicator/Ichimoku.js';

/** 一目均衡表の図。 */
export const ichimokuFigures = {
  'ichimoku-cloud': ({ repository }) => {
    const series = repository.find('ichimoku');
    const cloud = Ichimoku.compute(series);

    const b = new FigureSpecBuilder('ichimoku-cloud')
      .title('一目均衡表 — 時間をずらして眺める')
      .candles(series)
      .height(280)
      .xCount(series.length + cloud.displacement)
      .band(cloud.spanA, cloud.spanB, { fill: 'accent3', opacity: 0.16 })
      .line(cloud.spanA, { color: 'accent3', dash: '3 3' })
      .line(cloud.spanB, { color: 'accent3', dash: '3 3' })
      .line(cloud.tenkan, { color: 'accent', label: '転換線' })
      .line(cloud.kijun, { color: 'warn', label: '基準線' })
      .line(cloud.chikou, { color: 'muted', label: '遅行スパン' });

    const last = series.length - 1;
    b.note([series.length + 12, cloud.spanA.at(series.length + 12) ?? series.highest()],
      '雲は 26 本先まで描かれる', { dy: -14 });

    const triple = Ichimoku.tripleBullish(series, cloud, last);
    return b.caption(
      `雲は 26 本先まで既に決まっているので、「この先どこに抵抗があるか」を先に見られるのが特徴。`
      + `遅行スパンは終値を 26 本前に置いたもので、当時の価格を上回っていれば買い方が優勢。`
      + `最終足の三役好転: ${triple ? '成立' : '不成立'}。`
    ).build();
  }
};
