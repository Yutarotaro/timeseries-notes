/** 見出しから目次を作り、読んでいる位置を追いかける。 */
export class TableOfContents {
  #nav; #links = []; #observer = null;

  constructor(nav) { this.#nav = nav; }

  build(sections) {
    const list = document.createElement('ol');
    list.className = 'toc__list';
    sections.forEach((section) => {
      const heading = section.querySelector('h2');
      if (!heading || !section.id) return;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = heading.textContent;
      link.dataset.target = section.id;
      item.appendChild(link);
      list.appendChild(item);
      this.#links.push(link);
    });
    const panel = this.#nav.querySelector('details') ?? this.#nav;
    const host = this.#nav.querySelector('[data-toc]') ?? this.#nav;
    host.replaceChildren(list);

    // 狭い画面では目次を畳んでおく。開いたままだと本文が 1 画面ぶん下がる。
    if (panel instanceof HTMLDetailsElement && window.matchMedia('(max-width: 900px)').matches) {
      panel.open = false;
    }
    list.addEventListener('click', () => {
      if (panel instanceof HTMLDetailsElement && window.matchMedia('(max-width: 900px)').matches) {
        panel.open = false;
      }
    });

    this.#observe(sections);
  }

  #observe(sections) {
    this.#observer?.disconnect();
    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        this.#links.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.target === entry.target.id);
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    sections.forEach((s) => this.#observer.observe(s));
  }
}
