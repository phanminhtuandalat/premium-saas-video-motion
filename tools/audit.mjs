#!/usr/bin/env node
/* Layout audit — finds text that overlaps other text, is cut off, leaves the canvas / safe area, or is too small to read.
 *   node tools/audit.mjs <page.html> [--every 1] [--beats 12,22.5,35] [--safe 0,221,1080,1536] [--min-font 26]
 *
 * Run it on SETTLED moments (after each scene's animation has landed): during a push/rise/iris transition overlaps are expected.
 * The film may describe itself, so no flags are needed:
 *   window.AUDIT = { beats: [..settled beats..], safe: [x0,y0,x1,y1], safeExempt: ['.capi'], minFont: 26, ignore: ['.decor'] }
 * What counts as an error (exit 1):  overlap · off-canvas · outside-safe · clipped-x       warning: tiny (effective font px < minFont)
 * "Visible" means the element is really on top at its text's centre (elementFromPoint) — scenes covered by a later scene are ignored.
 * Geometry is measured on the glyph band (middle 64 % of the line box), so tightly-set multi-line headlines do not count as overlapping.
 * Effective font size includes every CSS transform on the way (a 40px label inside a ×0.917 layer counts as 36.7px).
 */
import path from 'node:path'; import { pathToFileURL } from 'node:url';
const argv = process.argv.slice(2); const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const page = argv[0]; if (!page || page.startsWith('--')) { console.error('usage: node tools/audit.mjs <page.html> [--every 1] [--beats a,b] [--safe x0,y0,x1,y1] [--min-font 26]'); process.exit(2); }
const { chromium } = await import('playwright');
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] }); const probe = await b.newPage(); await probe.goto(pathToFileURL(path.resolve(page)).href); await probe.evaluate(() => window.ready);
const [size, dur, B, cfg] = await probe.evaluate(() => [window.SIZE || [innerWidth, innerHeight], window.DUR, window.B || window.VP?.B || .5, window.AUDIT || {}]); await probe.close();
const ctx = await b.newContext({ viewport: { width: size[0], height: size[1] } }); const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(pathToFileURL(path.resolve(page)).href); await p.evaluate(() => window.ready);
const beats = arg('beats') ? arg('beats').split(',').map(Number) : cfg.beats || [...Array(Math.floor(dur / B / +arg('every', 1)))].map((_, i) => i * +arg('every', 1));
const safe = arg('safe') ? arg('safe').split(',').map(Number) : cfg.safe || null, minFont = +arg('min-font', cfg.minFont || 26);
const cfgIn = { safe, minFont, safeExempt: cfg.safeExempt || [], ignore: cfg.ignore || [] };

const issues = new Map();   // key -> {type, a, b, beats[]}
for (const bt of beats) {
  await p.evaluate(t => window.seek(t), bt * B);
  const found = await p.evaluate(({ safe, minFont, safeExempt, ignore }) => {
    const W = innerWidth, H = innerHeight, stage = document.getElementById('stage') || document.body, out = [], items = [];
    const opac = e => { let o = 1; for (let n = e; n && n !== document.body; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden') return 0; o *= +c.opacity; } return o; };
    const matches = (e, list) => list.some(s => e.closest(s));
    for (const el of stage.querySelectorAll('*')) {
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (matches(el, ignore) || opac(el) < .05) continue;
      const r = document.createRange(); r.selectNodeContents(el); const raw = r.getBoundingClientRect(); if (raw.width < 2 || raw.height < 2) continue;
      const tr = { left: raw.left + 1, right: raw.right - 1, top: raw.top + raw.height * .18, bottom: raw.bottom - raw.height * .18, width: raw.width - 2, height: raw.height * .64 };   // glyph band (≈ cap-height region)
      if (tr.right < 0 || tr.left > W || tr.bottom < 0 || tr.top > H) continue;               // fully off-canvas elements are parked, not a bug (animations park things)
      let seen = false;                                                                      // visible = the element itself is on top at ANY of 9 sample points (one covered point must not hide a real overlap)
      for (const fx of [.15, .5, .85]) for (const fy of [.25, .5, .75]) { const x = tr.left + tr.width * fx, y = tr.top + tr.height * fy; if (x < 0 || y < 0 || x >= W || y >= H) continue; const hit = document.elementFromPoint(x, y); if (hit && el.contains(hit)) seen = true; }
      if (!seen) continue;                                                                   // covered by a later scene, or clipped away by an ancestor (e.g. a roll mask)
      const bb = el.getBoundingClientRect(), k = el.offsetWidth ? bb.width / el.offsetWidth : 1, fs = parseFloat(getComputedStyle(el).fontSize) * (isFinite(k) && k > 0 ? k : 1);
      const txt = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30);
      items.push({ el, tr, txt, fs });
      if (tr.left < -2 || tr.top < -2 || tr.right > W + 2 || tr.bottom > H + 2) out.push({ type: 'off-canvas', a: txt });
      if (safe && !matches(el, safeExempt) && (tr.left < safe[0] - 2 || tr.top < safe[1] - 2 || tr.right > safe[2] + 2 || tr.bottom > safe[3] + 2)) out.push({ type: 'outside-safe', a: txt, d: `${tr.left | 0},${tr.top | 0}→${tr.right | 0},${tr.bottom | 0}` });
      if (fs < minFont) out.push({ type: 'tiny', a: txt, d: fs.toFixed(1) + 'px' });
      for (let n = el.parentElement; n && n !== stage; n = n.parentElement) { const c = getComputedStyle(n); if (/(hidden|clip)/.test(c.overflowX)) { const nr = n.getBoundingClientRect(); if (nr.width && (tr.left < nr.left - 3 || tr.right > nr.right + 3)) { out.push({ type: 'clipped-x', a: txt }); break; } } }
    }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const A = items[i], C = items[j]; if (A.el.contains(C.el) || C.el.contains(A.el)) continue;
      const w = Math.min(A.tr.right, C.tr.right) - Math.max(A.tr.left, C.tr.left), h = Math.min(A.tr.bottom, C.tr.bottom) - Math.max(A.tr.top, C.tr.top);
      if (w > 3 && h > 3) out.push({ type: 'overlap', a: A.txt, b: C.txt });
    }
    return out;
  }, cfgIn);
  for (const f of found) { const key = [f.type, f.a, f.b || ''].join('|'); const e = issues.get(key) || { ...f, beats: [] }; e.beats.push(bt); issues.set(key, e); }
}
await b.close();
const range = bs => { const o = []; let s = bs[0], pv = bs[0]; for (const x of bs.slice(1)) { if (x - pv > 1.01) { o.push(s === pv ? s : `${s}–${pv}`); s = x; } pv = x; } o.push(s === pv ? s : `${s}–${pv}`); return o.join(', '); };
const ERR = ['overlap', 'off-canvas', 'outside-safe', 'clipped-x'];
const list = [...issues.values()].sort((x, y) => ERR.includes(y.type) - ERR.includes(x.type) || x.type.localeCompare(y.type));
for (const e of list) console.log(`${ERR.includes(e.type) ? '✗' : '!'} ${e.type.padEnd(12)} "${e.a}"${e.b ? ` × "${e.b}"` : ''}${e.d ? `  (${e.d})` : ''}  @ beat ${range(e.beats)}`);
for (const m of errs) console.log('✗ PAGE ERROR', m);
const nErr = list.filter(e => ERR.includes(e.type)).length + errs.length, nWarn = list.length - list.filter(e => ERR.includes(e.type)).length;
console.log(`\n${beats.length} moments checked · ${nErr} error${nErr === 1 ? '' : 's'} · ${nWarn} warning${nWarn === 1 ? '' : 's'}${safe ? ` · safe area ${safe.join(',')}` : ''}`);
process.exit(nErr ? 1 : 0);
