const STORAGE_KEY = 'notes.theme';

// 記号（☾ など）はフォント次第で描かれないことがあるので図形で持つ
const MOON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.6 5.6 0 1 0 6.6 6.6Z" fill="currentColor"/></svg>';
const SUN = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<circle cx="8" cy="8" r="3.2" fill="currentColor"/>'
  + '<g stroke="currentColor" stroke-width="1.3" stroke-linecap="round">'
  + '<path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6"/>'
  + '<path d="M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1"/>'
  + '</g></svg>';

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
    this.#button.innerHTML = dark ? SUN : MOON;
    this.#button.setAttribute('aria-label', dark ? '明るいテーマに切り替え' : '暗いテーマに切り替え');
  }

  #read() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  #write(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* 保存できないだけなので続行 */ }
  }
}
