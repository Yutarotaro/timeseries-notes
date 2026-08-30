import { FigureSpecBuilder } from '../figure/FigureSpec.js';
import { TradePlan } from '../../domain/risk/TradePlan.js';
import { RiskParameters } from '../../domain/risk/RiskParameters.js';
import { PositionSizer } from '../../domain/risk/PositionSizer.js';
import { Instrument } from '../../domain/model/Instrument.js';

/** リスク管理の図。数字は TradePlan / PositionSizer に計算させる。 */
export const riskFigures = {
  'risk-reward': ({ repository }) => {
    const series = repository.find('risk-reward');
    const instrument = Instrument.USDJPY;
    const plan = new TradePlan({
      instrument, side: 'long',
      entry: 149.10, stopLoss: 148.70, takeProfit: 150.30
    });
    const risk = new RiskParameters({ balance: 1_000_000, riskRatio: 0.01 });
    const lots = PositionSizer.lots(risk, plan, 1000); // 1 ロット = 10 万通貨、1 pip ≒ 1,000 円

    // 印を置く足は決め打ちにせず、エントリー価格を通った最後の足にする。
    // 決め打ちだと、その後に損切り水準へ近づく場面が図に入って話が濁る。
    const entryIndex = series.candles.reduce(
      (found, candle, i) => (candle.low <= plan.entry && plan.entry <= candle.high ? i : found), 0
    );
    return new FigureSpecBuilder('risk-reward')
      .title('建てる前に 3 本の線を引いておく')
      .candles(series)
      .height(250)
      .yPad(0.12)
      .priceZone(plan.entry, plan.stopLoss, { fill: 'danger', opacity: 0.12, label: null })
      .priceZone(plan.takeProfit, plan.entry, { fill: 'up', opacity: 0.1, label: null })
      .level(plan.entry, { label: `エントリー ${instrument.format(plan.entry)}`, color: 'accent', dash: null })
      .level(plan.stopLoss, { label: `損切り −${plan.riskPips.toFixed(0)} pips`, color: 'danger' })
      .level(plan.takeProfit, { label: `利確 +${plan.rewardPips.toFixed(0)} pips`, color: 'up' })
      .marker([entryIndex, plan.entry], 'buy', { color: 'accent' })
      .caption(
        `リスクリワード ${plan.riskRewardRatio.toFixed(2)}、損益分岐となる勝率は `
        + `${(plan.breakEvenWinRate * 100).toFixed(1)}%。`
        + `残高 100 万円・1 トレードのリスク 1%（＝${risk.riskAmount.toLocaleString()} 円）なら、`
        + `建てられるのは ${lots.toFixed(2)} ロット。`
        + 'ロットは「いくら買いたいか」ではなく、損切り幅から逆算して決まる。'
      ).build();
  },

  'overfit-warning': ({ repository }) => {
    const series = repository.find('overfit-warning');
    const b = new FigureSpecBuilder('overfit-warning')
      .title('この系列は乱数で作られている')
      .candles(series)
      .height(230)
      .yPad(0.1);

    // 意味のない線をあえて引く。ノイズにも線は引けてしまう。
    b.level(150.42, { label: '「効いている」レジスタンス', color: 'down' })
      .level(149.62, { label: '「効いている」サポート', color: 'up' })
      .segment([8, 149.9], [110, 150.6], { color: 'accent', dash: '5 4' })
      .note([60, 150.9], '後から見れば、どんな線でも当てはめられる', { dy: -6, color: 'warn' });

    return b.caption(
      'このチャートに未来の情報は一切入っていない。それでも支持線・抵抗線・トレンドラインは引けるし、'
      + '「効いている」ように見える。チャートを見て法則が見えたときは、'
      + '同じ手法を別の期間・別の通貨ペアに当てて、そこでも成立するか確かめるしかない。'
    ).build();
  }
};
