import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Directional } from '../../domain/indicator/Directional.js';
import { Parabolic } from '../../domain/indicator/Parabolic.js';
import { Volatility } from '../../domain/indicator/Volatility.js';
import { Vwap } from '../../domain/indicator/Vwap.js';

/** 移動平均・MACD 以外のトレンド系指標。 */
export const trendIndicatorFigures = {
  'dmi-adx': ({ repository }) => {
    const series = repository.find('dmi');
    const { plusDi, minusDi, adx } = Directional.compute(series, 14);

    // ADX が閾値を超えている＝方向が出ている区間を塗る
    const b = new FigureSpecBuilder('dmi-adx')
      .title('ADX は「方向が出ているか」だけを答える')
      .candles(series)
      .height(210);

    let start = null;
    let labelled = false;
    adx.values.forEach((v, i) => {
      const trending = v != null && v >= 25;
      if (trending && start == null) start = i;
      if (!trending && start != null) {
        if (i - start >= 6) {
          b.zone(start, i - 1, { label: labelled ? null : 'ADX 25 超', fill: 'accent', opacity: 0.09 });
          labelled = true;
        }
        start = null;
      }
    });
    if (start != null) b.zone(start, adx.length - 1, { label: labelled ? null : 'ADX 25 超', fill: 'accent', opacity: 0.09 });

    return b.pane((p) => p
      .title('DMI(14) / ADX(14)').height(100).range(0, 60)
      .line(plusDi, { color: 'up' })
      .line(minusDi, { color: 'down' })
      .line(adx, { color: 'accent', dash: '4 3' })
      .level(25, { label: '25', color: 'muted' }))
      .caption(
        '+DI（緑）が -DI（赤）より上なら買い優勢、逆なら売り優勢。ADX（点線）は向きを持たず、'
        + '上下どちらであれ「動いている」ほど上がる。ADX が低い区間で順張り指標を使っても、'
        + 'そもそも乗る流れがない。方向を決める前に、方向が出ているかを見る指標。'
      ).build();
  },

  'parabolic-sar': ({ repository }) => {
    const series = repository.find('parabolic');
    const sar = Parabolic.compute(series, { step: 0.02, max: 0.2 });

    const b = new FigureSpecBuilder('parabolic-sar')
      .title('パラボリック SAR — 損切り位置を機械的に引き上げる')
      .candles(series)
      .height(240)
      .digits(4);

    // 線ではなく点で打つ。連続した線に見えると「支持線」と誤解されやすい
    sar.values.forEach((v, i) => {
      if (v == null) return;
      b.marker([i, v], 'dot', { color: v > series.at(i).close ? 'down' : 'up' });
    });

    return b.caption(
      '点が価格の下にある間は買い持ち、上に移ったら手仕舞って売りに回る、という設計。'
      + '加速係数が 0.02 ずつ増えるので、伸びるほど点が速く追いかけてくる。'
      + 'レンジでは上下に付け替わり続け、損切りだけが並ぶ。トレンドが出ている前提の道具。'
    ).build();
  },

  'envelope': ({ repository }) => {
    const series = repository.find('bollinger-squeeze');
    const closes = series.closes();
    const env = Volatility.envelope(closes, { period: 25, percent: 0.5 });
    const band = Volatility.bollinger(closes, { period: 25, k: 2 });

    return new FigureSpecBuilder('envelope')
      .title('エンベロープとボリンジャーの違いは「幅が動くか」')
      .candles(series)
      .height(250)
      .band(env.upper, env.lower, { fill: 'warn', opacity: 0.08 })
      .line(env.upper, { color: 'warn', dash: '4 3', label: 'エンベロープ ±0.5%' })
      .line(env.lower, { color: 'warn', dash: '4 3', label: null })
      .line(band.upper, { color: 'accent', dash: '2 3', label: 'ボリンジャー ±2σ' })
      .line(band.lower, { color: 'accent', dash: '2 3', label: null })
      .caption(
        'エンベロープは常に同じ％だけ離れている。静かな相場では遠すぎて触れず、'
        + '荒れた相場では近すぎて何度も抜ける。ボリンジャーはばらつきに応じて伸縮するので、'
        + '「行き過ぎ」の基準としてはこちらのほうが素直。'
      ).build();
  },

  'vwap': ({ repository }) => {
    const series = repository.find('session-range');
    const barsPerDay = (24 * 60) / series.timeFrame.minutes;
    const anchor = 0;
    const vwap = Vwap.compute(series, [anchor]);

    return new FigureSpecBuilder('vwap')
      .title('VWAP — その区間に入った人たちの平均コスト')
      .candles(series)
      .height(230)
      .line(vwap, { color: 'accent', label: 'VWAP（起点から通し）' })
      .pane((p) => p
        .title('出来高（tick volume）')
        .height(70)
        .histogram(series.volumes(), { color: 'muted', signed: false }))
      .caption(
        `終値ではなく高安終の平均を、出来高で重みづけして積み上げる。移動平均と違って`
        + `起点を決めないと値が決まらない — 起点からの累積だからだ。`
        + `株なら寄り付きが自然な起点になるが、24 時間動く為替では「どこから数えるか」を`
        + `人が決める（この図は先頭から通し、1 日は ${barsPerDay} 本）。`
      ).build();
  }
};
