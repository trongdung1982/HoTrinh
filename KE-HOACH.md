# KẾ HOẠCH — nhánh Supabase

*Cập nhật 26/09/2026 · b126 XONG — SQL `34`→`38` đã dán lên Supabase thật,
JS (Hồ sơ cá nhân, tab *Đơn Hồ sơ cá nhân*, `sb.js` chữ ký mới) đã chạy theo.
Nút Cũ/Mới dưới 🔍 giữ tới khi chủ dự án bảo gỡ. **b111 đã soạn lại cách bấm
thử** (bảng dưới) — chủ dự án bấm khi rảnh. Kế tiếp cho AI: **b125c** — sửa
tại chỗ bảng người, việc XÂY MÃ chưa viết, khác bản chất với b111.*

⚠ **TRẦN CỨNG 250 DÒNG · 15 KB** *(đo: `kiem-thu/do-gon.mjs` · luật: `QUY-TAC-GON.md`)*. Vượt trần là có thứ đứng nhầm chỗ,
**đừng nới trần**. Ba luật giữ nó gọn:

1. **Xong rồi thì xoá khỏi đây.** Việc đã làm nằm ở lời commit (`git log`).
   Muốn đọc bản cũ: `git log -p KE-HOACH.md`.
2. **File này giữ đúng bốn thứ:** đang ở đâu · trạng thái dán SQL · việc kế
   tiếp · việc còn treo. Bài học thuộc về `so-tay/` của chức năng ấy.
3. **Dòng ⚠ chỉ được chuyển, không được mất.** Trước khi cắt phải chỉ được nơi
   trú mới của từng dòng ⚠.

---

## Đang ở đâu

**App chạy thật tại `https://nguyentrongbac.io.vn`** từ 03/09/2026 *(chứng chỉ
Let's Encrypt hạn 02/12/2026; địa chỉ cũ `301` về đây)*. Máy chủ thật nay có
**BA cây** — NTB 59 người · Nguyễn Phúc Giáo 681 người · **LVT433** *(chủ dự
án làm chủ)* — mã cây 3 chữ số. Trang `QuanTri.html` bốn khu đều đã nối. Phân
quyền đã đo bằng REST, 5/5 hàng rào đạt (b94, b96).

### Điểm dừng chưa bấm thử — trang Quản trị đã xong (b118d), nay bấm được

Tất cả là "chưa ai bấm", không phải "chưa viết". Đã có sẵn **hai tài khoản
Quản trị hệ thống**.

| Điểm dừng | Bấm gì |
|---|---|
| **b111** — kiểm duyệt TRƯỚC/SAU | ✅ Sẵn sàng 26/09 — mã đã đo đạt từ 10/09, quyền b126 xong nên hết lý do hoãn. Cần một dòng CHỜ DUYỆT trước: tài khoản vai `sua` (không phải Quản trị) sửa một trường người bất kỳ → Lưu → vào hàng chờ. Rồi tài khoản Quản trị hệ thống → khu Kiểm duyệt → tab *Chờ duyệt* → bấm **Xem chi tiết** ở dòng ấy → phải thấy bảng Người · Trường · Trước · Sau, đúng trường vừa sửa |
| **b111c** — đơn gắn mã | ✅ Dán xong 26/09 — bấm ở *Tài khoản của tôi → Mã người & Dòng họ* (nộp) và tab *Đơn Hồ sơ cá nhân* của Quản trị hệ thống (xét) |
| **b117** — khu Tài khoản | ①bảng *Các gia phả tôi tham gia* đúng mã (tài khoản thường, qua RLS) ②đổi mật khẩu |
| **b118d** — cả trang Quản trị | Còn: các trang con; menu *Chọn hành động* và *Chọn ▾* mỗi thứ một lần; một Duyệt + một Từ chối ở Kiểm duyệt |
| **b127d** — đề nghị sửa quan hệ (`33`, xong d-1→d-3) | Form người có quan hệ ngoài cây: bấm ✉ gửi đề nghị → Quản trị hệ thống → tab *Đề nghị sửa quan hệ* → Duyệt (gỡ) hoặc Từ chối |
---

## SQL — đã dán gì

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.
Luật dán lại (file nào kéo theo file nào): **`so-tay/phan-quyen.md`** mục
*Chuỗi dán lại*.

**Đã dán lên CẢ HAI Supabase (thật + Staging): `01` → `21`, không sót file
nào.** `04-view-ma-da-dung.sql` là view phụ trợ, không thuộc chuỗi.

**`22`→`33` — ĐÃ DÁN lên THẬT, tự kiểm ĐẠT cả** (ngày dán từng file: `git log`).
⚠ **Chưa rõ Staging từ `22` trở đi** — hỏi lại trước khi coi hai máy đồng bộ.
⚠ `32` là bản đứng cuối của `luu_cay()` — dán lại `27`/`28` sau nó là mở lại
lỗ, im lặng.

**`34`→`38` (b126a→d) — ĐÃ DÁN lên THẬT 26/09, tự kiểm ĐẠT cả.** `35` gặp dữ
liệu thật: chỉ mục "một tài khoản một đơn chờ" từ chối vì bảng `de_xuat_gan_
nguoi` (đơn gắn mã cũ, theo cây) có tài khoản mang ≥2 đơn "chờ" — chuyện bình
thường ở luật cũ, không hợp ở luật mới. Xử lý: **`truncate table de_xuat_gan_
nguoi;`** trước khi dán lại `35` — xoá sạch đơn cũ (theo cây), không ai mất gì
vì đơn ấy chưa hề có nghĩa toàn phần mềm. Bài học đầy đủ: `so-tay/phan-quyen.md`.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

### Trang Quản trị — đọc `so-tay/trang-quan-tri.md` trước khi đụng

⚠ Nói *"hàm máy chủ này thiếu"* thì grep `luoc-do/` trước — `export` của
`sb.js` không phải danh sách hàm máy chủ (`THIET-KE-QUAN-TRI.md` 9.5).
⚠ Khung KHÔNG đổi sang tab ngang: thanh trái, dưới 850px mới thành hàng thẻ.

### ⚠⚠ Một người một bản ghi — b121 → b124 (xong, trừ b124b)

Sổ tay: `so-tay/luu-du-lieu.md` · kéo người, b124b chưa dựng:
`so-tay/nguoi-xuyen-cay.md` · b124c: `so-tay/phan-quyen.md` *Nới hẹp tự duyệt*.
⚠ Staging vẫn lệch thật tới khi dán `26`+`27`+`28` sang đó.
⚠ Ô gợi ý trên điện thoại thật chưa ai bấm lại — `so-tay/o-goi-y.md`.

### ⚠ b125 — BẢNG NGƯỜI trong trang Quản trị (chủ dự án chốt 23/09/2026)

Bấm tên cây ở khu Gia phả → trang cây → mục *Danh sách người*: bảng phẳng kiểu
trang tính, để **quản lý nhiều trường nội dung**. Cột *Tài khoản* chỉ để XEM —
gắn tài khoản ↔ người là việc của b126 (Hồ sơ cá nhân), **b125b đã bỏ** 23/09.

| Bước | Việc | Điểm dừng |
|---|---|---|
| **b125c** ⏸ | Sửa tại chỗ các trường, Lưu theo dòng qua `luu_cay()`. Hoãn hết hạn 26/09 (như b111) | Thành viên thường sửa → vào hàng chờ; quản trị → ghi thẳng |
| **b125d** | Chọn nhiều dòng + sửa hàng loạt một trường | Sửa 10 người một lượt, hoàn tác được |
| **b125e** | Xuất Excel; nối vào đường NHẬP đã có | Xuất ra mở được bằng Excel |

⚠ b125e đụng nợ nhập GEDCOM/Excel (*Còn treo*).

### Sau đó — chưa đặt số, chưa chốt

**Nhóm E quantri3** *(9.5 — ⚠ tạo tài khoản cần `service_role` qua Edge
Function, **không bao giờ** vào repo Public)* · chặn đăng nhập tài khoản bị
khoá *(`banned_until`)* · **dòng họ + cây chính do người tự chọn** (`6`) ·
nhập GEDCOM/Excel qua máy chủ · **khôi phục thật** *(đo cả vòng sao lưu→đổi→
khôi phục→về đúng cũ, không chỉ "có file")* · **tối ưu tốc độ đọc** khi mọi
chức năng đã chạy *(681 người: ~0,4s)*. *(Số mục = `THIET-KE-QUAN-TRI.md`.)*

⚠ **17/09, chủ dự án nêu:** huy hiệu số đếm + bấm tên mở cây ở Gia phả, an
toàn (`9.6`). *(Câu thứ hai — QTHT tự duyệt — đã chốt 21/09, nay là b124c.)*

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — nhật ký bước đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| ⚠ **Nhập GEDCOM/Excel chưa nối vào kho mã** — `capMaHangLoat()` hỏi `nextId` một lần rồi tự đếm tiếp, nên từ mã thứ hai đã ra ngoài phần máy chủ đặt trước. Hỏng to tiếng (`trungma`), không lặng lẽ. Đường sửa: `pages/import-export.js` gọi `repo.xinMa(loai, so)` trước khi nhập | `so-tay/luu-du-lieu.md` |
| ⚠ **`di-doi/sinh-sql-di-doi.mjs` lạc hậu từ `26`** — SQL nó sinh còn gắn `tree_id` vào bốn bảng dùng chung. Ba cây đã di dời xong nên chưa có việc; chạy sẽ lỗi to tiếng | đầu chính file ấy |
| ⚠ **Bốn bảng CHƯA được sao lưu**: `cau_hinh` · `tai_khoan` · `de_xuat_gan_nguoi` · `doi_ma_toan_cuc`. Ba bảng đầu giữ cờ QTHT, khoá mềm, đơn đề xuất; `doi_ma_toan_cuc` giữ cặp mã cũ→mới vĩnh viễn. Cần xem RLS có cho vai `sao_luu` đọc không trước khi thêm | `kiem-thu/kiem-sao-luu.mjs` hằng `CHUA_SAO_LUU` |
| ⚠ **Hai hàm của `16` LỆCH NGHĨA với tên** (`xin_xoa_cay` ẩn cây NGAY; `huy_xin_xoa_cay` = trả lại cho chủ). Giữ tên cũ là cố ý; đổi tên là một bước riêng | `luoc-do/23-bon-luat-moi.sql` khối đầu |
| ⚠ **`ds_kiem_duyet()` chưa trả người duyệt · lúc duyệt · lý do từ chối** — hai tab lịch sử của Kiểm duyệt để trống ba cột (cột có trong `change_log`, hàm chưa đọc). Sửa hàm là `drop` → chép cả `grant` | `so-tay/trang-quan-tri.md` |
| ⚠ **b106 chưa nghiệm thu bằng mắt**: gắn mã người · vai `sua` xem `pham_vi_sua()` đúng chưa *(b126 sẽ đụng cả hai)* | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **b127b chưa bấm thật**: thẻ người kéo sang `T388` phải đủ vợ/con | — |
| ⚠ **Huy hiệu *đơn chờ duyệt* trên nút Gia phả đếm theo cây ĐANG MỞ** (`napSoDem(phien.treeId)`) — chỗ duy nhất của trang còn dính cây đang mở. Có từ b101, b117 chỉ dời nút | `khung.js` · luật 5a |
| ⚠ **Ai gọi `don_thung_rac()`** — nút bấm tay hay trigger Apps Script đêm? Chưa hỏi chủ dự án | `THIET-KE-NHIEU-CAY.md` mục 11.6 |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`, mới dán lên Staging. Soi lướt: `12` và `13` không thêm luật ghi nào — nhưng chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng. Đường chạy tạm: `--import ./sang-supabase.mjs` (b128b) — ⚠ KHÔNG ăn vào bài chạy trong Chrome; `kiem-buoc-80` dùng bản `kiem-buoc-80-sb.mjs` | `/kiem-tra` phép 9 |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| ⚠ **`tree_members.person_id` thành cột chết từ b126** — `duyet_thanh_vien()` (đơn xin vào cây) vẫn GHI vào đó; `ds_cay_cua_tai_khoan()`/`trang-tai-khoan.js` vẫn ĐỌC nó, nên trang một tài khoản có thể hiện mã không khớp Hồ sơ cá nhân của chính người ấy | `so-tay/phan-quyen.md` |
| ⚠ **Sao lưu KHÔNG chép ảnh** — chỉ liệt kê. Ảnh vẫn nằm đúng một chỗ | `KIEN-TRUC.md` mục 7 |
| ⚠ **Chưa ai thử KHÔI PHỤC từ file sao lưu** — *có file* khác *khôi phục được* | `sao-luu/HUONG-DAN-SAO-LUU.md` |
| Bốn màn hình chưa mở được (sao lưu · dựng gia phả mới · bỏ chọn · quyền ảnh) | `KIEN-TRUC.md` mục 6 |
| Giấu chi tiết người còn sống với người chỉ có quyền xem | `KIEN-TRUC.md` mục 6 |
| Tháo giàn giáo `tuong-thich.js` — mốc 7 file, chỉ được giảm | `KIEN-TRUC.md` mục 4 |
| Đổi tên ba vết sẹo (`driveFileId` · `driveThumbUrl` · `tuong-thich`) | `KIEN-TRUC.md` mục 4 |
| Đợt 7 của phép tách `person-edit.js` — treo từ b48 | `BAT-DAU.md` mục 5 |
| **Ảnh: kho công khai hay kho kín?** Hiện công khai — đường dẫn khó đoán, nhưng *"khó đoán"* không phải *"được bảo vệ"* | `KIEN-TRUC.md` mục 7 |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)* | `06-quyen-truc-he.sql` mục 2 |

### ⚠ Bộ bất biến bố cục đang gác nhầm nhánh

Bộ kiểm bảo vệ `domains/layout.js` `import` từ `../giapha/js/` — bản ĐÃ ĐÓNG
BĂNG — nên sửa `supabase/js/domains/` thì nó vẫn xanh vì đang đo file khác.
Lý lẽ đầy đủ và ba đường chưa chọn: **`/kiem-tra` phép 9**. Đã thành sự thật ở
`person.js` (b120, b122b — chủ dự án cho phép cả hai lần) và **`layout.js`**
(b128 — khác hẳn từ 25/09). ⚠ Đo `layout.js` phải qua `--import ./sang-supabase.mjs`
hoặc `kiem-buoc-80-sb.mjs`; nhóm 9b (bắt khuỷu) ở đó đã lỗi thời — chủ dự án
bác luật khuỷu 25/09. Đường chạy bằng đúng pipeline app (thêm/ẩn dâu/rể) chưa
có trong bộ kiểm — `so-tay/ve-so-do.md`.
