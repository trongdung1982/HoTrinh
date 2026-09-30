# Sổ tay — Sao lưu và khôi phục

*Lập 28/09/2026 (b142b). Ghi theo chức năng: gặp lỗi thì thêm vào đây.*

## Bản đồ

| Việc | File |
|---|---|
| Sao lưu đêm (Apps Script, chủ dự án dán tay) | `sao-luu/SaoLuu.gs` · hướng dẫn `sao-luu/HUONG-DAN-SAO-LUU.md` |
| Vai `sao_luu` · bảng hệ thống · cây mới tự có máy sao lưu · báo kết quả vào nhật ký (b147) | `luoc-do/05` · `44` · `45` · `49` |
| Bảng nào đã/chưa sao lưu | `kiem-thu/kiem-sao-luu.mjs` |
| **Khôi phục**: JSON → một file SQL | `sao-luu/khoi-phuc.mjs` |
| **Khôi phục từ nút** (b155a): chỉ QTHT, chỉ file có dấu vân tay máy sao lưu báo | `luoc-do/54` · đo `../kiem-thu/ban-thu-sql/do-b155a.mjs` (33 phép) |
| **Ảnh** (b154): chép sang Drive `Anh/<mã cây>/` mỗi đêm · tải ngược lên `khoiPhucAnh` | `SaoLuu.gs` mục ẢNH · phép 14–16 của `kiem-sao-luu.mjs` |

## Khôi phục từ nút — HAI đường (chủ dự án chốt 29/09/2026)

**ĐẠT trên app thật 29/09/2026** (chủ dự án bấm, đường web app: danh sách →
khôi phục → Khôi phục ảnh). Hàng rào web app đo thật bằng REST cùng ngày.

1. **Chọn file trong máy** (ổ Google Drive for desktop) — luôn có.
2. **Máy sao lưu làm web app** (`SaoLuu.gs` `doPost`, địa chỉ ở `cau-hinh.js`
   `SAO_LUU_WEB_APP`): liệt kê bản trên Drive → tải nguyên văn → khôi phục →
   *Khôi phục ảnh* bằng VÉ NGƯỜI BẤM (QTHT qua luật `ghi_anh`, không mật khẩu
   điền tạm). Hỏng/để trống → lùi về đường 1.

- ⚠⚠ Web app "Anyone" + chạy bằng quyền Drive chủ dự án. Hàng rào DUY NHẤT:
  `xacMinhQtht_` hỏi Supabase `/auth/v1/user` + `la_quan_tri_he_thong()` bằng
  vé người gửi. `tai` chỉ đưa file TRONG thư mục sao lưu, đúng khuôn tên.
  Phép canh: `kiem-sao-luu.mjs` phần 18 (14 phép).
- ⚠ Sửa `SaoLuu.gs` thì web app cần *Manage deployments → New version*; lịch
  đêm thì không. Lệch nhau = web app chạy mã cũ, im lặng.
- ⚠ Bản giả `sb-gia.mjs` coi như ĐÃ có web app (ảnh `kq-kp-danh-sach*`).
- Đã cân và bỏ: kho phụ `sao-luu` trên Supabase (bản sao lưu nằm hai nơi, máy
  sao lưu phải được ghi một khe vào kho ảnh).

## Khôi phục từ nút — vì sao có dấu vân tay

File do người bấm đưa lên. Không kiểm thì QTHT sửa tay `tai_khoan` /
`tree_members` trong file rồi "khôi phục" = tự phong QTHT, cho người vào cây —
vòng qua mọi luật hai chữ ký. Nên `SaoLuu.gs` 0.8.0 báo SHA-256 của NGUYÊN VĂN
file vào `ban_sao_luu_da_ghi` (chỉ vai `sao_luu` ghi), và `54` chỉ nhận file
khớp. Hệ quả: file ghi trước 0.8.0 phải đi đường `khoi-phuc.mjs`.

- ⚠ **Thân khôi phục có HAI bản**: `luoc-do/54` (`khoi_phuc_ban_sao`) và
  `sao-luu/khoi-phuc.mjs` — cùng luật, cùng mảng 19 bảng. Sửa một thì sửa cả hai.

- ⚠ Hàm gọi từ trình duyệt bị cắt ở ~8 s; đặt `statement_timeout` trong hàm
  vô tác dụng. Bàn thử: 0,5 s cho 782 người / 1,2 MB. Dữ liệu lớn gấp chục thì
  đo lại trước.
- ⚠ Bàn thử so cả dòng sẽ báo lệch oan khi bản chụp cũ hơn lược đồ (cột mới
  nhận mặc định) — chỉ so cột FILE có, như bước 3c.

## Ảnh — ba điều cố ý

- Drive **không xoá theo** app (app xoá ảnh là xoá thật, `xoaAnhThat()`), nên
  khôi phục dữ liệu về hôm qua vẫn có ảnh. Đổi lại `Anh` chỉ lớn lên.
- `khoiPhucAnh` **chỉ tải tấm còn dòng `media` trỏ tới** (kể cả dòng ở thùng
  rác) — tải theo "Drive có mà kho thiếu" thì đẻ ảnh mồ côi (chủ dự án bắt,
  29/09). Nên khôi phục dữ liệu chữ TRƯỚC, ảnh SAU.
- Số ảnh báo nhật ký nằm ở `demBao`, **không** ở `banSao.dem` — dem ấy vào
  `DEM_LAN_TRUOC` để so sụt giảm, "chưa chép" giảm là tin tốt.
- Khôi phục cần tài khoản GHI (`ghi_anh` = `co_the_sua()`), vai `sao_luu`
  không ghi được: chủ dự án điền tạm `EMAIL_/MAT_KHAU_KHOI_PHUC` rồi xoá.
  ĐẠT trên máy thật 29/09: sao lưu ảnh, và ca xoá tệp ảnh khỏi kho → khôi
  phục qua web app → ảnh về lại (chủ dự án bấm). Đường `khoiPhucAnh` chạy
  tay (mật khẩu điền tạm) chưa chạy thật — cùng lõi `khoiPhucAnhBang_`.
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

- ⚠ **Xoá một cột = mọi bản sao lưu chụp TRƯỚC đó không khôi phục được**
  (b162b, `63` xoá `tree_members.person_id`). Bước so từng dòng (3c ở
  `khoi-phuc.mjs` và `54`) so theo khoá CỦA FILE; file cũ còn khoá đã mất
  → mọi dòng "lệch" → huỷ gọn, dữ liệu không đổi. Chủ dự án chấp nhận bỏ
  bản cũ (30/09/2026, app chưa chạy chính thức). Lần sau xoá cột mà cần giữ
  bản cũ: 3c phải bỏ khoá file không còn là cột. Đo: `DEN_CUOI=1 node
  do-b155a.mjs <bản chụp>` — khuôn mới 34/34, bản cũ bị huỷ đúng như trên.

- psql trên Windows xuống dòng **CRLF**: tách kết quả bằng `/\r?\n/`, không
  thì `'ĐẠT\r' ≠ 'ĐẠT'` — bài đo báo HỎNG oan.
- SQL nằm trong template literal của JS: **cấm backtick** trong ghi chú SQL
  (ký ức *backtick trong bài kiểm Chrome* — cùng bệnh).
- Chỉ cây NTB có trong bản sao lưu trước 28/09/2026 08:04 (`45` mới bù) —
  thử khôi phục chỉ dùng bản từ 28/09 trở đi.
