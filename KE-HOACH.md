# KẾ HOẠCH — nhánh Supabase

*Cập nhật 27/09/2026 · b125e XONG (mã, bản ĐƠN GIẢN) — nút *Xuất Excel* ở bảng
Danh sách người (`trang-nguoi.js` + `xuat-excel.js`), sheet `DuLieu` cùng
khuôn cột `domains/excel.js`. Chủ dự án bấm thử, ĐẠT — nhưng phát hiện ngay
**b125f, việc kế tiếp, CHỦ DỰ ÁN CHỌN LÀM BẰNG OPUS** (đủ lớn, nhiều quyết
định thiết kế): xem đặc tả đầy đủ ở mục *b125f* dưới "Sau đó". b130 (bỏ trần
`KE-HOACH.md`, thêm "duyệt hàng loạt Kiểm duyệt" + "xoá nhật ký hàng loạt")
làm ngay trước b125e, xem `git log`.*

⚠ **Không còn trần cứng dòng/byte** (bỏ 27/09/2026, b131 — chủ dự án chỉ ra:
trần buộc nén nội dung mỗi bước, làm phiên sau đọc thiếu chi tiết mà hiểu sai
việc đã làm). `do-gon.mjs` vẫn ĐO file này (mục XEM, không chặn báo hoàn
thành). Gọn bằng KỶ LUẬT, không bằng con số — ba luật dưới đây
(`QUY-TAC-GON.md` mục 4):

1. **Xong rồi thì xoá khỏi đây.** Việc đã làm nằm ở lời commit (`git log`).
   Muốn đọc bản cũ: `git log -p KE-HOACH.md`.
2. **File này giữ đúng bốn thứ:** đang ở đâu · trạng thái dán SQL · việc kế
   tiếp · việc còn treo. Bài học thuộc về `so-tay/` của chức năng ấy.
3. **Dòng ⚠ chỉ được chuyển, không được mất.** Trước khi cắt phải chỉ được nơi
   trú mới của từng dòng ⚠.

---

## Đang ở đâu

**App chạy thật tại `https://nguyentrongbac.io.vn`** từ 03/09/2026 *(chứng chỉ Let's Encrypt hạn 02/12/2026; địa chỉ cũ `301` về đây)*. Máy chủ thật nay có **BA cây** — NTB 59 người · Nguyễn Phúc Giáo 681 người · **LVT433** *(chủ dự án làm chủ)* — mã cây 3 chữ số. Trang `QuanTri.html` bốn khu đều đã nối. Phân quyền đã đo bằng REST, 5/5 hàng rào đạt (b94, b96).

### Điểm dừng chưa bấm thử — trang Quản trị đã xong (b118d), nay bấm được

Tất cả là "chưa ai bấm", không phải "chưa viết". Đã có sẵn **hai tài khoản
Quản trị hệ thống**.

| Điểm dừng | Bấm gì |
|---|---|
| **b111c** — đơn gắn mã | ✅ Dán xong 26/09 — bấm ở *Tài khoản của tôi → Mã người & Dòng họ* (nộp) và tab *Đơn Hồ sơ cá nhân* của Quản trị hệ thống (xét) |
| **b117** — khu Tài khoản | ①bảng *Các gia phả tôi tham gia* đúng mã (tài khoản thường, qua RLS) ②đổi mật khẩu |
| **b118d** — cả trang Quản trị | Còn: các trang con; menu *Chọn hành động* và *Chọn ▾* mỗi thứ một lần; một Duyệt + một Từ chối ở Kiểm duyệt |
| **b129c** — cột Tài khoản (`39` đã dán) | Danh sách người → Chỉnh sửa → gắn một người chưa có tài khoản; chọn một tài khoản đã liên kết (phải bị chặn, nói rõ gia phả); Đề xuất gỡ → người ấy vào Hồ sơ cá nhân bấm Đồng ý gỡ |
| **b127d** — đề nghị sửa quan hệ (`33`, xong d-1→d-3) | Form người có quan hệ ngoài cây: bấm ✉ gửi đề nghị → Quản trị hệ thống → tab *Đề nghị sửa quan hệ* → Duyệt (gỡ) hoặc Từ chối |
| **b125e** — nút Xuất Excel | Danh sách người → *Xuất Excel* → mở file `.xlsx` tải về bằng Excel thật, xem có đọc được không |
---

## SQL — đã dán gì

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.
Luật dán lại (file nào kéo theo file nào): **`so-tay/phan-quyen.md`** mục
*Chuỗi dán lại*.

**`22`→`33` — ĐÃ DÁN lên THẬT, tự kiểm ĐẠT cả** (ngày dán từng file: `git log`).
⚠ `32` là bản đứng cuối của `luu_cay()` — dán lại `27`/`28` sau nó là mở lại
lỗ, im lặng.

**`34`→`38` (b126a→d) — ĐÃ DÁN lên THẬT 26/09, tự kiểm ĐẠT cả.** `35` gặp dữ
liệu thật: chỉ mục "một tài khoản một đơn chờ" từ chối vì bảng `de_xuat_gan_
nguoi` (đơn gắn mã cũ, theo cây) có tài khoản mang ≥2 đơn "chờ" — chuyện bình
thường ở luật cũ, không hợp ở luật mới. Xử lý: **`truncate table de_xuat_gan_
nguoi;`** trước khi dán lại `35` — xoá sạch đơn cũ (theo cây), không ai mất gì
vì đơn ấy chưa hề có nghĩa toàn phần mềm. Bài học đầy đủ: `so-tay/phan-quyen.md`.

**`39` (b129c) — ĐÃ DÁN lên THẬT 27/09, tự kiểm 7/7 ĐẠT.** ⚠ Thêm HAI CỘT vào `de_xuat_gan_nguoi` (`loai`,
`nop_boi` — có mặc định, không đụng dòng cũ), bảy hàm mới, và là bản ĐỨNG CUỐI
của `duyet_de_xuat_gan()`/`ds_de_xuat_gan()`/`de_xuat_gan_cua_toi()` — dán lại
`35`/`36` sau nó thì phải dán lại `39`. Dán sau `38`. Đo đủ trên bàn thử.

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
⚠ Ô gợi ý trên điện thoại thật chưa ai bấm lại — `so-tay/o-goi-y.md`.

⚠ **b125 — BẢNG NGƯỜI trong trang Quản trị (chủ dự án chốt 23/09/2026) — XONG**
a→c + e đã viết và tự kiểm; d (chọn nhiều dòng, sửa hàng loạt) BỎ hẳn theo
quyết định 27/09/2026, chưa viết dòng nào nên không có gì gỡ. Điểm dừng bấm
thử còn lại của e: bảng trên.

### ⚠ b125f ← KẾ TIẾP — Xuất Excel bản ĐẦY ĐỦ (chủ dự án chọn làm bằng OPUS)

Phát hiện lúc bấm thử b125e (27/09/2026): bảng phẳng hiện tại (`xuat-excel.js`
`dungHangExcel()`) chỉ lấy union cha-mẹ ĐẦU TIÊN tìm thấy cho mỗi người — ai
có **hai cặp cha mẹ** (ruột + nuôi, hoặc nhiều cặp nuôi) thì cặp thứ hai trở
đi bị bỏ, im lặng. Số lượng khác nhau tuỳ NGƯỜI và tuỳ CÂY: có cây không ai
có cha mẹ nuôi, có cây một người có 2+ cặp; có người 1 cuộc hôn nhân, có
người 3+. Bảng phẳng một-dòng-một-người không biểu diễn được số lượng đổi.

**Chủ dự án chốt: làm CẢ HAI tuỳ chọn xuất, để người dùng chọn:**

1. **Bảng phẳng, cột ĐỘNG theo cây** — quét cả cây trước để biết cần bao
   nhiêu cột (VD: cây có người nhiều hôn nhân nhất là 3 → xuất "ID phối ngẫu
   1/2/3"; ai có cha mẹ nuôi thì thêm cột "Cha nuôi 1/Mẹ nuôi 1", "Cha nuôi
   2/Mẹ nuôi 2"…), cột nào cả cây không ai dùng thì ẨN hẳn, không xuất cột
   rỗng. ⚠ Đây là ĐỊNH DẠNG RIÊNG, số cột đổi theo từng lần xuất — không còn
   khớp khuôn cố định của `domains/excel.js` nữa, nên KHÔNG nạp lại được qua
   màn Nhập GEDCOM/Excel hiện có. Chỉ để xem/sửa tay/báo cáo.
2. **Hai sheet tách bảng** — sheet 1 **thông tin người** (thuộc tính cá nhân
   thuần, KHÔNG có cột quan hệ nào cả — Đời, Tên, Giới tính, ngày sinh/mất,
   nơi ở, nghề, ghi chú…); sheet 2 **thông tin các cặp gia đình** (mỗi dòng =
   MỘT union: hai vợ chồng, loại quan hệ với từng con — ruột/nuôi/kế/thừa tự
   — số thứ tự hôn nhân nếu có). Không giới hạn số dòng một người, không mất
   dữ liệu. Đây cũng là định dạng riêng, không nạp lại qua đường Nhập cũ.

**Bỏ hẳn khái niệm "Mã số" kiểu cũ.** Chủ dự án giải thích nguồn gốc: bản
Excel gốc (trước khi có app) dùng "Mã số" = mã cha + chuỗi ký tự mã hoá thông
tin người đó, để tự vẽ sơ đồ trong Excel; "ID mới" là mã đánh LẠI (độ dài
bằng nhau) khi nhập bản đó vào một phần mềm chuẩn GEDCOM. **Phần mềm này đã
chính thức, không nên bám khung file Excel thô nữa** — cột "Mã số" bỏ hẳn,
không xuất; "ID mới" không phải một bước đánh số lại — dùng THẲNG `p.id` thật
của app (`P0007`…) làm định danh, đúng như `xuat-excel.js` đang làm.

⚠ Cột *Đời* (`p.vn.generation`) — chủ dự án nói đang thiếu thông tin lúc bấm
thử. Tên trường đúng theo `domains/excel.js`/`domains/gedcom.js` là
`vn.generation`; có thể là DỮ LIỆU thật sự trống ở nhiều người (chưa từng
điền Đời), không phải lỗi đọc sai trường — xác minh lại bằng mắt trên một
người ĐÃ biết chắc có điền Đời trước khi kết luận.

**Vẫn đúng (giữ từ b125e):** đặt hàm dựng bảng ở `pages/quan-tri/` (không
phải `domains/excel.js`) — mười file `domains/` phải giống hệt bit-với-bit
hai nhánh (`/kiem-tra` phép 9); thêm bất cứ hàm nào vào `domains/excel.js` là
kéo theo phải sửa cả bản Apps Script đã đóng băng, dù bản đó không dùng tới.

### Sau đó — chưa đặt số, chưa chốt

**Nhóm E quantri3** *(9.5 — ⚠ tạo tài khoản cần `service_role` qua Edge
Function, **không bao giờ** vào repo Public)* · chặn đăng nhập tài khoản bị
khoá *(`banned_until`)* · **dòng họ + cây chính do người tự chọn** (`6`) ·
nhập GEDCOM/Excel qua máy chủ · **khôi phục thật** *(đo cả vòng sao lưu→đổi→
khôi phục→về đúng cũ, không chỉ "có file")* · **tối ưu tốc độ đọc** khi mọi
chức năng đã chạy *(681 người: ~0,4s)*. *(Số mục = `THIET-KE-QUAN-TRI.md`.)*

⚠ **17/09, chủ dự án nêu:** huy hiệu số đếm + bấm tên mở cây ở Gia phả, an
toàn (`9.6`). *(Câu thứ hai — QTHT tự duyệt — đã chốt 21/09, nay là b124c.)*

⚠ **Xoá nhật ký hàng loạt — ĐÃ có giao diện, đang khoá mờ chờ máy chủ.**
`QuanTri.html` (khu Quản trị hệ thống → Nhật ký hệ thống) có sẵn
`#sys-log-check-all` (chọn tất cả) · `#btn-delete-selected-logs` (xoá đã
chọn) · `#btn-don-nhat-ky-thung-rac` (dọn nhật ký thùng rác). Cả ba đang bị
`khu-quan-tri-he-thong.js` khoá mờ vì "nhật ký hệ thống cần một bảng mới ở
máy chủ" — thuộc Nhóm E ở trên, chưa tách bước số. Phát hiện 27/09/2026 khi
tra lại b125d — đưa vào đây để không quên khi tới lượt Nhóm E.

⚠ **Duyệt hàng loạt ở Kiểm duyệt — Ý MỚI 27/09/2026, KHÔNG có trong prototype
quantri3, chưa thiết kế.** `khu-kiem-duyet.js` hiện mỗi "lần Lưu" (một thay
đổi chờ duyệt) chỉ có một nút Duyệt + một nút Từ chối riêng — không có cách
chọn nhiều lần Lưu rồi xử lý cùng lúc, kể cả dạng khoá mờ. Trước khi viết mã
cần chủ dự án chốt: phạm vi chọn (trong một cây, hay xuyên cây?), Từ chối
hàng loạt có chung một lý do hay từng dòng riêng, và có RPC nào an toàn để
duyệt/từ chối nhiều `change_log` trong một lời gọi hay phải lặp từng dòng.

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
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`. Từng dán thử lên Staging nhưng Staging đã XOÁ 26/09 — nay chưa dán ở đâu cả, chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng. Đường chạy tạm: `--import ./sang-supabase.mjs` (b128b) — ⚠ KHÔNG ăn vào bài chạy trong Chrome; `kiem-buoc-80` dùng bản `kiem-buoc-80-sb.mjs` | `/kiem-tra` phép 9 |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| ⚠ **`tree_members.person_id` thành cột chết từ b126** — `duyet_thanh_vien()` (đơn xin vào cây) vẫn GHI vào đó; `ds_cay_cua_tai_khoan()`/`trang-tai-khoan.js` và cột *Tên người trong cây* của bảng **Thành viên & quyền** (`ds_thanh_vien()`) vẫn ĐỌC nó → có thể hiện sai. Bảng Danh sách người đã chuyển sang `ds_lien_ket_cay()` (b129c) — hai chỗ kia nên đi cùng đường | `so-tay/luu-mot-dong-quan-tri.md` |
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
