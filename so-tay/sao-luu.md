# Sổ tay — Sao lưu và khôi phục

*Lập 28/09/2026 (b142b). Ghi theo chức năng: gặp lỗi thì thêm vào đây.*

## Bản đồ

| Việc | File |
|---|---|
| Sao lưu đêm (Apps Script, chủ dự án dán tay) | `sao-luu/SaoLuu.gs` · hướng dẫn `sao-luu/HUONG-DAN-SAO-LUU.md` |
| Vai `sao_luu` · bảng hệ thống · cây mới tự có máy sao lưu | `luoc-do/05` · `44` · `45` |
| Bảng nào đã/chưa sao lưu | `kiem-thu/kiem-sao-luu.mjs` |
| **Khôi phục**: JSON → một file SQL | `sao-luu/khoi-phuc.mjs` |
| Đo khôi phục trọn vòng (36 phép) | `../kiem-thu/ban-thu-sql/do-b142b.mjs` *(ngoài repo)* |

## Khôi phục làm gì — và cố ý KHÔNG làm gì

- **Toàn phần**: `truncate` cả 19 bảng rồi đổ lại, MỘT giao dịch. Hỏng giữa
  chừng thì không gì bị đổi (đã đo: N1–N3).
- Không đụng `auth.users` (mật khẩu không có trong bản sao lưu) và hai bảng
  nhật ký hệ thống — chỉ thêm một dòng `backup / Khôi phục từ bản sao lưu`.
- Tắt đúng những trigger người dùng đang bật, đổ xong bật lại đúng những cái
  ấy. **Khoá ngoại vẫn gác** — thứ tự cha→con ở hằng `THU_TU`.
- Cột máy chủ có mà bản sao lưu không có → nhận **mặc định**, không phải
  `null` (chèn theo danh sách cột, không `jsonb_populate_recordset` trần —
  bẫy ở ký ức *default SQL không điền hộ*).
- **Tài khoản đã mất khỏi `auth.users`**: làm đúng điều khoá ngoại khai —
  `cascade` bỏ dòng, `set null` đặt trống. Y như Postgres đã làm nếu người ấy
  bị xoá sau lúc chụp. Chốt 28/09 khi chủ dự án chưa trả lời; đổi thì sửa
  bước 3a trong SQL sinh ra.
- **Tài khoản mở sau lúc chụp**: `truncate tai_khoan` xoá mất dòng mà trigger
  `sau_khi_tao_user` từng cấp → bước 5 cấp lại, quyền trống.
- `change_log.user_id` KHÔNG có khoá ngoại tới `auth.users` → giữ nguyên mã
  của tài khoản đã mất. Đúng như máy chủ thật, không phải lỗi.

## ⚠ Chưa chứng minh trên Supabase thật

Bàn thử chạy bằng superuser (ký ức *bàn thử nói dối ở ba chỗ*). Hai điều chỉ
máy chủ thật trả lời được:

1. `alter table … disable trigger` cần **chủ bảng**. Kiểm trước (chỉ đọc):
   `select tablename, tableowner from pg_tables where schemaname = 'public';`
   — phải là `postgres` cả.
2. SQL Editor có nhận **một câu ~1 MB** không. Không nhận thì chạy bằng
   `psql` với chuỗi kết nối của project (máy này có psql 17).

Staging đã xoá 26/09 → chưa có chỗ thử thật mà không đụng dữ liệu đang dùng.

## Bẫy đã gặp

- psql trên Windows xuống dòng **CRLF**: tách kết quả bằng `/\r?\n/`, không
  thì `'ĐẠT\r' ≠ 'ĐẠT'` — bài đo báo HỎNG oan.
- SQL nằm trong template literal của JS: **cấm backtick** trong ghi chú SQL
  (ký ức *backtick trong bài kiểm Chrome* — cùng bệnh).
- Chỉ cây NTB có trong bản sao lưu trước 28/09/2026 08:04 (`45` mới bù) —
  thử khôi phục chỉ dùng bản từ 28/09 trở đi.
