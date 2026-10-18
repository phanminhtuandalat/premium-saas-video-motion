# Vàng sáng — clip 9:16 làm từ báo cáo văn bản mỗi sáng

Kiểu: keynote sáng (nền sáng, số lớn, nhấn vàng kim). Trang `index.html` không chứa con số nào, mọi chữ và số lấy từ báo cáo.

```bash
# 1. lưu báo cáo của sáng nay (copy nguyên văn từ tin nhắn của công việc tự chạy) vào reports/<ngày>.txt
# 2. bật VieNeu Studio (cổng 8001), rồi:
node examples/gold-morning/make.mjs examples/gold-morning/reports/2026-10-18.txt
# kết quả: out/gold-morning-2026-10-18.mp4
```

Các bước: `parse-report.mjs` (báo cáo → data.json) → `narration.mjs` (lời đọc, số viết ra chữ qua `vnnum.mjs`) → `tts.mjs` (VieNeu) →
`tools/wordtimes.py` (Whisper căn từ) → `timeline.mjs` → nhạc + trộn → `audit.mjs` → render → `popcheck.py`.

Cần: báo cáo đúng định dạng của Gold Advisor (parse-report báo trường nào thiếu rồi dừng). Phần "KHUYẾN NGHỊ" được đọc lại đúng như báo cáo,
kèm dòng "Tham khảo, không phải khuyến nghị tài chính" hiện suốt clip. Đây không phải lời khuyên đầu tư của người làm clip.
