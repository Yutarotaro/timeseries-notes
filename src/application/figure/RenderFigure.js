/**
 * ユースケース: 図 ID を受け取って、指定された場所に描く。
 *
 * ここが唯一「目録・データ・描画」を束ねる場所。依存は全部注入で受け取り、
 * このクラス自身は import で具体実装に触らない。
 */
export class RenderFigure {
  #catalog; #repository; #renderer;

  constructor({ catalog, repository, renderer }) {
    this.#catalog = catalog;
    this.#repository = repository;
    this.#renderer = renderer;
  }

  execute(figureId, target) {
    const spec = this.#catalog.build(figureId, { repository: this.#repository });
    this.#renderer.render(target, spec);
    return spec;
  }

  knownIds() { return this.#catalog.ids(); }
}
