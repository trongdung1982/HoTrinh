# Sổ tay · Nhập/xuất GEDCOM và nhập Excel

Gồm      : `js/domains/gedcom.js` (xuất + đọc + trộn) · `js/domains/excel.js`
(đọc sheet `DuLieu`) · `js/pages/import-export.js` (hai màn hình)
Liên quan: XUẤT Excel là `so-tay/xuat-excel.md` — khuôn khác hẳn, không nạp lại
được · bảng ánh xạ GEDCOM gốc: `../tai-lieu/CAU-TRUC-DU-LIEU_V06.md`

## Luật

- **Cột mới trên `persons` thì GEDCOM có BA chỗ phải thêm**, thiếu chỗ nào
  là mất im lặng qua một vòng xuất → nhập: ① `veNguoi` (xuất, nằm TRONG nhánh
  `else` để "Ẩn chi tiết người còn sống" giấu nó) · ② `docNguoi` (mặc định +
  `case` đọc thẻ) · ③ bảng `TRUONG_NGUOI` (trộn bổ sung: so và ghi vào người
  đã có). Excel thêm một chỗ: bảng `COT` của `excel.js` (cột KHÔNG bắt buộc).
- Thẻ tự đặt (`_` đầu) cho mọi trường không có thẻ chuẩn khớp nghĩa: `_DOI` ·
  `_CHI` · `_GIO` · `_QUANHE` · `_RANK` · `_TRANGTHAI` · **`_LIENHE`** (b160,
  `contact` — chữ tự do, nên không vào `PHON`/`EMAIL`).
- Nhập Excel: cột nào không có thì bỏ qua, không báo. Vì thế tên cột gõ lệch
  là mất IM LẶNG — cột nào người điền dễ gõ khác thì khai tên thứ hai ở
  `COT_TEN_KHAC` (hiện có `ID mẹ` cho `ID me`).

## Rà 29/09/2026 (b160) — sau khi bảng Excel xuất và lược đồ đổi

Đo bằng cây giả điền ĐỦ mọi trường (năm loại quan hệ con, thứ bậc, ly hôn,
ngày cưới chữ, ghi chú cặp, nguồn) → xuất → đọc lại → so từng trường; cộng
bảy bài có sẵn (`kiem-gedcom` · `kiem-nhap-gedcom` · `kiem-nhap-bo-sung` ·
`kiem-nhap-excel` · `kiem-ghep-doi-excel` · `kiem-nhap-cay-moi` ·
`kiem-cap-ma-nhap`, chạy `--import ./sang-supabase.mjs`) — đạt cả.

- **Đã vá**: `contact` (b150b) rơi mất ở cả xuất, đọc lẫn trộn GEDCOM. Excel:
  "ID mẹ" có dấu bị bỏ qua cả cột; "Nam/Nữ", "Còn sống/Đã mất", chuỗi
  "TRUE" trong ô định dạng chữ thành "chưa rõ"/"còn sống"; bảy cột thông tin
  (Chức tước … Liên hệ, cùng tên bản Xuất Excel) nay đọc nếu file có.
- **Còn lệch, CỐ Ý**:
  - `partnerOrder` không đi qua GEDCOM — `HUSB`/`WIFE` chia theo giới tính.
  - `_DOI` xuất số ghi tay `vn.generation` cũ, KHÔNG phải Đời app hiện
    (`tree_persons.doi`). Ô *Đời thứ mấy* đã bỏ khỏi form Sửa (chủ dự án
    29/09, b160); số cũ nằm yên trong dữ liệu, không ai ghi thêm.
  - Khuôn `DuLieu` chỉ hai phối ngẫu, chỉ con đẻ, không ngày cưới.
- Ngày Excel đọc được số nhưng KHÔNG chắc ("khoảng 1890") nay giữ nguyên văn
  ở `raw` (trước b160 mất chữ "khoảng") — cả hai khuôn.

## Nhập lại BẢNG PHẲNG (b160, chủ dự án 29/09/2026)

- File không có sheet `DuLieu` mà có `BangPhang` → `docBangPhang()`. Tên cột
  khớp TỪNG CHỮ `pages/quan-tri/xuat-excel.js` — đổi bên này phải đổi bên kia.
- Cha/mẹ theo năm loại (+ số khi có hai cặp cùng loại) → mỗi nhóm một cặp;
  phối ngẫu k ≥ 2 mang thứ bậc k; thứ tự con = vị trí trong `ID con …` của
  cha/mẹ. Cột Đời (số máy chủ tính) KHÔNG vào `vn.generation`.
- Khuôn không mang: ngày/nơi cưới, tình trạng hôn nhân, nơi mất, tên phụ
  ngoài biệt danh → trống sau khi nhập (bản xem trước nói điều này).
- Đo: `kiem-thu/kiem-nhap-bang-phang.mjs` — vòng xuất → nhập trên cây giả
  (năm loại quan hệ, ba vợ, hai cặp cha mẹ, con một bên, người đã xoá) và
  cây 681: mọi gia đình, thứ tự con, loại quan hệ, thứ bậc khớp.
- Khuôn hai sheet (`Nguoi` + `GiaDinh`) CHƯA nhập được.
