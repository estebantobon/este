/* Shared behaviour for every page: pill nav, scroll reveal, parallax,
   cursor glow, card spotlight/tilt, page transitions. No dependencies. */
(() => {
  const reduced = document.documentElement.classList.contains('reduce-motion');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---- Pill nav: slide the highlight to the active or hovered link ---- */
  const links = [...document.querySelectorAll('.nav-links a')];
  const pill = document.querySelector('.nav-pill');
  const current = links.find(a => a.getAttribute('aria-current') === 'page') || links[0];
  const moveTo = a => {
    if (!pill || !a) return;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  if (pill) {
    moveTo(current);
    links.forEach(a => {
      a.addEventListener('mouseenter', () => moveTo(a));
      a.addEventListener('focus', () => moveTo(a));
    });
    document.querySelector('.nav-links')?.addEventListener('mouseleave', () => moveTo(current));
    addEventListener('resize', () => moveTo(current));
    document.fonts?.ready.then(() => moveTo(current));
  }

  /* ---- Page transitions: fade out before following an internal link ---- */
  if (!reduced) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => (location.href = url.href), 320);
    });
    addEventListener('pageshow', e => e.persisted && document.body.classList.remove('leaving'));
  }

  /* ---- Fade-in on scroll ---- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }

  /* ---- Parallax: [data-speed] drifts relative to the viewport centre ---- */
  const para = [...document.querySelectorAll('[data-speed]')];

  /* ---- Word-by-word statement that lights up as you scroll ---- */
  const statements = [...document.querySelectorAll('.statement')];
  statements.forEach(s => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else { const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.append(w); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(s);
    s._words = [...s.querySelectorAll('.w')];
  });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = innerHeight;
      if (!reduced) {
        for (const el of para) {
          const r = el.getBoundingClientRect();
          const mid = r.top + r.height / 2 - vh / 2;
          el.style.transform = `translate3d(0, ${(-mid * parseFloat(el.dataset.speed)).toFixed(1)}px, 0)`;
        }
      }
      for (const s of statements) {
        const r = s.getBoundingClientRect();
        // 0 when the block's top hits 85% of the viewport, 1 when its bottom reaches 45%
        const p = reduced ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.4)));
        const n = Math.round(p * s._words.length);
        s._words.forEach((w, i) => w.classList.toggle('lit', i < n));
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- Cursor glow + card spotlight/tilt (fine pointers only) ---- */
  if (finePointer && !reduced) {
    const glow = document.createElement('div');
    glow.className = 'glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.prepend(glow);
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      root.classList.add('has-pointer');
    }, { passive: true });
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.querySelectorAll('.card, .tile').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---- Motion toggle in the footer (remembered per visitor) ---- */
  document.querySelectorAll('.motion-toggle').forEach(btn => {
    btn.setAttribute('aria-pressed', String(reduced));
    btn.textContent = reduced ? 'Turn motion on' : 'Reduce motion';
    btn.addEventListener('click', () => {
      try { localStorage.setItem('motion', reduced ? 'on' : 'off'); } catch (e) {}
      location.reload();
    });
  });

  /* ---- Year in footer ---- */
  document.querySelectorAll('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));
})();
