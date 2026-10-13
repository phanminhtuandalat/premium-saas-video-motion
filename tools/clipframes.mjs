#!/usr/bin/env node
/* Footage → numbered JPG frames the film can seek into (Chromium in Playwright has no H.264, so no <video>).
 *   node tools/clipframes.mjs <video> <clipId> --film examples/<film> [--ss 0] [--t 12] [--fps 30] [--w 1080] [--h 1920]
 * Writes <film>/footage/<clipId>/00001.jpg… (cover-cropped to w×h) and updates <film>/footage/meta.js (window.FOOTAGE = {id:{n,fps}}).
 * Phone footage is often HEVC/rotated: ffmpeg applies the rotation tag automatically. */
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const [video, id] = argv; if (!video || !id || !arg('film')) { console.error('usage: node tools/clipframes.mjs <video> <clipId> --film <dir> [--ss s] [--t s] [--fps 30] [--w 1080] [--h 1920]'); process.exit(1); }
const fps = +arg('fps', 30), w = +arg('w', 1080), h = +arg('h', 1920), root = path.join(arg('film'), 'footage'), dir = path.join(root, id);
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const a = ['-y', '-loglevel', 'error']; if (arg('ss')) a.push('-ss', arg('ss')); a.push('-i', video); if (arg('t')) a.push('-t', arg('t'));
a.push('-vf', `fps=${fps},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`, '-q:v', '3', path.join(dir, '%05d.jpg'));
execFileSync('ffmpeg', a, { stdio: 'inherit' });
const n = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
const mp = path.join(root, 'meta.js'); let meta = {}; try { meta = JSON.parse(fs.readFileSync(mp, 'utf8').replace(/^window\.FOOTAGE=/, '').replace(/;\s*$/, '')); } catch { }
meta[id] = { n, fps }; fs.writeFileSync(mp, 'window.FOOTAGE=' + JSON.stringify(meta) + ';\n');
console.log(`✓ ${id}: ${n} frames @${fps} (${(n / fps).toFixed(1)} s) → ${dir}`);
