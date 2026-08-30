import { candlestickFigures } from './candlestick.js';
import { trendFigures } from './trend.js';
import { levelFigures } from './levels.js';
import { movingAverageFigures } from './movingAverage.js';
import { momentumFigures } from './momentum.js';
import { volatilityFigures } from './volatility.js';
import { ichimokuFigures } from './ichimoku.js';
import { fibonacciFigures } from './fibonacci.js';
import { patternFigures } from './patterns.js';
import { multiTimeFrameFigures } from './multiTimeFrame.js';
import { riskFigures } from './risk.js';
import { sessionFigures } from './session.js';

/** すべてのシナリオ。図を足すときはここに並べる。 */
export const ALL_FIGURES = {
  ...candlestickFigures,
  ...trendFigures,
  ...levelFigures,
  ...movingAverageFigures,
  ...momentumFigures,
  ...volatilityFigures,
  ...ichimokuFigures,
  ...fibonacciFigures,
  ...patternFigures,
  ...multiTimeFrameFigures,
  ...riskFigures,
  ...sessionFigures
};
