import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { Volatility } from '../../domain/indicator/Volatility.js';

/**
 * 取引時間帯の図。
 *
 * 為替は 24 時間動くが、参加者は時間帯で入れ替わる。
 * 「同じ通貨ペアでも時間帯で性格が変わる」ことを 1 枚で見せる。
 */
export const sessionFigures = {
  'session-range': ({ repository }) => {
    const series = repository.find('session-range');
    const perBar = series.timeFrame.minutes;
    const barsPerHour = 60 / perBar;
    const at = (hours) => Math.min(series.length - 1, Math.round(hours * barsPerHour));

    return new FigureSpecBuilder('session-range')
      .title('時間帯で値動きの性格が変わる（15 分足・時刻は日本時間）')
      .candles(series)
      .height(220)
      .zone(0, at(7), { label: '東京', fill: 'accent3', opacity: 0.1 })
      .zone(at(7) + 1, at(16), { label: 'ロンドン', fill: 'accent', opacity: 0.1 })
      .zone(at(13), series.length - 1, { label: 'ニューヨーク', fill: 'warn', opacity: 0.08 })
      .pane((p) => p
        .title('ATR(14) — 1 本あたりの平均的な値幅')
        .height(78)
        .line(Volatility.atr(series, 14), { color: 'warn' }))
      .caption(
        '東京時間は値幅が出にくく、ロンドンが開くと広がり、ニューヨークと重なる時間帯が最も動く。'
        + '同じ手法でも、狙う時間帯を変えるだけで損切り幅の妥当性が変わる。'
      ).build();
  }
};
