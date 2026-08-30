/**
 * ローソク足系列の取得口（ポート）。
 *
 * アプリケーション層はこの形しか知らない。実装が合成データでも、
 * CSV でも、ブローカーの API でも、上の層は書き換えずに済む。
 * 実際このサイトでは合成データの実装しか無いが、境界を引いておく意味は
 * 「データの出どころが変わったときに壊れる範囲を 1 ファイルに閉じる」こと。
 *
 * @abstract
 */
export class CandleSeriesRepository {
  /**
   * @param {string} id 系列の識別子
   * @returns {import('../../domain/model/CandleSeries.js').CandleSeries}
   */
  find(id) { throw new Error('CandleSeriesRepository#find が実装されていない'); }

  /** @returns {string[]} */
  ids() { throw new Error('CandleSeriesRepository#ids が実装されていない'); }
}
