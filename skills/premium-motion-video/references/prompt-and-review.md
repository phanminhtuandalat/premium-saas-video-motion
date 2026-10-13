# Prompt, review và bài học từ Skillry / thư viện Opus 5.5

Nguồn: bài tổng hợp "Opus 5.5 Motion Design" (aiidelist), các trang video trên skillry.dev (10/2026).
Chỉ lấy **ý tưởng và quy trình**. Không sao chép code, hình hay prompt của creator khác.

## 1. Brief 9 lớp (dùng khi viết spec cho một phim mới)
Điền đủ chín dòng vào đầu `<film>/video-spec.md` trước khi dựng. Dòng nào trống thì chọn mặc định và ghi rõ.

| # | Lớp | Câu hỏi trả lời |
|---|---|---|
| 1 | Vai trò | Agent đóng vai gì (creative director, rồi reviewer khắt khe) |
| 2 | Mục tiêu | Một câu: người xem giữ lại điều gì |
| 3 | Định dạng | Tỉ lệ, độ dài, fps, nơi đăng |
| 4 | Câu chuyện | Danh sách cảnh, mỗi cảnh một việc |
| 5 | Định hướng nghệ thuật | Playbook (Keynote, Sketchbook…), màu, font, tài sản thật |
| 6 | Ngôn ngữ chuyển động | Easing/spring theo chức năng (xem `timing-easing.md`), họ chuyển cảnh |
| 7 | Điều cấm | "Không giống slide PowerPoint", không cross-fade chữ, không random không seed |
| 8 | Ràng buộc kỹ thuật | Page contract, `seek(t)` thuần, vùng an toàn, số liệu trong `data.js` |
| 9 | Vòng QA | Contact sheet, `audit.mjs`, bước review bên dưới |

Khám phá thì viết ngắn và mở. Sản xuất thì dùng đủ chín lớp.

## 2. Hai vai: dựng rồi phản biện
Sau bản dựng đầu tiên, đổi vai: "Bản này chưa phải bản cuối. Tìm lỗi." Chấm theo nhóm, ghi mốc thời gian, xếp hạng:

- **P0**: hỏng ý nghĩa hoặc đọc không được (chữ bị cắt, số sai, cảnh chớp trống, sai nhịp drop).
- **P1**: làm phim rẻ đi (cùng một chuyển cảnh 3 lần liền, giữ > 1 s không chuyển động, chữ < 26 px).
- **P2**: tinh chỉnh (độ trễ so le, dừng yên 300–600 ms trước khi hé lộ).

Sửa hết P0, rồi P1, và mỗi vòng chỉ sửa **một lỗi có tên** (xem "Iterating with the user" trong SKILL.md).
Ghi chú theo khung hình khi cần, ví dụ "dời logo reveal chậm 12 khung" (60 fps; 1 beat ở 113 BPM ≈ 32 khung).
Câu phản hồi hiệu quả của creator: "làm cho bớt giống PowerPoint". Hãy biến câu như vậy thành một dòng ở lớp 7.

## 3. Liên tục giữa các cảnh
- **Vật nối**: dùng một đối tượng đã có trên màn hình làm cầu sang cảnh sau (thanh tìm kiếm → thanh tiến trình → trục biểu đồ → bảng so sánh → gạch chân logo). Trước khi code, nhờ agent đề xuất chuỗi vật nối.
- **Họ chuyển cảnh**: chọn 2–3 họ cho cả phim (ví dụ push, zoom-through, iris) và lặp lại có chủ đích. Dùng cái mạnh nhất ở drop. Việc này không mâu thuẫn với Variety rule trong SKILL.md: đa dạng hiệu ứng trong cảnh, nhất quán chuyển cảnh giữa cảnh.
- **Mô-típ lặp**: một hình nhỏ quay lại nhiều lần (con mắt mèo của phim LongCat nhìn người gõ, chớp theo beat, liếc rồi dừng ở logo). Mỗi phim nên có một mô-típ.
- **Loop hero**: khung cuối khớp khung đầu (đã có `VP.cycle`).

## 4. Âm nhạc
Phân tích bài trước: BPM, downbeat, breakdown, drop, đoạn kết. Chuyển động nhỏ đặt trên beat, chuyển cảnh lớn đặt trên downbeat, đoạn yên thì bố cục đơn giản. SFX chỉ đặt khi có tương tác nhìn thấy được.
Repo đã có: `beatgrid.py`, `cues.mjs`, `mix.py`, `synthmusic.py`. Nhiều creator Skillry cũng tự tổng hợp nhạc bằng Python thuần để khỏi vướng bản quyền, đây là cách `synthmusic.py` đang làm.

## 5. Nhiều ngôn ngữ từ một bản dựng
Cardilife 1.3 xuất bản tiếng Nhật và tiếng Anh từ cùng một code, đổi bằng props. Trong repo, giữ mọi chuỗi chữ trong `<script id="spec">` hoặc `data.js`, và xuất mỗi ngôn ngữ bằng một file spec. Không viết chữ cứng trong code cảnh.

## 6. Cảnh 3D (Three.js) — `engine/scene3d.js`
- Chỉ dùng khi 3D có mục đích (mở đầu, vật anh hùng, logo). Không trang trí.
- Quy tắc tất định: camera, xoay, hạt đều là hàm của `k` (beat từ đầu cảnh). Không `THREE.Clock`, không `AnimationMixer`, không `Math.random()` (dùng `VP.rng(seed)`), không rAF riêng.
- `VP3.make('orbit', {w, h, colors, bg})` trả `{el, draw(k)}`. Thêm preset mới vào `PRESETS`.
- Shot `scene3d` trong `templates/kinetic-promo`; demo ở `examples/scene3d-demo/`.
- Render cần WebGL phần mềm: `render.mjs`, `sheet.mjs`, `audit.mjs` đã có cờ `--use-angle=swiftshader`. Kiểm tra tất định: cùng `t` cho cùng ảnh sau khi tua đi chỗ khác (đã thử, khớp).
- Chậm hơn cảnh DOM. Đo trước khi render bản cuối 60 fps của phim dài.

## 7. Kho tham chiếu (cách dùng Skillry)
Skillry hiển thị video gốc và bản dựng lại cạnh nhau, nhưng nhiều trang chỉ có trích đoạn prompt chứ không có prompt đầy đủ (đã kiểm tra: Cardilife, TopSlash, LongCat, logo cuối quảng cáo). Dùng làm nguồn ý tưởng:

| Muốn học | Xem loại video | Việc cần ghi lại |
|---|---|---|
| Mở đầu 3D cho promo | "Cardilife 1.3", logo cuối quảng cáo (Three.js) | Camera làm gì ở 3 giây đầu, đổi sang 2D thế nào |
| Phim ra mắt SaaS | TopSlash, Synclify, scroll+ | Số cảnh, độ dài mỗi cảnh, chuyển cảnh |
| Phong cách riêng | LongCat (halftone xerox) | Một chất liệu thị giác xuyên suốt |
| Giải thích | QR repair, mô hình tim 3D | Cách camera dẫn mắt qua các lớp |

Quy trình: xem video, viết 5 dòng ghi chú (vật nối, họ chuyển cảnh, mô-típ, nhịp, điểm yếu), rồi viết lại bằng engine của repo. Ghi nguồn ở đầu file ghi chú. Nhạc và hình của người khác là tài sản của họ.
