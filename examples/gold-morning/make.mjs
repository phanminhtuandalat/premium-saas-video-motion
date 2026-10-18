#!/usr/bin/env node
// One command per morning:  node make.mjs reports/2026-10-18.txt
// report text -> data.json -> spoken script -> VieNeu voice -> Whisper word times -> timeline -> music + mix -> render -> mp4 for Reels/TikTok.
// Needs: VieNeu Studio on :8001 (voice), python with faster-whisper + numpy/scipy/soundfile, ffmpeg, node + playwright (see repo README).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const report = process.argv[2];
if (!report || !existsSync(resolve(report))) { console.error("usage: node make.mjs reports/<ngày>.txt   (file báo cáo văn bản)"); process.exit(1); }
const stamp = basename(report).replace(/\.\w+$/, "");
const run = (cmd, args, opt = {}) => { console.log("\n==>", [cmd, ...args].join(" ").slice(0, 160)); execFileSync(cmd, args, { stdio: "inherit", cwd: HERE, env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" }, ...opt }); };
const py = process.env.PYTHON || "python";

try {
  const r = await fetch("http://127.0.0.1:8001/api/health"); if (!r.ok) throw new Error(r.status);
} catch { console.error("VieNeu Studio chưa chạy ở cổng 8001. Bật nó trước (uv run vieneu-studio trong thư mục AI-Audio-Studio), rồi chạy lại."); process.exit(1); }

run("node", ["parse-report.mjs", resolve(report), "--out", "data.json"]);
run("node", ["narration.mjs", "data.json", "lines.json"]);
run("node", ["emit.mjs"]);
run("node", ["tts.mjs"]);
run(py, [join(ROOT, "tools/wordtimes.py"), "audio/vo", "--script", "audio/vo/spoken.json", "--out", "words.js"]);
run("node", ["timeline.mjs"]);

const dur = JSON.parse(readFileSync(join(HERE, "timeline.js"), "utf8").replace(/^window\.TL=/, "").replace(/;\s*$/, "")).dur;
const out = join(ROOT, "out"); mkdirSync(out, { recursive: true });
const beats = Math.ceil((dur + 3) * 100 / 60);
run(py, [join(ROOT, "tools/synthmusic.py"), "--bpm", "100", "--beats", String(beats), "--mood", "minimal", "--out", join(out, "gold-music.wav")]);
run("ffmpeg", ["-y", "-v", "error", "-i", join(out, "gold-music.wav"), "-i", join(HERE, "audio/vo.wav"), "-filter_complex",
  `[0:a]atrim=0:${dur},volume=-5dB,aformat=channel_layouts=stereo,afade=t=out:st=${(dur - 3).toFixed(2)}:d=3[m];[1:a]aformat=channel_layouts=stereo,asplit[v1][v2];[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];[md][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-2.2:LRA=9,atrim=0:${dur}[o]`,
  "-map", "[o]", "-ar", "48000", join(out, "gold-mix.wav")]);
run("node", [join(ROOT, "tools/audit.mjs"), join(HERE, "index.html")]);
const raw = join(out, "gold-raw.mp4"), final = join(out, `gold-morning-${stamp}.mp4`);
run("node", [join(ROOT, "tools/render.mjs"), join(HERE, "index.html"), "--mode", "preview", "--audio", join(out, "gold-mix.wav"), "--out", raw], { cwd: ROOT });
run(py, [join(ROOT, "tools/popcheck.py"), raw], { cwd: ROOT });
run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-vf", "scale=in_range=full:out_range=tv", "-color_range", "tv",
  "-c:a", "aac", "-profile:a", "aac_low", "-ar", "44100", "-ac", "2", "-b:a", "192k", "-movflags", "+faststart", final]);
console.log("\nXONG:", final);
