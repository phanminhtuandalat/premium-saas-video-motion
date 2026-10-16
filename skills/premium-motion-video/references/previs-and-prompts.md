# Dàn cảnh trước khi làm và viết prompt (rút từ audit topview-3d-builder)

Nguồn: https://github.com/topviewai/topview-3d-builder (commit a0671f9, 10/2026). Audit ngày 16/10/2026.
Chỉ lấy **quy trình và quy tắc**. Không cài, không chép code.

## Repo đó là gì
Skill `topview-3d-cli`: dựng cảnh 3D dạng khối (nhân vật ma-nơ-canh, đạo cụ hình khối, 121 tư thế tĩnh, camera tĩnh), render PNG hoặc video tham chiếu ngoại tuyến, rồi (nếu người dùng đồng ý) gửi khung hình cho dịch vụ sinh video. Mục tiêu là **bản vẽ dàn cảnh** (blocking), không phải hình đẹp.

## Kết quả audit
- **Giấy phép:** mã Apache-2.0, tài sản dựng sẵn (nhân vật, tư thế) CC BY 4.0 nên dùng lại phải ghi nguồn.
- **An toàn:** mã Python và Node chỉ gọi tiến trình con (node, trình duyệt) và tải `uv` từ astral.sh khi cài. Có xóa thư mục kết xuất và thư mục tạm của chính nó (`shutil.rmtree`), chưa thấy xóa chỗ nào khác.
- **Điểm cần biết:** `.mcp.json` trỏ tới một máy chủ MCP từ xa (`mcp-3d.topview.ai`, đăng nhập OAuth). Bước cuối của skill gửi khung hình lên dịch vụ sinh video của họ, có thể tính phí. Mình **không cài** và không dùng phần này.
- **Nặng:** 110 MB, cần Node 20.6, Python, Chromium. Nhân vật là GLB có xương, muốn dùng trong `scene3d` phải thêm GLTFLoader và cách đặt tư thế tất định. Không đáng làm lúc này.
- Checkout trên Windows báo thiếu một số file `.claude-plugin` (lỗi đường dẫn khi clone), không ảnh hưởng nội dung đã đọc.

## Ý tưởng áp dụng được

### 1. Dừng ở mỗi mốc để người dùng duyệt
Mỗi giai đoạn xong thì cho xem kết quả, nêu một giới hạn còn lại, đề xuất bước kế và hỏi **một** câu cụ thể ("dựng cảnh này luôn, hay sửa bố cục trước?"). Câu "làm" của người dùng cho phép cả giai đoạn đó, không phải mọi giai đoạn sau. Trùng với cách làm của repo (bàn trước, anh bảo làm thì làm).

### 2. Ghi lại ý định, không chỉ ghi kết quả
Lưu lời yêu cầu của người dùng **nguyên văn**, phần suy ra thì ghi rõ là suy ra. Ghi vào `video-spec.md` (lớp 2 của brief 9 lớp). Lần sau đọc lại trước khi đổi, để sửa một chỗ không làm mất yêu cầu cũ.

### 3. Độ phủ camera cho cảnh 3D (`scene3d`) và phân cảnh
| Số người trong cảnh | Tối thiểu cảnh quay |
|---|---|
| 1 | 2: một cảnh trung hoặc toàn, một cảnh gần |
| 2 | 3: cảnh hai người, hai cảnh gần hoặc qua vai |
| 3 trở lên | 1 cảnh nhóm, 1 cảnh mỗi nhóm tương tác, 1 cảnh gần mỗi nhân vật chính |
Luôn có thêm một camera nhìn từ trên xuống để kiểm bố cục, không dùng làm hình chính. Nếu khó dựng thì **dời camera trước**, không dời người và vật để cho đẹp.

### 4. Quy tắc trung thực
- Không phán đoán trên ảnh chưa xem: mở ảnh render ra xem rồi mới kết luận.
- Phần thay thế đơn giản thì nói rõ là thay thế. Ràng buộc chưa kiểm thì để `unknown`.
- Không bịa mã, kích thước, số đo. Chép đúng từ kết quả lệnh.
- Nét mảnh, sọc, răng cưa là lỗi của bộ dựng, không phải lỗi hình. Chỉ sửa khi có số đo hoặc điều kiện thất bại làm căn cứ.

### 5. Khuôn viết prompt có checklist (áp dụng cho prompt tạo ảnh và video)
Điền đủ trước khi viết, thiếu thì chọn mặc định và ghi vào mục "Giả định":
1. **Thông số:** tỉ lệ, độ dài, nhịp hình.
2. **Mỏ neo phong cách:** một mô tả thực thi được (ví dụ "nét mực đen, giấy kem #F5EBD7") cộng 3–8 từ cụ thể. Cấm từ rỗng như "đẹp", "cao cấp".
3. **Chủ thể, cảnh, ánh sáng và bảng màu** (2–5 màu, khóa màu cụ thể).
4. **Khóa nhận dạng:** nhân vật, quần áo, đạo cụ giữ nguyên giữa các hình.
5. **Cấm viết rõ:** chữ ngoài danh sách, logo, watermark, đổ bóng, trôi phong cách.
6. **Dòng thời gian theo giây** nếu là video: ai làm gì ở giây nào.
7. **Quan hệ nhân quả vật lý:** không dịch chuyển tức thời, không vật tự xuất hiện.
8. **Kết thúc:** 0,5–2 giây cuối dừng thế nào.
Quy tắc ưu tiên khi các yêu cầu mâu thuẫn: yêu cầu cứng của người dùng, rồi khóa nhận dạng từ ảnh tham chiếu, rồi nhịp từ âm thanh, rồi phong cách từ video tham chiếu, cuối cùng mới tới mặc định của mình.

## Công cụ đi kèm: `tools/storyboard.mjs`
Một file `storyboard.json` (kích thước, khối phong cách, danh sách hình và các tầng với tỉ lệ `box`, mô tả, chuỗi chữ bắt buộc, mốc thời gian) sinh ra cả hai:
- `image-prompts.md`: prompt dán thẳng vào Gemini cho từng ảnh, kèm danh sách chuỗi cần kiểm từng ký tự.
- `scene_XX.annotation.json`: file vùng cho skill `srt-whiteboard-animation`.
Cả hai lấy từ cùng tỉ lệ `box` nên hình và vùng vẽ không bao giờ lệch nhau. Công cụ cảnh báo khi khoảng trống dành cho phụ đề (giữa tầng giữa và tầng dưới) nhỏ hơn mức đặt. Ví dụ: `examples/rau-sach-viet-nam/storyboard.json` (bản nháp).

```bash
node tools/storyboard.mjs examples/rau-sach-viet-nam/storyboard.json
```
