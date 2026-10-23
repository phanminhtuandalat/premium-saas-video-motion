# remotion-lab — thử Remotion cạnh engine VP

Remotion 4 (React) dựng lại clip "Vàng sáng 23/10/2026" của `examples/gold-3d`, để so hai cách dựng. Dùng đúng dữ liệu, lời đọc, mốc từ Whisper (`src/gold/*.json`, chép từ `gold-3d`) và bản trộn âm; chỉ phần dựng hình viết lại bằng React và `@remotion/three` (khối 3D `orbit`, thẻ số liệu, thanh so sánh, phụ đề).

```bash
cd examples/remotion-lab
npm install
# chép bản trộn âm của gold-3d vào public/ (file .wav bị git bỏ qua, nên không có sẵn):
mkdir -p public && cp ../../out/gold3d-mix.wav public/gold-mix.wav
npm run studio          # xem trước, cổng 3417
npm run render:gold     # -> out/gold-remotion.mp4 (khoảng 3 phút)
```

- Đặt `--port 3417` vì cổng 3000 mặc định có thể bị chương trình khác chiếm (render báo "NOT_FOUND").
- Cảnh 3D cần `--gl=angle`. `--concurrency=2` để đỡ tốn bộ nhớ.
- Kết quả đo (cùng 97,1 giây, 1080×1920): Remotion render 166 giây, 0 khung giật, −14,5 LUFS; bản VP 323 giây, 0 khung giật, −14,6 LUFS (hai bên khác chế độ render và tải máy, chưa phải so sánh công bằng).
- Giấy phép Remotion: miễn phí cho cá nhân và công ty tối đa 3 người, cấm chép mã Remotion để bán lại bản phái sinh. Thư mục này chỉ dùng Remotion như thư viện, không chép mã của nó.
- `src/Hello.tsx` là cảnh thử 3 giây; `src/Gold.tsx` là clip Vàng sáng.
