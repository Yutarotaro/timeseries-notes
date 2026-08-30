/**
 * ピボットポイント。
 *
 * 前の期間（前日・前週）の高値・安値・終値だけで、その日の目安になる
 * 水準を機械的に出す。誰が計算しても同じ数字になるのが利点で、
 * 「みんなが同じ線を見ている」という理由で効くタイプの水準。
 *
 * 計算に使うのは確定した前期間だけ。当日の値を混ぜると、
 * その日のうちは確定しない線になり、後から見たときだけ当たって見える。
 */
export const Pivot = {
  /** 標準式（クラシック） */
  classic({ high, low, close }) {
    const pivot = (high + low + close) / 3;
    const range = high - low;
    return {
      pivot,
      resistance: [
        2 * pivot - low,
        pivot + range,
        high + 2 * (pivot - low)
      ],
      support: [
        2 * pivot - high,
        pivot - range,
        low - 2 * (high - pivot)
      ]
    };
  },

  /** フィボナッチ式。値幅への掛け率をフィボナッチ比に置き換えただけ。 */
  fibonacci({ high, low, close }) {
    const pivot = (high + low + close) / 3;
    const range = high - low;
    const ratios = [0.382, 0.618, 1];
    return {
      pivot,
      resistance: ratios.map((r) => pivot + range * r),
      support: ratios.map((r) => pivot - range * r)
    };
  },

  /** 系列の一部（前日ぶんなど）から入力を作る。 */
  fromRange(series, from, to) {
    const window = series.candles.slice(from, to + 1);
    if (!window.length) throw new RangeError('Pivot: 範囲が空');
    return {
      high: Math.max(...window.map((c) => c.high)),
      low: Math.min(...window.map((c) => c.low)),
      close: window[window.length - 1].close
    };
  }
};
