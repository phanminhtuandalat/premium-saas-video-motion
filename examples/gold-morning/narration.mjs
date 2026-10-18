#!/usr/bin/env node
// data.json -> lines.json: the spoken script, with every number spelled out for the voice and kept as digits on screen.
// Each line: { id, scene, spoken, disp: [[display token, how many spoken words it covers], ...] }  (captions and counters use disp)
import { readFileSync, writeFileSync } from "node:fs";
import { readNumber } from "./vnnum.mjs";

const data = JSON.parse(readFileSync(process.argv[2] || "data.json", "utf8"));
const out = process.argv[3] || "lines.json";
const ntok = (s) => s.trim().split(/\s+/).filter(Boolean).length;

const W = (s) => s.split(/\s+/).filter(Boolean).map((w) => [w, w]);                      // plain words
const N = (n, p = "") => [[n + p, readNumber(n) + p]];                                   // number (digits shown, words spoken)
const P = (n, p = "") => [[n + "%" + p, readNumber(n) + " phần trăm" + p]];              // percent
const S = (shown, said) => [[shown, said]];                                              // custom token
const SJC = S("SJC", "ét-gi-xi");

const lines = [];
const add = (scene, ...parts) => {
  const toks = parts.flat();
  lines.push({ id: "l" + String(lines.length).padStart(2, "0"), scene,
    spoken: toks.map((t) => t[1]).join(" "), disp: toks.map(([d, s]) => [d, ntok(s)]) });
};

const { date, sjc, spread, xau, premium, levels, rec } = data;
const verdictWords = rec.verdict.toLowerCase();

add(0, W("Vàng sáng, ngày"), N(String(+date.d)), W("tháng"), N(String(+date.m), "."));
add(0, data.weekend ? W(`${data.weekend}, thị trường trong nước nghỉ, giá giữ mức chốt cuối tuần.`)
                    : W("Dữ liệu cập nhật lúc"), ...(data.weekend ? [] : [N(String(+date.hh)), W("giờ"), N(String(+date.mm), ".")]));
add(1, SJC, W("mua"), N(sjc.buy, ","), W("bán"), N(sjc.sell), W(sjc.unchanged ? "triệu một lượng, không đổi." : "triệu một lượng."));
add(1, W("Chênh lệch"), N(spread.tr), W("triệu,"), P(spread.pct, ":"), W("mua xong bán lại ngay là mất"), N(spread.tr), W("triệu."));
add(2, W("Thế giới:"), N(xau.price), W("đô la một ounce, thấp hơn đỉnh"), P(xau.fromPeak, "."));
add(3, SJC, W("cao hơn thế giới quy đổi khoảng"), P(premium.pct, ","), W("tương đương"), N(premium.tr), W("triệu."));
add(4, W("Ngưỡng: hỗ trợ"), N(levels.sjcSup[0], ","), W("kháng cự"), N(levels.sjcRes[0], "."));
add(5, W("Theo báo cáo:"), W(verdictWords + (rec.detail ? "," : ".")), ...(rec.detail ? [W(rec.detail.replace(/\s*\.?$/, "."))] : []));
add(5, W("Chỉ để tham khảo, không phải khuyến nghị tài chính."));

writeFileSync(out, JSON.stringify(lines, null, 1));
console.log(`${lines.length} lines -> ${out}`);
lines.forEach((l) => console.log(`  ${l.id} [s${l.scene}] ${l.spoken}`));
