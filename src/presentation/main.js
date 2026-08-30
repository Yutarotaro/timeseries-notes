/**
 * 合成ルート（composition root）。
 *
 * 具体的な実装を選んで結線するのはここ 1 箇所だけ。
 * 上の層は import でアダプタに触れていないので、
 * 例えば SvgFigureRenderer を Canvas 実装に差し替えるならこの数行で済む。
 */
import { FigureCatalog } from '../application/figure/FigureCatalog.js';
import { RenderFigure } from '../application/figure/RenderFigure.js';
import { ALL_FIGURES } from '../application/scenarios/index.js';
import { SyntheticCandleSeriesRepository } from '../infrastructure/data/SyntheticCandleSeriesRepository.js';
import { SvgFigureRenderer } from '../infrastructure/rendering/SvgFigureRenderer.js';
import { FigureMount } from './FigureMount.js';
import { TableOfContents } from './TableOfContents.js';
import { ThemeController } from './ThemeController.js';

function bootstrap() {
  const catalog = new FigureCatalog().registerAll(ALL_FIGURES);
  const repository = new SyntheticCandleSeriesRepository();
  const renderer = new SvgFigureRenderer();
  const renderFigure = new RenderFigure({ catalog, repository, renderer });

  new FigureMount(renderFigure).mountAll();

  // 目次の入れ物ではなく nav 全体を渡す（開閉のための details を含むため）
  const tocHost = document.querySelector('[data-toc]');
  const nav = tocHost?.closest('.toc') ?? tocHost;
  if (nav) new TableOfContents(nav).build([...document.querySelectorAll('main > section.part')]);

  new ThemeController(document.querySelector('[data-theme-toggle]')).start();

  document.documentElement.classList.add('is-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
