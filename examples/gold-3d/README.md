# Vàng sáng 3D — clip 9:16 từ báo cáo Gold Advisor (23/10/2026)

Nền là cảnh 3D `orbit` của `engine/scene3d.js` (vàng kim, đỏ ở cảnh giá giảm); số liệu hiện đè lên. Trang `index.html` không chứa con số nào: chữ và số lấy từ `data.json`, lời đọc từ `narration.mjs`.

```bash
node narration.mjs && echo "window.GOLD=$(tr -d '\n' < data.json);" > data.js && node emit.mjs
TEMPO=1.25 node tts.mjs                      # VieNeu Studio phải chạy ở cổng 8001
python tools/wordtimes.py examples/gold-3d/audio/vo --script examples/gold-3d/audio/vo/spoken.json --out examples/gold-3d/words.js
node timeline.mjs                            # rồi nhạc + trộn + render như examples/gold-morning/make.mjs
node tools/render.mjs examples/gold-3d/index.html --mode preview --workers 2 --audio out/gold3d-mix.wav --out out/gold3d-raw.mp4
```

- `data.json` nhập tay từ `reports/2026-10-23.txt` (chưa có bộ đọc tự động cho định dạng 7 mục mới; bộ đọc của `gold-morning` chỉ hợp định dạng cũ).
- Dài khoảng 97 giây: đã lược lời (bỏ Mi Hồng, Bảo Tín, "vị thế dài hạn"); phần khuyến nghị đọc rút gọn, không phải nguyên văn.
- Dòng "Tham khảo, không phải khuyến nghị tài chính" hiện suốt clip. Đây không phải lời khuyên đầu tư của người làm clip.
- Dùng `--workers 2` khi render để đỡ tốn bộ nhớ (có WebGL).
