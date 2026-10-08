/* Index page extras: showreel play/pause, prompt typing, stat count-up. */
(() => {
  const reduced = document.documentElement.classList.contains('reduce-motion');

  /* Showreel: play only while visible, honour reduced motion, user can toggle */
  const video = document.getElementById('reel');
  const toggle = document.querySelector('.reel-toggle');
  if (video && toggle) {
    let userPaused = reduced;
    const sync = () => {
      toggle.textContent = video.paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-pressed', String(video.paused));
    };
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    toggle.addEventListener('click', () => {
      userPaused = !video.paused;
      video.paused ? video.play() : video.pause();
    });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) video.play().catch(() => {});
      else if (!e.isIntersecting) video.pause();
    }, { threshold: 0.3 }).observe(video);
    sync();
  }

  /* Prompt bar types the example brief, "sends", then repeats */
  const prompt = document.querySelector('.prompt');
  const out = prompt?.querySelector('.prompt-text');
  if (prompt && out) {
    const full = out.dataset.type;
    if (reduced) out.textContent = full;
    else {
      let started = false;
      const run = async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        for (;;) {
          prompt.classList.remove('sent');
          for (let i = 0; i <= full.length; i++) {
            out.textContent = full.slice(0, i);
            await wait(full[i - 1] === ' ' ? 55 : 28 + Math.random() * 30);
          }
          await wait(700);
          prompt.classList.add('sent');
          await wait(2600);
          out.textContent = '';
          await wait(500);
        }
      };
      new IntersectionObserver(([e], io) => {
        if (e.isIntersecting && !started) { started = true; io.disconnect(); run(); }
      }, { threshold: 0.6 }).observe(prompt);
    }
  }

  /* Count-up numbers */
  if (!reduced) {
    document.querySelectorAll('[data-count]').forEach(el => {
      const to = +el.dataset.count;
      el.textContent = '0';
      new IntersectionObserver(([e], io) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now(), dur = 1400;
        const step = now => {
          const t = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - t, 4);
          el.textContent = Math.round(to * k);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 }).observe(el);
    });
  }
})();
