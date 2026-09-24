# KẾ HOẠCH — nhánh Supabase

*Cập nhật 25/09/2026 05:45 · b128 XONG: rào thép (`32`) + vẽ BA KHỐI —
chủ dự án xem: bản mới đẹp hơn, app mặc định MỚI, nút Cũ/Mới dưới 🔍 giữ tới
khi chủ dự án bảo gỡ (`so-tay/ve-so-do.md`). Kế tiếp: b127d, rồi b126.*

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
| **b111** — kiểm duyệt TRƯỚC/SAU | ⏸ **Hoãn** — quyền đang chỉnh lý (b126 · gom một cửa quyền). Chỉnh xong mới soạn lại cách bấm |
| **b111c** — đơn gắn mã | Còn ①nhận lời mời QTHT ②QTHT khác duyệt được ③**b124c**: chủ cây tự duyệt đơn mình PHẢI ăn |
| **b117** — khu Tài khoản | ①bảng *Các gia phả tôi tham gia* đúng mã (tài khoản thường, qua RLS) ②đổi mật khẩu |
| **b118d** — cả trang Quản trị | Còn: các trang con; menu *Chọn hành động* và *Chọn ▾* mỗi thứ một lần; một Duyệt + một Từ chối ở Kiểm duyệt |
---

## SQL — đã dán gì

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.
Luật dán lại (file nào kéo theo file nào): **`so-tay/phan-quyen.md`** mục
*Chuỗi dán lại*.

**Đã dán lên CẢ HAI Supabase (thật + Staging): `01` → `21`, không sót file
nào.** `04-view-ma-da-dung.sql` là view phụ trợ, không thuộc chuỗi.

**`22`→`29` — ĐÃ DÁN lên THẬT, tự kiểm ĐẠT cả** (`26`+`27` ngày 18/09 · `28`
ngày 22/09 · `29` ngày 23/09; chủ dự án đọc lại bảng tự kiểm từng lần).
⚠ **Chưa rõ Staging từ `22` trở đi** — hỏi lại trước khi coi hai máy đồng bộ.

**`30` (b127a) — ĐÃ DÁN lên THẬT 23/09**, chạy thành công.
**`31` (b127c) — ĐÃ DÁN lên THẬT 24/09**: 2 trigger, 0 cặp trùng từ trước.
**`32` (b128a) — ĐÃ DÁN lên THẬT 24/09**, tự kiểm 4/4 ĐẠT. ⚠ Bản đứng cuối
của `luu_cay()` — dán lại `27`/`28` sau nó là mở lại lỗ, im lặng.
**`33` (b127d-1) — CHƯA DÁN.** Chỉ thêm, không đè hàm nào; tự kiểm `1|0|5|0`.

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
| **b125c** ⏸ | Sửa tại chỗ các trường, Lưu theo dòng qua `luu_cay()`. **Hoãn như b111** — quyền đang chỉnh lý | Thành viên thường sửa → vào hàng chờ; quản trị → ghi thẳng |
| **b125d** | Chọn nhiều dòng + sửa hàng loạt một trường | Sửa 10 người một lượt, hoàn tác được |
| **b125e** | Xuất Excel; nối vào đường NHẬP đã có | Xuất ra mở được bằng Excel |

⚠ b125e đụng nợ nhập GEDCOM/Excel (*Còn treo*).

### ⚠ b127d — ĐỀ NGHỊ CHỈNH SỬA quan hệ → QTHT duyệt (tách 24/09/2026)

Chủ dự án chốt 25/09: **hai loại, đều là GỠ** — gỡ con khỏi cặp cha mẹ ·
gỡ vợ/chồng khỏi hôn nhân. Duyệt = máy chủ TỰ gỡ (rào `32` chặn cả QTHT sửa
tay). Đổi đẻ↔nuôi để sau. Luật: đầu file `luoc-do/33`.

| Bước | Việc | Điểm dừng |
|---|---|---|
| ✓ **d-1** | `33`: bảng + 5 hàm, bàn thử `do-b127d.mjs` 40/40 | Chủ dự án dán `33` |
| **d-2** | Nút *✉ Đề nghị sửa* ở cặp đang khoá trong form người + `sb`/`repo` | Gửi được một đề nghị thật |
| **d-3** | Khu duyệt trong `QuanTri.html` | Duyệt một đề nghị, quan hệ gỡ đúng |
⚠ b127b chưa bấm thật: thẻ người kéo sang `T388` phải đủ vợ/con.

### ⚠⚠ b126 — GẮN NGƯỜI và DÒNG HỌ về HỒ SƠ CÁ NHÂN (chốt 23/09/2026)

Luật, lý lẽ, danh sách chỗ bị đụng: **`THIET-KE-NHIEU-CAY.md` mục 6**, khối
*Gắn người và dòng họ*. Tóm: một người duy nhất, một tài khoản duy nhất → gắn
là chuyện của TÀI KHOẢN, không của từng cây. Chủ tài khoản tự khai, không ai
khai thay, **QTHT duyệt**; dòng họ chọn trong các cây mình là thành viên, QTHT
tự chọn cho mình không cần duyệt. Đổi nền móng (`pham_vi_sua` · `nguoi_gan` ·
bốn cửa gắn mã · `de_xuat_gan_nguoi` đang mang `tree_id`) — **chia bước và đo
trên bàn thử trước, đừng dán thẳng**.

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
| ⚠ **Huy hiệu *đơn chờ duyệt* trên nút Gia phả đếm theo cây ĐANG MỞ** (`napSoDem(phien.treeId)`) — chỗ duy nhất của trang còn dính cây đang mở. Có từ b101, b117 chỉ dời nút | `khung.js` · luật 5a |
| ⚠ **Ai gọi `don_thung_rac()`** — nút bấm tay hay trigger Apps Script đêm? Chưa hỏi chủ dự án | `THIET-KE-NHIEU-CAY.md` mục 11.6 |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`, mới dán lên Staging. Soi lướt: `12` và `13` không thêm luật ghi nào — nhưng chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng. Đường chạy tạm đã có: `--import ./sang-supabase.mjs` (b128b) | `/kiem-tra` phép 9 |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| ⚠ **`index.html` → Cài đặt: "Dòng họ" và vai trò CỐ ĐỊNH TRONG MÃ** — tồn dư thời một cây, phải đọc từ chỗ khai của b126 | `js/pages/settings.js` |
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
`person.js` (b120, b122b — chủ dự án cho phép cả hai lần); `layout.js` vẫn
giống hệt bản đóng băng nên chưa nguy hiểm.
