import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { MovingAverage } from '../../domain/indicator/MovingAverage.js';
import { CurrencyStrength } from '../../domain/analysis/CurrencyStrength.js';

/** 市場の状態を測る図（出来高・通貨強弱）。 */
export const marketFigures = {
  'volume-breakout': ({ repository }) => {
    const series = repository.find('volume-spike');
    const volumes = series.volumes();
    const average = MovingAverage.simple(volumes, 20);

    const b = new FigureSpecBuilder('volume-breakout')
      .title('出来高の裏付けがあるブレイク')
      .candles(series)
      .height(220);

    // 平均の 2 倍を超えた足を目立たせる
    const spikes = volumes
      .map((v, i) => ({ i, v, mean: average.at(i) }))
      .filter(({ v, mean }) => mean != null && v > mean * 2)
      .map(({ i }) => i);
    if (spikes.length) {
      b.zone(spikes[0], spikes[spikes.length - 1], { label: '出来高急増', fill: 'accent', opacity: 0.12 });
    }

    return b.pane((p) => p
      .title('tick volume と 20 本平均').height(80)
      .histogram(volumes, { color: 'muted', signed: false })
      .line(average, { color: 'warn' }))
      .caption(
        'FX に出回る「出来高」は約定金額ではなく tick volume（値が動いた回数）で、'
        + '業者ごとに数字が違う。絶対値に意味はないが、'
        + '「普段より多いか」という相対比較なら使える。'
        + 'レンジを抜けた足に出来高が伴っていなければ、参加者が増えていないブレイク＝戻されやすい。'
      ).build();
  },

  'currency-strength': ({ repository }) => {
    const pairs = ['strength-usdjpy', 'strength-eurusd', 'strength-gbpjpy'].map((id) => repository.find(id));
    const strength = CurrencyStrength.series(pairs, 20);
    const ranking = CurrencyStrength.rank(pairs, 20);

    const colors = { USD: 'accent', JPY: 'down', EUR: 'warn', GBP: 'accent3' };
    const b = new FigureSpecBuilder('currency-strength')
      .title('通貨強弱 — ペアを通貨に分解する')
      .candles(pairs[0])
      .height(170)
      .line(MovingAverage.simple(pairs[0].closes(), 20), { color: 'muted', label: 'USD/JPY の SMA20' });

    b.pane((p) => {
      p.title('20 本前からの騰落を通貨ごとに集計（％）').height(120);
      [...strength.entries()].forEach(([currency, values]) => {
        p.line(values, { color: colors[currency] ?? 'muted', label: currency });
      });
      p.level(0, { label: '0', color: 'muted', dash: '2 4' });
      return p;
    });

    return b.caption(
      `USD/JPY が上がったとき、ドルが強いのか円が弱いのかは、そのペアだけでは分からない。`
      + `複数のペアに同じ計算をして通貨ごとに配ると分解できる。`
      + `この 3 ペアでの順位は ${ranking.map((r) => `${r.currency} ${r.strength >= 0 ? '+' : ''}${r.strength.toFixed(2)}`).join(' / ')}。`
      + `強い通貨を買い、弱い通貨を売るペアを選ぶ、という使い方をする。`
      + `ただしペアの組み合わせが偏れば結果も偏るので、順位の入れ替わり程度に読む。`
    ).build();
  }
};
