// Builds scene_0N.annotation.json (skill srt-whiteboard-animation schema) from the storyboard fractions and the SRT timing.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const W = 768, H = 1376;
const px = ([fx, fy, fw, fh]) => ({ x: Math.round(fx * W), y: Math.round(fy * H), width: Math.round(fw * W), height: Math.round(fh * H) });
const scenes = [
  { id: "scene-01", file: "scene_01", basis: "Giai đoạn dựng khung tán: MIA Nutriflow 13-13-13 cân bằng Đạm-Lân-Kali, rễ bung, lá xanh, tưới nhỏ giọt.",
    els: [
      { id: "scale-13", label: "Cân 13-13-13, can phân và giọt nước", role: "Giới thiệu công thức nền tảng", sub: "cây cần nền tảng cân bằng tuyệt đối từ MIA Nutriflow 13-13-13.", box: [0.15, 0.08, 0.7, 0.25], start: 3000, dur: 11500, dir: "top_to_bottom" },
      { id: "bush", label: "Bụi cây thân mập, lá vươn tán", role: "Kết quả: rễ bung, thân mập, lá xanh bóng", sub: "giúp rễ bung mạnh, thân mập, lá dày xanh bóng, tạo bộ khung vững chắc.", box: [0.15, 0.35, 0.7, 0.30], start: 15000, dur: 8000, dir: "top_to_bottom" },
      { id: "drip-roots", label: "Dây tưới nhỏ giọt và bộ rễ", role: "Nền tảng dưới đất, bước chạy đà", sub: "Đây chính là bước chạy đà hoàn hảo trước khi cây bước vào giai đoạn mang trái.", box: [0.15, 0.68, 0.7, 0.25], start: 23500, dur: 5500, dir: "top_to_bottom" },
    ] },
  { id: "scene-02", file: "scene_02", basis: "Giai đoạn nuôi trái: MIA Nutriflow 7-5-44, Kali 44% thúc đường và tinh bột về trái, trái lớn, nặng ký.",
    els: [
      { id: "badge-744", label: "Huy hiệu 7-5-44, mũi tên cam ở số 44", role: "Chuyển công thức sang giai đoạn nuôi trái", sub: "chuyển ngay sang MIA Nutriflow 7-5-44 với hàm lượng Kali cao vượt trội lên tới 44%.", box: [0.15, 0.08, 0.7, 0.22], start: 6000, dur: 9500, dir: "top_to_bottom" },
      { id: "fruit-cluster", label: "Chùm quả và mũi tên dẫn dinh dưỡng", role: "Cơ chế: Kali dồn đường và tinh bột về trái", sub: "Kali cao thúc đẩy vận chuyển đường và tinh bột về trái, giúp trái lớn nhanh.", box: [0.15, 0.33, 0.7, 0.32], start: 16500, dur: 7000, dir: "top_to_bottom" },
      { id: "basket-scale", label: "Giỏ trái trên cân, mũi tên tăng trưởng", role: "Kết quả: trái nặng ký, ngọt đậm, mùa vụ bội thu", sub: "13-13-13 dựng khung khỏe, 7-5-44 thúc trái chất lượng.", box: [0.15, 0.68, 0.7, 0.26], start: 24000, dur: 5000, dir: "top_to_bottom" },
    ] },
];
for (const s of scenes) {
  const elements = s.els.map((e, i) => {
    const r = px(e.box);
    return { id: e.id, label: e.label, sequence: i + 1, narrativeRole: e.role, subtitle: e.sub, type: "structure", region: r,
      reveal: { direction: e.dir, startMs: e.start, durationMs: e.dur, maskPaddingPx: 30, protectedRegions: [] },
      handPath: { start: [r.x + 20, r.y + 10], end: [r.x + r.width - 20, r.y + r.height - 10], easing: "easeInOut" } };
  });
  writeFileSync(join(HERE, s.file + ".annotation.json"), JSON.stringify({ sceneId: s.id, canvas: { width: W, height: H }, storyBasis: s.basis, sceneDurationMs: 30000, elements }, null, 2));
  console.log("wrote", s.file + ".annotation.json", elements.map((e) => JSON.stringify(e.region)).join(" "));
}
