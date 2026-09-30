# Sổ tay — Xuất ảnh sơ đồ · In PDF

*Mã: `js/pages/export-image.js`. Chuyển từ ghi chú đầu file ngày 30/09/2026
(b161a, trả nợ D1). Lịch sử: `git log -p js/pages/export-image.js`.*

## Ba đường xuất

| Đường | Hàm | Cách làm |
|---|---|---|
| PNG | `xuatAnhPNG()` | clone `<svg>` → canvas → `toBlob()`, 0 thư viện |
| PDF vector | `inSoDo()` | `window.print()` + `@media print`, trình duyệt tự có *Lưu PDF* |
| Raster theo khổ + DPI | `xuatAnhDoPhanGiaiCao()` → `inAnhRaster()` | ảnh đúng số pixel rồi in full khổ |

Chưa cần jsPDF — thêm thư viện là việc phải hỏi (`CLAUDE.md` mục 9).
Ảnh chỉ chụp PHẦN SƠ ĐỒ ĐANG HIỆN (đã lọc đời/huyết thống), không phải cả gia
phả — chữ trên nút ở `settings.js` phải nói rõ.

## Luật đã chốt

- **In PDF luôn thu nhỏ vừa MỘT trang** (chủ dự án chọn 31/08/2026): cây lớn
  thì chữ nhỏ, nhưng không ai bị cắt đôi giữa hai trang.
- **`<svg>` để `width/height:100%`**, cho `preserveAspectRatio` tự co — KHÔNG
  ép pixel tính sẵn (xem sự cố novaPDF).
- **Nút tải PNG không tự bấm hộ** (`a.click()`): hàm `async`, lúc xong thì cú
  bấm gốc đã qua, trình duyệt ÂM THẦM chặn tải. Hiện link thật cho người dùng
  bấm lần hai — cùng lý do với Xuất GEDCOM (`import-export.js`).
- Khổ lớn (nhiều mét) đi đường IN (vector), không đi đường CHỤP (canvas).
- **Chế độ CHỈ CHỮ xuất chung đường, không sửa gì** (1d, đo 30/09/2026):
  ba đường chỉ đọc `viewBox` + nhân bản `<svg>`, sơ đồ chữ không có `<image>`
  nên không chờ nạp ảnh; phông nằm ở `font-family` của `<svg>` gốc nên chữ
  DỌC ra đúng phông. ⚠ Khổ giấy tính theo `VE.chuTen` (11) — trùng
  `O_CHU.dong.ten.co` là CỐ Ý; đổi một bên thì chế độ Chữ in sai chiều cao
  chữ, im lặng. Đo: `../kiem-thu/kiem-xuat-che-do-chu.mjs <59|681> <tâm> <đời>`
  (PNG · PNG DPI · PDF nhiều trang · bấm ô ngang/dọc) — mở ảnh ra nhìn.
  ⚠ Bài Chrome đọc lại blob ảnh: dùng `new Image()` + blob URL, KHÔNG
  `createImageBitmap()` — dưới `--virtual-time-budget` nó treo mãi, trang
  không báo lỗi, `<pre>` kết quả trống (b165 tưởng xuất PNG treo).

## Sự cố đã gặp

⚠ **novaPDF 31/08/2026** — hai lỗi, cả hai là một con số ĐOÁN chưa đo:
1. PNG bóp ảnh xuống 13% (4096×304 cho cây 681 người) do kẹp
   `CANH_TOI_DA = 4096` chép từ mã nháp → `tinhTyLePng()`.
2. In qua máy in PDF ẢO ra Letter, sơ đồ bé xíu: trình điều khiển máy in
   (novaPDF, Microsoft Print to PDF, máy in giấy) quyết khổ giấy và BỎ QUA
   `@page size`. `do-khong-lon.mjs` chỉ đo "Lưu PDF" của Chrome nên đúng cho
   đúng đường ấy. `do-in-vua-trang.mjs` đo lại: ép pixel → tràn 359%;
   `100%` → vừa 99%/100%.

**Nếp:** một phép đo chỉ nói về ĐÚNG con đường nó đã đi. Muốn chắc thì đo con
đường người dùng thật sự đi.

⚠ **Trần canvas — ĐÃ ĐO** (`kiem-thu/do-canvas-lon.mjs`): tối đa 268.435.456
điểm ảnh (2^28) và mỗi cạnh ≤ 65535. A4@1200 · A2@600 · A0@300 ĐƯỢC;
A0@600 · A1@600 · A3@1200 HỎNG. Và **hỏng IM LẶNG**: không ném lỗi, điểm ảnh
đọc lại `0,0,0,0`, `toBlob()` trả `null`. Nên `kiemTranCanvas()` chặn TRƯỚC,
và sau khi vẽ còn kiểm `toBlob()` null lần nữa (máy ít RAM hỏng sớm hơn).

`Page.printToPDF` (CDP — chính là nút *Lưu thành PDF*) chạy `@page size` tới
ít nhất 8×12 mét; `chrome --headless --print-to-pdf` dòng lệnh trần thì bỏ
qua `@page size` — đừng nhầm đó là trần của Chrome.

## Ảnh người trong bản xuất

- `thayAnhBangDataUri()` tải từng ảnh về Data URI trước khi vẽ canvas (ảnh
  ngoài làm canvas "bẩn", `toBlob()` từ chối). Tải hỏng thì GỠ `href` — lớp
  bóng người nằm sẵn ngay dưới (`render.js` vẽ hai lớp chồng), không làm hỏng
  cả bản xuất.
- Đổi sang bản LỚN 1600px lúc xuất: `banDoAnhLon()` dựng bản đồ URL nhỏ → URL
  lớn từ `tree.media`. ⚠ Kho ảnh KÍN từ b161a: khoá là **URL đã ký** trọn vẹn
  (`driveThumbUrl`), không còn thay mã file trong URL như thời Drive — cách
  cũ (dò `?id=`) đã câm từ lúc chuyển sang Supabase.
- Chưa đo CORS của ảnh có chữ ký trên app thật. Hỏng thì chỉ mất ảnh, không
  mất bản xuất.
- Chưa có công tắc "bỏ ảnh khi in khổ lớn" — ảnh raster phóng nhiều mét thì mờ.
