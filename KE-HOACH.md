# KẾ HOẠCH — nhánh Supabase

*Cập nhật 14/09/2026 · Bước gần nhất: **b113** — rà việc Antigravity làm 12/09
· Việc kế tiếp: **b114 — quantri3: bản đồ và chốt thiết kế**

⚠ **TRẦN CỨNG 250 DÒNG.** File này nạp ở đầu MỌI phiên, nên mỗi dòng thừa ở
đây là dòng thừa nhân với số phiên còn lại. Vượt trần là dấu hiệu có thứ đứng
nhầm chỗ, **đừng nới trần**. Ba luật giữ nó gọn:

1. **Xong rồi thì xoá khỏi đây.** Mỗi bước đã đóng có `nhat-ky/bXX-*.md` của
   riêng nó, và `nhat-ky/INDEX.md` có một dòng cho mỗi bước. Chép lại ở đây là
   chép lần thứ ba. Muốn đọc bản cũ: `git log -p KE-HOACH.md`.
2. **File này giữ đúng bốn thứ:** đang ở đâu · trạng thái dán SQL · việc kế
   tiếp · việc còn treo. Bài học của một bước thuộc về nhật ký bước ấy.
3. **Dòng ⚠ chỉ được chuyển, không được mất.** Trước khi cắt phải liệt kê mọi
   dòng ⚠ ra và chỉ được nơi trú của từng dòng *(b112 làm thế, 153 dòng)*.

---

## Thứ tự làm — chốt 14/09/2026

Chủ dự án ra thứ tự, nguyên văn: *"thứ tự làm sẽ là rà soát chống phình ngữ
cảnh (nạp thông tin không cần thiết), tham khảo ý kiến agy đề xuất. chuyển đổi
quantri3 vào app chính sau đó mới làm việc khác."*

| Làm thứ | Bước | Việc | Mô hình |
|---|---|---|---|
| ~~1~~ | ~~b112~~ | ✓ **XONG 14/09/2026** — 212 KB → 81 KB, giảm 61,8% | Opus |
| ~~2~~ | ~~b113~~ | ✓ **XONG 14/09/2026** — khối Gia phả ở lại Cài đặt (xác nhận, cạnh khu 1) + vá phép đo mù; workflow 3 repo vệ tinh giữ, dùng chung backend là cố ý | Sonnet |
| 3 | **b114** | quantri3 — bản đồ và chốt thiết kế *(không sửa mã)* | Opus |
| 4 | **b115** | quantri3 — khung + điều hướng | Opus |
| 5 | **b116** | quantri3 — khu Gia phả | Sonnet |
| 6 | **b117** | quantri3 — khu Tài khoản *(gồm chuyển khối b111c sang)* | Opus |
| 7 | **b118** | quantri3 — khu Kiểm duyệt + Quản trị hệ thống | Sonnet |
| 8 | **b119** | Khu Sao lưu + Số đếm đối chiếu *(số cũ: b112)* | Sonnet |
| 9 | **b120** | Mã người xuyên cây *(số cũ: b113)* | Sonnet |

⚠ **Hai mục cuối đã ĐỔI SỐ.** Chúng vốn mang số b112/b113, đặt trước khi chủ
dự án chèn ba việc mới vào đầu hàng. Chưa bước nào trong hai mục ấy bắt tay
làm nên đổi số không cắt lịch sử của ai; `KE-HOACH.md` là nguồn đúng cho số
bước (`THIET-KE-NHIEU-CAY.md` mục 12 ghi sẵn luật ấy).

---

## Đang ở đâu

**App chạy thật tại `https://nguyentrongbac.io.vn`** từ 03/09/2026 *(chứng chỉ
Let's Encrypt hạn 02/12/2026; địa chỉ cũ `301` về đây)*. Máy chủ thật có **hai
cây** — NTB 59 người và Nguyễn Phúc Giáo 681 người — mã cây **3 chữ số**. Trang
`QuanTri.html` là khung **bốn khu**. Phân quyền đã đo bằng REST, 5/5 hàng rào
đạt (b94, b96). Chặng đã đóng: **b87 → b113** — mỗi bước một file `nhat-ky/`.

⚠ **`domains/` chưa sửa một dòng nào** trong cả mười file, suốt cả cuộc chuyển
nhà từ Drive sang Supabase. Đó là nghiệm thu của luật phân lớp, giữ nguyên.

### Ba chỗ còn hở, và cả ba đều là "chưa ai bấm", không phải "chưa viết"

| Hở | Vì sao chưa đóng |
|---|---|
| **b111** — điểm dừng kiểm duyệt TRƯỚC/SAU chưa bấm thử | Cần một lần Lưu "chờ duyệt" thật. ⚠ Quản trị luôn `ghi_thang()`, nên tự gắn mã người cho tài khoản CỦA MÌNH **không** tạo ra hàng chờ. Đường thử được ngay hôm nay: mời một **email thứ hai** vào cây, gắn mã người cho tài khoản ấy, đăng nhập bằng nó rồi Lưu |
| **b111b** — gắn mã người từ cả hai tấm, đổi cây ở ô chọn | Mã xong, `20` đã dán. Chỉ còn bấm |
| **b111c** — nộp đề xuất · tự duyệt bị từ chối · người khác duyệt được | Mã xong, `21` đã dán 14/09, bảng tự kiểm đạt hết. ⚠ Chủ dự án **cố ý hoãn**: *"tôi chưa thử trên app vì đợi chỉnh lại giao diện trang quantri"* → đi cùng **b117**. Ba việc phải bấm ở đó: ① nút **Nhận** lời mời bằng tài khoản Quản trị hệ thống *(vá 14/09)*; ② tự bấm duyệt bị máy chủ từ chối; ③ một Quản trị hệ thống KHÁC duyệt được |

⚠ **Một việc treo không có số, và nó đi theo MÁY chứ không theo bước:** commit
`render 1.9.1` của repo `giapha/` (`44768d9`) **chưa đẩy được** — trên LapAMD
`git push` đi bằng `trongdung1982`, mà repo ấy thuộc `ntdungsnotion`, nên nhận
`403`. Sang LapASUS thì một lệnh là xong. Bản `supabase/` đã đẩy (`0485a2b`).

---

## SQL — đã dán gì, và luật dán lại

**Đây là chỗ DUY NHẤT ghi trạng thái dán.** `CHI-DAN.md` cố ý không giữ bản
thứ hai: hai chỗ ghi là hai chỗ để lệch nhau.

**Đã dán lên CẢ HAI Supabase (thật + Staging): `01` → `21`, không sót file
nào.** Mốc gần nhất: `18` (10/09) · `19`, `20` (10/09) · `21` (14/09, bảng tự
kiểm đạt hết). `04-view-ma-da-dung.sql` là view phụ trợ, không thuộc chuỗi.

⚠ **Chuỗi dán lại** *(cùng bảng ở `CHI-DAN.md` mục 3, đừng để hai bản lệch)*:
`11`/`10`→`14`→`16`→`18` · `13`/`14`→`15`→`20`→`18` · `08`→`18`. Ba luật nữa,
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

Hai tài liệu thiết kế: quyền cấp hệ thống · danh sách cây · tạo cây · mã xuyên
cây → **`THIET-KE-NHIEU-CAY.md`**; bốn khu của `QuanTri.html` →
**`THIET-KE-QUAN-TRI.md`**. Thứ tự theo **"đau nhất trước"**, cộng một luật thứ
hai: **việc nào đụng `vai_tro()` thì đứng sau việc không đụng** — sai ở nền
móng thì mọi thứ xây bên trên sai theo, và không có gì báo lỗi.

### b114 — quantri3: bản đồ và chốt thiết kế · KHÔNG SỬA MÃ

⚠ Sản phẩm chốt: `../codex/dua_claude.ai/quantri3.html` (**ngoài
`Claude_Code`**, ở thư mục cha `Gia_pha/` — đừng tìm trong repo). Prototype
tĩnh, chủ dự án đã duyệt; dữ liệu và JavaScript trong đó là **mô phỏng**.

| | |
|---|---|
| **Vì sao một bước riêng chỉ để đọc** | Prototype đổi **khung điều hướng** — bốn tab NGANG + trang chi tiết theo ngữ cảnh, thay thanh dọc bốn khu hiện nay. Sửa mã trước khi có bản đồ là vẽ lại bốn khu bằng cách đoán, và đoán sai ở khu thứ ba thì hai khu đầu phải làm lại |
| **Làm** | Bảng đối chiếu: mỗi `data-route`, mỗi chip, mỗi nút → hàm `sb.js` đã có / chưa có / không cần. Không ô nào để trống — *"chưa biết gọi gì"* phải trả lời ở đây, không phải lúc đang gõ mã |
| **Chốt ba câu** | ① Khung hiện tại giữ lại gì *(bốn khu đã chạy thật; `quan-tri.css` là chỗ DUY NHẤT biết bề ngang màn hình)*. ② Khối **b111c** cắm vào đâu — prototype viết trước b111c nên **không có khái niệm ấy**; chỗ gần nhất là bảng *Các gia phả liên quan* cột *Mã người*. ③ Bộ ảnh `xem-khung-quan-tri.mjs` 25 cảnh đi đường nào |
| **⚠ Không bê nguyên** | *"Không bê dữ liệu mẫu, mã giả hoặc các đoạn thử nghiệm vào repo chính"* — `PHOI-HOP-AI.md`, bàn giao 13/09 |
| **Điểm dừng** | `THIET-KE-QUAN-TRI.md` cập nhật + bảng đối chiếu; **không một dòng mã nào đổi**; chủ dự án xác nhận đúng cái họ đã duyệt với AGY |

### b115 — quantri3: khung + điều hướng

| | |
|---|---|
| **Làm** | Bốn tab ngang + `data-route` → `QuanTri.html` và `js/pages/quan-tri.js`. `quan-tri.css` vẫn là chỗ duy nhất biết bề ngang |
| **⚠ Bẫy đã biết** | Ba luật khung điều hướng ở `THIET-KE-QUAN-TRI.md` mục 3, và *"`#` lạ bị sửa bằng cách gán lại `location.hash`"* — bộ bất biến có phép canh đúng chỗ ấy |
| **Điểm dừng** | Bốn tab mở đúng bốn khu cũ, chưa đổi ruột khu nào; 237 phép bất biến vẫn đạt |

### b116 — quantri3: khu Gia phả

| | |
|---|---|
| **Làm** | Bốn chip *(Tôi quản lý · Tôi là thành viên · Có thể xin vào · Tạo gia phả mới)* + trang chi tiết theo ngữ cảnh cây |
| **⚠ Giữ nguyên** | Vá 14/09/2026 ở `veOThaoTac()` — **lời mời đứng trước quyền xem**. Chuyển khung mà đánh rơi thứ tự ấy là trả lại đúng lỗi chủ dự án vừa báo |
| **Điểm dừng** | Nhận / Từ chối lời mời vẫn bấm được bằng tài khoản Quản trị hệ thống |

### b117 — quantri3: khu Tài khoản, và chuyển khối b111c sang

| | |
|---|---|
| **Làm** | Bảng tài khoản + trang chi tiết + bảng *Các gia phả liên quan*; chuyển **nút Đề xuất mã người** và **khối xét đơn** của b111c sang đúng chỗ đã chốt ở b114 |
| **⚠ Giữ nguyên ba thứ** | ① nút Duyệt **mờ sẵn kèm lý do** trên đơn của chính mình — cửa thứ TÁM của luật *"không ai tự đặt quyền cho mình"*; ② ô chọn cây riêng, KHÔNG dính cây đang mở của app; ③ cột xuyên cây không bao giờ là chỗ sửa — nó là dòng TÓM TẮT, bấm vào mở bảng theo từng cây |
| **Điểm dừng** | Nộp đề xuất · tự duyệt bị từ chối · quản trị khác duyệt được — cả ba trên giao diện mới |

### b118 — quantri3: khu Kiểm duyệt + Quản trị hệ thống, ảnh, `/kiem-tra`

| | |
|---|---|
| **Làm** | Hai khu còn lại; `xem-khung-quan-tri.mjs` chụp lại **toàn bộ** theo khung mới |
| **⚠⚠ Nhớ `sb-gia.mjs`** | Thêm cửa vào `sb.js` thì thêm cả ở đó — thiếu một tên là `SyntaxError` lúc nạp, **cả bộ ảnh ra nền trơn**. Đã xảy ra hai lần (b110b, b111) |
| **Điểm dừng** | Nhìn bằng mắt cả bộ ảnh ở 1280px và 390px; `/kiem-tra` đạt cả 9 |

### b119 — Khu Sao lưu + Số đếm đối chiếu

| | |
|---|---|
| **Làm** | `dem_du_lieu(p_tree)` · `khu-sao-luu.js` — trạng thái lần sao lưu gần nhất + bảng đối chiếu 5 con số |
| **Sản phẩm** | Khu 4 ở trạng thái **chỉ đọc**, và nói thẳng *"sao lưu không chép nội dung ảnh"* |
| **⚠ Không làm** | **Không vẽ nút Khôi phục.** Máy chủ chưa khôi phục được; vẽ nút là giả vờ giải quyết bằng giao diện |
| **Điểm dừng** | Số trên màn hình khớp số đếm được trong file sao lưu đêm gần nhất |

### b120 — Mã người xuyên cây

| | |
|---|---|
| **Làm** | `persons.noi_ve` · thêm tên cột vào bảng `TEN_PERSON` của `hinh-dang.js` · ô nhập trong màn hồ sơ · dòng *"Người này cũng có trong gia phả …"* + nút nhảy sang **chỉ khi người xem truy cập được cây kia** |
| **⚠ Bẫy** | Cột không có tên trong `TEN_PERSON` thì mỗi lần lưu ghi `null` đè lên, **và không có gì báo lỗi** — `DU-LIEU.md` mục 3 điều 7 |
| **Đứng cuối vì** | Chưa ai dựng cây thứ ba. Cột này chỉ có việc khi có người dựng cây cho bên nhà họ |
| **Điểm dừng** | Lưu một vòng rồi đọc lại, `noi_ve` **còn nguyên** |

### Sau b120 — chưa đặt số, chưa chốt

Nhập GEDCOM/Excel qua máy chủ · **khôi phục thật** *(việc nguy hiểm nhất, phải
kiểm chứng bằng vòng `sao lưu → đổi dữ liệu → khôi phục → dữ liệu quay đúng
trạng thái cũ`, không phải bằng việc có file JSON)* · nối **quan hệ** bắc qua
hai cây *(`noi_ve` chỉ nói "cùng một con người", không nói "cùng một gia đình")*.

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — nhật ký bước đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| ⚠ **MỘT EMAIL THỨ HAI đang chặn BA điểm dừng cùng lúc** — b111 (dựng hàng chờ kiểm duyệt thật), b111b (gắn mã người cho tài khoản khác), b111c (hai chữ ký cần **hai** Quản trị hệ thống). Một việc mở khoá cả ba | `nhat-ky/b111b-*.md` |
| ⚠ **Bảng tấm *Toàn hệ thống* nay CHÍN cột** và ở 1280px tràn khỏi khu — câu nhắc *"kéo ngang"* đo `scrollWidth` thật nên không nói dối. Chưa vỡ, nhưng **cột thứ mười là cột làm vỡ**: muốn thêm cột thì phải bỏ một cột, hoặc xếp chồng hai dòng trong một ô | `THIET-KE-QUAN-TRI.md` khu 2 |
| ⚠ **Hai việc của điểm dừng b106 chưa nghiệm thu bằng mắt**: gắn được mã người · đăng nhập bằng vai `sua` xem `pham_vi_sua()` đúng chưa | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **Nợ b105 chưa trả**: người mang vai `quan_tri` **được phong** vẫn THẤY khối *Đơn chờ duyệt* trong Cài đặt, bấm Duyệt thì máy chủ từ chối — **giấu nút đi** | `nhat-ky/b105-quan-ly-thanh-vien.md` |
| ⚠ **`HUONG-DAN-PHAN-QUYEN.md` mục 3 vẫn bảo chủ dự án gõ `update` trong SQL Editor** — b106 đã làm xong màn hình thay nó, nhưng chưa ai xoá mục ấy. Hướng dẫn cũ còn sống là đường để sửa tay đè lên màn hình | `nhat-ky/b106-khu-tai-khoan.md` |
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

### ⚠ Bộ bất biến bố cục đang gác nhầm nhánh

Bộ kiểm 66 phép / 51.250 phép so trên 214 sơ đồ — thứ bảo vệ `domains/layout.js`,
phần đắt nhất của cả dự án — nằm ở `Claude_Code/kiem-thu/`, **ngoài repo này**,
và **58 trong 142 file của nó `import` từ `../giapha/js/`**, tức bản đã đóng băng.
Hôm nay vẫn an toàn vì hai bản `domains/` giống nhau **bit-với-bit, 10/10 file**
(đo 03/09/2026) — nhưng đó là một sự trùng hợp, không phải một cơ chế: ngày ai
đó sửa `supabase/js/domains/`, bộ kiểm ấy **vẫn chạy xanh** vì đang đo file
khác. `/kiem-tra` phép 9 chỉ báo *"hai bản đã lệch"*, không thay được việc trỏ
bộ kiểm sang đúng chỗ. Ba đường chưa chọn: (a) biến môi trường chọn gốc cho 58
file kiểm; (b) chép bộ kiểm vào `supabase/kiem-thu/`; (c) sống bằng phép 9.
**Chỉ phải quyết khi thật sự cần sửa `domains/`** — mà theo `BAT-DAU.md` mục 1
thì ngày ấy đằng nào cũng phải dừng lại hỏi vì sao.
