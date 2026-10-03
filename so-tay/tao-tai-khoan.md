# Sổ tay — Tạo tài khoản mới (Edge Function)

*Từ b143, 28/09/2026 · Edge Function đã dán lên Supabase thật, chủ dự án
bấm thử tạo tài khoản ĐẠT cùng ngày*

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
5. Vào hàm vừa tạo → thẻ **Settings** → tắt công tắc **Verify JWT with
   legacy secret** → **Save changes**.
6. Tự kiểm: trang Quản trị → Quản trị hệ thống → **+ Tạo tài khoản mới** →
   điền tên + email thử → **+ Tạo tài khoản ngay**. Thấy hộp *Đã tạo tài
   khoản* kèm mật khẩu tạm là xong. Tài khoản thử xoá ở Sổ tài khoản.

## Đặt lại mật khẩu (b171, 03/10/2026)

Cùng hàm, `viec: 'dat_lai_mat_khau'` + `userId` (hàm bản 0.2.0). Nút ở Sổ tài khoản
(`khu-quan-tri-he-thong.js` `hoiDatLaiMatKhau`). Từ chối: chính mình · một QTHT khác
(chiếm tài khoản không qua hai chữ ký). Ghi `nhat_ky_he_thong` loại `qtht`, sự kiện
`dat_lai_mat_khau`, người làm = người gọi. Phiên đang mở của người bị đặt lại KHÔNG bị ngắt.
⚠ Hàm bản 0.1.0 không biết `viec` → app báo "còn bản cũ, dán lại". **Chưa chạy trên máy chủ
thật** — dán hàm 0.2.0 rồi bấm thử một tài khoản thường.

## Chưa làm / bẫy đã biết

- **Gửi liên kết qua email: mờ.** App chưa có màn hình đặt mật khẩu khi bấm
  liên kết (cả luồng *Quên mật khẩu* cũng chưa có), và thư mặc định của
  Supabase chỉ tới email thành viên dự án — cần SMTP riêng. ⚠ **Chủ dự án
  HUỶ tính năng này 29/09/2026** (không thuê dịch vụ gửi thư) — nút cứ để
  mờ, đừng đề xuất làm lại.
- **Nhật ký ghi người làm = chính tài khoản mới** (`nk_tao_tai_khoan`, `42`
  mục 3c — trigger không biết ai gọi Edge Function). Muốn ghi đúng QTHT thì
  phải đổi `42`.
