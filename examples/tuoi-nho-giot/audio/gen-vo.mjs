// Voice-over for "Vì sao tưới nhỏ giọt tiết kiệm nước": local VieNeu Studio (POST :8001/api/tts), then atempo 1.1 + loudnorm.
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const LINES = {
  s1: "Cùng một thùng nước, nhưng tưới kiểu nào thì cây uống được nhiều nhất?",
  s2: "Tưới tràn hay tưới phun mưa, nước bốc hơi và chảy đi mất một phần lớn, trong khi rễ cây chỉ cần ở một chỗ rất nhỏ.",
  s3: "Tưới nhỏ giọt thì khác. Từng giọt nước rơi ngay tại gốc, thấm xuống vùng rễ và giữ ẩm ở đó.",
  s4: "Cách làm rất đơn giản: nước đi từ bể, qua máy bơm và ống dẫn, rồi nhỏ giọt qua đầu phun đặt sát gốc cây.",
  s5: "Nhờ vậy nước ít bốc hơi, đến đúng chỗ cây cần, và vùng đất giữa các luống khô nên cỏ dại cũng ít mọc hơn.",
  s6: "Thêm một cảm biến độ ẩm, vườn sẽ tự tưới vừa đủ. Mỗi ngày biết thêm một chút, vườn lại tiết kiệm thêm một chút.",
};
mkdirSync(join(HERE, "vo/raw"), { recursive: true });
for (const [id, text] of Object.entries(LINES)) {
  const res = await fetch("http://127.0.0.1:8001/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice: "Giọng Tuấn MIA", speed: 1.0 }) });
  if (!res.ok) throw new Error(`${id}: ${res.status} ${await res.text()}`);
  const raw = join(HERE, "vo/raw", id + ".wav");
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", "atempo=1.1,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", join(HERE, "vo", id + ".wav")]);
  console.log(id, "ok");
}
writeFileSync(join(HERE, "vo/vo-raw.json"), JSON.stringify(LINES, null, 1));
