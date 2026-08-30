import { FigureSpecBuilder } from '../figure/FigureSpec.js';

/**
 * ローソク足そのものを説明する図。
 *
 * 図の中で使う「実体」「ヒゲ」の値は Candle の getter から取る。
 * 座標をベタ書きすると、データを変えた瞬間に注釈だけ嘘になる。
 */
export const candlestickFigures = {
  'candle-anatomy': ({ repository }) => {
    const series = repository.find('candle-anatomy');
    const last = series.length - 1;
    const target = series.at(last);
    // 足の本数より広く取って右に余白を作る。注釈の水平線が他の足を
    // 横切らずに済み、どの足の話なのかが一目で分かる。
    const b = new FigureSpecBuilder('candle-anatomy')
      .title('ローソク足 1 本が持っている情報')
      .candles(series)
      .height(230)
      .xCount(series.length + 6)
      .yPad(0.16);

    b.zone(last, last, { fill: 'accent', opacity: 0.1 });

    // 注釈は語だけに留める。長い説明を図に入れると価格軸まで届いて重なる
    const annotate = (price, label, color) => {
      b.arrow([last + 2.4, price], [last + 0.45, price], { color })
        .note([last + 2.7, price], label, { anchor: 'start', dy: 3.5, color: 'text' });
    };
    annotate(target.high, '高値', 'accent');
    annotate((target.high + target.bodyTop) / 2, '上ヒゲ', 'accent2');
    annotate((target.bodyTop + target.bodyBottom) / 2, '実体', 'up');
    annotate(target.bodyBottom - target.lowerWick / 2, '下ヒゲ', 'accent2');
    annotate(target.low, '安値', 'accent');

    return b.caption(
      '実体は始値から終値まで、ヒゲはそこまで伸びたが戻された跡。'
      + `陽線（終値 > 始値）は買いが押し切った足で、陰線はその逆。`
      + `この足の実体は全体の ${Math.round(target.bodyRatio * 100)}% しかなく、残りは往復に使われている。`
    ).build();
  },

  'candle-patterns': ({ repository }) => {
    const series = repository.find('candle-patterns');
    const b = new FigureSpecBuilder('candle-patterns')
      .title('覚える価値のある 3 つの形')
      .candles(series)
      .height(240)
      .yPad(0.18);

    // 判定はドメインの述語に任せる。図と本文の食い違いが起きない。
    const engulf = series.at(4);
    if (engulf.engulfs(series.at(3))) {
      b.zone(3, 4, { label: '包み足', fill: 'up', opacity: 0.14 })
        .note([4, series.at(4).low], '前の足の実体を丸ごと飲み込む', { dy: 22, color: 'text' });
    }
    const pin = series.at(9);
    if (pin.isPinBar()) {
      b.zone(9, 9, { label: 'ピンバー', fill: 'accent', opacity: 0.16 })
        .note([9.4, pin.low], '長いヒゲ＝跳ね返された側', { dy: 16, anchor: 'start' });
    }
    if (series.at(15).isHaramiOf(series.at(14))) {
      b.zone(14, 15, { label: 'はらみ足', fill: 'muted', opacity: 0.18 })
        .note([15, series.at(14).high], '値幅が縮む＝方向感が消えた', { dy: -12 });
    }
    if (series.at(19).isPinBar()) {
      // 高値が図の上端に近く、別行の注釈を足すとゾーンの札と重なるので札に含める
      b.zone(19, 19, { label: 'ピンバー（上ヒゲ）', fill: 'accent', opacity: 0.16 });
    }

    return b.caption(
      '形そのものに意味があるのではなく、「どこで出たか」で意味が決まる。'
      + 'レンジの真ん中のピンバーはただのノイズで、効いている水準で出たときだけ話が変わる。'
    ).build();
  }
};
