# Công thức video giải thích ngắn 9:16 (rút từ audit remotion-cuongit-template)

Nguồn: https://github.com/Cuongyd196/remotion-cuongit-template (commit 963d65e, 09/2026), đã audit ngày 15/10/2026.
Chỉ lấy **ý tưởng**. Repo đó không có file LICENSE (README ghi MIT, `package.json` ghi UNLICENSED), nên không chép code.

## Kết quả audit
**An toàn:** không có `eval`, `child_process`, `postinstall` hay gọi mạng lạ. Toàn bộ 502 gói trong lockfile lấy từ registry.npmjs.org. Mã duy nhất chạm mạng là script sinh giọng đọc.

**Điểm đáng học**
- Kịch bản 6 cảnh cố định cho video 50–60 s (bảng dưới). Người làm nội dung chỉ việc thay chủ đề.
- Thời lượng mỗi cảnh lấy từ file giọng đọc, không đặt tay. Đệm +3 khung hình giữa các cảnh cho nhịp nhanh.
- Tên kênh ở đỉnh giữa, khối nội dung chính ở giữa màn hình, phụ đề một dòng 5–7 từ phía dưới.
- Skill viết sẵn quy trình 5 bước để agent làm theo (soạn lời, sinh giọng, dựng component, đăng ký composition, render).

**Điểm yếu (repo mình đã làm tốt hơn)**
- Phụ đề chia đều theo số từ trong khoảng thời gian của cảnh, không khớp từng từ. Mình căn từ bằng Whisper (`tools/wordtimes.py`).
- Thời lượng MP3 đoán bằng cách đọc header khung MPEG, có đường lui là ước lượng theo dung lượng. Mình đo bằng `ffprobe`.
- Không có nhạc nền, không hạ nhạc khi có giọng, không đo độ to. Mình có `mix.py`, `sidechaincompress` và đo LUFS.
- Không kiểm tra vùng an toàn. Mình có `tools/audit.mjs`.
- Các cảnh Docker viết tay trong TSX, không có contact sheet hay popcheck.
- Hai bản skill (`.agents/` và `.claude/`) lệch nhau. Bản `.claude` có đường dẫn tuyệt đối `d:\cuongit\...`.

**Điểm cần cân nhắc: giọng `edge-tts-universal`**
- Gói này giấy phép AGPL-3.0. Dùng như công cụ riêng thì không sao, nhưng không nên đưa vào repo làm phụ thuộc mà chưa đọc kỹ điều khoản.
- Nó gọi dịch vụ đọc trực tuyến của Microsoft Edge qua cổng không chính thức, nên có thể bị chặn hoặc đổi bất cứ lúc nào. Khi thử ngày 15/10/2026 trên máy này, kết nối không có phản hồi sau 25 giây.
- Vì vậy repo giữ **VieNeu chạy cục bộ** làm giọng chính (miễn phí, offline). Nếu cần giọng dự phòng, cân nhắc Google TTS.

## Công thức 6 cảnh (50–60 s)
Dùng làm khung điền spec cho phim giải thích. Độ dài giọng đọc quyết định thời gian thật.

| Cảnh | Việc | Gợi ý thời gian |
|---|---|---|
| 1 Hook | Một câu hỏi gây tò mò, tiêu đề lớn | 0–5 s |
| 2 Nỗi đau | Bối cảnh, vì sao vấn đề đáng quan tâm, so sánh trước và sau | 5–12 s |
| 3 Giải pháp (1) | Ý cốt lõi, một vật thể hoặc sơ đồ | 12–20 s |
| 4 Giải pháp (2) | Cách hoạt động từng bước, tối đa 3 bước | 20–30 s |
| 5 Lợi ích | Ba con số hoặc ba so sánh | 30–40 s |
| 6 Kết | Một câu chốt và một lời kêu gọi | 40–50 s |

Cách áp dụng với engine của repo:
1. Soạn 6 câu thoại, mỗi câu 15–25 từ, rồi tạo giọng bằng VieNeu (xem `tts-integration.md`).
2. Chạy `tools/wordtimes.py` để có thời điểm từng từ, rồi đặt `t` của mỗi cảnh theo lúc câu bắt đầu.
3. Mỗi cảnh làm một việc (lớp 4 của brief 9 lớp trong `prompt-and-review.md`).
4. Với cảnh "cách hoạt động", có thể dùng skill `anatomy` (xem mục "Explainer figures" trong `SKILL.md`). Ví dụ đã làm: `examples/soil-sensor-film/`.
5. Kiểm tra bằng `sheet.mjs --safe`, `audit.mjs`, `popcheck.py` như thường lệ.

Quy tắc bố cục mượn từ repo đó, đã khớp với vùng an toàn của mình (hộp an toàn 60,220 đến 970,1540): thương hiệu kênh ở đỉnh nhưng không thấp hơn y = 220, khối chính căn giữa, phụ đề một dòng nằm quanh y ≈ 1330–1410.
