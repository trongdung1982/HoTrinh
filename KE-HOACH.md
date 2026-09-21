# KẾ HOẠCH — nhánh Supabase

*Cập nhật 22/09/2026 · Bước gần nhất: **b124a** — máy chủ (`luoc-do/28`, đã
dán) và trình duyệt (ô "đã có sẵn chưa" ở bốn chế độ thêm người) đều xong;
CHƯA AI BẤM THỬ. ⚠ **b122d NGHIỆM THU XONG** (21/09): một người một bản ghi
chạy đúng hai chiều qua hai tài khoản.*

⚠ **TRẦN CỨNG 250 DÒNG · 15 KB** *(đo: `kiem-thu/do-gon.mjs` · luật: `QUY-TAC-GON.md`)*. File này nạp ở đầu MỌI phiên: mỗi dòng
thừa ở đây nhân với số phiên còn lại. Vượt trần là có thứ đứng nhầm chỗ,
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

⚠⚠ **Từ b118d trang Quản trị LÀ nguyên file prototype quantri3**, dựng bằng máy,
mọi trang con gắn chức năng thật, không còn chỗ vẽ tạm — luật và bẫy ở
`so-tay/trang-quan-tri.md`. ⚠ **Đã bấm trên máy chủ thật 21/09** (mục Thành
viên & quyền của cây NTB) — mới một trang con, các trang khác chưa.

⚠ **`domains/` giữ nguyên chín file** (mười, trừ `person.js` sửa ở b120 và
b122b, chủ dự án cho phép cả hai lần) suốt cuộc chuyển nhà — hệ quả ở phần
"Bộ bất biến" dưới.

### Điểm dừng chưa bấm thử — trang Quản trị đã xong (b118d), nay bấm được

Tất cả là "chưa ai bấm", không phải "chưa viết". Đã có sẵn **hai tài khoản
Quản trị hệ thống**.

| Điểm dừng | Bấm gì |
|---|---|
| **b111** — kiểm duyệt TRƯỚC/SAU | Lưu "chờ duyệt" thật, bằng tài khoản KHÔNG quản trị cây ấy (quản trị luôn `ghi_thang()`, không vào hàng chờ) |
| **b111b** — gắn mã người, đổi cây ở ô chọn | Mã xong, `20` đã dán |
| **b111c** — nộp · tự duyệt bị từ chối · người khác duyệt được | ✓② nộp đã bấm 17/09 (LVT433). Còn ①Nhận lời mời QTHT ③tự duyệt bị từ chối ④QTHT khác duyệt được |
| **b117** — khu Tài khoản | ①bảng *Các gia phả tôi tham gia* đúng mã (tài khoản thường, qua RLS) ②Đổi mật khẩu: sai bị từ chối, đúng thì đổi |
| **b118d** — cả trang Quản trị | ✓ Thành viên & quyền đã mở 21/09. Còn: từng trang con còn lại; menu *Chọn hành động* (trang cây) và *Chọn ▾* (trang tài khoản) mỗi thứ một lần; một Duyệt + một Từ chối ở Kiểm duyệt |

---

## SQL — đã dán gì, và luật dán lại

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.

**Đã dán lên CẢ HAI Supabase (thật + Staging): `01` → `21`, không sót file
nào.** `04-view-ma-da-dung.sql` là view phụ trợ, không thuộc chuỗi.

**`22`→`25` — ĐÃ DÁN lên THẬT, tự kiểm ĐẠT.** Chưa rõ Staging — hỏi lại trước
khi coi hai máy chủ đã đồng bộ.

**`26-mot-nguoi-mot-ban-ghi.sql` (b121) + `27-ham-mot-nguoi.sql` (b122a) — ĐÃ
DÁN lên THẬT** (b122c, 18/09/2026). Bảng tự kiểm cuối mỗi file: **chủ dự án
đọc lại 18/09/2026, tất cả các dòng đạt.** Chưa rõ Staging.

**`28-keo-nguoi-co-san.sql` (b124a) — ĐÃ DÁN lên THẬT, 22/09/2026, tự kiểm
6/6 ĐẠT** (chủ dự án đọc lại, xác nhận). Chưa rõ Staging.

⚠ **Chuỗi dán lại** *(cùng bảng ở `CHI-DAN.md` mục 3, đừng để hai bản lệch)*:
`11`/`10`→`14`→`16`→`18`**→`23`** · `13`/`14`→`15`→`20`**→`23`** · `08`→`18` ·
`03`/`06`/`08`/`13`→`25`→`27`**→`28`** *(`28` đứng CUỐI: nó giữ bản đứng cuối
của `luu_cay()` và `tu_choi_thay_doi()`, khác `27` chín chỗ. Dán lại `27` sau
`28` là mất cả chín, **không một lời báo**)*.
⚠ **Sau `26` KHÔNG dán lại `02`/`11`** — luật đọc trên bảng người của chúng
hỏi `tree_id` đã bỏ; bản đứng cuối của bốn luật ấy ở `26` mục 5.
`23` đứng CUỐI mọi chuỗi: nó là bản đứng cuối của 13 hàm, trong đó có
`la_quan_tri_he_thong()` · `la_thanh_vien()` · `co_the_xem_cay()` ·
`co_the_sua()`. Quên nó là mở lại khoá mềm, mở lại lời mời QTHT thành quyền
thật, và mở lại cây đã xoá — cả ba đều **im lặng**.

⚠ Ba luật dán lại nữa, cả ba đều đã có người trả giá — `05` phải đứng trước
`06` · dán lại riêng `06`/`07` là mở rộng `quan_tri` trở lại · `drop function`
xoá cả `grant`: nay ở **`so-tay/phan-quyen.md`**, mục *Luật chung*.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

### Trang Quản trị — đọc `so-tay/trang-quan-tri.md` trước khi đụng

⚠ Nói *"hàm máy chủ này thiếu"* thì grep `luoc-do/` trước — `export` của
`sb.js` không phải danh sách hàm máy chủ (`THIET-KE-QUAN-TRI.md` 9.5).
⚠ Khung KHÔNG đổi sang tab ngang: thanh trái, dưới 850px mới thành hàng thẻ.

### ⚠⚠ Một người một bản ghi toàn phần mềm — b121 → b124

`THIET-KE-NHIEU-CAY.md` mục 6 (thay b120, `noi_ve` bỏ). **b121 · b122a · b122b
· b122c (dán) xong**; sổ tay: `so-tay/luu-du-lieu.md`.

**b122d — ĐÃ NGHIỆM THU 21/09/2026** *(một người một bản ghi chạy đúng hai
chiều qua hai tài khoản)*. Còn lẻ: nút Từ chối khoá đúng lúc — chưa ai bấm.
⚠ Staging vẫn lệch thật tới khi dán `26`+`27`+`28` sang đó.

**✓ HƯỚNG ĐÃ CHỐT 21/09 — `THIET-KE-NHIEU-CAY.md` mục 6 (ba câu cuối) + 11.10.**
Chủ dự án chọn: ① tự duyệt **nới hẹp** (chủ/`quan_tri` cây ấy tự duyệt đơn gắn
mã của mình; cây chưa có vai vẫn cần chữ ký thứ hai) ② gộp thì **máy giữ mã
nhỏ**, QTHT chỉ Duyệt/Từ chối ③ làm **phòng trước**. Ba bước:
**b124a** ô gợi ý *"đã có trong phần mềm chưa"* lúc thêm người · **b124b** mục
*Báo trùng* + hàm gộp · **b124c** SQL nới hẹp luật tự duyệt.

**b124a — MÁY CHỦ VÀ MÃ ĐỀU XONG, CHƯA AI BẤM THỬ** (22/09). SQL đã dán, tự
kiểm 6/6 ĐẠT. Trình duyệt: ô "đã có trong phần mềm chưa" đứng trên khối Tên ở
cả BỐN chế độ thêm người (con · cha/mẹ · vợ/chồng · người đầu tiên) —
`taoHoacDungNguoi()` thay `createPerson()`, ba nơi lưu tự canh không gửi bản
ghi người khi đã chọn (`so-tay/luu-du-lieu.md`). Điểm dừng: mở form thêm
người, gõ tên một người đã ở cây khác, chọn, lưu — người ấy vào cả hai cây.
⚠ Ô gợi ý trên điện thoại: vá `visualViewport` đã có **ảnh 390px đạt**
(`kq-gan-ma-390.png`, b123) — hộp mở gọn, không tràn. Nhưng đó là trang giả
trên máy tính; **điện thoại thật vẫn chưa ai bấm lại**.

- ⚠ Để b124 (chưa lộ vì mỗi cây còn tự đứng riêng): cờ `deleted` và xoá cứng hôn
  nhân là CHUNG mọi cây · `doc_cay` bỏ cạnh con có một đầu ngoài cây.

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
| ⚠ **Hai hàm của `16` nay LỆCH NGHĨA với tên của chúng**: `xin_xoa_cay()` không còn là "xin" — nó ẩn cây ngay; `huy_xin_xoa_cay()` nay chỉ QTHT gọi được và nghĩa thật là *trả lại cho chủ*. Giữ tên cũ ở b118b là **cố ý** (đổi tên kéo theo `sb.js` · `sb-gia.mjs` · `trang-cay.js` · bộ ảnh). Đổi tên là một bước riêng | `luoc-do/23-bon-luat-moi.sql` khối đầu |
| ⚠ **`ds_kiem_duyet()` chưa trả người duyệt · lúc duyệt · lý do từ chối** — hai tab lịch sử của Kiểm duyệt để trống ba cột (cột có trong `change_log`, hàm chưa đọc). Sửa hàm là `drop` → chép cả `grant` | `so-tay/trang-quan-tri.md` |
| ⚠ **Prototype `quantri3.html` vẫn còn `Georgia`** — app đã bỏ (b123, `quan-tri.css` 1.1.3) nhưng file prototype thì chưa. Chép lại khối CSS từ prototype là **rước lại lỗi vỡ dấu `ề`/`ắ`/`ồ`**; nhớ giữ dòng đè ở phần app | `so-tay/trang-quan-tri.md` |
| ⚠ **Hai việc của điểm dừng b106 chưa nghiệm thu bằng mắt**: gắn được mã người · đăng nhập bằng vai `sua` xem `pham_vi_sua()` đúng chưa | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **Thành viên thường nộp đề xuất phải gõ mã người trần** — ô gợi ý đi qua `tim_nguoi_trong_cay()`, gác bằng `co_the_quan_tri()`, nên với họ không gợi ý gì. Nộp vẫn được | `nhat-ky/b117-khu-tai-khoan.md` |
| ⚠ **Huy hiệu *đơn chờ duyệt* trên nút Gia phả đếm theo cây ĐANG MỞ** (`napSoDem(phien.treeId)`) — chỗ duy nhất của trang còn dính cây đang mở. Có từ b101, b117 chỉ dời nút | `khung.js` · luật 5a |
| ⚠ **Ai gọi `don_thung_rac()`** — nút bấm tay hay trigger Apps Script đêm? Chưa hỏi chủ dự án | `THIET-KE-NHIEU-CAY.md` mục 11.6 |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`, mới dán lên Staging. Soi lướt: `12` và `13` không thêm luật ghi nào — nhưng chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng | `/kiem-tra` phép 9 |
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

Bộ kiểm 66 phép / 51.250 phép so — thứ bảo vệ `domains/layout.js` — nằm ở
`Claude_Code/kiem-thu/`, và **58 trong 142 file của nó `import` từ
`../giapha/js/`**, tức bản đã đóng băng: sửa `supabase/js/domains/` thì nó vẫn
xanh vì đang đo file khác. *(Lý lẽ đầy đủ: `/kiem-tra` phép 9.)* Ba đường chưa
chọn: (a) biến môi trường chọn gốc; (b) chép bộ kiểm vào `supabase/kiem-thu/`;
(c) sống bằng phép 9.

⚠ **Đã thành sự thật** — `domains/person.js` sửa ở b120 (thêm `noiVe`) và b122b
(bỏ đi), chủ dự án cho phép cả hai lần; phép 9 báo LỖI đúng dự đoán. Chưa nguy
hiểm: `layout.js` vẫn giống hệt bản đóng băng. Quyết (a)/(b)/(c) để phiên khác.
