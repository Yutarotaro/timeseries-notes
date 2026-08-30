/**
 * ロット計算。ドメインサービス。
 *
 * 手順はいつも同じ: 許容損失額 ÷ 損切り幅（金額換算）。
 * 「いくら買うか」から始めず、「どこで間違いを認めるか」から始める。
 */
export const PositionSizer = {
  /**
   * @param {RiskParameters} risk
   * @param {TradePlan} plan
   * @param {number} pipValuePerLot 1 ロットあたり 1 pip の金額
   */
  lots(risk, plan, pipValuePerLot) {
    if (!(pipValuePerLot > 0)) throw new RangeError('PositionSizer: pipValuePerLot は正の数');
    const lossPerLot = plan.riskPips * pipValuePerLot;
    return risk.riskAmount / lossPerLot;
  },

  /** 損切り幅を ATR に合わせる。値動きが荒い局面で自動的にロットが減る。 */
  stopDistanceFromAtr(atrValue, multiplier = 1.5) {
    return atrValue * multiplier;
  }
};
