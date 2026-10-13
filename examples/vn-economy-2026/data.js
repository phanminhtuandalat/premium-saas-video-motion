/* NGUỒN SỐ LIỆU DUY NHẤT — Kinh tế Việt Nam 9 tháng 2026 (nội dung do người dùng cung cấp).
 * index.html chỉ đọc số từ đây; không gõ số cứng trong code dựng phim.
 * Đơn vị: g = % tăng; abs = giá trị tuyệt đối (đơn vị ghi ở nhãn trên màn hình). */
window.DATA = {
  gdp: 9.01,                                   // % GDP thực, 9 tháng
  q3: 9.95,                                    // % GDP quý III
  sector: { cnxd: 11.21, dv: 8.69, nlts: 4.02 },
  invest: { abs: 3109.6, g: 15.1 },            // nghìn tỷ đồng
  credit: { abs: 20.75, g: 16.69 },            // triệu tỷ đồng
  fdi: { abs: 21.07, g: 12.1 },                // tỷ USD (FDI thực hiện)
  export: { abs: 434.3, g: 24.5 },             // tỷ USD
  import: { abs: 453.72, g: 36.7 },            // tỷ USD
  deficit: 19.42,                              // tỷ USD (nhập siêu)
  fdiShareExport: 80.7,                        // % kim ngạch xuất khẩu do khu vực FDI
  inputShareImport: 94.1,                      // % hàng nhập khẩu là tư liệu sản xuất
  cpi: 4.52,                                   // % CPI bình quân
  income: { abs: 9.1, g: 9.1 },                // triệu đồng/tháng; % tăng danh nghĩa
  realIncome: 4.4,                             // % sức mua thực (xấp xỉ)
  jobs: { abs: 52.7, g: 1.3 }                  // triệu người; %
};

/* CHUỖI KỲ VỌNG — chép tay đúng như bản tin gốc (KHÔNG sinh từ DATA, để bắt lỗi định dạng/gõ sai).
 * [beat, chuỗi phải xuất hiện trên màn hình ở beat đó]. Kiểm tra: node tools/checkdata.mjs examples/vn-economy-2026/index.html */
window.EXPECT = [
  [15.5, '9,01%'], [16.5, '+9,95%'],
  [22.5, '11,21%'], [22.5, '8,69%'], [22.5, '4,02%'],
  [35, '3.109,6'], [35, '+15,1%'], [35, '20,75'], [35, '+16,69%'], [35, '21,07'], [35, '+12,1%'],
  [49.5, '434,3'], [49.5, '+24,5%'], [49.5, '453,72'], [49.5, '+36,7%'], [51, '19,42'],
  [62, '80,7%'], [62, '94,1%'],
  [74.5, '+9,1%'], [74.5, '4,52%'], [74.5, '9,1 triệu'], [74.5, '+4,4%'], [74.5, '52,7'], [74.5, '+1,3%'],
  [85, '36,7%'], [85, '24,5%'], [85, '16,69%'], [85, '15,1%'], [85, '12,1%'], [85, '9,01%'], [85, '4,4%'],
  [104, '9,01%']
];
/* Quan hệ số học phải đúng (checkdata.mjs kiểm tra): xuất − nhập = −nhập siêu; sức mua thực ≈ (1+thu nhập)/(1+CPI) − 1. */

/* Cấu hình cho tools/audit.mjs: các thời điểm đã "đáp" xong, vùng an toàn 9:16, phụ đề được phép nằm dưới vùng an toàn. */
window.AUDIT = { beats: [14.9, 22.5, 35.5, 49, 62.5, 74.5, 84.5, 104], safe: [0, 221, 1080, 1540], safeExempt: ['.capi'], minFont: 26 };
