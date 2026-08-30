import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Volatility } from '../../domain/indicator/Volatility.js';
import { PositionSizer } from '../../domain/risk/PositionSizer.js';

/** ボラティリティ系の図。 */
export const volatilityFigures = {
  'bollinger-squeeze': ({ repository }) => {
    const series = repository.find('bollinger-squeeze');
    const closes = series.closes();
    const band = Volatility.bollinger(closes, { period: 20, k: 2 });

    const b = new FigureSpecBuilder('bollinger-squeeze')
      .title('スクイーズからエクスパンションへ')
      .candles(series)
      .height(250)
      .band(band.upper, band.lower, { fill: 'accent', opacity: 0.1 })
      .line(band.upper, { color: 'accent', dash: '4 3' })
      .line(band.lower, { color: 'accent', dash: '4 3', label: null })
      .line(band.middle, { color: 'accent2', label: 'SMA20' });

    // バンド幅が細い区間＝スクイーズを機械的に拾う。
    // 1 本だけ閾値を超えて区間が切れることが多いので、近い区間はつなぐ。
    const widths = band.bandWidth.values.filter((v) => v != null);
    const threshold = quantile(widths, 0.32);
    const runs = [];
    let start = null;
    band.bandWidth.values.forEach((w, i) => {
      const narrow = w != null && w <= threshold;
      if (narrow && start == null) start = i;
      if (!narrow && start != null) { runs.push([start, i - 1]); start = null; }
    });
    if (start != null) runs.push([start, band.bandWidth.length - 1]);

    const merged = runs.reduce((acc, run) => {
      const previous = acc[acc.length - 1];
      if (previous && run[0] - previous[1] <= 5) previous[1] = run[1];
      else acc.push([...run]);
      return acc;
    }, []);

    merged
      .filter(([from, to]) => to - from >= 8)
      .forEach(([from, to], index) => {
        // 同じ札を並べると重なって読めないので最初の 1 つだけ
        b.zone(from, to, { label: index === 0 ? 'スクイーズ' : null, fill: 'muted', opacity: 0.16 });
      });

    return b.caption(
      'バンド幅は「直近 20 本のばらつき」そのもの。狭い＝動いていない状態が続いたあとは'
      + '大きく動きやすいが、どちらへ動くかはバンドは何も言っていない。'
      + '±2σ に収まる確率が約 95% というのは、価格が正規分布に従うと仮定した場合の話で、実際の相場は裾が厚い。'
    ).build();
  },

  'atr-stop': ({ repository }) => {
    const series = repository.find('atr-stop');
    const atr = Volatility.atr(series, 14);
    const instrument = series.instrument;
    const lastIndex = series.length - 1;
    const entry = series.at(lastIndex).close;
    const stopDistance = PositionSizer.stopDistanceFromAtr(atr.at(lastIndex), 1.5);

    // これから建てる想定なので、2 本の線は直近側にだけ引く
    const planFrom = Math.floor(series.length * 0.62);
    return new FigureSpecBuilder('atr-stop')
      .title('損切り幅を値動きの大きさに合わせる')
      .candles(series)
      .height(230)
      .level(entry, { label: 'エントリー', color: 'accent', from: planFrom })
      .level(entry - stopDistance, {
        label: `損切り（ATR × 1.5 ＝ ${instrument.toPips(stopDistance).toFixed(1)} pips）`,
        color: 'danger', from: planFrom
      })
      .pane((p) => p.title(`ATR(14) — ${instrument.symbol} の平均的な値幅`).height(80)
        .line(atr, { color: 'warn' }))
      .caption(
        '「10 pips で損切り」を全局面で使うと、荒れている日は誤差で刈られ、'
        + '静かな日は損失が大きすぎる。ATR を基準にすると幅が自動で伸縮する。'
      ).build();
  }
};

function quantile(sorted, q) {
  const values = [...sorted].sort((a, b) => a - b);
  const pos = (values.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return values[base + 1] != null ? values[base] + rest * (values[base + 1] - values[base]) : values[base];
}
