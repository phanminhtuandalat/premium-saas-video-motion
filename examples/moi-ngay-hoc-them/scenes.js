/* Minh họa phẳng vẽ bằng SVG, mỗi cảnh là hàm thuần của thời gian cục bộ u (giây từ lúc clip bắt đầu).
 * window.SCENES[id] = { build(svgRoot), draw(u, dur) }  — khung 1080×1920, không random không seed, không rAF. */
(() => {
  const NS = 'http://www.w3.org/2000/svg', W = 1080, H = 1920;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const eOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const el = (tag, at, par) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (par) par.appendChild(e); return e; };
  const set = (e, at) => { for (const k in at) e.setAttribute(k, typeof at[k] === 'number' ? +at[k].toFixed(2) : at[k]); };
  const P = { ink: '#2b3a1f', leaf: ['#3f8f3a', '#5fae45', '#86c75a', '#2f6e33'], soil: '#6b4a2f', soil2: '#523620', cream: '#fff6e0', sun: '#ffd36b', hot: '#ff9a4d', sky1: '#ffe9b8', sky2: '#fbb77a', sky3: '#9fd3c7', paper: '#f6ecd2', code: ['#7ee787', '#79c0ff', '#ffa657', '#d2a8ff', '#ff7b72'] };
  let uid = 0; const gid = () => 'g' + (++uid);
  const grad = (defs, stops, a = [0, 0, 0, 1]) => { const id = gid(), g = el('linearGradient', { id, x1: a[0], y1: a[1], x2: a[2], y2: a[3] }, defs); stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, g)); return `url(#${id})`; };
  const radial = (defs, c, o0 = 1) => { const id = gid(), g = el('radialGradient', { id }, defs); el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': o0 }, g); el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0 }, g); return `url(#${id})`; };
  const base = (svg, colors) => { const defs = el('defs', {}, svg); el('rect', { width: W, height: H, fill: grad(defs, colors) }, svg); return defs; };
  const hill = (par, y, amp, col, ph, wl = 900) => { let d = `M0 ${H} L0 ${y}`; for (let x = 0; x <= W; x += 40) d += ` L${x} ${(y + Math.sin(x / wl * 6.28 + ph) * amp + Math.sin(x / 260 + ph * 2) * amp * .35).toFixed(1)}`; return el('path', { d: d + ` L${W} ${H} Z`, fill: col }, par); };
  const sun = (par, defs, cx, cy, r) => { const g = el('g', {}, par); el('circle', { cx, cy, r: r * 3.2, fill: radial(defs, '#fff0b0', .9) }, g); const c = el('circle', { cx, cy, r, fill: P.sun }, g); return { g, c }; };
  const plantG = (par, x, y, s, col) => { const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, par); [-1, 0, 1].forEach((k, i) => el('ellipse', { cx: k * 16, cy: -22 + Math.abs(k) * 6, rx: 11, ry: 24, fill: col || P.leaf[i % 3], transform: `rotate(${k * 28} ${k * 16} 0)` }, g)); el('rect', { x: -2, y: -8, width: 4, height: 10, fill: P.leaf[3] }, g); return g; };
  const farmer = (par, s = 1) => { const g = el('g', {}, par), c = P.ink;
    const legL = el('rect', { x: -22, y: 0, width: 16, height: 120, rx: 8, fill: c }, g), legR = el('rect', { x: 6, y: 0, width: 16, height: 120, rx: 8, fill: c }, g);
    el('rect', { x: -34, y: -150, width: 68, height: 170, rx: 30, fill: '#35502a' }, g);
    el('circle', { cx: 0, cy: -178, r: 24, fill: '#3b2a1a' }, g);
    el('ellipse', { cx: 0, cy: -194, rx: 60, ry: 12, fill: '#d7b66a' }, g); el('path', { d: 'M-34 -196 Q0 -246 34 -196 Z', fill: '#e6c97f' }, g);
    const arm = el('rect', { x: -50, y: -140, width: 16, height: 100, rx: 8, fill: '#35502a' }, g);
    g._legL = legL; g._legR = legR; g._arm = arm; return g; };
  const rowsTo = (par, vp, n, side, col) => { const g = el('g', {}, par); for (let i = 0; i < n; i++) { const f = i / (n - 1), y = lerp(vp[1] + 30, H, Math.pow(f, 1.8)), x = lerp(vp[0] + side * 30, vp[0] + side * 520, Math.pow(f, 1.8)), s = lerp(.35, 2.3, Math.pow(f, 1.8)); plantG(g, x, y, s, col); plantG(g, x + side * 130 * s, y + 20 * s, s * .9, col); } return g; };

  const S = {};

  /* 1 · anh đi trong vườn lúc bình minh */
  S.walk = {
    build(svg) { const d = base(svg, [[0, P.sky2], [.45, P.sky1], [1, '#d9efb8']]); this.sun = sun(svg, d, 540, 760, 130);
      hill(svg, 820, 40, '#a8d08a', 0); hill(svg, 900, 30, '#86c06a', 2);
      el('path', { d: `M470 ${H} L520 930 L560 930 L610 ${H} Z`, fill: '#c89a62' }, svg);
      this.L = rowsTo(svg, [540, 930], 9, -1); this.R = rowsTo(svg, [540, 930], 9, 1);
      this.mist = [0, 1, 2].map(i => el('rect', { x: -200, y: 880 + i * 90, width: W + 400, height: 90, rx: 45, fill: '#fff', opacity: .2 }, svg));
      this.f = farmer(svg); },
    draw(u, d) { const k = clamp(u / d), sw = Math.sin(u * 5.2);
      set(this.sun.c, { cy: lerp(780, 700, ease(k)) }); this.mist.forEach((m, i) => set(m, { x: -200 + Math.sin(u * .5 + i) * 60, opacity: .18 + .05 * Math.sin(u + i) }));
      const y = lerp(1250, 1040, ease(k)), s = lerp(1.0, .5, ease(k)); this.f.setAttribute('transform', `translate(${540 + Math.sin(u * 2.6) * 6} ${y}) scale(${s})`);
      set(this.f._legL, { y: Math.max(0, sw) * -14 }); set(this.f._legR, { y: Math.max(0, -sw) * -14 }); this.f._arm.setAttribute('transform', `rotate(${sw * 14} -42 -140)`); }
  };

  /* 2 · lá cây bệnh + kính lúp */
  S.leaf = {
    build(svg) { const d = base(svg, [[0, '#cfe8b4'], [1, '#6fae5a']]); hill(svg, 1500, 60, '#4e8f44', 1); hill(svg, 1650, 50, '#3f7a39', 3);
      const g = el('g', { transform: 'translate(540 900)' }, svg); this.leaf = g;
      el('path', { d: 'M0 520 C-480 300 -420 -380 0 -520 C420 -380 480 300 0 520 Z', fill: P.leaf[1] }, g); el('path', { d: 'M0 520 L0 -500', stroke: P.leaf[3], 'stroke-width': 16, fill: 'none' }, g);
      for (let i = 0; i < 5; i++) { const y = -350 + i * 170; el('path', { d: `M0 ${y + 110} Q-150 ${y + 40} -300 ${y - 20}`, stroke: P.leaf[3], 'stroke-width': 7, fill: 'none', opacity: .7 }, g); el('path', { d: `M0 ${y + 110} Q150 ${y + 40} 300 ${y - 20}`, stroke: P.leaf[3], 'stroke-width': 7, fill: 'none', opacity: .7 }, g); }
      this.spots = [[-150, -120, 24], [110, 40, 30], [-60, 190, 20], [170, -230, 18]].map(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#a0521d', opacity: .9 }, g));
      this.lens = el('g', {}, svg); el('circle', { r: 190, fill: 'rgba(255,255,255,.16)', stroke: '#6b4a2f', 'stroke-width': 28 }, this.lens); el('circle', { r: 160, fill: 'none', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 6 }, this.lens);
      el('rect', { x: 150, y: 150, width: 36, height: 260, rx: 18, fill: '#6b4a2f', transform: 'rotate(-45 168 280)' }, this.lens); this.big = el('circle', { r: 0, fill: '#a0521d', opacity: .0 }, this.lens); },
    draw(u, d) { const k = clamp(u / d), t = u * .6; set(this.leaf.firstChild, {}); this.leaf.setAttribute('transform', `translate(540 ${900 + Math.sin(t) * 12}) rotate(${Math.sin(t * .8) * 2})`);
      const tg = [[390, 780], [650, 940], [480, 1090]], seg = k * 2.99, i = Math.min(2, Math.floor(seg)), f = ease(seg - i), a = tg[i], b = tg[Math.min(2, i + 1)];
      const x = lerp(a[0], b[0], f) + Math.sin(u * 3) * 6, y = lerp(a[1], b[1], f) + Math.cos(u * 2.3) * 6; this.lens.setAttribute('transform', `translate(${x} ${y})`);
      set(this.big, { r: 64 + 6 * Math.sin(u * 4), opacity: .85 }); } };

  /* 3 · cây con nhổ lên, rễ trắng */
  S.roots = {
    build(svg) { const d = base(svg, [[0, '#f3e6c4'], [.55, '#e9d6a8'], [1, '#7a5636']]); el('rect', { x: 0, y: 1250, width: W, height: 670, fill: P.soil }, svg); hill(svg, 1250, 22, P.soil, 0);
      this.crumbs = Array.from({ length: 14 }, (_, i) => el('circle', { r: 6 + (i % 4) * 3, fill: P.soil2 }, svg));
      this.g = el('g', {}, svg);
      el('path', { d: 'M0 0 L0 -430', stroke: P.leaf[3], 'stroke-width': 16, fill: 'none' }, this.g); [[-1, -330], [1, -400], [-1, -440]].forEach(([s, y], i) => el('path', { d: `M0 ${y + 40} C${s * 150} ${y - 30} ${s * 230} ${y - 120} ${s * 160} ${y - 200} C${s * 90} ${y - 120} 0 ${y - 60} 0 ${y + 40}`, fill: P.leaf[i], opacity: .95 }, this.g));
      const rg = el('g', {}, this.g); for (let i = 0; i < 11; i++) { const a = (-70 + i * 14) * Math.PI / 180, L = 150 + (i % 3) * 70; el('path', { d: `M0 0 Q${Math.sin(a) * L * .4} ${L * .5} ${Math.sin(a) * L} ${Math.cos(a) * L}`, stroke: '#fff8e8', 'stroke-width': 9 - (i % 3) * 2, fill: 'none', 'stroke-linecap': 'round' }, rg); }
      this.book = el('g', { transform: 'translate(190 1500) rotate(-6)' }, svg); el('rect', { width: 330, height: 220, rx: 14, fill: P.paper, stroke: '#b9a470', 'stroke-width': 6 }, this.book); [50, 90, 130, 170].forEach(y => el('line', { x1: 30, x2: 300, y1: y, y2: y, stroke: '#8a7a4f', 'stroke-width': 4 }, this.book)); },
    draw(u, d) { const k = ease(clamp(u / (d * .7))); this.g.setAttribute('transform', `translate(${540 + Math.sin(u * 1.4) * 10} ${lerp(1500, 1000, k) + Math.sin(u * 2) * 6}) rotate(${Math.sin(u * 1.1) * 3})`);
      this.crumbs.forEach((c, i) => { const f = clamp((u - .4 - i * .07) / 1.4), x = 540 + (i - 7) * 26 + Math.sin(i * 2) * 20, y = 1030 + f * f * 520 + (i % 3) * 20; set(c, { cx: x, cy: y, opacity: f > 0 && f < 1 ? 1 : 0 }); }); } };

  /* 4 · ghi chép + cảm biến + trà */
  S.notes = {
    build(svg) { const d = base(svg, [[0, '#f6e7c8'], [1, '#d9b98a']]); el('rect', { x: 0, y: 1180, width: W, height: 740, fill: '#a9784a' }, svg); for (let i = 0; i < 8; i++) el('rect', { x: 0, y: 1180 + i * 95, width: W, height: 4, fill: '#8d6038', opacity: .6 }, svg);
      el('rect', { x: 120, y: 120, width: 840, height: 640, rx: 24, fill: '#bfe3f0' }, svg); this.win = el('g', {}, svg); hill(svg, 600, 36, '#7fbf67', 0).setAttribute('clip-path', '');
      const nb = el('g', { transform: 'translate(210 1020) rotate(-3)' }, svg); el('rect', { width: 640, height: 780, rx: 20, fill: P.paper, stroke: '#b9a470', 'stroke-width': 8 }, nb); for (let i = 0; i < 12; i++) el('line', { x1: 50, x2: 590, y1: 90 + i * 55, y2: 90 + i * 55, stroke: '#b9c7d6', 'stroke-width': 3 }, nb);
      this.ink = Array.from({ length: 8 }, (_, i) => el('path', { d: `M50 ${80 + i * 55} q30 -18 60 0 t60 0 t60 0 t${60 + (i * 37 % 120)} 0`, stroke: '#2a4f8f', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, nb));
      this.pen = el('g', {}, svg); el('rect', { x: -10, y: -250, width: 20, height: 260, rx: 8, fill: '#2f6e33', transform: 'rotate(28)' }, this.pen); el('path', { d: 'M-10 6 L10 6 L0 28 Z', fill: '#2b3a1f', transform: 'rotate(28)' }, this.pen);
      const sen = el('g', { transform: 'translate(780 1260)' }, svg); el('rect', { width: 230, height: 150, rx: 14, fill: '#1e5a3a' }, sen); el('rect', { x: 20, y: 20, width: 80, height: 60, rx: 6, fill: '#22313a' }, sen); [0, 1, 2, 3].forEach(i => el('circle', { cx: 130 + i * 24, cy: 40, r: 7, fill: '#e8c46a' }, sen)); this.led = el('circle', { cx: 200, cy: 118, r: 9, fill: '#7ee787' }, sen);
      const mug = el('g', { transform: 'translate(760 1500)' }, svg); el('rect', { width: 150, height: 140, rx: 22, fill: '#f6efe2', stroke: '#c6b79a', 'stroke-width': 6 }, mug); el('path', { d: 'M150 36 q60 10 0 70', stroke: '#c6b79a', 'stroke-width': 14, fill: 'none' }, mug);
      this.steam = [0, 1, 2].map(i => el('path', { d: `M${770 + i * 50} 1480 q-20 -40 0 -80 q20 -40 0 -80`, stroke: '#fff', 'stroke-width': 10, fill: 'none', opacity: .5, 'stroke-linecap': 'round' }, svg)); },
    draw(u, d) { this.ink.forEach((p, i) => { const f = clamp((u - .3 - i * .55) / .55); set(p, { 'stroke-dashoffset': 1 - f }); });
      const idx = Math.min(7, Math.floor(Math.max(0, u - .3) / .55)), f = clamp((u - .3 - idx * .55) / .55); this.pen.setAttribute('transform', `translate(${260 + f * 360 + Math.sin(u * 20) * 3} ${1100 + idx * 55 + Math.sin(f * 12) * 10})`);
      set(this.led, { opacity: .55 + .45 * (Math.sin(u * 5) > 0 ? 1 : 0) }); this.steam.forEach((s, i) => set(s, { opacity: .35 + .2 * Math.sin(u * 1.5 + i), transform: `translate(${Math.sin(u + i) * 8} ${-((u * 20 + i * 30) % 60)})` })); } };

  /* 5 · laptop có mã lập trình */
  S.code = {
    build(svg) { const d = base(svg, [[0, '#cfe9d0'], [1, '#8fc58a']]); for (let i = 0; i < 6; i++) plantG(svg, 110 + i * 170, 520 + (i % 2) * 40, 2.4 + (i % 3) * .3, P.leaf[i % 3]);
      el('rect', { x: 0, y: 1500, width: W, height: 420, fill: '#a9784a' }, svg);
      const lp = el('g', { transform: 'translate(140 560)' }, svg); el('rect', { width: 800, height: 520, rx: 28, fill: '#22272e' }, lp); el('rect', { x: 24, y: 24, width: 752, height: 472, rx: 12, fill: '#0d1117' }, lp); el('path', { d: 'M-60 560 L860 560 L800 640 L0 640 Z', fill: '#c9d1d9' }, lp);
      this.lines = Array.from({ length: 13 }, (_, i) => { const g = el('g', { transform: `translate(60 ${64 + i * 34})` }, lp), ind = [0, 0, 1, 1, 2, 2, 1, 1, 2, 1, 0, 1, 0][i] * 36, parts = []; let x = ind; for (let j = 0; j < 4; j++) { const w = 50 + ((i * 53 + j * 71) % 120); parts.push(el('rect', { x, y: 0, width: w, height: 14, rx: 7, fill: P.code[(i + j) % 5] }, g)); x += w + 14; } g._p = parts; g._w = parts.map(p => +p.getAttribute('width')); return g; });
      this.cur = el('rect', { width: 10, height: 20, fill: '#fff' }, lp); this.lp = lp;
      this.cup = el('circle', { cx: 960, cy: 1600, r: 0 }, svg); },
    draw(u, d) { const n = u * 5.5; this.lines.forEach((g, i) => { const f = clamp((n - i * 2.2) / 2.2); g._p.forEach((p, j) => { const a = clamp(f * 4 - j); set(p, { width: Math.max(.1, g._w[j] * a), opacity: a > 0 ? 1 : 0 }); }); });
      const li = Math.min(12, Math.floor(n / 2.2)), g = this.lines[li], f = clamp((n - li * 2.2) / 2.2); let x = 60 + [0, 0, 1, 1, 2, 2, 1, 1, 2, 1, 0, 1, 0][li] * 36; for (let j = 0; j < 4; j++) { const a = clamp(f * 4 - j); x += g._w[j] * a + (a > 0 ? 14 : 0); }
      set(this.cur, { x: x + 4, y: 64 + li * 34 - 3, opacity: Math.sin(u * 8) > 0 ? 1 : .15 }); } };

  /* 6 · cảm biến độ ẩm → tín hiệu */
  S.sensor = {
    build(svg) { const d = base(svg, [[0, '#cfe6f5'], [.4, '#e9f3df'], [1, '#e9f3df']]); el('rect', { x: 0, y: 980, width: W, height: 940, fill: grad(d, [[0, '#7a5636'], [1, '#3c2815']]) }, svg); hill(svg, 980, 18, '#7a5636', 1);
      plantG(svg, 300, 985, 3.2, P.leaf[1]); plantG(svg, 780, 985, 3.8, P.leaf[0]);
      this.drops = Array.from({ length: 9 }, (_, i) => el('circle', { r: 6 + (i % 3) * 2, fill: '#5aa7d8', opacity: .8 }, svg));
      el('rect', { x: 520, y: 930, width: 40, height: 520, rx: 14, fill: '#2f3a44' }, svg); el('rect', { x: 530, y: 1150, width: 20, height: 300, rx: 8, fill: '#c9a96a' }, svg);
      this.box = el('g', { transform: 'translate(380 520)' }, svg); el('rect', { width: 320, height: 220, rx: 24, fill: '#1e5a3a', stroke: '#13402a', 'stroke-width': 8 }, this.box); el('rect', { x: 30, y: 36, width: 130, height: 90, rx: 8, fill: '#22313a' }, this.box);
      this.led = el('circle', { cx: 270, cy: 176, r: 12, fill: '#7ee787' }, this.box);
      this.arcs = [0, 1, 2].map(i => el('path', { d: `M${-60 - i * 50} 0 A${80 + i * 50} ${80 + i * 50} 0 0 1 ${60 + i * 50} 0`, stroke: '#2d7fb8', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round', transform: 'translate(540 440) rotate(-90 0 0) translate(0 -0)' }, svg));
      this.pulses = [0, 1, 2, 3].map(() => el('circle', { cx: 540, r: 12, fill: '#ffd36b' }, svg));
      this.val = el('text', { x: 540, y: 400, 'text-anchor': 'middle', 'font-size': 84, 'font-weight': 800, 'font-family': 'Be Vietnam Pro, sans-serif', fill: '#1e5a3a' }, svg); },
    draw(u, d) { this.arcs.forEach((a, i) => set(a, { opacity: .15 + .85 * clamp(Math.sin(u * 3 - i * .9) * 1.2), transform: `translate(540 372) rotate(0)` }));
      this.pulses.forEach((p, i) => { const f = ((u * .45 + i / 4) % 1); set(p, { cy: lerp(1400, 760, f), opacity: Math.sin(f * 3.14) }); });
      this.drops.forEach((p, i) => { const f = ((u * .35 + i / 9) % 1); set(p, { cx: 200 + i * 90 + Math.sin(i) * 20, cy: lerp(300, 990, f * f), opacity: f < .9 ? .85 : 0 }); });
      set(this.led, { opacity: Math.sin(u * 6) > 0 ? 1 : .3 }); this.val.textContent = Math.round(lerp(38, 64, eOut(u / 3))) + '%'; } };

  /* 7 · tưới nhỏ giọt + máy bơm */
  S.irrigation = {
    build(svg) { const d = base(svg, [[0, P.sky2], [.35, P.sky1], [1, '#d9efb8']]); sun(svg, d, 800, 520, 110); hill(svg, 800, 40, '#a8d08a', 1); el('rect', { x: 0, y: 1000, width: W, height: 920, fill: '#7a5636' }, svg);
      this.pl = [0, 1, 2, 3].flatMap(r => [0, 1, 2, 3, 4].map(c => ({ g: plantG(svg, 110 + c * 215 + (r % 2) * 60, 1120 + r * 130, 1.4 + r * .45, P.leaf[(r + c) % 3]), x: 110 + c * 215 + (r % 2) * 60, y: 1120 + r * 130, s: 1.4 + r * .45 })));
      el('rect', { x: 0, y: 1060, width: W, height: 10, fill: '#2f3a44' }, svg);
      this.drops = Array.from({ length: 10 }, (_, i) => el('path', { d: 'M0 -14 C10 0 10 10 0 12 C-10 10 -10 0 0 -14 Z', fill: '#5aa7d8' }, svg));
      const p = el('g', { transform: 'translate(70 1560)' }, svg); el('rect', { width: 300, height: 240, rx: 28, fill: '#c0392b' }, p); el('rect', { x: 30, y: 30, width: 140, height: 90, rx: 8, fill: '#22313a' }, p); this.led = el('circle', { cx: 240, cy: 60, r: 14, fill: '#7ee787' }, p); this.txt = el('text', { x: 100, y: 96, 'text-anchor': 'middle', 'font-size': 38, 'font-weight': 800, fill: '#7ee787', 'font-family': 'Be Vietnam Pro, sans-serif' }, p); this.txt.textContent = 'AUTO'; },
    draw(u, d) { const k = clamp(u / d); this.pl.forEach((q, i) => q.g.setAttribute('transform', `translate(${q.x} ${q.y}) scale(${q.s * (1 + .12 * ease(k) + .02 * Math.sin(u * 2 + i))})`));
      this.drops.forEach((p, i) => { const f = ((u * .6 + i / 10) % 1), cx = 110 + (i % 5) * 215 + (i < 5 ? 0 : 60); p.setAttribute('transform', `translate(${cx} ${1075 + f * f * 160}) scale(${1 - f * .3})`); set(p, { opacity: f < .85 ? 1 : 0 }); });
      set(this.led, { opacity: Math.sin(u * 4) > 0 ? 1 : .4 }); } };

  /* 8 · toàn cảnh vườn bậc thang */
  S.garden = {
    build(svg) { const d = base(svg, [[0, P.sky2], [.3, P.sky1], [1, '#e3f0c4']]); this.sun = sun(svg, d, 540, 640, 120);
      hill(svg, 760, 70, '#b7d79b', 0); hill(svg, 860, 60, '#93c476', 2);
      this.t = [0, 1, 2, 3].map(i => { const y = 1000 + i * 230, g = el('g', {}, svg); el('path', { d: `M0 ${y} Q540 ${y - 70} ${W} ${y} L${W} ${H} L0 ${H} Z`, fill: P.leaf[(i + 1) % 3 ? 1 : 0], opacity: 1 }, g); el('path', { d: `M0 ${y + 14} Q540 ${y - 56} ${W} ${y + 14}`, stroke: '#a87d52', 'stroke-width': 18, fill: 'none' }, g); for (let c = 0; c < 9; c++) plantG(g, 70 + c * 120 + (i % 2) * 40, y + 60 + Math.sin(c) * 6 - 40, 1.2 + i * .35, P.leaf[(c + i) % 3 + 0]); return g; });
      const h = el('g', { transform: 'translate(760 800)' }, svg); el('rect', { width: 180, height: 110, fill: '#c68b59' }, h); el('path', { d: 'M-20 0 L90 -70 L200 0 Z', fill: '#8a3d2a' }, h); el('rect', { x: 70, y: 40, width: 40, height: 70, fill: '#5a3a22' }, h);
      this.birds = [0, 1, 2].map(() => el('path', { d: 'M-16 0 Q-8 -12 0 0 Q8 -12 16 0', stroke: P.ink, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, svg)); },
    draw(u, d) { const k = clamp(u / d); set(this.sun.c, { cy: lerp(700, 600, ease(k)) });
      this.t.forEach((g, i) => g.setAttribute('transform', `translate(0 ${Math.sin(u * .5 + i) * 3 - ease(k) * (8 + i * 4)})`));
      this.birds.forEach((b, i) => b.setAttribute('transform', `translate(${lerp(-60, 1140, (k * .8 + i * .12) % 1)} ${420 + i * 70 + Math.sin(u * 3 + i) * 12}) scale(${1 + Math.sin(u * 9 + i) * .25} 1)`)); } };

  /* 9 · anh nhìn lại khu vườn lúc hoàng hôn */
  S.lookback = {
    build(svg) { const d = base(svg, [[0, '#5b4b8a'], [.35, '#f08a5d'], [.62, '#ffcf8a'], [1, '#ffe7b0']]); this.sun = sun(svg, d, 540, 820, 150);
      hill(svg, 900, 40, '#8f9f6a', 0); hill(svg, 1000, 40, '#5d8a4c', 2);
      this.rows = [0, 1, 2].map(i => rowsTo(svg, [540, 1010], 7, i - 1 || 1, P.leaf[3 - i]));
      hill(svg, 1290, 50, '#3a6b3a', 4); this.f = farmer(svg); this.f.setAttribute('transform', 'translate(300 1150) scale(1.4)');
      this.birds = [0, 1, 2, 3].map(() => el('path', { d: 'M-16 0 Q-8 -12 0 0 Q8 -12 16 0', stroke: '#3a2a4a', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, svg)); },
    draw(u, d) { const k = clamp(u / d); set(this.sun.c, { cy: lerp(820, 940, ease(k)) });
      this.f.setAttribute('transform', `translate(300 1150) scale(1.4) rotate(${Math.sin(u * .8) * .6})`); this.f._arm.setAttribute('transform', `rotate(${-8 + Math.sin(u) * 2} -42 -140)`);
      this.birds.forEach((b, i) => b.setAttribute('transform', `translate(${lerp(1140, -60, (k * .7 + i * .15) % 1)} ${480 + i * 60 + Math.sin(u * 3 + i) * 10}) scale(${1 + Math.sin(u * 9 + i) * .25} 1)`)); } };

  window.SCENES = S;
  window.mountScene = (id, host) => { const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' }); host.appendChild(svg); S[id].build(svg); return S[id]; };
})();
