/* WB — deterministic whiteboard "hand-drawn" reveal for SVG, in the spirit of the srt-whiteboard-animation skill
 * (pen draws the outline first = ink, then the colour fills in), but vector and a pure function of t: no raster, no OpenCV, no clock.
 *
 *   const wb = WB.sequence([
 *     { el: pathEl, a: 0.5, d: 1.2 },                      // stroke-draw from t=0.5 s for 1.2 s
 *     { el: leafEl, a: 1.8, d: 0.8, fill: '#7bd96b' },     // outline, then the fill fades in for 0.5 s
 *     { el: textEl, a: 2.8, d: 0.5, type: 'text' },        // text just fades/slides in (no stroke to draw)
 *   ]);
 *   wb.draw(t, penEl);   // pass the pen element to have it ride the tip of the line being drawn
 *
 * Items must be SVG geometry elements (path, circle, ellipse, rect, line, polyline) except type:'text'.
 */
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (x) => x * x * (3 - 2 * x);
  const WB = {};

  WB.sequence = (items, { fillDur = 0.5 } = {}) => {
    const prepared = items.map((it) => {
      const el = it.el, text = it.type === 'text';
      let len = 0;
      if (!text) {
        len = el.getTotalLength ? el.getTotalLength() : 0;
        el.setAttribute('stroke-dasharray', len + ' ' + (len + 2));
        el.dataset.fill = it.fill || '';
        if (it.fill) el.setAttribute('fill', it.fill);
      }
      return { ...it, len, text };
    });
    return {
      items: prepared,
      /* t in seconds on the sequence's own clock; returns the pen tip {x,y} or null */
      draw(t, pen) {
        let tip = null, tipT = -1;
        for (const it of prepared) {
          const p = clamp((t - it.a) / it.d), el = it.el;
          if (it.text) { el.setAttribute('opacity', ease(p)); continue; }
          el.setAttribute('stroke-dashoffset', (it.len * (1 - ease(p))).toFixed(2));
          el.setAttribute('opacity', p > 0 ? 1 : 0);
          if (it.fill) el.setAttribute('fill-opacity', ease(clamp((t - it.a - it.d) / fillDur)).toFixed(3));
          if (p > 0 && it.a > tipT && (p < 1 || t - it.a - it.d < 0.25)) {
            tipT = it.a;
            const at = el.getPointAtLength ? el.getPointAtLength(it.len * ease(p)) : { x: 0, y: 0 };
            tip = { x: at.x, y: at.y };
          }
        }
        if (pen) {
          if (tip) { pen.setAttribute('transform', `translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)})`); pen.setAttribute('opacity', 1); }
          else pen.setAttribute('opacity', 0);
        }
        return tip;
      },
    };
  };

  /* A simple pencil, tip at (0,0), tilted — append to an <svg>, then pass it to draw(). */
  WB.pen = (svg, { ink = '#3b3b3b', body = '#ffd166', size = 1 } = {}) => {
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = `<g transform="rotate(38) scale(${size})">
      <path d="M0 0 L-9 -34 L9 -34Z" fill="#f1d9b0" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-3 -10 L3 -10 L0 0Z" fill="${ink}"/>
      <rect x="-9" y="-130" width="18" height="96" fill="${body}" stroke="${ink}" stroke-width="3"/>
      <rect x="-9" y="-146" width="18" height="16" rx="4" fill="#ff8a7a" stroke="${ink}" stroke-width="3"/></g>`;
    svg.appendChild(g);
    return g;
  };

  window.WB = WB;
})();
