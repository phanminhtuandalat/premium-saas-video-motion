#!/usr/bin/env node
// lines.json -> audio/vo/<id>.wav with VieNeu Studio (POST :8001/api/tts, voice "Giọng Tuấn MIA"), sped 1.1x and loudness-normalised;
// also writes audio/vo/spoken.json ({id: spoken text}) for the Whisper alignment step.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
const lines = JSON.parse(readFileSync("lines.json", "utf8"));
mkdirSync("audio/vo/raw", { recursive: true });
const spoken = {};
for (const l of lines) {
  spoken[l.id] = l.spoken;
  const raw = `audio/vo/raw/${l.id}.wav`, rawText = `audio/vo/raw/${l.id}.txt`;
  const cached = existsSync(raw) && existsSync(rawText) && readFileSync(rawText, "utf8") === l.spoken;   // same text -> reuse the take, only re-time it
  if (!cached) {
  const res = await fetch("http://127.0.0.1:8001/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: l.spoken, voice: "Giọng Tuấn MIA", speed: 1.0 }) });
  if (!res.ok) throw new Error(`${l.id}: ${res.status} ${await res.text()}`);
  writeFileSync(raw, Buffer.from(await res.arrayBuffer())); writeFileSync(rawText, l.spoken);
  }
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", `audio/vo/raw/${l.id}.wav`, "-af", `atempo=${process.env.TEMPO || 1.2},loudnorm=I=-16:TP=-1.5:LRA=11`, "-ar", "48000", "-ac", "1", `audio/vo/${l.id}.wav`]);
  console.log(l.id, "ok");
}
writeFileSync("audio/vo/spoken.json", JSON.stringify(spoken, null, 1));
