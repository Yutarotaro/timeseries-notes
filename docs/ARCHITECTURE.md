# 設計メモ

静的なページ 1 枚にしては層が多い。その理由と、どこに何を書くかの決まりごと。

## なぜ分けるか

このサイトの図は、画像ではなく実行時の計算結果だ。
つまり「指標の実装」がそのまま「本文の主張」になる。
移動平均の添字が 1 本ずれていれば、図も、キャプションの数字も、
それを説明した文章も同時に間違う。

だから計算の正しさを、描画やブラウザから切り離して確かめられる形にしておきたい。
層を分ける動機はそこにある。見た目の整理ではない。

## 依存の向き

```
presentation ──▶ application ──▶ domain
                      ▲                ▲
                      │                │
                infrastructure ────────┘
```

矢印は「知っている」方向。守るのは 1 つだけ:

**`domain` は他のどの層も知らない。**

`domain` の中で `import` してよいのは `domain` の中だけ。
DOM も、描画も、データの出どころも知らない。
この制約があるので、`domain` は Node で単体テストできる。

`infrastructure` は `application/ports` に定義されたインタフェースを実装する側に回る。
データの供給元も描画方法も、内側が定めた形に従う（依存性逆転）。

## 各層に置くもの

### domain/

相場の言葉だけで書かれた層。

| ディレクトリ | 置くもの |
| --- | --- |
| `model/` | `Instrument` `TimeFrame` `Candle` `CandleSeries` `PriceLevel` |
| `indicator/` | `MovingAverage` `Macd` `Oscillator` `Volatility` `Ichimoku` `Directional` `Parabolic` `Momentum` `Vwap` |
| `analysis/` | `SwingDetector` `Fibonacci` `ChartPattern` `Pivot` `CurrencyStrength` |
| `risk/` | `RiskParameters` `TradePlan` `PositionSizer` `Expectancy` |

決まりごと:

- **値オブジェクトは不変にする。** コンストラクタで `Object.freeze`。
- **不変条件はコンストラクタで検証する。** 壊れた OHLC は例外にする。
  黙って直すと、それらしいチャートが表示されて、供給側の壊れに気づけない。
- **指標は必ず元データと同じ長さで返す。** 計算できない先頭は `null` で埋める。
  詰めた短い配列を返すと、使う側が毎回添字を合わせ直すことになり、
  そこがずれた瞬間に未来の値を読む。これは型の問題ではなく検証可能性の問題なので、
  `IndicatorSeries` という 1 つの形に固定してある。
- **未来を含む計算をここに置かない。** 中心化移動平均のように、
  その足の時点では計算できない値は、可視化に綺麗でも入れない。

`SwingDetector` が返すスイング点が `confirmedAt`（何本目で確定したか）を持つのも同じ理由。
フラクタル法の高値は右側の足が出揃うまで確定せず、その遅れを表現できないと、
後から見たチャートでしか成立しない判断を書けてしまう。

### application/

| ディレクトリ | 置くもの |
| --- | --- |
| `ports/` | `CandleSeriesRepository` `FigureRenderer`（インタフェース定義） |
| `figure/` | `FigureSpec` `FigureCatalog` `RenderFigure` |
| `scenarios/` | どの図に何を描くかの定義 |

`FigureSpec` は「何を描くか」だけを持ち、どう描くかは持たない。
色は `'accent'` `'warn'` のような意味の名前で指定し、実際の色は CSS 変数にある。
そのため明暗テーマの切り替えで図を描き直す必要がない。

図を 1 つ足すときに触るのは `scenarios/` の 1 ファイルと `scenarios/index.js` だけ。

### infrastructure/

| ディレクトリ | 置くもの |
| --- | --- |
| `data/` | `SyntheticCandleSeriesRepository` `SeriesCatalog` `DeterministicRandom` |
| `rendering/` | `SvgFigureRenderer` `svgDom` |

合成データは「この本目でこの価格を通る」というアンカーを線形補間し、
平均回帰するノイズを乗せて作る。乱数のシードは固定する
（図がリロードのたびに変わると、本文の「ここで包み足が出ている」が嘘になる）。

実データに差し替えるなら、`CandleSeriesRepository` を実装したクラスを 1 つ足して、
`presentation/main.js` の結線を変えるだけで済む。図の定義は書き換えなくていい。

### presentation/

DOM を触るのはこの層だけ。`main.js` が合成ルートで、
具体的な実装を選んで結線するのはここ 1 箇所に限る。

## テスト

```bash
node scripts/check.mjs
```

ブラウザなしで、指標の計算・系列の集約・登録された全部の図の組み立てを検証する。
中身は主に次の 3 種類:

1. 計算が定義どおりか（SMA の値、RSI の範囲、リスクリワードと損益分岐勝率の整合）
2. 添字がずれていないか（指標の長さ、先行スパンの位置、遅行スパンの位置）
3. 全部の図（39 点）が例外なく組み立てられるか

### ドメインに置かなかったもの

エリオット波動の波の判定は実装していない。数え方が一意に決まらず、
「当てはまるように数え直す」ことがいくらでもできるため、
自動判定を書くと恣意性がコードの中に隠れてしまう。
図では検出したスイングに人手でラベルを振り、その旨を本文に書いている。

## この分割の限界

正直なところ、この規模には過剰だ。
`Instrument` を値オブジェクトにする実利は、通貨ペアが 3 つしかない今はほとんどない。

効いてくるのは、実データを入れて検証を回し始めたとき——
指標の添字が 1 本ずれているだけで結論が変わるようになってからで、
今の形はその練習に近い。
