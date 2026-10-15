// SRT -> ASS for burning short captions (pages of <= 5 words, timed by character share inside each cue).
// Captions sit in the gap between the middle and bottom drawings (y ~ 1265 of 1920), on a semi-opaque paper-coloured box.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const toSec = (s) => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000; };
const ts = (t) => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t - h * 3600 - m * 60; return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`; };
const cues = readFileSync(join(HERE, "input/nutrition_mia.srt"), "utf8").replace(/\r/g, "").trim().split(/\n{2,}/).map((b) => {
  const l = b.split("\n"); const [a, z] = l[1].split("-->"); return { a: toSec(a), z: toSec(z), text: l.slice(2).join(" ").trim() };
});
const pages = [];
for (const c of cues) {
  const words = c.text.split(/\s+/); const chunks = []; let cur = [];
  for (const w of words) { cur.push(w); if (cur.length >= 5 || /[,.!?;:]$/.test(w) && cur.length >= 3) { chunks.push(cur); cur = []; } }
  if (cur.length) { if (chunks.length && cur.length < 3) chunks[chunks.length - 1].push(...cur); else chunks.push(cur); }
  const total = chunks.reduce((n, ch) => n + ch.join(" ").length, 0); let t = c.a;
  for (const ch of chunks) { const d = ((c.z - c.a) * ch.join(" ").length) / total; pages.push({ a: t, z: t + d, text: ch.join(" ") }); t += d; }
}
const head = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Arial,52,&H002C2C2C,&H002C2C2C,&H30D7EBF5,&H30D7EBF5,-1,0,0,0,100,100,0,0,3,16,0,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
const lines = pages.map((p) => `Dialogue: 0,${ts(p.a)},${ts(p.z - 0.04)},Cap,,0,0,0,,{\\an5\\pos(540,1265)}${p.text.replace(/\{|\}/g, "")}`);
writeFileSync(join(HERE, "input/captions.ass"), head + lines.join("\n") + "\n");
console.log(pages.length + " caption pages");
