import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Macd } from '../../domain/indicator/Macd.js';
import { Oscillator } from '../../domain/indicator/Oscillator.js';
import { MovingAverage } from '../../domain/indicator/MovingAverage.js';
import { SwingDetector } from '../../domain/analysis/SwingDetector.js';

/** オシレーター系の図。 */
export const momentumFigures = {
  'macd-basic': ({ repository }) => {
    const series = repository.find('macd-basic');
    const closes = series.closes();
    const { macd, signal, histogram } = Macd.compute(closes);

    return new FigureSpecBuilder('macd-basic')
      .title('MACD — 2 本の EMA の距離を見る')
      .candles(series)
      .height(210)
      .digits(4)
      .line(MovingAverage.exponential(closes, 12), { color: 'accent', label: 'EMA12' })
      .line(MovingAverage.exponential(closes, 26), { color: 'accent2', label: 'EMA26' })
      .pane((p) => p
        .title('MACD(12,26,9)')
        .height(96)
        .histogram(histogram, { color: 'muted' })
        .line(macd, { color: 'accent' })
        .line(signal, { color: 'warn', dash: '4 3' })
        .level(0, { label: '0', color: 'muted', dash: '3 3' }))
      .caption(
        'MACD 線は EMA12 と EMA26 の差そのもの。上のチャートで 2 本が開けば MACD は上に伸び、'
        + '近づけば 0 に戻る。ヒストグラムはさらにその差なので、反応は速いが騙しも多い。'
      ).build();
  },

  'rsi-divergence': ({ repository }) => {
    const series = repository.find('rsi-divergence');
    const rsi = Oscillator.rsi(series.closes(), 14);
    // 検出は複数出るが、図に全部描くと線が重なって読めない。直近の 1 件だけ示す。
    const divergences = SwingDetector.divergences(series, rsi, { lookback: 3 })
      .filter((d) => d.kind === 'bearish')
      .slice(-1);

    const b = new FigureSpecBuilder('rsi-divergence')
      .title('ダイバージェンス — 価格は更新、勢いは更新できず')
      .candles(series)
      .height(230)
      .pane((p) => {
        p.title('RSI(14)').height(96).range(0, 100)
          .zone(70, 100, { fill: 'down', opacity: 0.1 })
          .zone(0, 30, { fill: 'up', opacity: 0.1 })
          .line(rsi, { color: 'accent' })
          .level(70, { label: '70', color: 'muted' })
          .level(30, { label: '30', color: 'muted' });
        divergences.forEach((d) => {
          p.segment([d.from.index, d.indicatorFrom], [d.to.index, d.indicatorTo], { color: 'danger' });
        });
        return p;
      });

    divergences.forEach((d) => {
      b.segment([d.from.index, d.from.price], [d.to.index, d.to.price], { color: 'danger' })
        .note([(d.from.index + d.to.index) / 2, Math.max(d.from.price, d.to.price)],
          '高値は切り上げ', { dy: -12, color: 'danger' });
    });

    return b.caption(
      divergences.length
        ? '価格の高値は切り上がっているのに RSI の山は切り下がっている。買いの力が細っているサイン。'
          + 'ただし「反転する」ではなく「勢いが落ちた」までしか言っていない点に注意。'
        : 'この系列ではダイバージェンスは検出されなかった。'
    ).build();
  },

  'stochastic-range': ({ repository }) => {
    const series = repository.find('stochastic-range');
    const { k, d } = Oscillator.stochastic(series, { k: 14, d: 3 });

    return new FigureSpecBuilder('stochastic-range')
      .title('ストキャスティクスが機能するのはレンジのとき')
      .candles(series)
      .height(200)
      .digits(4)
      .pane((p) => p
        .title('Stochastic(14,3)').height(96).range(0, 100)
        .zone(80, 100, { fill: 'down', opacity: 0.1 })
        .zone(0, 20, { fill: 'up', opacity: 0.1 })
        .line(k, { color: 'accent' })
        .line(d, { color: 'warn', dash: '4 3' })
        .level(80, { label: '80', color: 'muted' })
        .level(20, { label: '20', color: 'muted' }))
      .caption(
        '上下が決まっている相場では「80 で売り 20 で買い」が噛み合う。'
        + 'ただしトレンドが出ると 80 に張り付いたまま上げ続けるので、同じ使い方をすると轢かれる。'
      ).build();
  }
};
