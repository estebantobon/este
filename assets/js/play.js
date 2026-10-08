/* Play page: featured video, category filters and an accessible lightbox. */
(() => {
  const feature = document.querySelector('.feature-video video');
  if (feature && !document.documentElement.classList.contains('reduce-motion') && 'IntersectionObserver' in window) {
    feature.loop = true;
    let userPaused = false;
    feature.addEventListener('pause', () => { if (feature.dataset.auto !== '1') userPaused = true; feature.dataset.auto = ''; });
    feature.addEventListener('play', () => { userPaused = false; });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) feature.play().catch(() => {});
      else if (!e.isIntersecting && !feature.paused) { feature.dataset.auto = '1'; feature.pause(); }
    }, { threshold: 0.4 }).observe(feature);
  }

  const tiles = [...document.querySelectorAll('.tile')];
  const chips = [...document.querySelectorAll('.chip')];
  const status = document.getElementById('filter-status');

  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    let shown = 0;
    tiles.forEach(t => {
      const on = f === 'all' || t.dataset.cat === f;
      t.classList.toggle('hide', !on);
      if (on) { shown++; t.classList.add('in'); }
    });
    if (status) status.textContent = `${shown} items shown`;
  }));

  const dlg = document.querySelector('.lightbox');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const art = dlg.querySelector('.lb-art');
  const title = dlg.querySelector('#lb-title');
  const desc = dlg.querySelector('#lb-desc');
  let idx = 0, opener = null;
  const visible = () => tiles.filter(t => !t.classList.contains('hide'));

  const show = t => {
    idx = visible().indexOf(t);
    const media = t.querySelector('.tile-art > *').cloneNode(true);
    media.style.transform = '';
    art.replaceChildren(media);
    art.style.setProperty('--h', t.style.getPropertyValue('--h'));
    title.textContent = t.dataset.title;
    desc.textContent = t.dataset.desc;
  };
  tiles.forEach(t => t.addEventListener('click', () => {
    opener = t; show(t); dlg.showModal();
  }));
  const step = d => { const v = visible(); show(v[(idx + d + v.length) % v.length]); };
  dlg.addEventListener('click', e => {
    const b = e.target.closest('[data-lb]');
    if (b) b.dataset.lb === 'close' ? dlg.close() : step(b.dataset.lb === 'next' ? 1 : -1);
    else if (e.target === dlg) dlg.close(); // backdrop click
  });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  dlg.addEventListener('close', () => opener?.focus());
})();
