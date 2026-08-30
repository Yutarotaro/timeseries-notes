/**
 * ローソク足 1 本。値オブジェクト（不変）。
 *
 * 「実体」「上ヒゲ」「下ヒゲ」「陽線／陰線」はすべてドメインの語彙で、
 * 描画の都合ではない。だから描画側ではなくここに置く。
 */
export class Candle {
  #open; #high; #low; #close; #index;

  constructor({ open, high, low, close, index = 0 }) {
    // 不変条件: 高値は始値・終値・安値のどれよりも低くならない。
    // 壊れたデータを黙って直すとチャートが「それらしく」表示されてしまい、
    // 供給側の壊れに気づけなくなる。ここでは落とす。
    if (![open, high, low, close].every(Number.isFinite)) {
      throw new TypeError(`Candle[${index}]: OHLC に非数が混じっている`);
    }
    if (high < Math.max(open, close) || low > Math.min(open, close) || high < low) {
      throw new RangeError(`Candle[${index}]: OHLC の大小関係が壊れている`);
    }
    this.#open = open; this.#high = high; this.#low = low; this.#close = close;
    this.#index = index;
    Object.freeze(this);
  }

  get open() { return this.#open; }
  get high() { return this.#high; }
  get low() { return this.#low; }
  get close() { return this.#close; }
  get index() { return this.#index; }

  get isBullish() { return this.#close > this.#open; }   // 陽線
  get isBearish() { return this.#close < this.#open; }   // 陰線

  get bodyTop() { return Math.max(this.#open, this.#close); }
  get bodyBottom() { return Math.min(this.#open, this.#close); }
  get bodyHeight() { return this.bodyTop - this.bodyBottom; }
  get range() { return this.#high - this.#low; }         // 全体の値幅
  get upperWick() { return this.#high - this.bodyTop; }
  get lowerWick() { return this.bodyBottom - this.#low; }

  /** 実体が全体の何割か。小さいほど迷いのある足。 */
  get bodyRatio() { return this.range === 0 ? 0 : this.bodyHeight / this.range; }

  /** 十字線（同時線）: 実体がほとんどない。 */
  isDoji(threshold = 0.1) { return this.bodyRatio <= threshold; }

  /** ピンバー: 片側のヒゲが実体より大幅に長く、逆側のヒゲが短い。 */
  isPinBar(minWickRatio = 0.6) {
    const upper = this.range === 0 ? 0 : this.upperWick / this.range;
    const lower = this.range === 0 ? 0 : this.lowerWick / this.range;
    if (upper >= minWickRatio && lower < 0.25) return 'upper'; // 上ヒゲピンバー
    if (lower >= minWickRatio && upper < 0.25) return 'lower'; // 下ヒゲピンバー
    return null;
  }

  /** 包み足: 自分の実体が相手の実体を完全に飲み込み、向きが逆。 */
  engulfs(previous) {
    return this.bodyTop >= previous.bodyTop
      && this.bodyBottom <= previous.bodyBottom
      && this.isBullish !== previous.isBullish
      && this.bodyHeight > previous.bodyHeight;
  }

  /** はらみ足: 相手の実体の内側に自分が収まる。 */
  isHaramiOf(previous) {
    return this.bodyTop <= previous.bodyTop && this.bodyBottom >= previous.bodyBottom;
  }

  withIndex(index) {
    return new Candle({ open: this.#open, high: this.#high, low: this.#low, close: this.#close, index });
  }
}
