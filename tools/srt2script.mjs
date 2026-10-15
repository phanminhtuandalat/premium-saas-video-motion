#!/usr/bin/env node
/* SRT → script.json for narrated films (idea from the srt-whiteboard-animation skill's parse_srt, rewritten).
 *   node tools/srt2script.mjs subtitles.srt [--target 30] [--min 25] [--max 35] [--out script.json]
 * Cues are merged into scenes of about --target seconds, never beyond --max, cutting at sentence ends when possible.
 * Output: { scenes: [{ id, start, end, durationMs, text, cues: [{ start, end, text }] }] } (seconds). */
import { readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^\d+(\.\d+)?$/.test(a));
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
if (!file) { console.error('usage: node tools/srt2script.mjs <file.srt> [--target 30 --min 25 --max 35 --out script.json]'); process.exit(1); }
const target = +opt('target', 30), min = +opt('min', 25), max = +opt('max', 35), out = opt('out', null);
const toSec = (s) => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4].padEnd(3, '0') / 1000 : NaN; };
const cues = readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r/g, '').split(/\n{2,}/).map((b) => {
  const l = b.trim().split('\n'); const ti = l.findIndex((x) => x.includes('-->')); if (ti < 0) return null;
  const [a, z] = l[ti].split('-->'); return { start: toSec(a), end: toSec(z), text: l.slice(ti + 1).join(' ').replace(/<[^>]+>/g, '').trim() };
}).filter((c) => c && c.text && Number.isFinite(c.start) && Number.isFinite(c.end));
if (!cues.length) { console.error('no cues found'); process.exit(1); }
const scenes = []; let cur = [];
const flush = () => { if (!cur.length) return; const s = cur[0].start, e = cur[cur.length - 1].end; scenes.push({ id: 'scene-' + String(scenes.length + 1).padStart(2, '0'), start: s, end: e, durationMs: Math.round((e - s) * 1000), text: cur.map((c) => c.text).join(' '), cues: cur }); cur = []; };
for (const c of cues) {
  const span = cur.length ? c.end - cur[0].start : 0;
  if (cur.length && span > max) flush();
  cur.push(c);
  const len = c.end - cur[0].start, sentenceEnd = /[.!?…。！？]$/.test(c.text);
  if (len >= target || (len >= min && sentenceEnd)) flush();
}
flush();
const json = JSON.stringify({ source: file, scenes }, null, 1);
if (out) writeFileSync(out, json); else console.log(json);
console.error(scenes.length + ' scene(s): ' + scenes.map((s) => (s.durationMs / 1000).toFixed(1) + 's').join(', '));
