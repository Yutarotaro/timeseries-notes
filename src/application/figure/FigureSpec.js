/**
 * 図の仕様。プレゼンテーション技術に依存しない記述。
 *
 * 色は "#3b82f6" ではなく 'accent' 'warn' のような意味の名前で持つ。
 * 実際の色はレンダラがテーマに合わせて決める。こうしておくと
 * ダークテーマ対応や配色変更がドメイン側に漏れてこない。
 */
export class FigureSpec {
  constructor({
    id, title, caption, series = null, height = 240, yPad = 0.1,
    axis = true, digits = null, layers = [], panes = [], xCount = null
  }) {
    Object.assign(this, {
      id, title, caption, series, height, yPad, axis, digits, layers, panes, xCount
    });
    Object.freeze(this);
  }
}

/** FigureSpec を読みやすく組み立てるためのビルダー。 */
export class FigureSpecBuilder {
  #spec;

  constructor(id) {
    this.#spec = { id, layers: [], panes: [] };
  }

  title(text) { this.#spec.title = text; return this; }
  caption(text) { this.#spec.caption = text; return this; }
  height(px) { this.#spec.height = px; return this; }
  yPad(ratio) { this.#spec.yPad = ratio; return this; }
  digits(n) { this.#spec.digits = n; return this; }
  noAxis() { this.#spec.axis = false; return this; }
  xCount(n) { this.#spec.xCount = n; return this; }

  /** ローソク足の本体。1 図につき 1 つ。 */
  candles(series) { this.#spec.series = series; return this; }

  /** 指標の折れ線。IndicatorSeries でも素の配列でも受ける。 */
  line(source, { color = 'accent', label = null, dash = null, width = null } = {}) {
    this.#spec.layers.push({
      type: 'line', values: valuesOf(source),
      label: label ?? source?.name ?? null, color, dash, width
    });
    return this;
  }

  /** 上下 2 本で囲まれた帯（ボリンジャーバンド、雲）。 */
  band(upper, lower, { fill = 'accent', opacity = 0.12 } = {}) {
    this.#spec.layers.push({
      type: 'band', upper: valuesOf(upper), lower: valuesOf(lower), fill, opacity
    });
    return this;
  }

  /** 水平線（サポート／レジスタンス、キリ番）。 */
  level(price, { label = null, color = 'level', dash = '4 3', from = null, to = null } = {}) {
    this.#spec.layers.push({ type: 'level', y: price, label, color, dash, from, to });
    return this;
  }

  /** 任意の 2 点を結ぶ線（トレンドライン、ネックライン）。 */
  segment(from, to, { color = 'accent', dash = null, width = null } = {}) {
    this.#spec.layers.push({ type: 'segment', from, to, color, dash, width });
    return this;
  }

  /** 縦方向の帯（局面の色分け）。 */
  zone(fromIndex, toIndex, { label = null, fill = 'muted', opacity = 0.1 } = {}) {
    this.#spec.layers.push({ type: 'zone', from: fromIndex, to: toIndex, label, fill, opacity });
    return this;
  }

  /** 横方向の帯（価格ゾーンとしてのサポレジ）。 */
  priceZone(y1, y2, { label = null, fill = 'level', opacity = 0.14 } = {}) {
    this.#spec.layers.push({ type: 'priceZone', y1, y2, label, fill, opacity });
    return this;
  }

  note(at, text, { color = 'text', anchor = 'middle', dx = 0, dy = 0 } = {}) {
    this.#spec.layers.push({ type: 'note', at, text, color, anchor, dx, dy });
    return this;
  }

  arrow(from, to, { color = 'accent' } = {}) {
    this.#spec.layers.push({ type: 'arrow', from, to, color });
    return this;
  }

  marker(at, kind = 'dot', { color = null } = {}) {
    this.#spec.layers.push({ type: 'marker', at, kind, color });
    return this;
  }

  /** 下段の指標ペイン。 */
  pane(build) {
    const p = new PaneBuilder();
    build(p);
    this.#spec.panes.push(p.build());
    return this;
  }

  build() { return new FigureSpec(this.#spec); }
}

class PaneBuilder {
  #pane = { lines: [], levels: [], zones: [], marks: [] };

  title(text) { this.#pane.title = text; return this; }
  height(px) { this.#pane.height = px; return this; }
  range(min, max) { this.#pane.min = min; this.#pane.max = max; return this; }

  line(source, { color = 'accent', dash = null, label = null } = {}) {
    this.#pane.lines.push({ values: valuesOf(source), color, dash, label: label ?? source?.name ?? null });
    return this;
  }
  histogram(source, { color = 'accent' } = {}) {
    this.#pane.histogram = { values: valuesOf(source), color };
    return this;
  }
  level(y, { label = null, color = 'level', dash = '4 3' } = {}) {
    this.#pane.levels.push({ y, label, color, dash });
    return this;
  }
  zone(y1, y2, { fill = 'muted', opacity = 0.12 } = {}) {
    this.#pane.zones.push({ y1, y2, fill, opacity });
    return this;
  }
  segment(from, to, { color = 'warn', dash = '4 3' } = {}) {
    this.#pane.marks.push({ type: 'segment', from, to, color, dash });
    return this;
  }
  note(at, text, { color = 'text', anchor = 'middle', dx = 0, dy = 0 } = {}) {
    this.#pane.marks.push({ type: 'note', at, text, color, anchor, dx, dy });
    return this;
  }
  build() { return this.#pane; }
}

function valuesOf(source) {
  if (Array.isArray(source)) return source;
  if (source && Array.isArray(source.values)) return source.values;
  throw new TypeError('FigureSpecBuilder: 配列か IndicatorSeries を渡すこと');
}
