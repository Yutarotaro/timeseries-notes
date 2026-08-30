import { chartBasicsFigures } from './chartBasics.js';
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
import { pivotFigures } from './pivot.js';
import { waveFigures } from './wave.js';
import { trendIndicatorFigures } from './trendIndicators.js';
import { oscillatorFigures } from './oscillators.js';
import { marketFigures } from './market.js';
import { combinationFigures } from './combination.js';

/** すべてのシナリオ。図を足すときはここに並べる。 */
export const ALL_FIGURES = {
  ...chartBasicsFigures,
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
  ...sessionFigures,
  ...pivotFigures,
  ...waveFigures,
  ...trendIndicatorFigures,
  ...oscillatorFigures,
  ...marketFigures,
  ...combinationFigures
};
