// Lays the 18 voice lines on a timeline (gaps, longer after questions), writes timeline.js and the VO track audio/vo.wav.
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const SCENES = [[0, 1], [2, 3], [4, 5, 6, 7, 8], [9, 10], [11, 12], [13, 14], [15, 16, 17]];
const QUESTION = new Set([1, 4, 13]);
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const lines = []; let t = 0.5;
for (let i = 0; i < 18; i++) {
  const id = "l" + String(i).padStart(2, "0"), d = dur(join(HERE, "audio/vo", id + ".wav"));
  lines.push({ id, start: +t.toFixed(3), dur: +d.toFixed(3) });
  t += d + (QUESTION.has(i) ? 0.7 : 0.3);
  if (SCENES.some((s) => s[s.length - 1] === i)) t += 0.15;
}
const end = lines[17].start + lines[17].dur + 3.2;
const scenes = SCENES.map((ls, k) => ({ lines: ls, a: k === 0 ? 0 : +(lines[ls[0]].start - 0.25).toFixed(3), b: k === SCENES.length - 1 ? +end.toFixed(2) : +(lines[SCENES[k + 1][0]].start - 0.25).toFixed(3) }));
writeFileSync(join(HERE, "timeline.js"), "window.TL=" + JSON.stringify({ lines, scenes, dur: +end.toFixed(2) }) + ";\n");
const args = [], fl = [];
lines.forEach((l, i) => { args.push("-i", join(HERE, "audio/vo", l.id + ".wav")); const ms = Math.round(l.start * 1000); fl.push(`[${i}:a]adelay=${ms}|${ms}[d${i}]`); });
const filter = fl.join(";") + ";" + lines.map((_, i) => `[d${i}]`).join("") + `amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${end.toFixed(2)}[vo]`;
execFileSync("ffmpeg", ["-y", "-v", "error", ...args, "-filter_complex", filter, "-map", "[vo]", "-t", end.toFixed(2), "-ar", "48000", "-ac", "1", join(HERE, "audio/vo.wav")]);
console.log("dur", end.toFixed(2), "scenes", scenes.map((s) => `${s.a}-${s.b}`).join(" "));
