#!/usr/bin/env node
// Flag AI-sounding Vietnamese in narration / on-screen copy before it goes into a clip.
// usage: node tools/aiwords.mjs <file.json|file.txt> ...   (lines.json = [{id,text}], {id:"text"}, script.json with voiceText, or plain text)
// Rules come from the ZEROM Clip Studio anti-AI-writing reference (banned words and structures). It flags, it does not rewrite.
import { readFileSync } from "node:fs";

const WORDS = ["giải pháp toàn diện", "tối ưu hóa", "tối ưu hoá", "cách tân", "hiệu quả vượt trội", "chất lượng cao cấp", "hệ sinh thái", "chiến lược", "đột phá", "bứt phá", "chuyển mình"];
// JS  only knows ASCII letters, so word edges are written with Unicode lookarounds
const W = "(?![\p{L}])", S = "(?<![\p{L}])";
const PATTERNS = [
  [new RegExp(`${S}không chỉ${W}[^.!?]*?${S}(mà còn|mà là)${W}|đây không chỉ là[^.!?]*đây là`, "iu"), "cấu trúc 'không chỉ X, mà là Y'"],
  [new RegExp(`(^|[.!?]\s*)từ${W}[^.!?]{2,40}${S}đến${W}`, "iu"), "cấu trúc 'Từ X đến Y, …'"],
  [new RegExp(`${S}dù (bạn )?là${W}[^.!?]*${S}hay${W}`, "iu"), "cấu trúc 'Dù bạn là X hay Y, …'"],
  [/(—|–)[^—–]{2,60}(—|–)/, "gạch dài ngắt giữa câu"],
];

const strings = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) (k === "id" || k === "type") ? 0 : strings(x, out);
  return out;
};

let total = 0;
for (const f of process.argv.slice(2)) {
  const raw = readFileSync(f, "utf8");
  let texts; try { texts = strings(JSON.parse(raw)); } catch { texts = raw.split(/\n+/); }
  for (const t of texts) {
    const low = t.toLowerCase(), hits = [];
    for (const w of WORDS) if (low.includes(w)) hits.push(`từ cấm "${w}"`);
    for (const [re, why] of PATTERNS) if (re.test(t)) hits.push(why);
    if (/^[^.!?]*\?/.test(t.trim()) && /^(bạn|có phải|liệu)\b/i.test(t.trim())) hits.push("mở bằng câu hỏi tu từ");
    if (hits.length) { total++; console.log(`${f}: "${t.slice(0, 90)}" -> ${hits.join("; ")}`); }
  }
}
console.log(total ? `${total} chỗ cần xem lại` : "sạch: không thấy từ hay cấu trúc bị cấm");
process.exit(total ? 1 : 0);
