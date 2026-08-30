/**
 * 1 トレードで許容する損失。値オブジェクト。
 *
 * 「口座の何 % までなら失っても続けられるか」を先に決める。
 * これを決めずにロットを決めると、順番が逆になって破産確率が跳ね上がる。
 */
export class RiskParameters {
  #balance; #riskRatio;

  constructor({ balance, riskRatio }) {
    if (!(balance > 0)) throw new RangeError('RiskParameters: balance は正の数');
    if (!(riskRatio > 0 && riskRatio <= 0.1)) {
      // 10% を超えるリスクは「入力ミス」として扱う。黙って通すほうが危ない。
      throw new RangeError('RiskParameters: riskRatio は 0 より大きく 0.1 以下');
    }
    this.#balance = balance;
    this.#riskRatio = riskRatio;
    Object.freeze(this);
  }

  get balance() { return this.#balance; }
  get riskRatio() { return this.#riskRatio; }

  /** 1 回のトレードで許容する損失額。 */
  get riskAmount() { return this.#balance * this.#riskRatio; }

  afterPnl(pnl) {
    return new RiskParameters({ balance: this.#balance + pnl, riskRatio: this.#riskRatio });
  }
}
