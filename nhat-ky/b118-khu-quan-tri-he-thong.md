# b118 — quantri3: khu Quản trị hệ thống

*15/09/2026 15:25*

## Đã làm

- Khu thứ tư trên thanh điều hướng đổi từ *Sao lưu* (chưa từng viết,
  `chuaLam`) sang **Quản trị hệ thống** — vỏ mới `khu-quan-tri-he-thong.js`,
  nạp động `khu-tai-khoan-he-thong.js` không sửa một dòng nghiệp vụ.
- Chip *Toàn hệ thống* rời khỏi `khu-tai-khoan.js`. Khu Tài khoản giờ chỉ còn
  một thứ để vẽ — bỏ hẳn cơ chế chip (`CHIP`, `chipDangMo`, `veHangChip`,
  `napHeThong`), khu-tai-khoan.js co lại còn ~1/3 độ dài. Xoá CSS `.qt-chip`/
  `.qt-chips` không còn ai dùng.
- Trang chi tiết một tài khoản đổi khu cha: `#thanh-vien/tai-khoan/<mã>` →
  `#quan-tri-he-thong/tai-khoan/<mã>` — sửa `TRANG` trong `khung.js` và
  `duongDan()` trong `khu-tai-khoan-he-thong.js`. Bắt được MỘT câu văn bản
  sót lại ("bấm tên tài khoản ở chip Toàn hệ thống của khu Tài khoản") bằng
  cách nhìn ảnh chụp kq-39 — bộ kiểm văn bản không bắt được câu này vì nó là
  chữ hiển thị, không phải cấu trúc mã.
- Khu Kiểm duyệt: **không sửa gì** — đã nối sẵn vào khung từ trước b115, chỉ
  xác nhận lại bằng ảnh chụp (kq-1, kq-2).
- Cập nhật `kiem-thu/kiem-trang-quan-tri.mjs`: thêm `JS_QTHT`, sửa danh sách
  bốn khu (`sao-luu` → `quan-tri-he-thong`), sửa phép đếm `chuaLam` (1 → 0),
  thêm PHẦN N (quy ước file mới), sửa ba phép PHẦN I trỏ sang file mới, sửa
  G13, sửa phép đăng ký TRANG. 298 phép, đạt hết.
- Cập nhật `Claude_Code/kiem-thu/xem-khung-quan-tri.mjs` (ngoài repo): đổi
  `#thanh-vien` → `#quan-tri-he-thong` cho mọi cảnh của sổ Toàn hệ thống, bỏ
  bước bấm `"Toàn hệ thống|"` khỏi các chuỗi `bam()` vì không còn chip phải
  bấm qua. 43 ảnh, không cái nào ra nền trơn. Đã nhìn bằng mắt ở 1280px và
  390px (kq-0, kq-3, kq-7…19, kq-39…42).

## VÌ SAO chọn cách này

**Không gác lại bằng `phien.laQuanTriHeThong` ở lớp giao diện.** Khu Kiểm
duyệt và khung đã có sẵn luật *"app không tự lọc, máy chủ lọc"* — nav hiện
cho mọi người, nội dung tự nói "không có quyền" khi máy chủ trả rỗng.
`mountToanHeThong()` đã sẵn câu giải thích ấy (*"Máy chủ không trả về tài
khoản nào… nếu bạn vừa được cấp cờ ấy thì đăng xuất rồi đăng nhập lại"*) nên
thêm một lớp hỏi trước ở khu mới là hai chỗ nói cùng một câu — hai chỗ có
ngày lệch nhau. Giữ nguyên một nguồn sự thật.

**Không đổi tên `khu-tai-khoan-he-thong.js`.** File vẫn đúng tên — nội dung
của nó (sổ đăng ký + bảng sâu) không đổi, chỉ đổi NƠI nó được gọi tới. Đổi
tên file mã là việc phải hỏi chủ dự án (`CLAUDE.md` mục 9); dựng thêm một vỏ
mỏng đứng trước nó rẻ hơn và không phải hỏi.

**Không gộp Sao lưu / Cây mặc định / Tạo tài khoản / Thùng rác / Nhật ký vào
khu này ngay**, dù prototype quantri3 vẽ cả bảy tab trong một khu
*Quản trị hệ thống*. `KE-HOACH.md` đã tách từng thứ thành bước riêng có số
(Sao lưu → b119, bốn luật SQL → b118b, Tạo tài khoản/Nhật ký → sau b120) —
xây cả bảy tab hôm nay là nhận việc của ba bốn bước khác vào một phiên,
đúng thứ CLAUDE.md mục 8 bảo phải chia nhỏ trước khi bắt đầu, không phải sau.
Khu hôm nay chỉ có một thứ để vẽ (sổ tài khoản) — không có tab nào cả, vì một
tab với đúng một mục là một tab thừa.

## Đã thử mà hỏng

Không có — việc chính là dời mã đã chạy đúng, không phải viết mới từ đầu, nên
không có vòng thử-sai nào đáng ghi. Bài học duy nhất: bộ kiểm văn bản
(`kiem-trang-quan-tri.mjs`) không bắt được câu chữ hiển thị sai
("chip Toàn hệ thống của khu Tài khoản" còn sót ở `trang-tai-khoan.js`) —
chỉ ảnh chụp nhìn bằng mắt mới bắt được. Nếp rút ra: đổi ĐƯỜNG DẪN (route/
khu) thì phải grep riêng các câu tiếng Việt cứng nhắc tới tên khu cũ, đừng
chỉ tin bộ kiểm cấu trúc.

## Còn treo

- **b118b** — bốn luật SQL (QTHT hai chữ ký, khoá mềm 60 ngày, thùng rác
  120 ngày, xin đổi quyền) — nền móng quyền, đứng sau việc không đụng vai.
- Khu Quản trị hệ thống mới chỉ có MỘT việc (sổ tài khoản). Sáu việc còn lại
  của prototype (Tổng quan, Tạo tài khoản, Cây mặc định, Sao lưu, Thùng rác,
  Nhật ký) chưa viết — mỗi thứ một bước riêng đã có số ở `KE-HOACH.md`.
- Ba điểm dừng b111/b111b/b111c/b117 vẫn chưa ai bấm thử trên máy chủ thật —
  hoãn tới khi xong trang Quản trị (chủ dự án chốt 15/09/2026), b118 vẫn
  chưa phải điểm dừng ấy vì Quản trị hệ thống còn dở.

## File đã đụng

- *Mới*: `js/pages/quan-tri/khu-quan-tri-he-thong.js`
- *Sửa*: `js/pages/quan-tri/khung.js` · `khu-tai-khoan.js` ·
  `khu-tai-khoan-he-thong.js` · `trang-tai-khoan.js` · `quan-tri.css` ·
  `kiem-thu/kiem-trang-quan-tri.mjs`
- *Sửa, ngoài repo `supabase/`*: `Claude_Code/kiem-thu/xem-khung-quan-tri.mjs`
