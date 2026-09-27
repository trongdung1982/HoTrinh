# Sổ tay · nhật ký hệ thống

Gồm      : `luoc-do/42-nhat-ky-he-thong.sql` — hai bảng, tám trigger, năm hàm · `js/pages/quan-tri/khu-nhat-ky.js` — tab Nhật ký + bảng nhật ký trong Thùng rác + thẻ Tổng quan · `sb.js` khối *Nhật ký hệ thống*
Liên quan: `so-tay/trang-quan-tri.md` · bàn thử `../kiem-thu/ban-thu-sql/do-b134.mjs` · ảnh `../kiem-thu/xem-khung-quan-tri.mjs nk`

## Luật chung

- **Máy chủ tự ghi bằng TRIGGER** trên `auth.users` · `tai_khoan` · `trees` ·
  `cau_hinh` — không sửa hàm nào cũ, nên `42` không vào chuỗi dán lại. Trình
  duyệt không có cửa ghi. Muốn ghi thêm loại việc thì thêm nhánh/trigger ở
  `42`; **đừng chép lại hàm của `23`/`27` để chèn `insert`** — dán lại file cũ
  sau đó là mất, im lặng.
- **Trigger đọc TRẠNG THÁI đổi** (cột trước → sau), không đọc tên hàm — nên bắt
  cả việc làm bằng SQL tay hay bảng điều khiển Supabase. Một câu `update` đổi
  nhiều cột (khoá mềm xoá luôn lời mời QTHT) thì ghi VIỆC CHÍNH, không ghi hệ
  quả kéo theo.
- **Người làm = `auth.uid()`**; `security definer` không đổi nó. Email chép
  thành CHỮ lúc ghi (không khoá ngoại) — xoá tài khoản thì nhật ký về họ vẫn
  còn. Trống = "Hệ thống" (dán SQL tay, bảng điều khiển, lúc tự đăng ký).
- **Hai lớp khoá bảng**: `revoke` (Supabase tự cấp quyền bảng mới cho `anon`,
  `authenticated`) + RLS bật KHÔNG luật nào. Cửa đọc duy nhất là năm hàm, hỏi
  `la_quan_tri_he_thong()` trong thân.
- Xoá = chuyển thùng rác thành MỘT lô; lô giữ 120 ngày (phép tính trên
  `xoa_luc`, không cột hạn). Xoá / phục hồi / dọn đều tự để lại một dòng loại
  `backup` — xoá dấu vết cũng là một dấu vết.

## Bẫy

- ⚠ **Trigger đăng nhập là trigger DUY NHẤT nuốt lỗi** — nó nằm trên đường
  đăng nhập của MỌI người. Bỏ khối `exception` là một lỗi nhật ký khoá cửa cả
  phần mềm. Bàn thử canh bằng D1.
- **Loại `backup` hôm nay chỉ là việc với chính nhật ký.** Bản sao lưu đêm chỉ
  ĐỌC nên không để dấu; muốn ghi thì `SaoLuu.gs` phải gọi một hàm mới.
- **Bộ kiểm sao lưu đếm MỌI `create table` trong `luoc-do/`** — thêm bảng mới
  là phải thêm vào `SaoLuu.gs` hoặc vào `CHUA_SAO_LUU` kèm một dòng ở
  `KE-HOACH.md`. b134 phát hiện `33`/`37` đã lọt từ lúc ra đời: bộ kiểm báo
  HỎNG mà không ai chạy nó.
