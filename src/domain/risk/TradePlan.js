/**
 * 建てる前に決めておくもの一式。値オブジェクト。
 *
 * エントリー・損切り・利確の 3 つが揃って初めて「計画」であり、
 * リスクリワードはそこから導出される。逆に、含み損が出てから
 * 損切りを動かすのは計画の変更＝別の TradePlan になる。
 */
export class TradePlan {
  #instrument; #side; #entry; #stopLoss; #takeProfit;

  constructor({ instrument, side, entry, stopLoss, takeProfit }) {
    if (side !== 'long' && side !== 'short') throw new RangeError('TradePlan: side は long か short');
    if (side === 'long' && !(stopLoss < entry && takeProfit > entry)) {
      throw new RangeError('TradePlan: 買いなら 損切り < エントリー < 利確');
    }
    if (side === 'short' && !(stopLoss > entry && takeProfit < entry)) {
      throw new RangeError('TradePlan: 売りなら 利確 < エントリー < 損切り');
    }
    this.#instrument = instrument;
    this.#side = side;
    this.#entry = entry;
    this.#stopLoss = stopLoss;
    this.#takeProfit = takeProfit;
    Object.freeze(this);
  }

  get instrument() { return this.#instrument; }
  get side() { return this.#side; }
  get entry() { return this.#entry; }
  get stopLoss() { return this.#stopLoss; }
  get takeProfit() { return this.#takeProfit; }

  get riskPips() { return Math.abs(this.#instrument.toPips(this.#entry - this.#stopLoss)); }
  get rewardPips() { return Math.abs(this.#instrument.toPips(this.#takeProfit - this.#entry)); }

  /** リスクリワード比。1 を割るなら、勝率でそのぶんを取り返す必要がある。 */
  get riskRewardRatio() { return this.rewardPips / this.riskPips; }

  /** この計画が損益ゼロになる勝率。これを超えられないなら期待値は負。 */
  get breakEvenWinRate() { return 1 / (1 + this.riskRewardRatio); }
}
