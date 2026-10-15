# Kiểu bảng trắng hand-drawn (rút từ audit srt-whiteboard-animation)

Nguồn: https://github.com/geeklee/srt-whiteboard-animation (giấy phép MIT, commit 696a724, 07/2026). Skill này cũng đã cài sẵn ở `~/.claude/skills/srt-whiteboard-animation`. Audit ngày 15/10/2026.

## Skill đó làm gì
SRT → 6 bước (đọc phụ đề và đề xuất phân cảnh, sinh ảnh nét vẽ trên giấy be bằng AI, tô vùng và thứ tự vẽ vào `annotation.json`, chỉnh trong bảng xem trước `assets/preview.html`, render MP4, ghép cảnh). Bút vẽ nét trước (ink) rồi màu hiện sau (color), mỗi vùng vẽ theo thứ tự của câu chuyện. Giao diện và lời nhắc toàn tiếng Trung.

## Kết quả audit
**An toàn:** MIT. Script chỉ dùng `subprocess` gọi ffmpeg và `pip install opencv-python numpy av` vào `.venv` riêng. Không thấy gọi mạng hay xóa file.

**Điểm đáng học**
- **Ink rồi color:** nét viền chạy trước, màu đổ vào sau. Đây là thứ làm hiệu ứng "đang được vẽ" thuyết phục.
- **Thứ tự theo câu chuyện, không theo vị trí:** bối cảnh, nhân vật chính, hành động, kết quả. Mỗi vùng gắn với câu phụ đề của nó (`subtitle`, `narrativeRole`).
- **Bút vẽ nối tiếp:** một cây bút đi, các vùng vẽ lần lượt, không vẽ song song.
- **Giữ khung cuối:** dừng ít nhất 0,5 s ở hình hoàn chỉnh.
- **Quy chuẩn thị giác:** giấy be `#F5EBD7`, nét xám đậm, chỉ đỏ, cam, xanh dương làm điểm nhấn, không chữ trong ảnh nguồn.

**Điểm yếu / không hợp với repo này**
- Cần **ảnh nét vẽ do AI sinh**, tốn tiền. Mình ưu tiên công cụ miễn phí.
- Vẽ bằng ảnh raster và OpenCV, không tất định theo `seek(t)`, tỉ lệ 16:9, rất chậm.
- Mỗi bước phải chờ người dùng xác nhận, nên không chạy tự động được.

## Cách repo áp dụng
`engine/whiteboard.js` (`WB.sequence`, `WB.pen`) làm hiệu ứng này bằng **vector SVG**, hàm thuần của t:
- Mỗi phần tử có `a` (giây bắt đầu) và `d` (độ dài). Nét chạy bằng `stroke-dashoffset`. Có `fill` thì màu hiện ra sau khi nét xong (ink rồi color).
- `type: 'text'` để chữ hiện dần. Cây bút bám đầu nét đang vẽ.
- Không ảnh AI, không OpenCV, không đồng hồ nên render lại ra đúng y hệt.

Ví dụ: `examples/whiteboard-tuoi-nho-giot/` (19 s, 9:16): hai cảnh "phun mưa làm mất nước" rồi "nhỏ giọt giữ nước ở gốc", dùng lại giọng và thời điểm từ của `examples/tuoi-nho-giot/`.

Quy trình áp dụng:
1. Mỗi cảnh một ý. Viết ra thứ tự vẽ theo câu chuyện: nền, nhân vật chính, hành động, kết quả.
2. Với mỗi phần tử, đặt `a` theo lúc từ liên quan được đọc (`words.js`).
3. Nét ink dùng màu xám đậm, điểm nhấn đỏ, cam, xanh dương. Nền be `#F5EBD7`.
4. Kiểm tra bằng `sheet.mjs --safe`, `audit.mjs`, `popcheck.py` như thường lệ.

Còn thiếu so với skill gốc: bảng xem trước để kéo thả vùng, đọc SRT trực tiếp, và nét vẽ theo đường xương của ảnh có sẵn. Muốn vẽ từ một ảnh bất kỳ thì vẫn cần skill gốc.
