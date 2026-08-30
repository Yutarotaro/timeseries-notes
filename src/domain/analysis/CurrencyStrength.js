/**
 * 通貨強弱。
 *
 * 為替の値動きは 2 通貨の綱引きなので、USD/JPY が上がったとき
 * 「ドルが強い」のか「円が弱い」のかは、そのペアだけ見ても分からない。
 * 複数のペアを突き合わせて、通貨ごとの動きに分解する。
 *
 * ここでの実装は素朴で、各ペアの騰落率を基軸通貨に ＋、決済通貨に − として
 * 配り、通貨ごとに平均する。ペアの組み合わせが偏っていると結果も偏るので、
 * 「順位が入れ替わったかどうか」くらいの粒度で読む。
 */
export const CurrencyStrength = {
  /**
   * @param {CandleSeries[]} seriesList
   * @param {number} lookback 何本ぶんの騰落を見るか
   * @returns {{currency: string, strength: number}[]} 強い順
   */
  rank(seriesList, lookback = 20) {
    const totals = new Map();
    const counts = new Map();

    seriesList.forEach((series) => {
      const [base, quote] = series.instrument.symbol.split('/');
      const last = series.length - 1;
      const from = Math.max(0, last - lookback);
      const change = (series.at(last).close / series.at(from).close - 1) * 100;

      add(base, change);
      add(quote, -change);
    });

    function add(currency, value) {
      totals.set(currency, (totals.get(currency) ?? 0) + value);
      counts.set(currency, (counts.get(currency) ?? 0) + 1);
    }

    return [...totals.entries()]
      .map(([currency, total]) => ({ currency, strength: total / counts.get(currency) }))
      .sort((a, b) => b.strength - a.strength);
  },

  /** 各時点での強弱を系列として返す（推移を図にするため）。 */
  series(seriesList, lookback = 20) {
    const length = Math.min(...seriesList.map((s) => s.length));
    const currencies = new Set();
    seriesList.forEach((s) => s.instrument.symbol.split('/').forEach((c) => currencies.add(c)));

    const result = new Map([...currencies].map((c) => [c, new Array(length).fill(null)]));
    for (let i = lookback; i < length; i++) {
      const totals = new Map();
      const counts = new Map();
      seriesList.forEach((series) => {
        const [base, quote] = series.instrument.symbol.split('/');
        const change = (series.at(i).close / series.at(i - lookback).close - 1) * 100;
        totals.set(base, (totals.get(base) ?? 0) + change);
        counts.set(base, (counts.get(base) ?? 0) + 1);
        totals.set(quote, (totals.get(quote) ?? 0) - change);
        counts.set(quote, (counts.get(quote) ?? 0) + 1);
      });
      totals.forEach((total, currency) => {
        result.get(currency)[i] = total / counts.get(currency);
      });
    }
    return result;
  }
};
