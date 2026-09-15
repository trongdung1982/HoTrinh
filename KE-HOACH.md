# KẾ HOẠCH — nhánh Supabase

*Cập nhật 15/09/2026 · Bước gần nhất: **b118e** — luật gọn + phép đo `do-gon.mjs` (`/kiem-tra` phép 10)
· Việc kế tiếp: **b118d — chuyển nốt các khu còn vẽ tạm sang HTML quantri3**

⚠ **TRẦN CỨNG 250 DÒNG · 15 KB** *(đo: `kiem-thu/do-gon.mjs` · luật: `QUY-TAC-GON.md`)*. File này nạp ở đầu MỌI phiên, nên mỗi dòng thừa ở
đây là dòng thừa nhân với số phiên còn lại. Vượt trần là dấu hiệu có thứ đứng
nhầm chỗ, **đừng nới trần**. Ba luật giữ nó gọn:

1. **Xong rồi thì xoá khỏi đây.** Việc đã làm nằm ở lời commit (`git log`).
   Muốn đọc bản cũ: `git log -p KE-HOACH.md`.
2. **File này giữ đúng bốn thứ:** đang ở đâu · trạng thái dán SQL · việc kế
   tiếp · việc còn treo. Bài học thuộc về `so-tay/` của chức năng ấy.
3. **Dòng ⚠ chỉ được chuyển, không được mất.** Trước khi cắt phải liệt kê mọi
   dòng ⚠ ra và chỉ được nơi trú của từng dòng *(b112 làm thế, 153 dòng)*.

---

## Thứ tự làm — chốt 14/09/2026

Chủ dự án ra thứ tự, nguyên văn: *"thứ tự làm sẽ là rà soát chống phình ngữ
cảnh (nạp thông tin không cần thiết), tham khảo ý kiến agy đề xuất. chuyển đổi
quantri3 vào app chính sau đó mới làm việc khác."*

| Làm thứ | Bước | Việc | Mô hình |
|---|---|---|---|
| 7b | **b118d** | Chuyển nốt sang HTML quantri3, **mỗi phiên một khu** — mục b118d bên dưới | Opus |
| 7c | **b118b** | SQL cho bốn luật mới *(nhóm D)* — đụng nền móng quyền | Opus |
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
`QuanTri.html` là khung **bốn khu**, cộng lớp **trang chi tiết** từ b115 —
Gia phả (b116) · Tài khoản (b117) · Kiểm duyệt (đã có từ trước) · Quản trị hệ
thống (b118) đều đã nối, mỗi khu ít nhất một việc thật. Phân quyền đã đo bằng
REST, 5/5 hàng rào đạt (b94, b96). Chặng đã đóng: **b87 → b118e** — mỗi bước
một file `nhat-ky/`.

⚠⚠ **Từ b118c giao diện trang Quản trị LÀ prototype quantri3** — `QuanTri.html`
và `quan-tri.css` là bản chép nguyên văn; JS chỉ đổ dữ liệu và gắn nút. Không
vẽ lại bằng `style=` hay class tự đặt *(b115–b118 đã làm thế, chủ dự án phải
hỏi lại 15/09)*. Khu chưa chuyển vẽ tạm vào `#khu-tam` bằng mã cũ.

⚠ **`domains/` chưa sửa một dòng nào** trong cả mười file, suốt cả cuộc chuyển
nhà từ Drive sang Supabase. Đó là nghiệm thu của luật phân lớp, giữ nguyên.

### Ba điểm dừng chưa bấm thử — HOÃN tới khi xong trang Quản trị

Cả ba là "chưa ai bấm", không phải "chưa viết". Chủ dự án chốt 15/09/2026:
*"chưa xong trang quantri thì không bấm thử mời và chấp nhận quyền quản trị hệ
thống"* — và **đã có sẵn hai tài khoản Quản trị hệ thống**. Không ghi mục này
vào "đang chặn" nữa; đề nghị bấm thử sau b118.

| Điểm dừng | Bấm gì |
|---|---|
| **b111** — kiểm duyệt TRƯỚC/SAU | Một lần Lưu "chờ duyệt" thật. ⚠ Quản trị luôn `ghi_thang()`, nên tự gắn mã người cho tài khoản CỦA MÌNH **không** tạo ra hàng chờ — phải Lưu bằng tài khoản KHÔNG quản trị cây ấy |
| **b111b** — gắn mã người từ cả hai tấm, đổi cây ở ô chọn | Mã xong, `20` đã dán |
| **b111c** — nộp đề xuất · tự duyệt bị từ chối · người khác duyệt được | Mã + giao diện mới xong (b117), `21` đã dán 14/09: ① nút **Nhận** lời mời bằng tài khoản Quản trị hệ thống *(vá 14/09)*; ② nộp ở khu **Tài khoản** → bảng các gia phả → *Đề xuất mã người*; ③ tự duyệt ở `#gia-pha/cay/<mã>/de-xuat-gan` bị máy chủ từ chối; ④ một Quản trị hệ thống KHÁC duyệt được |
| **b117** — khu Tài khoản trên máy chủ thật | ① bảng *Các gia phả tôi tham gia* hiện đúng mã người đã gắn — bằng tài khoản **thành viên thường**, vì nó đọc qua RLS chứ không qua hàm Quản trị; ② *Đổi mật khẩu* với mật khẩu cũ SAI phải bị từ chối, với mật khẩu cũ đúng thì đổi được |

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

**`22-rut-don-roi-cay.sql` (b116) — ĐÃ DÁN lên Supabase THẬT 15/09/2026,
bảng tự kiểm đạt hết.** Chưa rõ đã dán lên Staging chưa — hỏi lại trước khi
coi cả hai máy chủ đã đồng bộ tới `22`.

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

### Dùng chung cho b115 → b118b — quantri3 vào app

⚠ Prototype: `../codex/dua_claude.ai/quantri3.html` (**ngoài `Claude_Code`**,
ở thư mục cha `Gia_pha/` — đừng tìm trong repo). Dữ liệu và JavaScript trong
đó là **mô phỏng**: *"Không bê dữ liệu mẫu, mã giả hoặc các đoạn thử nghiệm vào
repo chính"* — bàn giao AGY 13/09. ⚠⚠ Câu ấy cấm dữ liệu mẫu và JS giả,
**KHÔNG cấm giao diện** — b114 đọc nhầm, đính chính b118c. Trước khi báo xong mỗi khu: mọi route có
handler, mọi tab mở đúng, mọi nút thành lời gọi dịch vụ thật *(hoặc mờ kèm lý do)*.

⚠ **Bản đồ đã chốt ở b114 — `THIET-KE-QUAN-TRI.md` mục 9, đọc 9.5 TRƯỚC.**
Bảng 9.3 bản đầu sai ba ô, đã đính chính. Nói *"hàm này thiếu"* thì grep
`luoc-do/` trước — 56 hàm `export` của `sb.js` không phải danh sách hàm máy chủ.
⚠ Khung **KHÔNG đổi sang tab ngang**: prototype vẫn là thanh trái, dưới 850px
mới thành hàng thẻ, đúng mục 3 cũ *(đính chính b114)*.

⚠ **Trang chi tiết đã có vỏ từ b115** (`nhat-ky/b115-*.md`): thêm trang mới
= thêm một dòng vào `TRANG` của `khung.js` *(từ b118c mang `view` = `id`
section quantri3)* + vỏ `veVoChiTiet()`. **Khung sửa
`#` lạ ở mọi tầng — trang KHÔNG tự sửa `#`**, và `#` lạ sửa bằng
`replaceState`, không gán lại `location.hash` *(bộ bất biến canh cả hai)*.

### b118d — chuyển nốt sang HTML quantri3 · MỖI PHIÊN MỘT KHU

| | |
|---|---|
| **Làm** | Đổi `view` của khu/trang trong `khung.js` từ `khu-tam` sang section quantri3: ① trang cây — `#tree-members` · `#tree-requests` (+ `#tree-detail`: Vòng đời · Đề xuất gắn) ② khu Tài khoản `#tai-khoan` ③ Kiểm duyệt `#kiem-duyet` + `#kiem-duyet-chitiet` ④ Sổ tài khoản (bảng chờ sẵn trong `data-ban-mau`) + `#sys-account-trees` *(chưa chép vào HTML)* |
| **Cách làm** | Như b118c *(đọc `nhat-ky/b118c-*.md` trước)*: HTML nằm sẵn, bỏ dữ liệu giả rồi — chỉ đổ dòng vào `tbody`, gắn nút vào hàm `sb.js` đã nối ở b116–b118 (chép logic từ file cũ), dùng `o-bang.js` + `hop-thoai.js`. Không `style=` mới. Máy chủ chưa có → `nutMo(chu, lyDo)` |
| **⚠⚠ Nhớ `sb-gia.mjs`** | Thêm cửa vào `sb.js` thì thêm cả ở đó — thiếu một tên là `SyntaxError` lúc nạp, **cả bộ ảnh ra nền trơn**. Đã xảy ra hai lần (b110b, b111). `kiem-trang-quan-tri.mjs` PHẦN M tự đối chiếu và báo tên thiếu |
| **⚠ Luật 5b②** | Cột xuyên cây của Sổ tài khoản là dòng TÓM TẮT, bấm vào mở bảng theo từng cây, không bao giờ là chỗ sửa |
| **Điểm dừng mỗi phiên** | `node ../kiem-thu/so-quantri3.mjs <cảnh>` rồi nhìn cặp `sq-p-*`/`sq-a-*` · `kiem-trang-quan-tri.mjs` đạt · `/kiem-tra` đạt 10. Khu cuối xong: xoá `#khu-tam` + khối TẠM `.qt-*` trong CSS; file mã cũ hết người `import` thì **hỏi** rồi mới xoá |

### b118b — SQL cho bốn luật mới *(nhóm D)* · đụng nền móng quyền

⚠ **Tới bước này tài liệu đi TRƯỚC máy chủ**: `THIET-KE-NHIEU-CAY.md` 11.9 đã
ghi luật mới, SQL đang chạy vẫn là luật cũ *(30 ngày · xin rồi mới ẩn · một
chữ ký · xoá cứng)*. Thử trên app trước b118b sẽ thấy lệch — đó không phải lỗi.

| | |
|---|---|
| **Làm** | QTHT hai chữ ký · khoá mềm tài khoản 60 ngày · `16`: cây ẩn ngay khi chủ xoá + thùng rác 120 ngày · xin đổi quyền *(cột + nộp/rút/duyệt)* |
| **Vì sao đứng sau giao diện** | Đụng `la_quan_tri_he_thong()` và `co_the_xem_cay()` — luật *việc đụng vai đứng sau việc không đụng*. Giao diện vẽ trước, nút chưa có máy chủ thì mờ kèm lý do |
| **⚠ Bẫy đã biết** | Lời mời QTHT chưa nhận KHÔNG mang quyền *(11.8 áp nguyên)* · `co_the_xem_cay()` phải chừa lối vai `sao_luu` *(khối đầu `16`)* · `drop function` xoá cả `grant` · chuỗi dán lại `14`→`16`→`18` |
| **Điểm dừng** | Phép đo mượn danh nghĩa trên bàn thử 5433 đạt; ba câu nhỏ cuối 11.9 đã hỏi; rồi mới đưa SQL cho chủ dự án dán |

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

**Nhóm E của quantri3** *(tạo tài khoản mới — ⚠ cần khoá `service_role`, chỉ
qua Edge Function, khoá **không bao giờ** vào repo Public · công khai theo
từng trường · nhật ký hệ thống — `THIET-KE-QUAN-TRI.md` 9.5)* ·
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
| ⚠ **Bảng tấm *Toàn hệ thống* nay CHÍN cột** và ở 1280px tràn khỏi khu — câu nhắc *"kéo ngang"* đo `scrollWidth` thật nên không nói dối. Chưa vỡ, nhưng **cột thứ mười là cột làm vỡ**: muốn thêm cột thì phải bỏ một cột, hoặc xếp chồng hai dòng trong một ô | `THIET-KE-QUAN-TRI.md` khu 2 |
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
