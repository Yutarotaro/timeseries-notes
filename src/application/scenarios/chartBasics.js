import { FigureSpecBuilder } from '../figure/FigureSpec.js';

/**
 * チャートそのものの説明。
 * 同じデータを 3 通りに描いて、何が落ちるかを見せる。
 */
export const chartBasicsFigures = {
  'chart-line': ({ repository }) => new FigureSpecBuilder('chart-line')
    .title('ラインチャート — 終値だけを結ぶ')
    .candles(repository.find('trend-structure'))
    .priceStyle('line')
    .height(180)
    .caption('大きな流れは掴みやすいが、その足の中で往復した跡は完全に落ちる。')
    .build(),

  'chart-bar': ({ repository }) => new FigureSpecBuilder('chart-bar')
    .title('バーチャート — 欧米で標準の形')
    .candles(repository.find('trend-structure'))
    .priceStyle('bar')
    .height(180)
    .caption('左の突起が始値、右が終値。情報量はローソク足と同じで、見た目の密度が低い。')
    .build(),

  'chart-candle': ({ repository }) => new FigureSpecBuilder('chart-candle')
    .title('ローソク足 — 始値と終値の関係を面で見せる')
    .candles(repository.find('trend-structure'))
    .height(180)
    .caption(
      '実体の色と大きさが一目で入ってくる。江戸期の米相場で使われていた形式で、'
      + '欧米に紹介されたのは 1990 年前後。情報は同じでも、読み取りの速さが違う。'
    ).build()
};
