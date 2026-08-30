const STORAGE_KEY = 'notes.theme';

/**
 * 明暗の切り替え。
 *
 * 図の色は CSS 変数なので、テーマを変えても再描画は要らない。
 * 保存できない環境（プライベートウィンドウ等）では例外が出るが、
 * その場合はセッション内だけ有効という挙動でよい。
 */
export class ThemeController {
  #button;

  constructor(button) { this.#button = button; }

  start() {
    const saved = this.#read();
    if (saved) document.documentElement.dataset.theme = saved;
    this.#sync();
    this.#button?.addEventListener('click', () => {
      const next = this.#current() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      this.#write(next);
      this.#sync();
    });
  }

  #current() {
    return document.documentElement.dataset.theme
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  #sync() {
    if (!this.#button) return;
    const dark = this.#current() === 'dark';
    this.#button.textContent = dark ? '☀' : '☾';
    this.#button.setAttribute('aria-label', dark ? '明るいテーマに切り替え' : '暗いテーマに切り替え');
  }

  #read() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  #write(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* 保存できないだけなので続行 */ }
  }
}
