/* Scroll-driven particle hero.
   A browser port of ParticleForm from motion-studio: seeded particles
   assemble into a sphere, then morph ring -> helix -> "ET" as you scroll.
   Positions spring toward their scroll target, so scrubbing feels physical. */
(() => {
  const section = document.querySelector('.hero');
  const canvas = document.getElementById('hero-canvas');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = document.documentElement.classList.contains('reduce-motion');
  const chapters = [...section.querySelectorAll('.chapter')];
  const ticks = [...section.querySelectorAll('.hero-progress li')];
  const hint = section.querySelector('.scroll-hint');

  // Seeded RNG so the form is identical on every load
  const rng = (s => () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  })(20261006);

  const small = innerWidth < 700;
  const N = small ? 1100 : 2000;

  /* ---- Target shapes (unit ~ 2.2 radius, same maths as ParticleForm) ---- */
  const sphere = i => {
    const t = (i + 0.5) / N, phi = Math.acos(1 - 2 * t), th = Math.PI * (1 + Math.sqrt(5)) * i;
    return [Math.sin(phi) * Math.cos(th) * 2.2, Math.cos(phi) * 2.2, Math.sin(phi) * Math.sin(th) * 2.2];
  };
  const ring = i => {
    const t = i / N, a = t * Math.PI * 2 * 7, r = 2.1 + 0.4 * Math.sin(a * 3);
    return [Math.cos(t * Math.PI * 2) * r, Math.sin(t * Math.PI * 2) * r * 0.9, Math.sin(a) * 0.45];
  };
  const helix = i => {
    // double helix with rungs: every 7th particle sits on a rung between strands
    const strand = i % 2, t = (i >> 1) / (N / 2), a = t * Math.PI * 9 + strand * Math.PI;
    if (i % 7 === 0) {
      const u = rng() * 2 - 1, b = t * Math.PI * 9;
      return [Math.cos(b) * 1.15 * u, (t - 0.5) * 5.4, Math.sin(b) * 1.15 * u];
    }
    return [Math.cos(a) * 1.15, (t - 0.5) * 5.4, Math.sin(a) * 1.15];
  };
  const textPts = (() => {
    const c = document.createElement('canvas'), w = 360, h = 200;
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.font = '700 190px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('ET', w / 2, h / 2 + 8);
    const data = g.getImageData(0, 0, w, h).data, pts = [];
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 140) pts.push([(x - w / 2) / 62, -(y - h / 2) / 62]);
    }
    return pts;
  })();
  const text = i => {
    const p = textPts[Math.floor(rng() * textPts.length)] || [0, 0];
    return [p[0] + (rng() - 0.5) * 0.03, p[1] + (rng() - 0.5) * 0.03, (rng() - 0.5) * 0.25];
  };
  const forms = [sphere, ring, helix, text].map(f => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) a.set(f(i), i * 3);
    return a;
  });

  /* ---- Particle state ---- */
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  const delay = new Float32Array(N), size = new Float32Array(N);
  const col = [];
  const stops = [[168, 220, 255], [142, 92, 247]];
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = (rng() - 0.5) * 16; // start scattered
    delay[i] = rng();
    size[i] = 0.9 + rng() * 1.4;
    // colour follows height on the sphere, so the gradient reads as one sweep
    const t = Math.min(0.999, Math.max(0, (forms[0][i * 3 + 1] / 2.2 + 1) / 2 * 0.9 + rng() * 0.1));
    const s = t * (stops.length - 1), j = Math.floor(s), f = s - j, A = stops[j], B = stops[j + 1];
    col.push(`rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * f)).join(',')})`);
  }

  /* ---- Sizing ---- */
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  /* ---- Input ---- */
  let mx = -1e4, my = -1e4, rotX = 0.25, rotY = 0, tiltX = 0, tiltY = 0;
  addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    tiltY = (mx / W - 0.5) * 0.6; tiltX = (my / H - 0.5) * 0.4;
  }, { passive: true });
  addEventListener('pointerleave', () => { mx = my = -1e4; });

  const progress = () => {
    const r = section.getBoundingClientRect();
    const span = section.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---- Chapters ---- */
  let activeChapter = -1;
  const setChapter = n => {
    if (n === activeChapter) return;
    activeChapter = n;
    chapters.forEach((c, i) => {
      const on = i === n;
      c.classList.toggle('on', on);
      c.setAttribute('aria-hidden', String(!on));
    });
    ticks.forEach((t, i) => t.classList.toggle('on', i === n));
  };

  /* ---- Loop ---- */
  let running = true, last = performance.now(), spin = 0, born = performance.now();
  const frame = now => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const p = reduced ? 0 : progress();
    const stages = forms.length - 1;
    const s = p * stages * 1.08;              // hold the final form for the last stretch
    const seg = Math.min(stages - 1, Math.floor(s));
    const local = Math.min(1, s - seg);
    setChapter(Math.min(stages, Math.round(s - 0.15)));
    if (hint) hint.style.opacity = p > 0.03 ? 0 : 1;

    // Text stage faces the camera; other stages turn slowly
    const textW = seg === stages - 1 ? ease(local) : 0;
    if (!reduced) spin += dt * 0.18 * (1 - textW);
    const ry = (spin + tiltY) * (1 - textW) + tiltY * 0.25 * textW;
    const rx = (rotX + tiltX) * (1 - textW) + tiltX * 0.15 * textW;
    rotY = ry;

    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const wide = W > 1000;
    const scale = Math.min(W, H) * (small ? 0.15 : 0.145);
    const ox = wide ? W * 0.63 : W / 2, oy = H * (small ? 0.38 : 0.45), cam = 8;
    const A = forms[seg], B = forms[seg + 1];
    const intro = Math.min(1, (now - born) / 1600);

    ctx.clearRect(0, 0, W, H);
    // soft core glow behind the form
    const gR = scale * 3.2, glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, gR);
    glow.addColorStop(0, 'rgba(142,92,247,0.16)'); glow.addColorStop(0.5, 'rgba(61,107,255,0.06)'); glow.addColorStop(1, 'rgba(14,14,14,0)');
    ctx.fillStyle = glow; ctx.fillRect(ox - gR, oy - gR, gR * 2, gR * 2);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      // staggered morph: each particle starts its move at a slightly different moment
      const d = delay[i] * 0.35;
      const t = ease(Math.min(1, Math.max(0, (local - d) / (1 - 0.35))));
      const i3 = i * 3;
      let tx = A[i3] + (B[i3] - A[i3]) * t;
      let ty = A[i3 + 1] + (B[i3 + 1] - A[i3 + 1]) * t;
      let tz = A[i3 + 2] + (B[i3 + 2] - A[i3 + 2]) * t;
      // breathing
      const br = 1 + Math.sin(now / 900 + delay[i] * 6) * 0.012;
      tx *= br; ty *= br; tz *= br;

      if (reduced) { pos[i3] = tx; pos[i3 + 1] = ty; pos[i3 + 2] = tz; }
      else {
        const k = intro < 1 ? 26 * (0.3 + intro) : 34, damp = Math.exp(-9 * dt);
        vel[i3] = (vel[i3] + (tx - pos[i3]) * k * dt) * damp;
        vel[i3 + 1] = (vel[i3 + 1] + (ty - pos[i3 + 1]) * k * dt) * damp;
        vel[i3 + 2] = (vel[i3 + 2] + (tz - pos[i3 + 2]) * k * dt) * damp;
        pos[i3] += vel[i3] * dt * 6; pos[i3 + 1] += vel[i3 + 1] * dt * 6; pos[i3 + 2] += vel[i3 + 2] * dt * 6;
      }

      // rotate (Y then X) and project
      const x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2];
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const persp = cam / (cam - z2);
      let px = ox + x1 * scale * persp, py = oy - y1 * scale * persp;

      // pointer repulsion in screen space, fed back into velocity
      const dx = px - mx, dy = py - my, d2 = dx * dx + dy * dy, R = 110;
      if (d2 < R * R && !reduced) {
        const f = (1 - Math.sqrt(d2) / R) * 0.9;
        vel[i3] += (dx / scale) * f; vel[i3 + 1] -= (dy / scale) * f;
      }

      const depth = (z2 + 2.6) / 5.2; // ~0 back .. 1 front
      const r = size[i] * persp * (small ? 1.05 : 1.2);
      ctx.globalAlpha = 0.35 + Math.max(0, Math.min(1, depth)) * 0.65;
      ctx.fillStyle = col[i];
      ctx.fillRect(px - r / 2, py - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  };

  // Pause when the hero is off screen or the tab is hidden
  const start = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
  const stop = () => { running = false; };
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(section);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  requestAnimationFrame(frame);
})();
