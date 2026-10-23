#!/usr/bin/env node
// data.json -> lines.json: the spoken script (numbers spelled out for the voice, kept as digits on screen).
// Each line: { id, scene, spoken, disp: [[display token, spoken-word count], ...] }.  Recommendation lines follow the 23/10 report one-to-one.
import { readFileSync, writeFileSync } from "node:fs";
import { readNumber } from "../gold-morning/vnnum.mjs";

const G = JSON.parse(readFileSync(process.argv[2] || "data.json", "utf8"));
const out = process.argv[3] || "lines.json";
const ntok = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const W = (s) => s.split(/\s+/).filter(Boolean).map((w) => [w, w]);
const N = (n, p = "") => [[n + p, readNumber(n) + p]];
const P = (n, p = "") => [[n + "%" + p, readNumber(n) + " phần trăm" + p]];
const S = (shown, said) => [[shown, said]];
const SJC = S("SJC", "ét-gi-xi");

const lines = [];
const add = (scene, ...parts) => {
  const toks = parts.flat();
  lines.push({ id: "l" + String(lines.length).padStart(2, "0"), scene, spoken: toks.map((t) => t[1]).join(" "), disp: toks.map(([d, s]) => [d, ntok(s)]) });
};
const { date, sjc, miHong, btmc, xau, conv, premium, macro, trend, levels } = G;

add(0, W("Vàng sáng, ngày"), N(String(+date.d)), W("tháng"), N(String(+date.m), "."));
add(1, SJC, W("mua"), N(sjc.buy), W("bán"), N(sjc.sell), W("triệu một lượng."));
add(2, W("Thế giới:"), N(xau.price), W("đô la một ounce, giảm"), P(xau.chg, "."));
add(3, SJC, W("cao hơn thế giới quy đổi"), N(premium.tr), W("triệu, tức"), P(premium.pct, "."));
add(3, W("Thế giới sập, nhưng"), SJC, W("không giảm."));
add(4, W("Fed tăng"), N(macro.fed), W("điểm cơ bản, biểu quyết"), S(macro.vote + ".", "mười hai không."));
add(4, W("Lợi suất Mỹ mười năm"), P(macro.us10y, ","), W("chỉ số đô la"), N(macro.dxy, "."));
add(5, W("Đỉnh lịch sử"), N(trend.peak), W("triệu, nay thấp hơn"), P(trend.fromPeak, "."));
add(6, W("Vàng thế giới: hỗ trợ"), N(levels.xauSup[0]), W("và"), N(levels.xauSup[1] + ","), W("kháng cự"), N(levels.xauRes[1]), W("và"), N(levels.xauRes[0], "."));
add(6, SJC, W("vùng mua tốt"), N(levels.sjcBuyLo), W("đến"), N(levels.sjcBuyHi + "."));
add(7, W("Khuyến nghị: giữ, không mua mới."));
add(7, W("Premium"), P(premium.pct, ","), SJC, W("chưa điều chỉnh. Mua lúc này là mua giá cũ."));
add(7, W("Fed diều hâu, đô la và lợi suất còn cao, chưa có chất xúc tác bật tăng."));
add(7, W("Giải ngân từng phần khi"), SJC, W("về"), N(levels.sjcBuyLo), W("đến"), N(levels.sjcBuyHi), W("và premium dưới"), P(premium.ceil, "."));
add(7, W("Cảnh báo: vàng thế giới thủng"), N(levels.xauSup[1]), W("thì xu hướng trung hạn xấu."));
add(7, W("Chỉ để tham khảo, không phải khuyến nghị tài chính."));

writeFileSync(out, JSON.stringify(lines, null, 1));
console.log(`${lines.length} lines -> ${out}`);
lines.forEach((l) => console.log(`  ${l.id} [s${l.scene}] ${l.spoken}`));
