#!/usr/bin/env node
// Gold Advisor morning report (plain text from the cron job) -> data.json. Usage: node parse-report.mjs reports/2026-10-18.txt [--out data.json]
// Numbers stay as the report prints them (strings, "," decimal, "." thousands); `v` fields are plain JS numbers for geometry.
import { readFileSync, writeFileSync } from "node:fs";
const file = process.argv[2];
if (!file) { console.error("usage: node parse-report.mjs <report.txt> [--out data.json]"); process.exit(1); }
const oi = process.argv.indexOf("--out"), out = oi > 0 ? process.argv[oi + 1] : "data.json";
const t = readFileSync(file, "utf8").replace(/\r/g, "");
const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));
const m = (re, label) => { const r = t.match(re); if (!r) missing.push(label); return r; };
const missing = [];

const d = m(/BÁO CÁO VÀNG SÁNG\D+(\d{2})\/(\d{2})\/(\d{4})\s*\((\d{2}):(\d{2})\)/, "ngày giờ");
const weekend = t.match(/Hôm nay (Chủ nhật|Thứ bảy)[^\n]*/);
const sjc = m(/SJC: mua ([\d.,]+) — bán ([\d.,]+) \(([^)]*)\)/, "giá SJC");
const spr = m(/Spread SJC: ([\d.,]+) tr \(([\d.,]+)%\)/, "spread SJC");
const xau = m(/XAU spot: \$([\d.,]+)\/oz/, "XAU spot");
const rng = m(/Vùng 30 phiên: ([\d.,]+) – ([\d.,]+) \(đỉnh (\d{2})\/(\d{2})\) → hiện [-−]?([\d.,]+)% từ đỉnh/, "vùng 30 phiên");
const conv = m(/Quy đổi: ([\d.,]+) tr \(tỷ giá ER\) \/ ([\d.,]+) tr \(VCB bán\)/, "quy đổi");
const prem = m(/Premium bán: \+([\d.,]+) tr \(~([\d.,]+)%\)/, "premium bán");
const sup = m(/SJC: hỗ trợ ([\d.,]+) → ([\d.,]+) \| kháng cự ([\d.,]+) → ([\d.,]+)/, "ngưỡng SJC");
const xs = m(/XAU: hỗ trợ ([\d.,]+) \| kháng cự ([\d.,]+) → ([\d.,]+)/, "ngưỡng XAU");
const rec = m(/KHUYẾN NGHỊ: ([^\n—-]+)(?:[—-]\s*([^\n]+))?/, "khuyến nghị");
const src = t.match(/📍 Nguồn: ([^\n]+)/);
const disc = t.match(/⚠️ (Tham khảo[^\n]*)/);
if (missing.length) { console.error("THIẾU:", missing.join(", ")); process.exit(2); }

const data = {
  date: { d: d[1], m: d[2], y: d[3], hh: d[4], mm: d[5] },
  weekend: weekend ? weekend[1] : null,
  sjc: { buy: sjc[1], sell: sjc[2], change: sjc[3], unchanged: /không đổi/i.test(sjc[3]), v: { buy: num(sjc[1]), sell: num(sjc[2]) } },
  spread: { tr: spr[1], pct: spr[2], v: num(spr[1]) },
  xau: { price: xau[1], v: num(xau[1]), lo: rng[1], hi: rng[2], peakD: rng[3], peakM: rng[4], fromPeak: rng[5], vlo: num(rng[1]), vhi: num(rng[2]) },
  conv: { er: conv[1], vcb: conv[2], v: num(conv[1]) },
  premium: { tr: prem[1], pct: prem[2], v: num(prem[2]) },
  levels: { sjcSup: [sup[1], sup[2]], sjcRes: [sup[3], sup[4]], xauSup: xs[1], xauRes: [xs[2], xs[3]], v: { sup: [num(sup[1]), num(sup[2])], res: [num(sup[3]), num(sup[4])] } },
  rec: { verdict: rec[1].trim(), detail: (rec[2] || "").trim() },
  sources: src ? src[1].trim() : "",
  disclaimer: disc ? disc[1].trim() : "Tham khảo, không phải khuyến nghị tài chính.",
};
writeFileSync(out, JSON.stringify(data, null, 1));
console.log("OK", out, "-", `${data.date.d}/${data.date.m}/${data.date.y}`, "SJC", data.sjc.buy, "-", data.sjc.sell, "| XAU", data.xau.price, "| premium", data.premium.pct + "%", "|", data.rec.verdict);
