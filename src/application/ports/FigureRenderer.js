/**
 * 図の描画口（ポート）。
 *
 * FigureSpec を受け取って、どこかに描く。SVG なのか Canvas なのか、
 * そもそも画面なのかはアプリケーション層の関心ではない。
 *
 * @abstract
 */
export class FigureRenderer {
  /**
   * @param {unknown} target 描画先（DOM 要素など、実装が解釈するハンドル）
   * @param {import('../figure/FigureSpec.js').FigureSpec} spec
   */
  render(target, spec) { throw new Error('FigureRenderer#render が実装されていない'); }
}
