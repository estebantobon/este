/* Me page: toolkit category filter. */
(() => {
  const chips = [...document.querySelectorAll('.filters .chip')];
  const groups = [...document.querySelectorAll('.tool-group')];
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    groups.forEach(g => {
      const on = f === 'all' || g.dataset.cat === f;
      g.classList.toggle('hide', !on);
      if (on) g.classList.add('in');
    });
  }));
})();
