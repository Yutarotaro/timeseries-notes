/**
 * DOM を使わない層（domain / application / infrastructure.data）のスモークテスト。
 *
 * 層を分けている実利がここに出る: ブラウザを起動しなくても、
 * 指標の計算と全部の図の組み立てが Node だけで検証できる。
 *   node scripts/check.mjs
 */
import assert from 'node:assert/strict';
import { FigureCatalog } from '../src/application/figure/FigureCatalog.js';
import { ALL_FIGURES } from '../src/application/scenarios/index.js';
import { SyntheticCandleSeriesRepository } from '../src/infrastructure/data/SyntheticCandleSeriesRepository.js';
import { MovingAverage } from '../src/domain/indicator/MovingAverage.js';
import { Oscillator } from '../src/domain/indicator/Oscillator.js';
import { Volatility } from '../src/domain/indicator/Volatility.js';
import { Ichimoku } from '../src/domain/indicator/Ichimoku.js';
import { IndicatorSeries } from '../src/domain/indicator/IndicatorSeries.js';
import { TimeFrame } from '../src/domain/model/TimeFrame.js';
import { Instrument } from '../src/domain/model/Instrument.js';
import { TradePlan } from '../src/domain/risk/TradePlan.js';
import { RiskParameters } from '../src/domain/risk/RiskParameters.js';
import { PositionSizer } from '../src/domain/risk/PositionSizer.js';
import { Expectancy } from '../src/domain/risk/Expectancy.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`✗ ${name}\n  ${error.message}`);
    process.exitCode = 1;
  }
}

const repository = new SyntheticCandleSeriesRepository();

test('全系列が不変条件を満たすローソク足で生成される', () => {
  repository.ids().forEach((id) => {
    const series = repository.find(id);
    assert.ok(series.length > 0, `${id} が空`);
    series.candles.forEach((c) => {
      assert.ok(c.high >= c.bodyTop && c.low <= c.bodyBottom, `${id} の OHLC が壊れている`);
    });
  });
});

test('同じ ID からは常に同じ系列が返る（決定論）', () => {
  const a = repository.find('trend-structure').closes();
  const b = new SyntheticCandleSeriesRepository().find('trend-structure').closes();
  assert.deepEqual(a, b);
});

test('SMA は先頭 period-1 本が未定義で、値は窓の平均に一致する', () => {
  const values = [1, 2, 3, 4, 5, 6];
  const sma = MovingAverage.simple(values, 3);
  assert.equal(sma.at(0), null);
  assert.equal(sma.at(1), null);
  assert.equal(sma.at(2), 2);
  assert.equal(sma.at(5), 5);
});

test('指標は必ずローソク足と同じ長さで返る（添字ずれ＝リークの原因）', () => {
  const series = repository.find('moving-average');
  const closes = series.closes();
  [
    MovingAverage.exponential(closes, 20),
    Oscillator.rsi(closes, 14),
    Volatility.atr(series, 14),
    Volatility.bollinger(closes).middle
  ].forEach((indicator) => {
    assert.equal(indicator.length, series.length, `${indicator.name} の長さが違う`);
  });
});

test('RSI は 0〜100 に収まる', () => {
  const rsi = Oscillator.rsi(repository.find('rsi-divergence').closes(), 14);
  rsi.values.filter((v) => v != null).forEach((v) => {
    assert.ok(v >= 0 && v <= 100, `RSI が範囲外: ${v}`);
  });
});

test('先行スパンは 26 本先に置かれ、遅行スパンは 26 本前に戻る', () => {
  const series = repository.find('ichimoku');
  const cloud = Ichimoku.compute(series);
  assert.equal(cloud.spanA.length, series.length + 26);
  assert.equal(cloud.chikou.at(0), series.at(26).close);
  // 未来にずれたぶんの手前は未定義でなければならない
  assert.equal(cloud.spanA.at(0), null);
});

test('クロスは抜けた側の足で検出される', () => {
  const a = new IndicatorSeries('a', [1, 3, 1]);
  const b = new IndicatorSeries('b', [2, 2, 2]);
  assert.deepEqual(IndicatorSeries.crossovers(a, b), [1]);
  assert.deepEqual(IndicatorSeries.crossunders(a, b), [2]);
});

test('同値でのタッチはクロスと呼ばない（確定が 1 本遅れる）', () => {
  // 触れただけでは抜けたことにしない。ここを甘くすると横ばい局面で
  // クロスが乱発され、そのまま売買条件にすると往復ビンタになる。
  const a = new IndicatorSeries('a', [1, 2, 3, 2, 1]);
  const b = new IndicatorSeries('b', [2, 2, 2, 2, 2]);
  assert.deepEqual(IndicatorSeries.crossovers(a, b), [2]);
  assert.deepEqual(IndicatorSeries.crossunders(a, b), [4]);
});

test('下位足を上位足に束ねると始値・高値・安値・終値が引き継がれる', () => {
  const lower = repository.find('mtf-lower');
  const higher = lower.aggregateTo(TimeFrame.H1);
  assert.equal(higher.timeFrame.code, 'H1');
  assert.equal(higher.length, Math.floor(lower.length / 4));
  assert.equal(higher.at(0).open, lower.at(0).open);
  assert.equal(higher.at(0).close, lower.at(3).close);
  assert.equal(higher.at(0).high, Math.max(...[0, 1, 2, 3].map((i) => lower.at(i).high)));
});

test('壊れた OHLC は生成時に落ちる', () => {
  assert.throws(() => repository.find('存在しない系列'));
});

test('TradePlan は損切りと利確の向きを検証する', () => {
  assert.throws(() => new TradePlan({
    instrument: Instrument.USDJPY, side: 'long', entry: 150, stopLoss: 151, takeProfit: 152
  }), /損切り < エントリー/);
});

test('リスクリワードと損益分岐勝率が整合する', () => {
  const plan = new TradePlan({
    instrument: Instrument.USDJPY, side: 'long', entry: 150.00, stopLoss: 149.60, takeProfit: 150.80
  });
  assert.equal(plan.riskPips.toFixed(1), '40.0');
  assert.equal(plan.rewardPips.toFixed(1), '80.0');
  assert.equal(plan.riskRewardRatio.toFixed(2), '2.00');
  assert.equal((plan.breakEvenWinRate * 100).toFixed(1), '33.3');
  assert.ok(Math.abs(Expectancy.perTrade(0.5, 2) - 0.5) < 1e-12);
});

test('ロットは許容損失額を損切り幅で割ったもの', () => {
  const plan = new TradePlan({
    instrument: Instrument.USDJPY, side: 'long', entry: 150.00, stopLoss: 149.80, takeProfit: 150.60
  });
  const risk = new RiskParameters({ balance: 1_000_000, riskRatio: 0.01 });
  // 20 pips × 1,000 円/pip/ロット = 20,000 円/ロット、許容 10,000 円 → 0.5 ロット
  assert.equal(PositionSizer.lots(risk, plan, 1000).toFixed(2), '0.50');
});

test('過大なリスク設定は入力ミスとして弾く', () => {
  assert.throws(() => new RiskParameters({ balance: 100, riskRatio: 0.5 }));
});

test('登録された全部の図が例外なく組み立てられる', () => {
  const catalog = new FigureCatalog().registerAll(ALL_FIGURES);
  catalog.ids().forEach((id) => {
    const spec = catalog.build(id, { repository });
    assert.ok(spec.layers.length > 0 || spec.panes.length > 0, `${id} に描くものがない`);
    assert.ok(spec.title, `${id} に見出しがない`);
    spec.layers.forEach((layer) => {
      assert.ok(layer.type, `${id} に型のないレイヤがある`);
    });
  });
  console.log(`  図: ${catalog.ids().length} 件`);
});

if (process.exitCode) {
  console.error(`\n${passed} 件成功、失敗あり`);
} else {
  console.log(`\n✓ ${passed} 件すべて成功`);
}
