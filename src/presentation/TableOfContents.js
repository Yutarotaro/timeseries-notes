/**
 * 見出しから目次を作り、読んでいる位置を追いかける。
 *
 * 章が 30 を超えると平らな一覧では読めないので、部（section.part）と
 * 章（その中の section[id]）の 2 階層で出す。
 */
export class TableOfContents {
  #nav; #links = []; #observer = null;

  constructor(nav) { this.#nav = nav; }

  build(parts) {
    const list = document.createElement('ol');
    list.className = 'toc__parts';
    const chapters = [];

    parts.forEach((part) => {
      const partTitle = part.querySelector('.part__title');
      const item = document.createElement('li');
      item.className = 'toc__part';

      if (partTitle) {
        const heading = document.createElement('a');
        heading.className = 'toc__partlink';
        heading.href = `#${part.id}`;
        heading.textContent = partTitle.textContent;
        const number = part.querySelector('.part__number');
        if (number) heading.dataset.number = number.textContent;
        item.appendChild(heading);
      }

      const sublist = document.createElement('ol');
      sublist.className = 'toc__list';
      part.querySelectorAll(':scope > section[id]').forEach((section) => {
        const title = section.querySelector('h3');
        if (!title) return;
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = title.textContent;
        link.dataset.target = section.id;
        li.appendChild(link);
        sublist.appendChild(li);
        this.#links.push(link);
        chapters.push(section);
      });

      if (sublist.childElementCount) item.appendChild(sublist);
      list.appendChild(item);
    });

    const panel = this.#nav.querySelector('details') ?? this.#nav;
    const host = this.#nav.querySelector('[data-toc]') ?? this.#nav;
    host.replaceChildren(list);

    // 狭い画面では目次を畳んでおく。開いたままだと本文が 1 画面ぶん下がる。
    // 画面幅が境界をまたいだときも追従させる（読み込み時だけの判定だと、
    // 横向きにした端末や広げたウィンドウで畳まれたままになる）。
    const media = window.matchMedia('(max-width: 900px)');
    const narrow = () => media.matches;
    if (panel instanceof HTMLDetailsElement) {
      panel.open = !narrow();
      media.addEventListener('change', () => { panel.open = !narrow(); });
    }
    list.addEventListener('click', () => {
      if (panel instanceof HTMLDetailsElement && narrow()) panel.open = false;
    });

    this.#observe(chapters);
  }

  #observe(sections) {
    this.#observer?.disconnect();
    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        this.#links.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.target === entry.target.id);
        });
        // 読んでいる章が畳まれた部の中にあると印が見えないので、その部を開く
        const active = this.#links.find((link) => link.classList.contains('is-active'));
        active?.closest('.toc__part')?.classList.add('is-current');
        this.#links.forEach((link) => {
          if (link !== active) link.closest('.toc__part')?.classList.remove('is-current');
        });
      });
    }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });
    sections.forEach((s) => this.#observer.observe(s));
  }
}
