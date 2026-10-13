#!/usr/bin/env node
/* Kiểm tra số liệu trên phim — chạy TRƯỚC khi render.
 *   node tools/checkdata.mjs examples/<film>/index.html
 * Trang phải nạp data.js định nghĩa:
 *   window.DATA   — nguồn số liệu duy nhất (phim chỉ đọc số từ đây)
 *   window.EXPECT — [[beat, "chuỗi"], ...] chép TAY đúng như bản tin gốc (không sinh từ DATA)
 * Kiểm tra 1: mỗi chuỗi kỳ vọng thật sự hiện trên màn hình ở beat đó (bắt lỗi gõ sai / định dạng sai / số không bao giờ hiện).
 * Kiểm tra 2: các quan hệ số học nếu DATA có đủ trường (xuất − nhập = −nhập siêu; sức mua thực ≈ (1+thu nhập)/(1+CPI) − 1).
 * Thoát mã 1 nếu có lỗi.
 */
import path from 'node:path'; import { pathToFileURL } from 'node:url';
const page = process.argv[2]; if (!page) { console.error('usage: node tools/checkdata.mjs <page.html>'); process.exit(2); }
const { chromium } = await import('playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = []; p.on('pageerror', e => errs.push('PAGE ERROR: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(pathToFileURL(path.resolve(page)).href); await p.evaluate(() => window.ready);
const { D, EX, B } = await p.evaluate(() => ({ D: window.DATA || null, EX: window.EXPECT || null, B: window.B }));
let bad = 0; const fail = m => { bad++; console.log('✗ ' + m); };
if (!D || !EX) { console.error('Trang không có window.DATA / window.EXPECT'); process.exit(2); }
const norm = s => s.replace(/[ \s]+/g, ' ');
const byBeat = {};
for (const [beat, str] of EX) (byBeat[beat] = byBeat[beat] || []).push(str);
let n = 0;
for (const beat of Object.keys(byBeat).map(Number).sort((x, y) => x - y)) {
  await p.evaluate(t => window.seek(t), beat * B);
  const txt = norm(await p.evaluate(() => document.getElementById('stage').innerText));
  for (const s of byBeat[beat]) { n++; if (!txt.includes(norm(s))) fail(`beat ${beat}: không thấy "${s}" trên màn hình`); }
}
console.log(`${n - bad < n ? '' : '✓ '}${n} chuỗi kỳ vọng đã kiểm tra tại ${Object.keys(byBeat).length} thời điểm`);
const near = (a, c, tol, msg) => { if (Math.abs(a - c) > tol) fail(`${msg}: ${a.toFixed(3)} ≠ ${c.toFixed(3)}`); else console.log(`✓ ${msg} (${a.toFixed(2)} ≈ ${c.toFixed(2)})`); };
if (D.export && D.import && D.deficit != null) near(D.export.abs - D.import.abs, -D.deficit, 0.011, 'xuất − nhập = −nhập siêu');
if (D.income && D.cpi != null && D.realIncome != null) near(((1 + D.income.g / 100) / (1 + D.cpi / 100) - 1) * 100, D.realIncome, 0.1, 'sức mua thực ≈ (1+thu nhập)/(1+CPI) − 1');
for (const e of errs) fail(e);
await b.close();
console.log(bad ? `\n${bad} lỗi` : '\nOK — số liệu trên phim khớp bản tin gốc');
process.exit(bad ? 1 : 0);
