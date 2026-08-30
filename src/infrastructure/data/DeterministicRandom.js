/**
 * 決定論的な擬似乱数（mulberry32）。
 *
 * 図がリロードのたびに変わると、本文の「ここで包み足が出ている」が
 * 嘘になる。乱数を使う以上シードは必ず固定する、というのは
 * この手のコード全般の作法でもある。
 */
export class DeterministicRandom {
  #state;

  constructor(seed) {
    this.#state = seed >>> 0;
  }

  next() {
    this.#state = (this.#state + 0x6d2b79f5) >>> 0;
    let t = this.#state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** -0.5 〜 +0.5 */
  centered() { return this.next() - 0.5; }
}
