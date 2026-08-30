import { Instrument } from '../../domain/model/Instrument.js';
import { TimeFrame } from '../../domain/model/TimeFrame.js';

/**
 * 合成系列の仕様。
 *
 * anchors は「この本目でこの価格を通る」という骨格で、そこへノイズを乗せて
 * ローソク足にする。実データを貼るより、説明したい形だけを持つ図が作れる。
 * patches は特定の足を狙った形（ピンバーなど）に差し替えるためのもの。
 *
 * 断っておくと、これは説明用の作り物であって値動きの予測モデルではない。
 */
export const SERIES_SPECS = {
  'candle-anatomy': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 7,
    anchors: [[0, 145.2], [11, 145.9]], volatility: 0.16, wick: 1.0
  },
  'candle-patterns': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 21,
    anchors: [[0, 146.4], [8, 145.6], [13, 145.5], [22, 146.6]], volatility: 0.13
  },
  'trend-structure': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H4, seed: 4,
    anchors: [[0, 143.0], [14, 145.4], [24, 144.5], [40, 147.2], [52, 146.2], [70, 149.4]],
    volatility: 0.10
  },
  'trend-break': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H4, seed: 33,
    anchors: [[0, 148.0], [12, 150.2], [22, 149.3], [34, 151.4], [46, 149.0], [58, 150.4], [72, 146.8]],
    volatility: 0.09
  },
  'support-resistance': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 12,
    anchors: [[0, 148.2], [10, 149.6], [20, 148.4], [30, 149.55], [42, 148.6], [52, 149.62], [62, 150.9], [72, 149.75], [84, 151.6]],
    volatility: 0.08
  },
  'trendline-channel': {
    instrument: Instrument.EURUSD, timeFrame: TimeFrame.H4, seed: 55,
    anchors: [[0, 1.0720], [12, 1.0810], [22, 1.0762], [36, 1.0880], [48, 1.0826], [62, 1.0950], [74, 1.0900]],
    volatility: 0.09
  },
  'moving-average': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 9,
    anchors: [[0, 150.4], [18, 148.9], [30, 149.2], [46, 148.6], [62, 150.3], [82, 152.0], [100, 151.4], [118, 153.6]],
    volatility: 0.10
  },
  'granville': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 63,
    anchors: [[0, 147.0], [16, 148.4], [26, 147.8], [40, 149.6], [52, 148.9], [66, 150.6], [80, 149.4]],
    volatility: 0.10
  },
  'macd-basic': {
    instrument: Instrument.EURUSD, timeFrame: TimeFrame.H1, seed: 88,
    anchors: [[0, 1.0950], [20, 1.0870], [38, 1.0910], [58, 1.0800], [78, 1.0870], [100, 1.1010], [118, 1.0960]],
    volatility: 0.09
  },
  'rsi-divergence': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 101,
    anchors: [[0, 149.0], [18, 151.4], [28, 150.4], [44, 152.1], [56, 151.3], [70, 152.35], [86, 150.2]],
    volatility: 0.075
  },
  'stochastic-range': {
    instrument: Instrument.EURUSD, timeFrame: TimeFrame.M15, seed: 202,
    anchors: [[0, 1.0840], [10, 1.0880], [20, 1.0838], [32, 1.0884], [44, 1.0836], [56, 1.0882], [70, 1.0840], [84, 1.0878]],
    volatility: 0.12
  },
  'bollinger-squeeze': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 31,
    anchors: [[0, 150.0], [14, 150.35], [28, 149.9], [42, 150.2], [56, 150.0], [66, 150.15], [76, 151.4], [92, 153.0], [110, 152.6]],
    volatility: 0.07
  },
  'ichimoku': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H4, seed: 44,
    anchors: [[0, 152.4], [26, 149.6], [48, 150.2], [66, 148.9], [86, 151.4], [110, 153.8], [130, 153.0]],
    volatility: 0.085
  },
  'fibonacci': {
    instrument: Instrument.GBPJPY, timeFrame: TimeFrame.H4, seed: 77,
    anchors: [[0, 182.0], [30, 190.5], [48, 185.2], [70, 193.0]],
    volatility: 0.07
  },
  'atr-stop': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 121,
    anchors: [[0, 147.4], [24, 147.8], [40, 147.5], [56, 148.9], [72, 150.8], [90, 150.2]],
    volatility: 0.10
  },
  'mtf-lower': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.M15, seed: 5,
    anchors: [[0, 149.2], [40, 151.0], [72, 150.1], [120, 152.6], [160, 151.7], [215, 154.0]],
    volatility: 0.10
  },
  'double-top': {
    instrument: Instrument.EURUSD, timeFrame: TimeFrame.H1, seed: 66,
    anchors: [[0, 1.0790], [22, 1.0902], [36, 1.0838], [52, 1.0898], [70, 1.0770]],
    volatility: 0.09
  },
  'head-shoulders': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 90,
    anchors: [[0, 148.0], [14, 150.0], [24, 149.1], [40, 151.6], [52, 149.2], [66, 150.2], [82, 147.6]],
    volatility: 0.085
  },
  'triangle': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 140,
    anchors: [[0, 149.0], [10, 151.2], [20, 149.5], [30, 150.9], [40, 149.9], [50, 150.6], [60, 150.15], [68, 150.45], [80, 152.4]],
    volatility: 0.07
  },
  'risk-reward': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 150,
    anchors: [[0, 149.6], [12, 148.9], [20, 149.1], [30, 148.75], [44, 150.4], [56, 151.2]],
    volatility: 0.09
  },
  'session-range': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.M15, seed: 170,
    anchors: [[0, 150.0], [28, 150.18], [40, 149.92], [56, 150.6], [76, 150.35], [92, 151.3], [110, 151.0]],
    volatility: 0.09
  },
  'overfit-warning': {
    instrument: Instrument.USDJPY, timeFrame: TimeFrame.H1, seed: 999,
    anchors: [[0, 150.0], [30, 150.4], [60, 149.7], [90, 150.5], [120, 150.1]],
    volatility: 0.16
  }
};

/** ピンバーや包み足など、狙った形を作るための上書き。 */
export const SERIES_PATCHES = {
  'candle-patterns': [
    // 3〜4 本目: 陰線を陽線が包む（強気の包み足）
    { index: 3, open: 146.05, close: 145.82, high: 146.12, low: 145.74 },
    { index: 4, open: 145.80, close: 146.16, high: 146.22, low: 145.72 },
    // 9 本目: 下ヒゲピンバー
    { index: 9, open: 145.66, close: 145.72, high: 145.78, low: 145.34 },
    // 14〜15 本目: はらみ足
    { index: 14, open: 145.86, close: 145.52, high: 145.92, low: 145.46 },
    { index: 15, open: 145.62, close: 145.76, high: 145.82, low: 145.58 },
    // 19 本目: 上ヒゲピンバー
    { index: 19, open: 146.30, close: 146.24, high: 146.62, low: 146.18 }
  ],
  'candle-anatomy': [
    // 解説用に、実体・上ヒゲ・下ヒゲがどれも読める大きさの足を 1 本置く
    { index: 11, open: 145.55, close: 145.93, high: 146.15, low: 145.25 }
  ]
};
