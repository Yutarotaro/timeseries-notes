/**
 * 時間足。値オブジェクト。
 *
 * 「上位足」「下位足」はドメインの言葉なので、分数の大小比較を
 * アプリケーション層に散らかさずここに閉じ込める。
 */
export class TimeFrame {
  #code;
  #minutes;
  #label;

  constructor(code, minutes, label) {
    this.#code = code;
    this.#minutes = minutes;
    this.#label = label;
    Object.freeze(this);
  }

  get code() { return this.#code; }
  get minutes() { return this.#minutes; }
  get label() { return this.#label; }

  isHigherThan(other) { return this.#minutes > other.minutes; }

  /** その足 1 本が何本分の下位足に相当するか。 */
  ratioTo(lower) { return this.#minutes / lower.minutes; }

  equals(other) { return other instanceof TimeFrame && other.code === this.#code; }
  toString() { return this.#code; }

  static M5 = new TimeFrame('M5', 5, '5 分足');
  static M15 = new TimeFrame('M15', 15, '15 分足');
  static H1 = new TimeFrame('H1', 60, '1 時間足');
  static H4 = new TimeFrame('H4', 240, '4 時間足');
  static D1 = new TimeFrame('D1', 1440, '日足');
  static W1 = new TimeFrame('W1', 7200, '週足');

  static all() { return [TimeFrame.M5, TimeFrame.M15, TimeFrame.H1, TimeFrame.H4, TimeFrame.D1, TimeFrame.W1]; }
}
