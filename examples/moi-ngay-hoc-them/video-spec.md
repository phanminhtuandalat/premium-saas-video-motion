# MỖI NGÀY BIẾT THÊM MỘT CHÚT — video-spec

Nguồn kịch bản: anh Tuấn. Phim 9:16, giọng thật của anh, cảnh thật ở Chi's Farm. Thời lượng ước tính 64 s (60 s lời + 4 s thông điệp cuối); sẽ chốt theo file giọng thật.

## Brief 9 lớp
| # | Lớp | Nội dung |
|---|---|---|
| 1 | Vai trò | Đạo diễn sáng tạo, rồi người phản biện khắt khe |
| 2 | Mục tiêu | Người xem giữ lại: học mỗi ngày một chút làm đời sống thú vị hơn, và học để sống tốt chứ không chỉ để kiếm sống |
| 3 | Định dạng | 1080×1920, 30 fps phim thật (render 60 fps), đăng Reels/TikTok/Shorts, phụ đề bắt buộc |
| 4 | Câu chuyện | Mở bằng câu hỏi → chuyện nông nghiệp gặp khoa học và lập trình → kiến thức nối nhau → lời nhắn cho các con |
| 5 | Nghệ thuật | Phim tài liệu đời thường: ánh sáng tự nhiên, màu vườn ấm, chữ trắng bo mềm, một điểm nhấn xanh lá. Không filter nặng |
| 6 | Chuyển động | Ken Burns chậm 1.00→1.06, hòa trộn 0.4 s giữa các clip, chữ hiện từng cụm, không hiệu ứng cầu kỳ |
| 7 | Điều cấm | Không cảnh AI dựng, không cắt giật theo kiểu quảng cáo, không chữ che mặt, không nhạc to hơn giọng |
| 8 | Kỹ thuật | Page contract chuẩn; phụ đề đặt trên vùng UI của nền tảng (cách đáy ≥ 26 %); mọi chữ trong `script.json` |
| 9 | Vòng QA | `sheet.mjs --safe`, `audit.mjs`, xem preview, phản biện P0/P1/P2, `popcheck.py`, ≈ −14 LUFS |

## Bảng cảnh (khớp kịch bản; thời gian chốt lại theo giọng thật)
| # | Giây | Trên màn hình | Lời | Âm thanh | Chuyển |
|---|---|---|---|---|---|
| 1 | 0–8 | `walk`: anh đi trong vườn, nhìn camera, cười. Tiêu đề nhỏ "MỖI NGÀY BIẾT THÊM MỘT CHÚT" hiện 0.6–3.2 s | s1, s2 | Piano nhẹ vào ở 0 s | hòa trộn |
| 2 | 8–23 | `leaf` (lá cây cận cảnh) 8–13 → `roots` (bộ rễ) 13–18 → `notes` (ghi chép, thiết bị) 18–23 | s3, s4, s5 | piano tiếp tục | hòa trộn 0.4 s |
| 3 | 23–42 | `code` (laptop có mã) 23–29 → `sensor` (cảm biến) 29–34 → `irrigation` (tưới tự động) 34–38 → `garden` (vườn) 38–42 | s6–s9 | nhạc dày thêm một chút | hòa trộn |
| 4 | 42–60 | `lookback`: anh quay lại nhìn vườn rồi nói kết (có thể tách thành `lookback` + `outro` nếu quay hai lần) | s10–s13 | nhạc nhẹ dần | giữ lâu |
| 5 | 60–64 | Nền mờ dần, thông điệp cuối hiện từng cụm; giữ ≥ 2 s | — | nhạc tắt dần ~1.5 s | — |

## Clip cần quay hoặc cung cấp (tên thư mục = id)
`walk, leaf, roots, notes, code, sensor, irrigation, garden, lookback`
Quay dọc 9:16. Mỗi clip dài hơn thời lượng cần 2–3 s để có chỗ cắt. Cảnh anh nói: dùng clip riêng, lời trong phim là giọng thu sạch, không phải tiếng hiện trường.

Cắt khung hình từ video: `node tools/clipframes.mjs <file.mp4> walk --film examples/moi-ngay-hoc-them --ss 2 --t 10`

## Giọng
Anh tự đọc, như chia sẻ với một người bạn. Thu từng câu `s1…s13` thành `audio/vo/<id>.wav`, rồi:
`python3 tools/wordtimes.py examples/moi-ngay-hoc-them/audio/vo --script examples/moi-ngay-hoc-them/script.json --out examples/moi-ngay-hoc-them/words.js`
Sau đó cập nhật trường `t` của từng câu trong `script.json` theo thời điểm câu bắt đầu thật.

## Điều chưa chắc
- Bản hiện tại dùng thời điểm ước tính từ kịch bản, phụ đề chia đều theo số từ. Sẽ chính xác khi có giọng.
- Nhạc: `calm-moment-of-peace` (80 BPM) trong thư viện là ứng viên, cần nghe thử xem có đúng chất piano/acoustic không.
