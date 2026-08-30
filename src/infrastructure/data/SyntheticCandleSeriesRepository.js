import { CandleSeriesRepository } from '../../application/ports/CandleSeriesRepository.js';
import { CandleSeries } from '../../domain/model/CandleSeries.js';
import { DeterministicRandom } from './DeterministicRandom.js';
import { SERIES_SPECS, SERIES_PATCHES } from './SeriesCatalog.js';

/**
 * 合成データでポートを満たす実装（アダプタ）。
 *
 * アンカーを線形補間した骨格に、平均回帰するノイズを乗せて OHLC にする。
 * 実データを配布せずに済み、図の形を意図どおりに保てるのが利点。
 * 同じ ID には常に同じ系列を返す（生成結果をキャッシュする）。
 */
export class SyntheticCandleSeriesRepository extends CandleSeriesRepository {
  #cache = new Map();
  #specs;
  #patches;

  constructor({ specs = SERIES_SPECS, patches = SERIES_PATCHES } = {}) {
    super();
    this.#specs = specs;
    this.#patches = patches;
  }

  ids() { return Object.keys(this.#specs); }

  find(id) {
    if (this.#cache.has(id)) return this.#cache.get(id);
    const spec = this.#specs[id];
    if (!spec) throw new Error(`SyntheticCandleSeriesRepository: 未知の系列 ID (${id})`);
    const series = CandleSeries.fromOhlc(
      spec.instrument, spec.timeFrame, this.#generate(spec, this.#patches[id] ?? [])
    );
    this.#cache.set(id, series);
    return series;
  }

  #generate(spec, patches) {
    const rnd = new DeterministicRandom(spec.seed);
    const anchors = spec.anchors;
    const count = anchors[anchors.length - 1][0] + 1;
    const prices = anchors.map((a) => a[1]);
    const span = Math.max(...prices) - Math.min(...prices) || Math.max(...prices) * 0.01;
    const noise = (spec.volatility ?? 0.1) * span;
    const wick = spec.wick ?? 0.85;

    // アンカー間を線形補間した骨格
    const base = new Array(count);
    for (let s = 0; s < anchors.length - 1; s++) {
      const [ai, ap] = anchors[s];
      const [bi, bp] = anchors[s + 1];
      for (let i = ai; i <= bi; i++) {
        const t = bi === ai ? 0 : (i - ai) / (bi - ai);
        base[i] = ap + (bp - ap) * t;
      }
    }

    // 骨格からの乖離を減衰させながら歩かせる（放っておくと骨格から離れるため）
    const rows = [];
    let deviation = 0;
    let previousClose = null;
    for (let i = 0; i < count; i++) {
      deviation = deviation * 0.62 + rnd.centered() * noise;
      const close = base[i] + deviation;
      const open = previousClose ?? base[i] + rnd.centered() * noise * 0.5;
      const top = Math.max(open, close);
      const bottom = Math.min(open, close);
      rows.push({
        o: open, c: close,
        h: top + rnd.next() * noise * wick,
        l: bottom - rnd.next() * noise * wick
      });
      previousClose = close;
    }

    // 狙った形の足を差し込む。前後との連続性はあえて直さない
    // （実際のチャートでも、そこだけ性格の違う足は出る）
    patches.forEach((p) => {
      const row = rows[p.index];
      if (!row) throw new RangeError(`patch: 範囲外の index (${p.index})`);
      rows[p.index] = {
        o: p.open ?? row.o, c: p.close ?? row.c,
        h: p.high ?? row.h, l: p.low ?? row.l
      };
    });

    return rows;
  }
}
