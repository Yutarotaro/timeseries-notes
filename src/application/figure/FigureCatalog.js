/**
 * 図の目録。図の ID と「その図の組み立て方」の対応表。
 *
 * HTML 側は <figure data-figure="rsi-divergence"> と書くだけでよく、
 * どう作られるかは知らない。図を足したいときに触るのはシナリオだけになる。
 */
export class FigureCatalog {
  #builders = new Map();

  register(id, builder) {
    if (this.#builders.has(id)) throw new Error(`FigureCatalog: 図 ID が重複している (${id})`);
    this.#builders.set(id, builder);
    return this;
  }

  registerAll(table) {
    Object.entries(table).forEach(([id, builder]) => this.register(id, builder));
    return this;
  }

  has(id) { return this.#builders.has(id); }
  ids() { return [...this.#builders.keys()]; }

  /** @returns {import('./FigureSpec.js').FigureSpec} */
  build(id, deps) {
    const builder = this.#builders.get(id);
    if (!builder) throw new Error(`FigureCatalog: 未登録の図 ID (${id})`);
    return builder(deps);
  }
}
