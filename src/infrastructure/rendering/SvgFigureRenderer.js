import { FigureRenderer } from '../../application/ports/FigureRenderer.js';
import { svg, text, LinearScale } from './svgDom.js';

/**
 * FigureSpec を SVG に落とす（アダプタ）。
 *
 * 色は 'accent' のような意味の名前で渡ってくるので、ここで CSS 変数に
 * 変換する。実際の色値は CSS 側が持ち、テーマ切り替えは再描画なしで効く。
 */
const COLOR_TOKENS = {
  accent: 'var(--fig-accent)',
  accent2: 'var(--fig-accent-2)',
  accent3: 'var(--fig-accent-3)',
  warn: 'var(--fig-warn)',
  danger: 'var(--fig-danger)',
  up: 'var(--fig-up)',
  down: 'var(--fig-down)',
  level: 'var(--fig-level)',
  muted: 'var(--fig-muted)',
  text: 'var(--fig-text)'
};

const VIEW_WIDTH = 760;
const PAD_TOP = 16;
const PAD_BOTTOM = 12;
const PAD_LEFT = 10;
const PANE_GAP = 20;

export class SvgFigureRenderer extends FigureRenderer {
  render(target, spec) {
    const axisWidth = spec.axis === false ? 12 : 54;
    const priceHeight = spec.height;
    // 系列名は線の右端ではなく上部の凡例にまとめる。線の終点に置くと
    // 価格軸のラベルと重なるし、複数の線が近いところで終わると団子になる。
    const legend = spec.layers.filter((l) => l.type === 'line' && l.label);
    const legendHeight = legend.length ? 18 : 0;
    const priceTop = PAD_TOP + legendHeight;
    let totalHeight = priceTop + priceHeight + PAD_BOTTOM;
    spec.panes.forEach((p) => { totalHeight += (p.height ?? 84) + PANE_GAP; });
    if (spec.panes.length) totalHeight += PAD_BOTTOM; // 最後のペインの枠線が端に接しないように

    const root = svg('svg', {
      viewBox: `0 0 ${VIEW_WIDTH} ${totalHeight}`,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'figure-svg',
      role: 'img',
      'aria-label': spec.title ?? '解説図'
    });

    const groups = {};
    ['back', 'grid', 'area', 'candle', 'line', 'mark', 'text'].forEach((name) => {
      groups[name] = svg('g', { class: `fg-${name}` });
      root.appendChild(groups[name]);
    });

    const candles = spec.series ? spec.series.candles : [];
    const count = this.#horizontalCount(spec, candles);
    const left = PAD_LEFT;
    const right = VIEW_WIDTH - axisWidth;
    const step = (right - left) / count;
    const x = (i) => left + step * (i + 0.5);
    const barWidth = Math.max(1.5, Math.min(11, step * 0.62));

    const [low, high] = this.#priceDomain(spec, candles);
    const y = new LinearScale([high, low], [priceTop, priceTop + priceHeight]);
    const digits = spec.digits ?? (high < 10 ? 4 : 2);

    const ctx = { x, y, step, barWidth, left, right, priceTop, priceHeight };
    this.#drawGrid(groups, spec, { left, right, y, low, high, digits });
    this.#drawLayers(groups, spec, ctx);
    this.#drawCandles(groups, candles, { x, y, barWidth });
    this.#drawLayers(groups, spec, ctx, true);
    if (legend.length) this.#drawLegend(groups, legend, { left, top: PAD_TOP + 4 });

    let paneTop = priceTop + priceHeight + PAD_BOTTOM;
    spec.panes.forEach((pane) => {
      paneTop += PANE_GAP;
      this.#drawPane(groups, pane, { x, barWidth, left, right, top: paneTop, axis: spec.axis !== false });
      paneTop += pane.height ?? 84;
    });

    target.replaceChildren(root);
    return root;
  }

  #horizontalCount(spec, candles) {
    let n = candles.length;
    spec.layers.forEach((l) => {
      if (l.values) n = Math.max(n, l.values.length);
      if (l.upper) n = Math.max(n, l.upper.length);
      if (l.lower) n = Math.max(n, l.lower.length);
    });
    spec.panes.forEach((p) => {
      (p.lines ?? []).forEach((l) => { n = Math.max(n, l.values.length); });
      if (p.histogram) n = Math.max(n, p.histogram.values.length);
    });
    return Math.max(spec.xCount ?? 0, n, 1);
  }

  #priceDomain(spec, candles) {
    let low = Infinity;
    let high = -Infinity;
    const see = (v) => { if (v != null && Number.isFinite(v)) { low = Math.min(low, v); high = Math.max(high, v); } };
    candles.forEach((c) => { see(c.high); see(c.low); });
    spec.layers.forEach((l) => {
      (l.values ?? []).forEach(see);
      (l.upper ?? []).forEach(see);
      (l.lower ?? []).forEach(see);
      if (l.type === 'level') see(l.y);
      if (l.type === 'priceZone') { see(l.y1); see(l.y2); }
      if (l.type === 'segment') { see(l.from[1]); see(l.to[1]); }
      if (l.at) see(l.at[1]);
    });
    if (!Number.isFinite(low)) { low = 0; high = 1; }
    const pad = (high - low) * (spec.yPad ?? 0.1);
    return [low - pad, high + pad];
  }

  #drawGrid(groups, spec, { left, right, y, low, high, digits }) {
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const value = low + ((high - low) * t) / ticks;
      const py = y.map(value);
      groups.grid.appendChild(svg('line', { x1: left, y1: py, x2: right, y2: py, class: 'fg-gridline' }));
      if (spec.axis !== false) {
        groups.text.appendChild(text(value.toFixed(digits), {
          x: right + 6, y: py + 3.5, class: 'fg-axis'
        }));
      }
    }
  }

  #drawCandles(groups, candles, { x, y, barWidth }) {
    candles.forEach((candle, i) => {
      const cls = candle.close >= candle.open ? 'fg-up' : 'fg-down';
      const cx = x(i);
      groups.candle.appendChild(svg('line', {
        x1: cx, y1: y.map(candle.high), x2: cx, y2: y.map(candle.low), class: `fg-wick ${cls}`
      }));
      const top = y.map(candle.bodyTop);
      const bottom = y.map(candle.bodyBottom);
      groups.candle.appendChild(svg('rect', {
        x: cx - barWidth / 2, y: top, width: barWidth,
        height: Math.max(1, bottom - top), class: `fg-body ${cls}`
      }));
    });
  }

  /** foreground=false のときは背景側（ゾーン・帯）、true のときは前景側を描く。 */
  #drawLayers(groups, spec, ctx, foreground = false) {
    const { x, y, step, left, right, priceTop, priceHeight } = ctx;
    const color = (token) => COLOR_TOKENS[token] ?? token;

    spec.layers.forEach((layer) => {
      const isBackground = layer.type === 'zone' || layer.type === 'priceZone' || layer.type === 'band';
      if (isBackground === foreground) return;

      switch (layer.type) {
        case 'zone': {
          const x0 = x(layer.from) - step / 2;
          const x1 = x(layer.to) + step / 2;
          groups.back.appendChild(svg('rect', {
            x: x0, y: priceTop, width: Math.max(1, x1 - x0), height: priceHeight,
            style: `fill:${color(layer.fill)};opacity:${layer.opacity}`
          }));
          if (layer.label) {
            groups.text.appendChild(text(layer.label, {
              x: (x0 + x1) / 2, y: priceTop + 14, class: 'fg-zonelabel'
            }));
          }
          break;
        }
        case 'priceZone': {
          const yTop = y.map(Math.max(layer.y1, layer.y2));
          const yBottom = y.map(Math.min(layer.y1, layer.y2));
          groups.back.appendChild(svg('rect', {
            x: left, y: yTop, width: right - left, height: Math.max(1, yBottom - yTop),
            style: `fill:${color(layer.fill)};opacity:${layer.opacity}`
          }));
          if (layer.label) {
            groups.text.appendChild(text(layer.label, {
              x: left + 6, y: yTop - 5, class: 'fg-note', 'text-anchor': 'start'
            }));
          }
          break;
        }
        case 'band': {
          const d = this.#bandPath(layer.upper, layer.lower, x, y);
          if (d) {
            groups.area.appendChild(svg('path', {
              d, style: `fill:${color(layer.fill)};opacity:${layer.opacity}`
            }));
          }
          break;
        }
        case 'line': {
          const d = this.#linePath(layer.values, x, y);
          if (d) {
            groups.line.appendChild(svg('path', {
              d, class: 'fg-plot',
              style: `stroke:${color(layer.color)}${layer.dash ? `;stroke-dasharray:${layer.dash}` : ''}${layer.width ? `;stroke-width:${layer.width}px` : ''}`
            }));
          }
          break;
        }
        case 'level': {
          const py = y.map(layer.y);
          groups.line.appendChild(svg('line', {
            x1: layer.from != null ? x(layer.from) : left, y1: py,
            x2: layer.to != null ? x(layer.to) : right, y2: py,
            class: 'fg-level',
            style: `stroke:${color(layer.color)}${layer.dash ? `;stroke-dasharray:${layer.dash}` : ''}`
          }));
          if (layer.label) {
            groups.text.appendChild(text(layer.label, {
              x: (layer.from != null ? x(layer.from) : left) + 4, y: py - 5,
              class: 'fg-note', 'text-anchor': 'start',
              style: `fill:${color(layer.color)}`
            }));
          }
          break;
        }
        case 'segment': {
          groups.line.appendChild(svg('line', {
            x1: x(layer.from[0]), y1: y.map(layer.from[1]),
            x2: x(layer.to[0]), y2: y.map(layer.to[1]),
            class: 'fg-segment',
            style: `stroke:${color(layer.color)}${layer.dash ? `;stroke-dasharray:${layer.dash}` : ''}${layer.width ? `;stroke-width:${layer.width}px` : ''}`
          }));
          break;
        }
        case 'arrow': {
          this.#drawArrow(groups.mark, x(layer.from[0]), y.map(layer.from[1]),
            x(layer.to[0]), y.map(layer.to[1]), color(layer.color));
          break;
        }
        case 'marker': {
          this.#drawMarker(groups.mark, x(layer.at[0]), y.map(layer.at[1]), layer.kind,
            layer.color ? color(layer.color) : null);
          break;
        }
        case 'note': {
          groups.text.appendChild(text(layer.text, {
            x: x(layer.at[0]) + layer.dx, y: y.map(layer.at[1]) + layer.dy,
            class: 'fg-note', 'text-anchor': layer.anchor,
            style: `fill:${color(layer.color)}`
          }));
          break;
        }
        default:
          throw new Error(`SvgFigureRenderer: 未知のレイヤ種別 (${layer.type})`);
      }
    });
  }

  #drawPane(groups, pane, { x, barWidth, left, right, top, axis }) {
    const color = (token) => COLOR_TOKENS[token] ?? token;
    const height = pane.height ?? 84;
    let low = Infinity;
    let high = -Infinity;
    const see = (v) => { if (v != null && Number.isFinite(v)) { low = Math.min(low, v); high = Math.max(high, v); } };
    (pane.lines ?? []).forEach((l) => l.values.forEach(see));
    if (pane.histogram) pane.histogram.values.forEach(see);
    (pane.levels ?? []).forEach((l) => see(l.y));
    if (pane.min != null) low = pane.min;
    if (pane.max != null) high = pane.max;
    if (!Number.isFinite(low)) { low = 0; high = 1; }
    const pad = (high - low) * 0.12;
    const y = new LinearScale([high + pad, low - pad], [top, top + height]);

    groups.grid.appendChild(svg('rect', {
      x: left, y: top, width: right - left, height, class: 'fg-pane'
    }));

    (pane.zones ?? []).forEach((z) => {
      const yTop = y.map(Math.max(z.y1, z.y2));
      const yBottom = y.map(Math.min(z.y1, z.y2));
      groups.back.appendChild(svg('rect', {
        x: left, y: yTop, width: right - left, height: Math.max(1, yBottom - yTop),
        style: `fill:${color(z.fill)};opacity:${z.opacity}`
      }));
    });

    (pane.levels ?? []).forEach((l) => {
      groups.grid.appendChild(svg('line', {
        x1: left, y1: y.map(l.y), x2: right, y2: y.map(l.y), class: 'fg-level',
        style: `stroke:${color(l.color)}${l.dash ? `;stroke-dasharray:${l.dash}` : ''}`
      }));
      if (axis && l.label !== false) {
        groups.text.appendChild(text(l.label ?? String(l.y), {
          x: right + 6, y: y.map(l.y) + 3.5, class: 'fg-axis'
        }));
      }
    });

    if (pane.histogram) {
      const zero = y.map(0);
      pane.histogram.values.forEach((v, i) => {
        if (v == null) return;
        const py = y.map(v);
        groups.candle.appendChild(svg('rect', {
          x: x(i) - barWidth / 2, y: Math.min(py, zero), width: barWidth,
          height: Math.max(1, Math.abs(py - zero)),
          class: `fg-hist ${v >= 0 ? 'fg-up' : 'fg-down'}`
        }));
      });
    }

    (pane.lines ?? []).forEach((l) => {
      const d = this.#linePath(l.values, x, y);
      if (!d) return;
      groups.line.appendChild(svg('path', {
        d, class: 'fg-plot',
        style: `stroke:${color(l.color)}${l.dash ? `;stroke-dasharray:${l.dash}` : ''}`
      }));
    });

    (pane.marks ?? []).forEach((m) => {
      if (m.type === 'segment') {
        groups.line.appendChild(svg('line', {
          x1: x(m.from[0]), y1: y.map(m.from[1]), x2: x(m.to[0]), y2: y.map(m.to[1]),
          class: 'fg-segment',
          style: `stroke:${color(m.color)}${m.dash ? `;stroke-dasharray:${m.dash}` : ''}`
        }));
      } else if (m.type === 'note') {
        groups.text.appendChild(text(m.text, {
          x: x(m.at[0]) + m.dx, y: y.map(m.at[1]) + m.dy,
          class: 'fg-note', 'text-anchor': m.anchor, style: `fill:${color(m.color)}`
        }));
      }
    });

    if (pane.title) {
      groups.text.appendChild(text(pane.title, { x: left + 5, y: top + 13, class: 'fg-panetitle' }));
    }
  }

  /**
   * 凡例。テキスト幅は文字種から概算する（getBBox は描画後にしか測れず、
   * 測ってから並べ直すと 2 度描くことになるため）。
   */
  #drawLegend(groups, legend, { left, top }) {
    let cursor = left + 2;
    legend.forEach((item) => {
      const stroke = COLOR_TOKENS[item.color] ?? item.color;
      groups.line.appendChild(svg('line', {
        x1: cursor, y1: top, x2: cursor + 14, y2: top, class: 'fg-plot',
        style: `stroke:${stroke}${item.dash ? `;stroke-dasharray:${item.dash}` : ''}`
      }));
      groups.text.appendChild(text(item.label, {
        x: cursor + 19, y: top + 3.5, class: 'fg-legend'
      }));
      cursor += 19 + approximateTextWidth(item.label) + 16;
    });
  }

  #linePath(values, x, y) {
    let d = '';
    let pen = false;
    for (let i = 0; i < values.length; i++) {
      if (values[i] == null) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(2)} ${y.map(values[i]).toFixed(2)} `;
      pen = true;
    }
    return d.trim();
  }

  #bandPath(upper, lower, x, y) {
    let forward = '';
    let backward = '';
    for (let i = 0; i < upper.length; i++) {
      if (upper[i] == null) continue;
      forward += `${forward ? 'L' : 'M'}${x(i).toFixed(2)} ${y.map(upper[i]).toFixed(2)} `;
    }
    for (let i = lower.length - 1; i >= 0; i--) {
      if (lower[i] == null) continue;
      backward += `L${x(i).toFixed(2)} ${y.map(lower[i]).toFixed(2)} `;
    }
    return forward ? `${forward}${backward}Z` : '';
  }

  #drawArrow(parent, ax, ay, bx, by, stroke) {
    parent.appendChild(svg('line', { x1: ax, y1: ay, x2: bx, y2: by, class: 'fg-arrow', style: `stroke:${stroke}` }));
    const angle = Math.atan2(by - ay, bx - ax);
    const size = 6.5;
    const p1 = `${bx - size * Math.cos(angle - 0.42)},${by - size * Math.sin(angle - 0.42)}`;
    const p2 = `${bx - size * Math.cos(angle + 0.42)},${by - size * Math.sin(angle + 0.42)}`;
    parent.appendChild(svg('polygon', { points: `${bx},${by} ${p1} ${p2}`, style: `fill:${stroke}` }));
  }

  #drawMarker(parent, cx, cy, kind, fill) {
    if (kind === 'buy') {
      parent.appendChild(svg('polygon', {
        points: `${cx},${cy - 5} ${cx - 5.5},${cy + 5} ${cx + 5.5},${cy + 5}`,
        class: 'fg-buy', style: fill ? `fill:${fill}` : null
      }));
    } else if (kind === 'sell') {
      parent.appendChild(svg('polygon', {
        points: `${cx},${cy + 5} ${cx - 5.5},${cy - 5} ${cx + 5.5},${cy - 5}`,
        class: 'fg-sell', style: fill ? `fill:${fill}` : null
      }));
    } else {
      parent.appendChild(svg('circle', {
        cx, cy, r: 3.6, class: 'fg-dot', style: fill ? `fill:${fill}` : null
      }));
    }
  }
}

/** 日本語は全角相当、それ以外は半角相当として概算する。 */
function approximateTextWidth(label) {
  return [...label].reduce((w, ch) => w + (ch.codePointAt(0) > 0x2000 ? 10.5 : 6), 0);
}
