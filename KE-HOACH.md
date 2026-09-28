# KẾ HOẠCH — nhánh Supabase

*Cập nhật 28/09/2026 trưa · b142a XONG phần mã: bản sao lưu đêm bỏ sót mọi
cây không có dòng `sao_luu` (đo trên bàn thử: 1/2 cây, 59/740 người) — vá bằng
`45` + `SaoLuu.gs` 0.5.0, **CHƯA dán**. Bảy điểm dừng dưới chưa bấm thử.*

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

### Điểm dừng chưa bấm thử

| Điểm dừng | Bấm gì |
|---|---|
| **b141** Tải ảnh | Ctrl+F5. Mở một người ở cây `TH957` → *Sửa* → khối Ảnh → thêm một tấm ảnh chụp điện thoại → *Lưu*. Đạt khi ảnh hiện trên ô sơ đồ, và bấm vào ảnh ở trang chi tiết thì ra bản lớn nét |
| **b140** Duyệt hàng loạt | *Quản trị → Kiểm duyệt*, tab *Đang chờ duyệt* (Ctrl+F5 trước). Cây thử `TH957`: sửa 2–3 lần bằng tài khoản thử để có dòng chờ. Tích hai dòng → thanh trên bảng ghi "Đã chọn 2 / n" → *Duyệt các dòng đã chọn* → *Duyệt chính thức* → hộp "Đã duyệt 2 / 2", hai dòng sang tab *Đã nhận chính thức*. Lặp với *Từ chối các dòng đã chọn* + một lý do → dữ liệu về như cũ, tab *Đã từ chối* hiện lý do ấy ở cả hai dòng. Đổi bộ lọc cây → các ô tích tự bỏ hết |
| **b139** Nhập GEDCOM bổ sung | Mở cây thử `TH957` → *Nhập GEDCOM/Excel* → chọn một file `.ged` có vài người CHƯA có trong cây → ghép đôi → *Ghi*. Đạt khi ghi xong không báo "Mã mới vừa cấp đã có bản ghi khác giữ", và người mới hiện trên sơ đồ |
| **b142a** + **b137** Sao lưu đủ cây | Làm đúng `sao-luu/HUONG-DAN-SAO-LUU.md` mục *Khi `SaoLuu.gs` có bản mới* (dán `45` → thay mã 0.5.0 → chạy `kiemTraKetNoi`). Đạt khi: bảng tự kiểm của `45` ĐẠT bốn dòng · nhật ký có sáu dòng `cau_hinh` … `de_xuat_dong_ho` · dòng cuối **`Đối chiếu với máy chủ: ĐỦ`**. ⚠ Nhìn dòng 3 của bảng tự kiểm TRƯỚC khi dán lần hai — không có cây nào bị kể tên nghĩa là máy chủ thật chưa từng thiếu; có tên thì các bản sao lưu cũ thiếu đúng cây ấy |
| **b136** Lịch sử Kiểm duyệt | *Quản trị → Kiểm duyệt*, tab *Đã nhận chính thức*: hai cột cuối có người duyệt + lúc duyệt; tab *Đã từ chối & hoàn tác*: người từ chối + lý do. Lần Lưu tự duyệt (người tin cậy) có thể trống người duyệt — đúng, không phải lỗi |
| **b135** Huy hiệu (9.6) | *Quản trị → Gia phả*, chip *Tôi quản lý*: cây nào có nội dung chờ kiểm duyệt thì dưới tên có huy hiệu "n chờ kiểm duyệt", bấm sang Kiểm duyệt. Số trên nút *Kiểm duyệt* / *Gia phả* ở thanh trái nay CỘNG mọi cây bạn quản lý — đổi cây đang mở không làm số đổi |
| **b134** Nhật ký hệ thống | Đăng xuất → đăng nhập lại → *Quản trị hệ thống → Nhật ký*: phải thấy dòng **"Bắt đầu ghi nhật ký"** và dòng **"Đăng nhập"** của chính bạn. Bấm *Cấp quyền tạo cây* rồi *Thu hồi* cho `khach@io.vn` → hai dòng mới, người làm là bạn. Tích một dòng → *Xóa các dòng đã chọn* → sang tab *Thùng rác*, bảng cuối có một lô → *Phục hồi* → dòng về lại. Thẻ *Nhật ký hệ thống* ở *Tổng quan* ra số sự kiện 7 ngày |

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

**`40` (b125g) — ĐÃ DÁN lên THẬT 27/09, Đời hiện đúng ở app thật** (chủ dự
án bấm thử trên cây TH957, Xuất Excel + Đời tự cập nhật đều đạt). Thêm cột
`tree_persons.doi`, hai hàm (`doi_tinh` · `tinh_lai_doi`, không ai ngoài
trigger gọi được), tám trigger trên `union_children` · `unions` · `persons`
· `tree_persons`. Không định nghĩa lại hàm nào của file khác → không kéo
theo chuỗi dán lại. Bàn thử: `do-b125g.mjs` 44/44.

**`41` (b132) — ĐÃ DÁN lên THẬT 27/09.** Bàn thử 15/15 + tự kiểm 5/5. Sửa `ds_thanh_vien()` và `ds_cay_cua_tai_khoan()` đọc cột chết
`tree_members.person_id` (chết từ `26`/b126) → đổi sang `tai_khoan.person_id`
qua `tree_persons`, cùng thuốc với `39` mục 8 (`ds_lien_ket_cay`, đã dán
26/09). `create or replace`, không đổi cột trả về, không cần `grant` lại.
Bàn thử: `do-b132.mjs`. Không đụng RLS, không đổi cửa ghi.

**`42` · `43` · `44` (b134 · b136 · b137) — ĐÃ DÁN lên THẬT 28/09** (chủ dự
án báo; `SaoLuu.gs` 0.4.0 đã thay cùng buổi). `42` tạo hai bảng nhật ký + tám
trigger (hai trên `auth.users`) + năm hàm QTHT — không kéo chuỗi dán lại. ⚠
`43` là bản ĐỨNG CUỐI của `ds_kiem_duyet()` — dán lại `08`/`10` thì phải dán
lại `43` (`so-tay/phan-quyen.md`). `44` = một hàm mới `sao_luu_bang_he_thong()`.

**`45` (b142a) — CHƯA DÁN.** Dán sau `44`, rồi thay `SaoLuu.gs` 0.5.0. Một
trigger mới trên `trees` · bù dòng `sao_luu` cho mọi cây · hàm mới
`sao_luu_dem_that()`. Không định nghĩa lại hàm nào của file khác → không kéo
chuỗi dán lại. Bàn thử: `do-b142a.mjs` 21/21.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

**b142b — khôi phục thật.** Script đổ ngược file sao lưu JSON → SQL, đo cả
vòng trên bàn thử (sao lưu → phá → khôi phục → so từng bảng khớp từng dòng).
Đã tra sẵn 28/09: 19 bảng không có vòng khoá ngoại · `change_log`/`imports`
dùng `serial` (phải `setval`) · mọi trigger người dùng trên 19 bảng phải tắt
lúc đổ (Đời, nhật ký, `chan_ghi_de`, `chan_quan_he_trung`, và ⚠ `them_may_sao_
luu` của `45` — để bật thì nó đẻ dòng `tree_members` đụng dòng sắp đổ) · bảng nhật ký không trỏ khoá
ngoại vào 19 bảng ấy nên `truncate` không lan. Chưa quyết: tài khoản có trong
bản sao lưu mà đã mất khỏi `auth.users` thì dừng hay bỏ dòng.

### Trang Quản trị — đọc `so-tay/trang-quan-tri.md` trước khi đụng

⚠ Nói *"hàm máy chủ này thiếu"* thì grep `luoc-do/` trước — `export` của
`sb.js` không phải danh sách hàm máy chủ (`THIET-KE-QUAN-TRI.md` 9.5).
⚠ Khung KHÔNG đổi sang tab ngang: thanh trái, dưới 850px mới thành hàng thẻ.

### ⚠⚠ Một người một bản ghi — b121 → b124 (xong, trừ b124b)

Sổ tay: `so-tay/luu-du-lieu.md` · kéo người, b124b chưa dựng:
`so-tay/nguoi-xuyen-cay.md` · b124c: `so-tay/phan-quyen.md` *Nới hẹp tự duyệt*.
⚠ Ô gợi ý trên điện thoại thật chưa ai bấm lại — `so-tay/o-goi-y.md`.

### Sau đó — chưa đặt số, chưa chốt

**Nhóm E quantri3** *(9.5 — nhật ký hệ thống XONG ở b134; còn tạo tài khoản
⚠ cần `service_role` qua Edge Function, **không bao giờ** vào repo Public ·
công khai theo từng trường · ghi bản sao lưu đêm vào nhật ký: `SaoLuu.gs`
gọi một hàm mới)* · chặn đăng nhập tài khoản bị
khoá *(`banned_until`)* · **dòng họ + cây chính do người tự chọn** (`6`) ·
nhập GEDCOM/Excel qua máy chủ · **khôi phục thật** *(đo cả vòng sao lưu→đổi→
khôi phục→về đúng cũ, không chỉ "có file")* · **tối ưu tốc độ đọc** khi mọi
chức năng đã chạy *(681 người: ~0,4s)*. *(Số mục = `THIET-KE-QUAN-TRI.md`.)*

⚠ **Cột *Nội dung thao tác* ở Kiểm duyệt co về một chữ mỗi dòng** (có từ
prototype; b140 thêm cột ô tích lấy thêm ~30px). Nới = đè `style=width` của
quantri3 cho cột *Hành động* / *Người thực hiện* — chờ chủ dự án bảo.

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — nhật ký bước đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| ⚠ **Nhập chế độ `moi` (dựng gia phả mới) vẫn giữ mã của file** → `trungma` ngay. Màn ấy chưa mở nên chưa ai vào; mở thì phải cấp mã mới cho mọi bản ghi (sửa `domains/gedcom.js` `tronMoi`, hỏi chủ dự án) | `so-tay/luu-du-lieu.md` *Kho mã* |
| ⚠ **`di-doi/sinh-sql-di-doi.mjs` lạc hậu từ `26`** — SQL nó sinh còn gắn `tree_id` vào bốn bảng dùng chung. Ba cây đã di dời xong nên chưa có việc; chạy sẽ lỗi to tiếng | đầu chính file ấy |
| Hai bảng nhật ký (`42`) cố ý CHƯA sao lưu — không cần để khôi phục app, tự có thùng rác 120 ngày. Sáu bảng hệ thống đã vào ở b137 | `kiem-thu/kiem-sao-luu.mjs` hằng `CHUA_SAO_LUU` |
| ⚠ **Hai hàm của `16` LỆCH NGHĨA với tên** (`xin_xoa_cay` ẩn cây NGAY; `huy_xin_xoa_cay` = trả lại cho chủ). Giữ tên cũ là cố ý; đổi tên là một bước riêng | `luoc-do/23-bon-luat-moi.sql` khối đầu |
| ⚠ **b106 chưa nghiệm thu bằng mắt**: gắn mã người · vai `sua` xem `pham_vi_sua()` đúng chưa *(b126 sẽ đụng cả hai)* | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **b127b chưa bấm thật**: thẻ người kéo sang `T388` phải đủ vợ/con | — |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`. Từng dán thử lên Staging nhưng Staging đã XOÁ 26/09 — nay chưa dán ở đâu cả, chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng. Đường chạy tạm: `--import ./sang-supabase.mjs` (b128b) — ⚠ KHÔNG ăn vào bài chạy trong Chrome; `kiem-buoc-80` dùng bản `kiem-buoc-80-sb.mjs` | `/kiem-tra` phép 9 |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| ⚠ **`tree_members.person_id` vẫn là cột chết từ b126** — `duyet_thanh_vien()` (đơn xin vào cây) vẫn GHI vào đó; từ b132 không hàm đọc nào dùng nó nữa. Bỏ hẳn cột là một bước riêng | `so-tay/luu-mot-dong-quan-tri.md` |
| ⚠ **Sao lưu KHÔNG chép ảnh** — chỉ liệt kê. Ảnh vẫn nằm đúng một chỗ | `KIEN-TRUC.md` mục 7 |
| ⚠ **Chưa ai thử KHÔI PHỤC từ file sao lưu** — *có file* khác *khôi phục được* | `sao-luu/HUONG-DAN-SAO-LUU.md` |
| Bốn màn hình chưa mở được (sao lưu · dựng gia phả mới · bỏ chọn · quyền ảnh) | `KIEN-TRUC.md` mục 6 |
| Giấu chi tiết người còn sống với người chỉ có quyền xem | `KIEN-TRUC.md` mục 6 |
| Tháo giàn giáo `tuong-thich.js` — mốc **2 file** (b141: `backup` · `chon-gia-pha`, hai màn hình chưa làm), chỉ được giảm. Nối hai màn ấy (hoặc bỏ hẳn) là về 0, xoá file | `KIEN-TRUC.md` mục 4 |
| Đổi tên ba vết sẹo (`driveFileId` · `driveThumbUrl` · `tuong-thich`) | `KIEN-TRUC.md` mục 4 |
| Đợt 7 của phép tách `person-edit.js` — treo từ b48 | `BAT-DAU.md` mục 5 |
| **Ảnh: kho công khai hay kho kín?** Hiện công khai — đường dẫn khó đoán, nhưng *"khó đoán"* không phải *"được bảo vệ"* | `KIEN-TRUC.md` mục 7 |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)* | `06-quyen-truc-he.sql` mục 2 |

### ⚠ Bộ bất biến bố cục đang gác nhầm nhánh

Bộ kiểm bảo vệ `domains/layout.js` `import` từ `../giapha/js/` — bản ĐÃ ĐÓNG
BĂNG — nên sửa `supabase/js/domains/` thì nó vẫn xanh vì đang đo file khác.
Lý lẽ đầy đủ và ba đường chưa chọn: **`/kiem-tra` phép 9**. Đã thành sự thật ở
`person.js` (b120, b122b — chủ dự án cho phép cả hai lần), **`layout.js`**
(b128 — khác hẳn từ 25/09) và `gedcom.js` (b139, cho phép 28/09 —
`capMaHangLoat()`; đo bằng `kiem-cap-ma-nhap.mjs`, nạp thẳng `supabase/js`). ⚠ Đo `layout.js` phải qua `--import ./sang-supabase.mjs`
hoặc `kiem-buoc-80-sb.mjs`; nhóm 9b (bắt khuỷu) ở đó đã lỗi thời — chủ dự án
bác luật khuỷu 25/09. Đường chạy bằng đúng pipeline app (thêm/ẩn dâu/rể) chưa
có trong bộ kiểm — `so-tay/ve-so-do.md`.
