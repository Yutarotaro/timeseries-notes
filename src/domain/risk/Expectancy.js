/**
 * 期待値。ドメインサービス。
 *
 * 勝率とリスクリワードは片方だけでは何も言えない。
 * 「勝率 70%」でも RR 0.3 なら負ける。ここを 1 本の式にしておく。
 */
export const Expectancy = {
  /** 1 トレードあたりの期待損益を「リスク 1 単位」で表す。 */
  perTrade(winRate, riskRewardRatio) {
    if (!(winRate >= 0 && winRate <= 1)) throw new RangeError('Expectancy: winRate は 0〜1');
    return winRate * riskRewardRatio - (1 - winRate) * 1;
  },

  /** 損益ゼロになる勝率。 */
  breakEvenWinRate(riskRewardRatio) { return 1 / (1 + riskRewardRatio); },

  /**
   * 連敗のドローダウン。リスク r を掛け続けたときに n 連敗で資金が何倍になるか。
   * 2% でも 10 連敗で 8 割強まで減る、という感覚を数字で持っておく。
   */
  drawdownAfterLosses(riskRatio, losses) {
    return (1 - riskRatio) ** losses;
  }
};
