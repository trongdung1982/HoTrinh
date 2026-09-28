# Sổ tay — Tạo tài khoản mới (Edge Function)

*Từ b143, 28/09/2026*

## Bản đồ

| Mảnh | File |
|---|---|
| Hàm máy chủ (Edge Function `tao-tai-khoan`) | `ham-may-chu/tao-tai-khoan/index.ts` |
| Cửa gọi | `js/services/sb.js` → `taoTaiKhoan(email)` |
| Tab giao diện | `js/pages/quan-tri/khu-tao-tai-khoan.js` (form quantri3 có sẵn) |
| Bản giả + ảnh | `../kiem-thu/sb-gia.mjs` · cảnh `ttk`, `ttk-trong` |

## Luật

- **Khoá `service_role` không bao giờ vào repo.** Supabase tự đặt nó vào biến
  môi trường của Edge Function — không phải dán Secret nào.
- Hàm **chỉ tạo người dùng** (email + mật khẩu tạm 10 ký tự, email coi như đã
  xác nhận). Họ tên · quyền tạo cây · lời mời QTHT do trang gọi tiếp hàm SQL
  có sẵn — luật và nhật ký nằm một chỗ.
- Cổng kiểm = `la_quan_tri_he_thong()` gọi **bằng thẻ người gọi**. Nhờ vậy
  tắt "Enforce JWT verification" không hở: thẻ giả thì PostgREST từ chối.
- Hàm luôn trả HTTP 200 kèm `{ ok, loi }`. Trang báo 404 = chưa dán hàm.

## Cách dán lên Supabase (chủ dự án, làm một lần — và mỗi lần file đổi)

1. Mở supabase.com → dự án → menu trái **Edge Functions**.
2. Bấm **Deploy a new function** → chọn **Via Editor**.
3. Ô tên hàm gõ đúng: `tao-tai-khoan`.
4. Xoá hết mã mẫu trong khung soạn, dán **toàn bộ** nội dung file
   `ham-may-chu/tao-tai-khoan/index.ts`, bấm **Deploy function**.
5. Vào hàm vừa tạo → thẻ **Details** (hoặc Settings) → tắt công tắc
   **Enforce JWT verification** (tên có thể là *Verify JWT with legacy
   secret*) → **Save**.
6. Tự kiểm: trang Quản trị → Quản trị hệ thống → **+ Tạo tài khoản mới** →
   điền tên + email thử → **+ Tạo tài khoản ngay**. Thấy hộp *Đã tạo tài
   khoản* kèm mật khẩu tạm là xong. Tài khoản thử xoá ở Sổ tài khoản.

## Chưa làm / bẫy đã biết

- **Gửi liên kết qua email: mờ.** App chưa có màn hình đặt mật khẩu khi bấm
  liên kết (cả luồng *Quên mật khẩu* cũng chưa có), và thư mặc định của
  Supabase chỉ tới email thành viên dự án — cần SMTP riêng. Hai việc ấy xong
  thì mới mở lựa chọn này.
- **Nhật ký ghi người làm = chính tài khoản mới** (`nk_tao_tai_khoan`, `42`
  mục 3c — trigger không biết ai gọi Edge Function). Muốn ghi đúng QTHT thì
  phải đổi `42`.
