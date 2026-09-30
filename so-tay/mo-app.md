# Sổ tay · mở app (phiên + đọc cây lúc khởi động)

Gồm      : `js/services/sb.js` — `layPhien()` · `layGoiPhien()` · `layDong()`/`docDong()`/`ghepDong()` · `js/services/repo.js` — `khoiTao()` · `napCay()` · `luoc-do/55-mo-phien.sql` — `mo_phien()`
Liên quan: mọi trang (`layPhien()` chạy ở đầu cả sơ đồ lẫn Quản trị) · phân quyền (`so-tay/phan-quyen.md`) · đo: `../kiem-thu/ban-thu-sql/do-b157b.mjs`

## Luật chung

- **Mở app = MỘT lượt mạng** (b157b, 29/09/2026): `mo_phien(p_doc_cay)` trả
  gói tài khoản + cây được chọn + thùng rác + quyền sửa + tên cây, và (trang
  sơ đồ) cả dữ liệu cây. Đo máy thật: cây 681 người 2,1 s → 0,62 s; 21 câu → 1.
- ⚠⚠ **`mo_phien` phải là `security INVOKER`.** Nó chỉ gom những câu trình
  duyệt vẫn hỏi, dưới đúng RLS của người gọi. Đổi sang `definer` là mở toang
  mọi bảng bên dưới. Tự kiểm dòng 1 của `55` bắt điều này.
- ⚠⚠ **HAI ĐƯỜNG phải giữ ĐỒNG BỘ.** `layPhien()` hỏi gói trước; lỗi hay chưa
  có hàm thì đi đường cũ từng câu. Thêm một câu vào `layPhien()` (một cờ tài
  khoản, một cột `user_settings`…) thì thêm CẢ vào `mo_phien()` — sót là đường
  gói im lặng trả thiếu, và đường cũ lại chạy đúng nên thử tay không lộ.
  Luật chọn cây cũng ở hai chỗ: `cayDangChon()` (JS) và khối "Chọn cây" (`55`).
- **Dữ liệu cây ráp ở MỘT chỗ** — `ghepDong()`, cho cả đường gói lẫn đường lẻ.
- **Đọc trước chỉ cho trang sơ đồ**: `layPhien({ docCayLuon: true })` chỉ
  `repo.khoiTao` bật. `layDong()` nhận lời hứa đọc trước MỘT lần, đúng cây,
  trong 15 giây. Trang Quản trị không bật — khỏi kéo ~600 KB nó không dùng.
- **Xin mã chạy ngầm** (`dayKhoMa()` trong `napCay`) — sơ đồ không chờ. Chủ dự
  án bấm thêm người + Lưu ngay sau khi mở: không lỗi mã (29/09).

## Lỗi đã gặp — áp cho MỌI file trong "Gồm"

- **`getUser()` CÓ gọi mạng** — ghi chú cũ của `nguoiDangNhap()` nói "không gọi
  mạng", sai: mỗi trang tốn ~130 ms chỉ để hỏi "ai". `layPhien()` dùng
  `nguoiTrongPhien()` (`getSession()`, đọc trong máy); hàng rào thật là máy
  chủ kiểm chìa khoá ở mọi câu sau. `nguoiDangNhap()` giữ `getUser()` cho chỗ
  cần tin tươi (ngày đăng ký ở khu Tài khoản).
- **So gói với câu lẻ báo lệch oan** — `jsonb` tự xếp lại thứ tự khoá,
  PostgREST trả theo thứ tự cột. So bằng chuỗi JSON thì phải chuẩn hoá khoá
  trước; trong SQL so `jsonb = jsonb` thì không vướng.
- **Đưa cây vào thùng rác trong phép đo bị chặn im** — ràng buộc
  `trees_thung_rac_hop_le` (`16`) đòi `xin_xoa_luc` có trước `da_xoa_luc`. Đặt
  một cột là `update` lỗi, cây KHÔNG vào thùng rác, và phép đo hỏng oan.
  Luôn kiểm `.ok` của câu dựng cảnh.
- **Đọc được cây mà không ghi được "tôi đang mở cây này"** (b145c, 30/09) —
  người có chân ở cây A mở cây mặc định B: `dat_cay_dang_mo()` báo "new row
  violates row-level security policy for table user_settings", vì luật ghi
  `user_settings` đòi `la_thanh_vien()` còn cửa đọc là `co_the_xem_cay()`. Vá
  ở `64` (ghi được cây mình XEM được; tắt cờ ở cây vừa thôi là mặc định luôn
  được) + `mo_phien` 0.2.0 nhận cờ ấy, vai `xem`. ⚠ Tài khoản thử
  `khach@io.vn` · `thu-h9` đều CÓ chân ở `TH957` — thử cửa cây mặc định bằng
  chúng là không thử gì; đo REST bằng tài khoản thật sự không chân.

## Vì sao làm thế này

- Chậm không nằm ở dữ liệu (đọc cả cây 681 người ~0,34 s) mà ở **bảy vòng mạng
  NỐI ĐUÔI** trước khi được đọc cây, mỗi vòng ~130 ms dù câu hỏi tí hon. Đo
  từng chặng trước khi sửa (b157): gom vòng ở trình duyệt được 2× (0,78 s),
  gói máy chủ được 3×.
- Gói kèm dữ liệu cây luôn (thay vì đoán cây ở trình duyệt rồi đọc song song)
  vì không cần nhớ gì ở máy người dùng và không bao giờ đọc nhầm cây.
