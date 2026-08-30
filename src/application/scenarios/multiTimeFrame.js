import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { TimeFrame } from '../../domain/model/TimeFrame.js';
import { MovingAverage } from '../../domain/indicator/MovingAverage.js';

/**
 * マルチタイムフレームの図。
 *
 * 上位足は下位足を集約して作る（CandleSeries#aggregateTo）。
 * 別々のデータを並べると「同じ相場を違う解像度で見ている」ことが伝わらない。
 */
export const multiTimeFrameFigures = {
  'mtf-lower': ({ repository }) => {
    const series = repository.find('mtf-lower');
    return new FigureSpecBuilder('mtf-lower')
      .title(`下位足（${series.timeFrame.label}）— 上下に振られて見える`)
      .candles(series)
      .height(200)
      .line(MovingAverage.exponential(series.closes(), 20), { color: 'accent', label: 'EMA20' })
      .caption('同じ値動きを 15 分足で見ると、押し戻しのたびに方向が変わったように見える。')
      .build();
  },

  'mtf-higher': ({ repository }) => {
    const lower = repository.find('mtf-lower');
    const higher = lower.aggregateTo(TimeFrame.H4);
    return new FigureSpecBuilder('mtf-higher')
      .title(`上位足（${higher.timeFrame.label}）— 同じ期間を束ねたもの`)
      .candles(higher)
      .height(200)
      .line(MovingAverage.exponential(higher.closes(), 20), { color: 'accent', label: 'EMA20' })
      .caption(
        `${lower.length} 本の${lower.timeFrame.label}を、${higher.length} 本の${higher.timeFrame.label}に束ねた。`
        + '同じデータだが、下位足のノイズは実体とヒゲに畳み込まれて消える。'
        + '上位足の方向に逆らわない、というのはこの畳み込みの向きに従うということ。'
      ).build();
  }
};
