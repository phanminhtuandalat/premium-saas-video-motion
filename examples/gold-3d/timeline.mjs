#!/usr/bin/env node
// Lays the voice lines on a timeline (scene gaps, tail), writes timeline.js and the VO track audio/vo.wav.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const lines = JSON.parse(readFileSync("lines.json", "utf8"));
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const L = []; let t = 0.5;
lines.forEach((l, i) => {
  const d = dur(`audio/vo/${l.id}.wav`);
  L.push({ id: l.id, scene: l.scene, start: +t.toFixed(3), dur: +d.toFixed(3) });
  t += d + 0.3 + (lines[i + 1] && lines[i + 1].scene !== l.scene ? 0.2 : 0);
});
const end = +(L[L.length - 1].start + L[L.length - 1].dur + 3.0).toFixed(2);
const nScene = Math.max(...lines.map((l) => l.scene)) + 1;
const scenes = Array.from({ length: nScene }, (_, k) => {
  const first = L.find((x) => x.scene === k), next = L.find((x) => x.scene === k + 1);
  return { lines: L.map((x, i) => (x.scene === k ? i : -1)).filter((i) => i >= 0), a: k === 0 ? 0 : +(first.start - 0.25).toFixed(3), b: next ? +(next.start - 0.25).toFixed(3) : end };
});
writeFileSync("timeline.js", "window.TL=" + JSON.stringify({ lines: L, scenes, dur: end }) + ";\n");
const args = [], fl = [];
L.forEach((l, i) => { args.push("-i", `audio/vo/${l.id}.wav`); const ms = Math.round(l.start * 1000); fl.push(`[${i}:a]adelay=${ms}|${ms}[d${i}]`); });
execFileSync("ffmpeg", ["-y", "-v", "error", ...args, "-filter_complex", fl.join(";") + ";" + L.map((_, i) => `[d${i}]`).join("") + `amix=inputs=${L.length}:normalize=0,apad=whole_dur=${end}[vo]`, "-map", "[vo]", "-t", String(end), "-ar", "48000", "-ac", "1", "audio/vo.wav"]);
console.log("dur", end, "| scenes", scenes.map((s) => `${s.a}-${s.b}`).join(" "));
