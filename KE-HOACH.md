# KẾ HOẠCH — nhánh Supabase

*Cập nhật 17/09/2026 · Bước gần nhất: **b120 MÃ XONG** — `noi_ve` (mã người xuyên
cây) · CHỜ chủ dự án dán `25-noi-ve.sql` rồi bấm điểm dừng*

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
Let's Encrypt hạn 02/12/2026; địa chỉ cũ `301` về đây)*. Máy chủ thật có **hai
cây** — NTB 59 người và Nguyễn Phúc Giáo 681 người — mã cây **3 chữ số**. Trang
`QuanTri.html` là khung **bốn khu**, cộng lớp **trang chi tiết** từ b115 —
Gia phả (b116) · Tài khoản (b117) · Kiểm duyệt (đã có từ trước) · Quản trị hệ
thống (b118) đều đã nối, mỗi khu ít nhất một việc thật. Phân quyền đã đo bằng
REST, 5/5 hàng rào đạt (b94, b96). Chặng đã đóng: **b87 → b118e** — mỗi bước
một file `nhat-ky/`.

⚠⚠ **Từ b118d trang Quản trị LÀ nguyên file prototype quantri3**, dựng bằng máy,
mọi trang con gắn chức năng thật, không còn chỗ vẽ tạm — luật và bẫy ở
`so-tay/trang-quan-tri.md`. Chưa ai bấm trên máy chủ thật.

⚠ **`domains/` chưa sửa một dòng nào** trong cả mười file, suốt cả cuộc chuyển
nhà từ Drive sang Supabase. Đó là nghiệm thu của luật phân lớp, giữ nguyên.

### Điểm dừng chưa bấm thử — trang Quản trị đã xong (b118d), nay bấm được

Tất cả là "chưa ai bấm", không phải "chưa viết". Đã có sẵn **hai tài khoản
Quản trị hệ thống**.

| Điểm dừng | Bấm gì |
|---|---|
| **b111** — kiểm duyệt TRƯỚC/SAU | Một lần Lưu "chờ duyệt" thật. ⚠ Quản trị luôn `ghi_thang()`, nên tự gắn mã người cho tài khoản CỦA MÌNH **không** tạo ra hàng chờ — phải Lưu bằng tài khoản KHÔNG quản trị cây ấy |
| **b111b** — gắn mã người từ cả hai tấm, đổi cây ở ô chọn | Mã xong, `20` đã dán |
| **b111c** — nộp đề xuất · tự duyệt bị từ chối · người khác duyệt được | Mã + giao diện mới xong (b117), `21` đã dán 14/09: ① nút **Nhận** lời mời bằng tài khoản Quản trị hệ thống *(vá 14/09)*; ② nộp ở khu **Tài khoản** → bảng các gia phả → *Đề xuất mã người*; ③ tự duyệt ở `#gia-pha/cay/<mã>/de-xuat-gan` bị máy chủ từ chối; ④ một Quản trị hệ thống KHÁC duyệt được |
| **b117** — khu Tài khoản trên máy chủ thật | ① bảng *Các gia phả tôi tham gia* hiện đúng mã người đã gắn — bằng tài khoản **thành viên thường**, vì nó đọc qua RLS chứ không qua hàm Quản trị; ② *Đổi mật khẩu* với mật khẩu cũ SAI phải bị từ chối, với mật khẩu cũ đúng thì đổi được |
| **b118d** — cả trang Quản trị trên máy chủ thật | Mở từng trang con; bấm mỗi menu *Chọn hành động* / *Chọn ▾* một lần; một lần Duyệt và một lần Từ chối ở *Kiểm duyệt › Xem trước / sau*. Ảnh chụp mới chỉ trên máy chủ giả |


---

## SQL — đã dán gì, và luật dán lại

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.

**Đã dán lên CẢ HAI Supabase (thật + Staging): `01` → `21`, không sót file
nào.** `04-view-ma-da-dung.sql` là view phụ trợ, không thuộc chuỗi.

**`22-rut-don-roi-cay.sql` (b116) — ĐÃ DÁN lên Supabase THẬT 15/09/2026,
bảng tự kiểm đạt hết.** Chưa rõ đã dán lên Staging chưa — hỏi lại trước khi
coi cả hai máy chủ đã đồng bộ tới `22`.

**`23-bon-luat-moi.sql` — ĐÃ DÁN lên THẬT 17/09/2026** (bỏ qua Staging, chủ
dự án chốt 16/09). Bàn thử 5433 trước đó: 107/107 đạt. REST xác nhận 17/09
qua tài khoản thử: khoá→mở khoá, mời QTHT (chữ ký 1)→huỷ, xoá cây→trả lại —
cả ba ĐẠT. b118c đóng.

**`24-dem-du-lieu.sql` (b119) — ĐÃ DÁN, điểm dừng ĐẠT** 17/09/2026. Chưa rõ
đã dán lên Staging chưa.

**`25-noi-ve.sql` (b120) — CHƯA DÁN.** Bàn thử 5433: `do-b120.mjs` 25/25 đạt.
Mã JS đẩy trước dán vẫn an toàn (khoá `noi_ve` lạ thì máy chủ bỏ qua).

⚠ **Chuỗi dán lại** *(cùng bảng ở `CHI-DAN.md` mục 3, đừng để hai bản lệch)*:
`11`/`10`→`14`→`16`→`18`**→`23`** · `13`/`14`→`15`→`20`**→`23`** · `08`→`18` ·
`03`/`08`**→`25`** *(bản đứng cuối của `luu_cay` + `tu_choi_thay_doi`)*.
`23` đứng CUỐI mọi chuỗi: nó là bản đứng cuối của 13 hàm, trong đó có
`la_quan_tri_he_thong()` · `la_thanh_vien()` · `co_the_xem_cay()` ·
`co_the_sua()`. Quên nó là mở lại khoá mềm, mở lại lời mời QTHT thành quyền
thật, và mở lại cây đã xoá — cả ba đều **im lặng**. Ba luật nữa,
và cả ba đều đã có người trả giá:

- ⚠ **`05` phải đứng trước `06`.** `05` đặt lại ràng buộc vai **thiếu
  `quan_tri`** (nó có trước khi vai ấy ra đời), `06` mới thêm vào. Đảo hai file
  là tự tay bỏ vai quản trị viên khỏi danh sách hợp lệ.
- ⚠ **Dán lại riêng `06` hay `07` sẽ âm thầm mở rộng `quan_tri` trở lại** —
  `08` mục 8 định nghĩa lại ba hàm của hai file ấy cho hẹp hơn. Dán lại chúng
  thì dán lại cả `08` *(rồi `18` theo chuỗi trên)*.
- ⚠ **`drop function` XOÁ CẢ `grant`.** Dựng lại một hàm đã có thì chép theo cả
  dòng `grant` của nó, không thì nó lặng lẽ rơi về mặc định Postgres *ai cũng
  gọi được, kể cả `anon`* — `15` đã vấp, `20` vá.

⚠ **Và một câu về phân quyền hay bị mô tả ngược:** từ b94, **admin duyệt là
hàng rào thật, luật trực hệ chỉ còn là bộ lọc** giúp admin đỡ phải đọc những
đề nghị chắc chắn bị từ chối. Đừng viết ngược lại.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

**Còn một bước:** đóng `b120` — chủ dự án dán `25` rồi bấm điểm dừng.

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

### Trang Quản trị — đọc `so-tay/trang-quan-tri.md` trước khi đụng

⚠ Nói *"hàm máy chủ này thiếu"* thì grep `luoc-do/` trước — `export` của
`sb.js` không phải danh sách hàm máy chủ (`THIET-KE-QUAN-TRI.md` 9.5).
⚠ Khung KHÔNG đổi sang tab ngang: thanh trái, dưới 850px mới thành hàng thẻ.

### b120 — Mã người xuyên cây

Mã xong (`25` · `hinh-dang.js` · `domains/person.js` · form Sửa hồ sơ · thẻ ⓘ).
Bẫy và cách làm: `so-tay/luu-du-lieu.md`.
**Điểm dừng:** Sửa hồ sơ một người **cây NTB** → gõ `NPG473_P0001` → Lưu → mở lại: ô **còn
nguyên**; thẻ ⓘ hiện dòng *"Người này cũng có trong…"*. ⚠ Nút nhảy CHƯA ai bấm
— dữ liệu hai cây còn mã cũ `P####`, không có người nào để nhảy tới.

### Sau b120 — chưa đặt số, chưa chốt

**Nhóm E của quantri3** *(`THIET-KE-QUAN-TRI.md` 9.5 — ⚠ tạo tài khoản cần khoá
`service_role`, chỉ qua Edge Function, khoá **không bao giờ** vào repo Public)* ·
chặn đăng nhập thật cho tài khoản bị khoá *(`auth.users.banned_until`, cùng
đường với trên)* · **dọn mã người cũ `P####` trước vận hành chính thức** *(chủ dự
án chốt 17/09: không hợp lệ)* · **dòng họ + cây chính do người tự chọn** *(`THIET-KE-NHIEU-CAY.md` 6)* · nhập GEDCOM/Excel qua máy chủ · **khôi phục thật** *(việc
nguy hiểm nhất: phải đo bằng vòng sao lưu → đổi → khôi phục → về đúng trạng
thái cũ, không phải bằng việc có file JSON)* · nối **quan hệ** bắc qua hai cây
*(`noi_ve` chỉ nói "cùng một con người", không nói "cùng một gia đình")*.

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — nhật ký bước đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| ⚠ **Hai hàm của `16` nay LỆCH NGHĨA với tên của chúng**: `xin_xoa_cay()` không còn là "xin" — nó ẩn cây ngay; `huy_xin_xoa_cay()` nay chỉ QTHT gọi được và nghĩa thật là *trả lại cho chủ*. Giữ tên cũ ở b118b là **cố ý** (đổi tên kéo theo `sb.js` · `sb-gia.mjs` · `trang-cay.js` · bộ ảnh). Đổi tên là một bước riêng, làm cùng hay ngay sau b118c | `luoc-do/23-bon-luat-moi.sql` khối đầu |
| ⚠ **`ds_kiem_duyet()` chưa trả người duyệt · lúc duyệt · lý do từ chối** — hai tab lịch sử của Kiểm duyệt để trống ba cột (cột có trong `change_log`, hàm chưa đọc). Sửa hàm là `drop` → chép cả `grant` | `so-tay/trang-quan-tri.md` |
| ⚠ **`xem-khung-quan-tri.mjs` (ngoài repo) còn kịch bản bấm của giao diện cũ** — viết lại theo cảnh của `so-quantri3.mjs`, hoặc bỏ | `so-tay/trang-quan-tri.md` |
| ⚠ **Hai việc của điểm dừng b106 chưa nghiệm thu bằng mắt**: gắn được mã người · đăng nhập bằng vai `sua` xem `pham_vi_sua()` đúng chưa | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **Nợ b105 chưa trả**: người mang vai `quan_tri` **được phong** vẫn THẤY khối *Đơn chờ duyệt* trong Cài đặt, bấm Duyệt thì máy chủ từ chối — **giấu nút đi** | `nhat-ky/b105-quan-ly-thanh-vien.md` |
| ⚠ **`HUONG-DAN-PHAN-QUYEN.md` mục 3 vẫn bảo chủ dự án gõ `update` trong SQL Editor** — b106 đã làm xong màn hình thay nó, nhưng chưa ai xoá mục ấy. Hướng dẫn cũ còn sống là đường để sửa tay đè lên màn hình | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **Thành viên thường nộp đề xuất phải gõ mã người trần** — ô gợi ý đi qua `tim_nguoi_trong_cay()`, gác bằng `co_the_quan_tri()`, nên với họ không gợi ý gì. Nộp vẫn được | `nhat-ky/b117-khu-tai-khoan.md` |
| ⚠ **Huy hiệu *đơn chờ duyệt* trên nút Gia phả đếm theo cây ĐANG MỞ** (`napSoDem(phien.treeId)`) — chỗ duy nhất của trang còn dính cây đang mở. Có từ b101, b117 chỉ dời nút | `khung.js` · luật 5a |
| ⚠ **Ai gọi `don_thung_rac()`** — nút bấm tay hay trigger Apps Script đêm? Chưa hỏi chủ dự án | `THIET-KE-NHIEU-CAY.md` mục 11.6 |
| ⚠ **`settings.js` vẫn gọi thứ này là *Quyền*** trong khi khu Quản trị đã đổi hết sang **Vai trò** (b109c). Chính luật *"hai màn hình gọi một thứ bằng hai tên"* là lý do đổi tên lần ấy | `nhat-ky/b109c-o-vai-tro.md` |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`, mới dán lên Staging. Soi lướt: `12` và `13` không thêm luật ghi nào — nhưng chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Tên gọi chưa chốt**: hai thứ khác hẳn nhau cùng tên *"quản trị hệ thống"* | `THIET-KE-NHIEU-CAY.md` mục 11 |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng | `/kiem-tra` phép 9 |
| ⚠ **Sao lưu KHÔNG chép ảnh** — chỉ liệt kê. Ảnh vẫn nằm đúng một chỗ | `KIEN-TRUC.md` mục 7 |
| ⚠ **Chưa ai thử KHÔI PHỤC từ file sao lưu** — *có file* khác *khôi phục được* | `sao-luu/HUONG-DAN-SAO-LUU.md` |
| ⚠ **Chưa bấm thử app trên cây 681 người** — cây ấy nay có thật; lỗi `vn` của b89 lộ ra ở app thật chứ không lộ ở bộ kiểm | `nhat-ky/b89-*.md` |
| Bốn màn hình chưa mở được (sao lưu · dựng gia phả mới · bỏ chọn · quyền ảnh) | `KIEN-TRUC.md` mục 6 |
| Giấu chi tiết người còn sống với người chỉ có quyền xem | `KIEN-TRUC.md` mục 6 |
| Lỗi điện thoại: chọn số đời không tự vẽ lại | `BAT-DAU.md` mục 5 |
| Tháo giàn giáo `tuong-thich.js` — mốc 7 file, chỉ được giảm | `KIEN-TRUC.md` mục 4 |
| Đổi tên ba vết sẹo (`driveFileId` · `driveThumbUrl` · `tuong-thich`) | `KIEN-TRUC.md` mục 4 |
| Đợt 7 của phép tách `person-edit.js` — treo từ b48 | `BAT-DAU.md` mục 5 |
| Chế độ **bổ sung** của nhập Excel — có phép đo, chưa ai bấm thử trên app thật | `BAT-DAU.md` mục 5 |
| Chưa mở file `.ged` xuất ra bằng một phần mềm gia phả thật | `BAT-DAU.md` mục 5 |
| **Ảnh: kho công khai hay kho kín?** Hiện công khai — đường dẫn khó đoán, nhưng *"khó đoán"* không phải *"được bảo vệ"* | `KIEN-TRUC.md` mục 7 |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)* | `06-quyen-truc-he.sql` mục 2 |
| **`GEMINI.md` vẫn bảo Antigravity chạy *"7 phép rà"*** — nay 10; AGY sửa mã thì cũng phải chạy `do-gon.mjs` | `../GEMINI.md` dòng 138 |

### ⚠ Bộ bất biến bố cục đang gác nhầm nhánh

Bộ kiểm 66 phép / 51.250 phép so trên 214 sơ đồ — thứ bảo vệ `domains/layout.js`
— nằm ngoài repo này, ở `Claude_Code/kiem-thu/`, và **58 trong 142 file của nó
`import` từ `../giapha/js/`**, tức bản đã đóng băng. Ngày ai đó sửa
`supabase/js/domains/`, bộ kiểm ấy **vẫn chạy xanh** vì đang đo file khác.
*(Lý lẽ đầy đủ: `/kiem-tra` phép 9.)* Ba đường chưa chọn: (a) biến môi trường
chọn gốc cho 58 file kiểm; (b) chép bộ kiểm vào `supabase/kiem-thu/`; (c) sống
bằng phép 9. **Chỉ phải quyết khi thật sự cần sửa `domains/`** — mà ngày ấy
`BAT-DAU.md` mục 1 đằng nào cũng bắt dừng lại hỏi vì sao.
