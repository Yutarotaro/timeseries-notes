import { Candle } from './Candle.js';

/**
 * ローソク足の時系列。集約ルート。
 *
 * 「どの銘柄の、どの時間足か」を持たない足の並びはドメイン上意味がない
 * （USD/JPY の 145 と EUR/USD の 1.09 を同じ配列に入れられてしまう）ので、
 * Instrument と TimeFrame を必ず伴わせる。
 */
export class CandleSeries {
  #instrument; #timeFrame; #candles;

  constructor(instrument, timeFrame, candles) {
    if (!Array.isArray(candles) || candles.length === 0) {
      throw new RangeError('CandleSeries: 空の系列は作れない');
    }
    this.#instrument = instrument;
    this.#timeFrame = timeFrame;
    this.#candles = Object.freeze(candles.map((c, i) =>
      c instanceof Candle ? c.withIndex(i) : new Candle({ ...c, index: i })
    ));
    Object.freeze(this);
  }

  static fromOhlc(instrument, timeFrame, rows) {
    return new CandleSeries(instrument, timeFrame, rows.map((r, i) => new Candle({
      open: r.o ?? r.open, high: r.h ?? r.high, low: r.l ?? r.low, close: r.c ?? r.close, index: i
    })));
  }

  get instrument() { return this.#instrument; }
  get timeFrame() { return this.#timeFrame; }
  get candles() { return this.#candles; }
  get length() { return this.#candles.length; }

  at(i) { return this.#candles[i]; }
  get last() { return this.#candles[this.#candles.length - 1]; }

  /* 投影 — 指標は「終値の列」「高値の列」しか要らないことが多い */
  closes() { return this.#candles.map((c) => c.close); }
  highs() { return this.#candles.map((c) => c.high); }
  lows() { return this.#candles.map((c) => c.low); }
  typicalPrices() { return this.#candles.map((c) => (c.high + c.low + c.close) / 3); }

  highest() { return Math.max(...this.highs()); }
  lowest() { return Math.min(...this.lows()); }

  slice(from, to) {
    return new CandleSeries(this.#instrument, this.#timeFrame, this.#candles.slice(from, to));
  }

  /**
   * 下位足を上位足に束ねる。マルチタイムフレーム分析の土台。
   * 端数の足は捨てる（未確定の足を確定足と混ぜないため）。
   */
  aggregateTo(higherTimeFrame) {
    if (!higherTimeFrame.isHigherThan(this.#timeFrame)) {
      throw new RangeError('aggregateTo: 上位足を指定すること');
    }
    const size = Math.round(higherTimeFrame.ratioTo(this.#timeFrame));
    const out = [];
    for (let i = 0; i + size <= this.#candles.length; i += size) {
      const chunk = this.#candles.slice(i, i + size);
      out.push(new Candle({
        open: chunk[0].open,
        high: Math.max(...chunk.map((c) => c.high)),
        low: Math.min(...chunk.map((c) => c.low)),
        close: chunk[chunk.length - 1].close,
        index: out.length
      }));
    }
    return new CandleSeries(this.#instrument, higherTimeFrame, out);
  }
}
