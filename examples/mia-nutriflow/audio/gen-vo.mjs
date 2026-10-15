// Voice-over for the MIA Nutriflow film: VieNeu Studio (POST :8001/api/tts). Numbers are spelled out for the TTS;
// each line is sped up with atempo just enough to fit its SRT cue, then loudness-normalised.
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const LINES = [
  { id: "c1", cue: [0, 6.5], text: "Muốn cây trồng đạt năng suất đỉnh cao, bạn không thể bón một công thức phân suốt cả vụ." },
  { id: "c2", cue: [6.5, 15], text: "Ở giai đoạn sinh trưởng và nuôi khung tán, cây cần nền tảng cân bằng tuyệt đối từ Mia Nutriflow mười ba, mười ba, mười ba." },
  { id: "c3", cue: [15, 23.5], text: "Tỉ lệ Đạm, Lân, Kali đồng đều giúp rễ bung mạnh, thân mập, lá dày xanh bóng, tạo bộ khung vững chắc." },
  { id: "c4", cue: [23.5, 30], text: "Đây chính là bước chạy đà hoàn hảo trước khi cây bước vào giai đoạn mang trái." },
  { id: "c5", cue: [30, 38], text: "Nhưng khi bước sang giai đoạn nuôi trái lớn và vào chắc, nhu cầu của cây thay đổi hoàn toàn." },
  { id: "c6", cue: [38, 46.5], text: "Lúc này, chuyển ngay sang Mia Nutriflow bảy, năm, bốn mươi bốn, với hàm lượng Kali cao vượt trội lên tới bốn mươi bốn phần trăm." },
  { id: "c7", cue: [46.5, 54], text: "Kali cao thúc đẩy vận chuyển đường và tinh bột về trái, giúp trái lớn nhanh, nặng ký, lên màu đẹp và ngọt đậm." },
  { id: "c8", cue: [54, 60], text: "Mười ba, mười ba, mười ba dựng khung khỏe. Bảy, năm, bốn mươi bốn thúc trái chất lượng. Công thức vàng cho mùa vụ bội thu!" },
];
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
mkdirSync(join(HERE, "raw"), { recursive: true });
const report = [];
for (const L of LINES) {
  const res = await fetch("http://127.0.0.1:8001/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: L.text, voice: "Giọng Tuấn MIA", speed: 1.0 }) });
  if (!res.ok) throw new Error(`${L.id}: ${res.status} ${await res.text()}`);
  const raw = join(HERE, "raw", L.id + ".wav");
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  const room = L.cue[1] - L.cue[0] - 0.35, rawLen = dur(raw);
  const tempo = Math.min(1.35, Math.max(1.1, rawLen / room));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", `atempo=${tempo.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11`, "-ar", "48000", "-ac", "1", join(HERE, L.id + ".wav")]);
  const len = dur(join(HERE, L.id + ".wav"));
  report.push({ id: L.id, cueStart: L.cue[0], cueLen: +(L.cue[1] - L.cue[0]).toFixed(2), rawLen: +rawLen.toFixed(2), tempo: +tempo.toFixed(2), finalLen: +len.toFixed(2), fits: len <= L.cue[1] - L.cue[0] });
}
writeFileSync(join(HERE, "vo-report.json"), JSON.stringify(report, null, 1));
console.table(report);
