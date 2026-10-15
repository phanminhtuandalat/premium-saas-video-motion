// Generates the voice-over lines with local VieNeu Studio (POST :8001/api/tts), then speeds them 1.1x and normalises.
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LINES = [
  "Đầu dò cắm xuống đất, đo độ ẩm liên tục.",
  "Đất khô dần, con trượt tụt xuống ngưỡng.",
  "Chạm ngưỡng, máy bơm tự bật, nước nhỏ giọt.",
  "Muốn đất ẩm hơn? Xoay núm, nâng ngưỡng.",
  "Cây đủ nước, anh không cần ra vườn.",
];
mkdirSync(join(HERE, "raw"), { recursive: true });
for (const [i, text] of LINES.entries()) {
  const res = await fetch("http://127.0.0.1:8001/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: "Giọng Tuấn MIA", speed: 1.0 }),
  });
  if (!res.ok) throw new Error(`line ${i + 1}: ${res.status} ${await res.text()}`);
  const raw = join(HERE, "raw", `v${i + 1}.wav`);
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", "atempo=1.1,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", join(HERE, `v${i + 1}.wav`)]);
  console.log("v" + (i + 1), "ok");
}
writeFileSync(join(HERE, "vo-lines.json"), JSON.stringify(LINES, null, 1));
