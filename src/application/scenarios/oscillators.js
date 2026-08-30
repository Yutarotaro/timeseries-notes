import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Oscillator } from '../../domain/indicator/Oscillator.js';
import { Momentum } from '../../domain/indicator/Momentum.js';
import { SwingDetector } from '../../domain/analysis/SwingDetector.js';

/** オシレーター系のうち、RSI・ストキャス以外と、比較の図。 */
export const oscillatorFigures = {
  'oscillator-overlap': ({ repository }) => {
    const series = repository.find('oscillator-compare');
    const closes = series.closes();

    // どれも「今の価格を少し前と比べる」計算なので、正規化の仕方が違うだけで形は揃う
    return new FigureSpecBuilder('oscillator-overlap')
      .title('4 つ並べても、見ているものはほぼ同じ')
      .candles(series)
      .height(180)
      .pane((p) => p.title('RSI(14)').height(64).range(0, 100)
        .line(Oscillator.rsi(closes, 14), { color: 'accent' })
        .level(50, { label: '50', color: 'muted', dash: '2 4' }))
      .pane((p) => p.title('Williams %R(14)').height(64).range(-100, 0)
        .line(Momentum.williamsR(series, 14), { color: 'accent2' })
        .level(-50, { label: '-50', color: 'muted', dash: '2 4' }))
      .pane((p) => p.title('CCI(20)').height(64)
        .line(Momentum.cci(series, 20), { color: 'warn' })
        .level(0, { label: '0', color: 'muted', dash: '2 4' }))
      .pane((p) => p.title('RCI(9)').height(64).range(-100, 100)
        .line(Momentum.rci(closes, 9), { color: 'accent3' })
        .level(0, { label: '0', color: 'muted', dash: '2 4' }))
      .caption(
        '山と谷の位置がほとんど揃っている。指標を 4 つ確認しても、'
        + '実際には同じ情報を 4 回数えているだけで、確信だけが増える。'
        + '組み合わせるなら、性格の違うもの（トレンド系とオシレーター系、価格と出来高）を選ぶ。'
      ).build();
  },

  'oscillator-parts': ({ repository }) => {
    const series = repository.find('oscillator-compare');
    const closes = series.closes();

    return new FigureSpecBuilder('oscillator-parts')
      .title('乖離率と ROC — 何と比べているかの違い')
      .candles(series)
      .height(180)
      .pane((p) => p.title('乖離率(25) — 移動平均と比べる').height(72)
        .line(Momentum.disparity(closes, 25), { color: 'accent' })
        .level(0, { label: '0', color: 'muted', dash: '2 4' }))
      .pane((p) => p.title('ROC(10) — 10 本前の価格と比べる').height(72)
        .line(Momentum.rateOfChange(closes, 10), { color: 'warn' })
        .level(0, { label: '0', color: 'muted', dash: '2 4' }))
      .caption(
        '乖離率は「平均からどれだけ離れたか」、ROC は「少し前から何％動いたか」。'
        + '前者は水準、後者は速度を見ている。同じ上昇でも、'
        + '平均が追いついてくれば乖離率は縮み、ROC は伸びたままになる。'
      ).build();
  },

  'hidden-divergence': ({ repository }) => {
    const series = repository.find('hidden-divergence');
    const rsi = Oscillator.rsi(series.closes(), 14);
    const hidden = SwingDetector.divergences(series, rsi, { lookback: 3 })
      .filter((d) => d.hidden && d.kind === 'bullish')
      .slice(-1);

    const b = new FigureSpecBuilder('hidden-divergence')
      .title('隠れダイバージェンス — 継続を示す側')
      .candles(series)
      .height(230);

    b.pane((p) => {
      p.title('RSI(14)').height(90).range(0, 100)
        .line(rsi, { color: 'accent' })
        .level(50, { label: '50', color: 'muted', dash: '2 4' });
      hidden.forEach((d) => {
        p.segment([d.from.index, d.indicatorFrom], [d.to.index, d.indicatorTo], { color: 'up' })
          .note([(d.from.index + d.to.index) / 2, Math.max(d.indicatorFrom, d.indicatorTo)],
            'RSI は切り下げ', { dy: -8, color: 'up' });
      });
      return p;
    });

    hidden.forEach((d) => {
      b.segment([d.from.index, d.from.price], [d.to.index, d.to.price], { color: 'up' })
        .note([(d.from.index + d.to.index) / 2, Math.min(d.from.price, d.to.price)],
          '安値は切り上げ', { dy: 20, color: 'up' });
    });

    return b.caption(
      hidden.length
        ? '価格の安値は切り上がっている（＝上昇トレンドは崩れていない）のに、'
          + 'RSI の谷は前より深い。押しが速かっただけで、構造は壊れていない、という読み方をする。'
          + '通常のダイバージェンスが反転側なのに対して、これは継続側のサイン。'
        : 'この系列では隠れダイバージェンスは検出されなかった。'
    ).build();
  }
};
