# Sổ tay — Sao lưu và khôi phục

*Lập 28/09/2026 (b142b). Ghi theo chức năng: gặp lỗi thì thêm vào đây.*

## Bản đồ

| Việc | File |
|---|---|
| Sao lưu đêm (Apps Script, chủ dự án dán tay) | `sao-luu/SaoLuu.gs` · hướng dẫn `sao-luu/HUONG-DAN-SAO-LUU.md` |
| Vai `sao_luu` · bảng hệ thống · cây mới tự có máy sao lưu · báo kết quả vào nhật ký (b147) | `luoc-do/05` · `44` · `45` · `49` |
| Bảng nào đã/chưa sao lưu | `kiem-thu/kiem-sao-luu.mjs` |
| **Khôi phục**: JSON → một file SQL | `sao-luu/khoi-phuc.mjs` |
| **Ảnh** (b154): chép sang Drive `Anh/<mã cây>/` mỗi đêm · tải ngược lên `khoiPhucAnh` | `SaoLuu.gs` mục ẢNH · phép 14–16 của `kiem-sao-luu.mjs` |

## Ảnh — ba điều cố ý

- Drive **không xoá theo** app (app xoá ảnh là xoá thật, `xoaAnhThat()`), nên
  khôi phục dữ liệu về hôm qua vẫn có ảnh. Đổi lại `Anh` chỉ lớn lên, và
  `khoiPhucAnh` đưa cả ảnh đã xoá về kho (mồ côi, không hiện ở đâu).
- Số ảnh báo nhật ký nằm ở `demBao`, **không** ở `banSao.dem` — dem ấy vào
  `DEM_LAN_TRUOC` để so sụt giảm, "chưa chép" giảm là tin tốt.
- Khôi phục cần tài khoản GHI (`ghi_anh` = `co_the_sua()`), vai `sao_luu`
  không ghi được: chủ dự án điền tạm `EMAIL_/MAT_KHAU_KHOI_PHUC` rồi xoá.
  ⚠ Chưa chạy thật trên Supabase — cửa `/object/authenticated/` và tải lên
  mới đo bằng máy chủ giả.
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

## Đã chạy THẬT trên Supabase — 28/09/2026 09:20

Chủ dự án dán bản khôi phục từ `giapha-sao-luu-2026-09-28-0810.json` vào SQL
Editor: 19 bảng **so từng dòng khớp**, 21 trigger bật lại, người thêm sau
08:10 mất đúng như dự kiến. Hai điều bàn thử (superuser) không trả lời được
nay đã rõ: SQL Editor **nhận** câu ~950 KB; vai `postgres` là chủ bảng nên
`disable trigger` chạy được. Có hộp cảnh báo *destructive operation* — bấm
chạy tiếp là đúng.

⚠ Bước 3c (tự so bằng `except all`) là thứ làm kết quả trên đáng tin: đếm số
dòng khớp chưa đủ. Nó dựa vào `to_jsonb` in ngày giờ đúng dạng PostgREST đã
ghi — nên đầu file SQL đặt `timezone = 'UTC'`. Bỏ dòng ấy là báo lệch oan.

## Bẫy đã gặp

- psql trên Windows xuống dòng **CRLF**: tách kết quả bằng `/\r?\n/`, không
  thì `'ĐẠT\r' ≠ 'ĐẠT'` — bài đo báo HỎNG oan.
- SQL nằm trong template literal của JS: **cấm backtick** trong ghi chú SQL
  (ký ức *backtick trong bài kiểm Chrome* — cùng bệnh).
- Chỉ cây NTB có trong bản sao lưu trước 28/09/2026 08:04 (`45` mới bù) —
  thử khôi phục chỉ dùng bản từ 28/09 trở đi.
