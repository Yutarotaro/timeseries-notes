/**
 * 指標の計算結果。値オブジェクト。
 *
 * 「先頭 n 本は計算できない」ことを null で表し、必ずローソク足と同じ添字で
 * 並べる。ここを詰めて短い配列にすると、描画やバックテストのたびに添字を
 * 合わせ直すことになり、そこがずれた瞬間に未来の値を参照する。
 * 添字を揃えるのはリーク対策そのものなので、型として固定する。
 */
export class IndicatorSeries {
  #name; #values;

  constructor(name, values) {
    this.#name = name;
    this.#values = Object.freeze(values.slice());
    Object.freeze(this);
  }

  get name() { return this.#name; }
  get values() { return this.#values; }
  get length() { return this.#values.length; }

  at(i) { return this.#values[i] ?? null; }
  get last() { return this.#values[this.lastDefinedIndex] ?? null; }

  get lastDefinedIndex() {
    for (let i = this.#values.length - 1; i >= 0; i--) if (this.#values[i] != null) return i;
    return -1;
  }

  /**
   * 系列を前後にずらす。正なら未来方向（一目の先行スパン）、
   * 負なら過去方向（遅行スパン）。ずらした先が空くぶんは null で埋める。
   */
  shift(offset) {
    const out = new Array(this.#values.length + Math.max(offset, 0)).fill(null);
    this.#values.forEach((v, i) => {
      const j = i + offset;
      if (j >= 0 && j < out.length) out[j] = v;
    });
    return new IndicatorSeries(this.#name, out);
  }

  map(name, fn) {
    return new IndicatorSeries(name, this.#values.map((v, i) => (v == null ? null : fn(v, i))));
  }

  /** 2 本の系列の差。どちらかが未定義なら未定義。 */
  static difference(name, a, b) {
    const n = Math.max(a.length, b.length);
    const out = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      const x = a.at(i), y = b.at(i);
      if (x != null && y != null) out[i] = x - y;
    }
    return new IndicatorSeries(name, out);
  }

  /** a が b を下から上に抜けた添字（ゴールデンクロス相当）。 */
  static crossovers(a, b) {
    const idx = [];
    for (let i = 1; i < Math.max(a.length, b.length); i++) {
      const p = a.at(i - 1), q = b.at(i - 1), x = a.at(i), y = b.at(i);
      if (p == null || q == null || x == null || y == null) continue;
      if (p <= q && x > y) idx.push(i);
    }
    return idx;
  }

  static crossunders(a, b) { return IndicatorSeries.crossovers(b, a); }
}
