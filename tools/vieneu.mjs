#!/usr/bin/env node
// Shared Vietnamese voice-over with VieNeu Studio (local, port 8001).
// usage: node tools/vieneu.mjs <lines.json> <out_dir>
//   lines.json = [{"id": "l00", "text": "Xin chào"}, ...]   (text = what the voice should say, numbers already in words)
// writes <out_dir>/<id>.wav (48 kHz mono, loudness -16 LUFS-ish, tempo TEMPO env, default 1.1) and <out_dir>/dur.json
// Reuses a take when <id>.txt in raw/ still matches the text. Needs VieNeu Studio running: uv run vieneu-studio (see examples/gold-morning/README.md).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const [linesPath, outDir] = process.argv.slice(2);
if (!linesPath || !outDir) { console.error("usage: node tools/vieneu.mjs <lines.json> <out_dir>"); process.exit(2); }
const VOICE = process.env.VIENEU_VOICE || "Giọng Tuấn MIA";
const TEMPO = process.env.TEMPO || "1.1";

try { const h = await fetch("http://127.0.0.1:8001/api/health"); if (!h.ok) throw new Error(h.status); }
catch { console.error("VieNeu Studio chưa chạy ở cổng 8001. Bật nó trước: uv run vieneu-studio (PYTHONUTF8=1, VIENEU_PORT=8001)."); process.exit(1); }

const lines = JSON.parse(readFileSync(linesPath, "utf8"));
const raw = join(outDir, "raw"); mkdirSync(raw, { recursive: true });
const dur = {};
for (const l of lines) {
  const rawWav = join(raw, `${l.id}.wav`), rawTxt = join(raw, `${l.id}.txt`);
  const cached = existsSync(rawWav) && existsSync(rawTxt) && readFileSync(rawTxt, "utf8") === l.text;
  if (!cached) {
    const res = await fetch("http://127.0.0.1:8001/api/tts", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: l.text, voice: VOICE, speed: 1.0 }) });
    if (!res.ok) throw new Error(`${l.id}: ${res.status} ${await res.text()}`);
    writeFileSync(rawWav, Buffer.from(await res.arrayBuffer())); writeFileSync(rawTxt, l.text);
  }
  const out = join(outDir, `${l.id}.wav`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", rawWav, "-af", `atempo=${TEMPO},loudnorm=I=-16:TP=-1.5:LRA=11`, "-ar", "48000", "-ac", "1", out]);
  dur[l.id] = +(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString()).toFixed(3));
  console.log(l.id, dur[l.id] + "s", l.text);
}
writeFileSync(join(outDir, "dur.json"), JSON.stringify(dur, null, 1));
