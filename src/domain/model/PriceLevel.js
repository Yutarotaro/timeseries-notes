/**
 * 価格の水準（サポート／レジスタンス）。値オブジェクト。
 *
 * 水平線を「ただの数値」で持つと、何回反応したのか・どちら側だったのかが
 * 失われる。水準の強さは反応回数で語るのがドメインの流儀なので束ねて持つ。
 */
export class PriceLevel {
  #price; #kind; #touches;

  constructor(price, kind, touches = 1) {
    if (kind !== 'support' && kind !== 'resistance') {
      throw new RangeError('PriceLevel: kind は support か resistance');
    }
    this.#price = price; this.#kind = kind; this.#touches = touches;
    Object.freeze(this);
  }

  get price() { return this.#price; }
  get kind() { return this.#kind; }
  get touches() { return this.#touches; }
  get isSupport() { return this.#kind === 'support'; }

  /** 抜けたあとに役割が入れ替わる（ロールリバーサル）。 */
  flipped() {
    return new PriceLevel(this.#price, this.isSupport ? 'resistance' : 'support', this.#touches);
  }

  touchedAgain() { return new PriceLevel(this.#price, this.#kind, this.#touches + 1); }

  /** その足がこの水準に触れたか。許容幅は呼び出し側の判断に委ねる。 */
  isTouchedBy(candle, tolerance = 0) {
    return candle.low - tolerance <= this.#price && this.#price <= candle.high + tolerance;
  }
}
