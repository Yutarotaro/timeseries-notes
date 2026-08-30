/**
 * 銘柄（通貨ペア）。値オブジェクト。
 *
 * ユビキタス言語:
 *   pip   — その銘柄で「1 目盛り」とみなす値幅。クロス円は 0.01、それ以外は 0.0001。
 *   digits— 表示上の小数桁数。
 *
 * 値幅を pips で語れるのは銘柄を知っているときだけなので、pip の定義は
 * 銘柄に属させる。ここを緩めると「30 の損切り」が何の 30 か分からなくなる。
 */
export class Instrument {
  #symbol;
  #pipSize;
  #digits;

  constructor(symbol, pipSize, digits) {
    if (!symbol) throw new TypeError('Instrument: symbol は必須');
    if (!(pipSize > 0)) throw new RangeError('Instrument: pipSize は正の数');
    this.#symbol = symbol;
    this.#pipSize = pipSize;
    this.#digits = digits;
    Object.freeze(this);
  }

  get symbol() { return this.#symbol; }
  get pipSize() { return this.#pipSize; }
  get digits() { return this.#digits; }

  /** 価格差（絶対値ではなく符号つき）を pips に換算する。 */
  toPips(priceDelta) { return priceDelta / this.#pipSize; }

  /** pips を価格差に戻す。 */
  fromPips(pips) { return pips * this.#pipSize; }

  format(price) { return price.toFixed(this.#digits); }

  equals(other) { return other instanceof Instrument && other.symbol === this.#symbol; }

  static USDJPY = new Instrument('USD/JPY', 0.01, 3);
  static EURUSD = new Instrument('EUR/USD', 0.0001, 5);
  static GBPJPY = new Instrument('GBP/JPY', 0.01, 3);
}
