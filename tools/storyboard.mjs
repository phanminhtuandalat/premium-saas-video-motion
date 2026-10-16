#!/usr/bin/env node
/* One storyboard file -> (1) ready-to-paste image-generator prompts and (2) the annotation.json files that the
 * srt-whiteboard-animation renderer needs. The same tier boxes drive both, so the picture and its regions never drift.
 *
 *   node tools/storyboard.mjs board.json [--out dir]
 *
 * board.json:
 * { "name": "...", "size": [768, 1376], "style": "<shared style block>", "gap": 0.07,
 *   "images": [ { "id": "scene_01", "sceneDurationMs": 30000, "tiers": [
 *       { "id": "t1", "label": "...", "box": [0.15, 0.08, 0.7, 0.25], "desc": "what to draw",
 *         "exact": ["71,2%"], "start": 3000, "dur": 11500, "subtitle": "...", "role": "..." } ] } ] }
 * Prompt rules baked in (from the topview-3d-builder audit): timeline/locked-style first, explicit prohibitions,
 * exact strings listed so they can be checked character by character, caption gap reserved, margins reserved. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: node tools/storyboard.mjs board.json [--out dir]"); process.exit(1); }
const oi = args.indexOf("--out");
const board = JSON.parse(readFileSync(file, "utf8"));
const out = resolve(oi >= 0 ? args[oi + 1] : dirname(file));
mkdirSync(out, { recursive: true });
const [W, H] = board.size || [768, 1376];
const pct = (v) => Math.round(v * 100);
const lines = [];

for (const img of board.images) {
  const tiers = img.tiers;
  const exact = tiers.flatMap((t) => t.exact || []);
  for (let i = 1; i < tiers.length; i++) {
    const gap = tiers[i].box[1] - (tiers[i - 1].box[1] + tiers[i - 1].box[3]);
    const need = i === tiers.length - 1 ? (board.gap ?? 0.07) : 0.02;
    if (gap < need - 1e-9) console.error(`warning: ${img.id} gap before tier ${i + 1} is ${pct(gap)}% (need >= ${pct(need)}%${i === tiers.length - 1 ? ", reserved for captions" : ""})`);
  }
  const body = tiers.map((t, i) => {
    const [fx, fy, fw, fh] = t.box;
    const where = ["trên", "giữa", "dưới"][i] || `thứ ${i + 1}`;
    return `**Hình ${where} (từ ${pct(fy)}% đến ${pct(fy + fh)}% chiều cao, rộng ${pct(fw)}% ở giữa ảnh):** ${t.desc}` +
      (t.exact?.length ? ` Chỉ viết đúng các chuỗi sau, từng ký tự: ${t.exact.map((s) => `"${s}"`).join(", ")}.` : " Không có chữ.");
  });
  const prompt = [
    board.style,
    `Ảnh gồm ${tiers.length} hình riêng biệt xếp từ trên xuống, giữa các hình có khoảng trống rộng. Chừa một dải trống nằm ngang cao khoảng ${pct(board.gap ?? 0.07)}% ảnh giữa hình giữa và hình dưới để đặt phụ đề.`,
    ...body,
    "Cấm: chữ nào khác ngoài các chuỗi đã chỉ định, logo, watermark, đổ bóng, gradient, nền trắng.",
  ].join("\n\n");
  lines.push(`## ${img.id}\n\n${prompt}\n\nKiểm tra sau khi tạo: ${exact.length ? exact.map((s) => `"${s}"`).join(" · ") : "(không có chuỗi chữ)"}\n`);

  const elements = tiers.map((t, i) => {
    const [fx, fy, fw, fh] = t.box;
    const r = { x: Math.round(fx * W), y: Math.round(fy * H), width: Math.round(fw * W), height: Math.round(fh * H) };
    return { id: t.id, label: t.label || t.id, sequence: i + 1, narrativeRole: t.role || "", subtitle: t.subtitle || "", type: "structure", region: r,
      reveal: { direction: "top_to_bottom", startMs: t.start, durationMs: t.dur, maskPaddingPx: 30, protectedRegions: [] },
      handPath: { start: [r.x + 20, r.y + 10], end: [r.x + r.width - 20, r.y + r.height - 10], easing: "easeInOut" } };
  });
  const last = Math.max(...elements.map((e) => e.reveal.startMs + e.reveal.durationMs));
  const dur = img.sceneDurationMs || last + 1000;
  if (dur < last + 500) console.error(`warning: ${img.id} sceneDurationMs ${dur} is shorter than last region end + 500 ms (${last + 500})`);
  writeFileSync(join(out, img.id + ".annotation.json"), JSON.stringify({ sceneId: img.id, canvas: { width: W, height: H }, storyBasis: img.basis || board.name || "", sceneDurationMs: dur, elements }, null, 2));
}
writeFileSync(join(out, "image-prompts.md"), `# Prompt tạo ảnh: ${board.name || ""}\n\n${lines.join("\n")}`);
console.log(`wrote image-prompts.md and ${board.images.length} annotation file(s) in ${out}`);
