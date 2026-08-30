const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG 要素を属性つきで作る。null/undefined の属性は付けない。 */
export function svg(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    node.setAttribute(key, String(value));
  }
  return node;
}

export function text(content, attrs = {}) {
  const node = svg('text', attrs);
  node.textContent = content;
  return node;
}

/** 線形スケール。定義域 → 値域の写像だけを持つ。 */
export class LinearScale {
  constructor([d0, d1], [r0, r1]) {
    this.d0 = d0; this.d1 = d1; this.r0 = r0; this.r1 = r1;
    this.span = d1 - d0 || 1;
  }
  map(v) { return this.r0 + ((v - this.d0) / this.span) * (this.r1 - this.r0); }
}
