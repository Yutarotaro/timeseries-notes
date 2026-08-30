/**
 * HTML 上の <figure data-figure="..."> を見つけて描画する。
 *
 * DOM を触るのはこの層だけ。図が 1 つ壊れてもページ全体が白くならないよう、
 * 失敗はその図の中に出す（握り潰して空欄にはしない）。
 */
export class FigureMount {
  #renderFigure;

  constructor(renderFigure) {
    this.#renderFigure = renderFigure;
  }

  mountAll(root = document) {
    const nodes = root.querySelectorAll('[data-figure]');
    nodes.forEach((node) => this.mount(node));
    return nodes.length;
  }

  mount(node) {
    const id = node.dataset.figure;
    const canvas = node.querySelector('.figure__canvas') ?? node;
    try {
      const spec = this.#renderFigure.execute(id, canvas);
      this.#applyCaption(node, spec);
    } catch (error) {
      console.error(`図の描画に失敗: ${id}`, error);
      const message = document.createElement('p');
      message.className = 'figure__error';
      message.textContent = `図「${id}」を描画できませんでした: ${error.message}`;
      canvas.replaceChildren(message);
    }
  }

  #applyCaption(node, spec) {
    if (!spec.title && !spec.caption) return;
    let caption = node.querySelector('figcaption');
    if (!caption) {
      caption = document.createElement('figcaption');
      node.appendChild(caption);
    }
    caption.replaceChildren();
    if (spec.title) {
      const strong = document.createElement('strong');
      strong.className = 'figure__title';
      strong.textContent = spec.title;
      caption.appendChild(strong);
    }
    if (spec.caption) {
      const text = document.createElement('span');
      text.className = 'figure__caption';
      text.textContent = spec.caption;
      caption.appendChild(text);
    }
  }
}
