# KẾ HOẠCH — nhánh Supabase

*Cập nhật 29/09/2026 · **b155 (nút Khôi phục, hai đường: file trong máy · web app máy sao lưu) ĐẠT trên app thật 29/09.** **b154 (sao lưu + khôi phục ảnh) ĐẠT trên app thật 29/09 — xoá ảnh rồi khôi phục, ảnh về lại.** **b153a (trang sơ đồ theo tông màu) XONG MÃ ·
b152 (công khai theo từng người áp cả cho vai `xem`) XONG MÃ, `53` đã dán
29/09.** Mười bảy điểm dừng dưới chưa bấm thử.*

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
| **b152** Công khai theo từng người — cả vai Xem | ✓ `53` đã dán. Ctrl+F5. Cần một người CÓ tài khoản gắn, ở cây thử `TH957` (ví dụ người của bạn): *Quản trị → Tài khoản* → bảng *Các gia phả tôi đang tham gia* → dòng `TH957` → cột *Thông tin công khai* → tắt *Quê quán* + *Tiểu sử* → *Lưu*. Mời `khach@io.vn` vào `TH957` vai **Khách** (`xem`), đăng nhập `khach@io.vn` → mở `TH957` → bấm người của bạn: KHÔNG thấy quê quán, tiểu sử. Người khác vẫn đủ như cũ (người còn sống vẫn bị lược như b148). Đăng nhập lại tài khoản của bạn: thấy đủ. Xong: bật lại hai trường, gỡ vai của `khach@io.vn` |
| **Tông màu** (trang Quản trị) | Ctrl+F5 → *Quản trị* → thanh trái có nút **🎨 Tông màu** ngay trên *← Về trang sơ đồ* → bấm → bảng 10 tông mở sang phải nút → chọn *Đêm hoài cổ* → cả trang tối lại, chữ đọc được → tải lại trang (F5) → vẫn tông ấy. Chọn *Kem tối giản (mặc định)* → về y như cũ. Điện thoại: ☰ → *Tông màu* → bảng đứng giữa màn hình. **b153a — trang sơ đồ**: để tông *Đêm hoài cổ* → *← Về trang sơ đồ* → nền, nút tròn, Cài đặt, thẻ chi tiết, form Sửa, Danh sách người đều tối theo; ô người trên sơ đồ vẫn sáng (cố ý — không đổi `render.js`). Chọn lại *Kem tối giản* → trang sơ đồ y hệt trước |
| **Cột Nội dung thao tác** (Kiểm duyệt) | Ctrl+F5 → *Quản trị → Kiểm duyệt*: cột *Nội dung thao tác* đọc thành câu, không còn một chữ mỗi dòng. Tab *Đã từ chối & hoàn tác*: cột *Lý do từ chối* cũng vậy |
| **b151a** Nhập tạo gia phả mới | ⚠ Bước này DỰNG một gia phả thật trên máy chủ — thử xong thì xoá nó. Cần tài khoản được phép tạo cây. Ctrl+F5 → ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn `tai-lieu/My Family Tree.ged` → ô *Tên gia phả mới* gõ `Thu b151` → *Tạo gia phả mới và ghi vào đó*. Đạt khi: hộp báo ghi xong 6 người, KHÔNG báo "Mã mới vừa cấp đã có bản ghi khác giữ"; sơ đồ hiện đủ 6 người, 2 gia đình; *Danh sách người* cho thấy mã người là số lớn (không phải `P0001`…`P0006`). Xong: *Quản trị → Gia phả* → xoá `Thu b151` |
| **b151b** Nhập 681 người qua mạng thật | Sau b151a. Mở cây Nguyễn Phúc Giáo → ⚙ Cài đặt → *Xuất GEDCOM* → tải file về. Rồi *Nhập GEDCOM/Excel* → chọn file vừa tải → tên `Thu b151b` → *Tạo gia phả mới và ghi vào đó*. Đạt khi: báo ghi xong 681 người trong vài giây, sơ đồ mở được. Bàn thử đo 0,6–0,73 s; đây là phép duy nhất đo được đường mạng thật (gói ~624 KB). Xong: xoá `Thu b151b` |
| **b151c** Nhập Excel tạo gia phả mới | Sau b151a. ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn file `Cay gia pha 17 doi cu Nguyen Phuc Giao (Pass VBA 12345).xlsb` (nằm trong thư mục `Claude_Code`) → bản xem trước ghi 681 người → tên `Thu b151c` → *Tạo gia phả mới và ghi vào đó*. Đạt khi báo ghi xong 681 người, sơ đồ mở được, cột Đời có số. Bàn thử đo 1,04 s. Xong: xoá `Thu b151c` |
| **b150 · b150b** Thông tin công khai của tôi + Liên hệ | ✓ `50`, `51`, `52` đã dán. Ctrl+F5. Sơ đồ → mở người của bạn → *Sửa* → khối *Cuộc đời* có ô **Liên hệ** → gõ số điện thoại → *Lưu* → trang chi tiết có hàng *Liên hệ* → *Danh sách người* → *Xuất Excel ▾* → file có cột *Liên hệ* sau *Dân tộc*. *Quản trị → Tài khoản* → bảng *Các gia phả tôi đang tham gia*: cột *Thông tin công khai* ghi "11 thông tin →" → bấm ở dòng cây thử `TH957` → trang MƯỜI MỘT dòng, giá trị của người bạn được gắn → tắt *Ảnh* + *Quê quán* → *Lưu thiết lập công khai*. *Quản trị hệ thống → Cây mặc định*: đặt `TH957` (tạm). Tab ấy nay có 10 nhóm, *Số điện thoại & Email liên hệ* mặc định TẮT. Đăng nhập `khach@io.vn` (không có chân ở `TH957`) mở sơ đồ: người của bạn không ảnh, không quê quán, không liên hệ; người khác vẫn đủ (trừ liên hệ). ⚠ Người của bạn phải CÓ trong `TH957` thì mới thấy khác. Xong: bật lại hai trường, đặt lại cây mặc định như cũ |
| **b149** Nút Sao lưu | Ctrl+F5. Sơ đồ → ⚙ Cài đặt: có khối *Sao lưu & khôi phục*, nút *Mở Sao lưu (trang Quản trị)* → bấm → sang trang Quản trị, đang đứng ở tab **Sao lưu**. Đăng nhập `khach@io.vn` → ⚙ Cài đặt: KHÔNG có khối ấy |
| **b148** Giấu người còn sống | ✓ `50` đã dán. Ctrl+F5. *Quản trị → Gia phả →* cây thử `TH957` → *Mời gia nhập*: mời `khach@io.vn` với vai **Khách** (`xem`). Đăng nhập `khach@io.vn` → nhận lời mời → mở `TH957`: người còn sống (không ngày mất, sinh chưa quá 100 năm) chỉ còn tên, giới tính, năm sinh — không ảnh, không tiểu sử; trang chi tiết có dòng *"Người này còn sống nên máy chủ đã lược bớt…"*. Người đã mất vẫn đủ. Thêm: *Quản trị → Gia phả →* `TH957` → *Danh sách người* → bấm tên một người còn sống → trang hồ sơ MỞ ĐƯỢC (bản che), không báo "không có quyền xem". Đăng nhập lại tài khoản của bạn: thấy đủ cả. Xong nhớ gỡ vai của `khach@io.vn` |
| **b146** Báo trùng + gộp | ✓ `48` đã dán. Ctrl+F5 → *Quản trị → Gia phả → chip Báo trùng người*: ô 1 gõ tên một người ở cây thử `TH957`, bấm chọn một dòng; ô 2 chọn một người trùng với họ ở `T388` (hoặc cùng cây); ghi lý do → *Gửi báo trùng* → hộp báo mã nào sẽ ở lại, bảng dưới có dòng "Chờ duyệt". Sang *Quản trị hệ thống → tab Báo trùng người* → *Duyệt (gộp)* → *Duyệt và gộp* → hộp "Đã gộp …". Mở sơ đồ cây của người bị gộp: chỉ còn một người, vợ/chồng + con của cả hai bản đều về người ấy. Tab *Nhật ký* có dòng "Gộp hai bản ghi người". ⚠ Chỉ thử trên hai cây thử — gộp KHÔNG hoàn tác được bằng nút |
| **b145** Công khai theo trường | Ctrl+F5 → *Quản trị hệ thống → Cây mặc định*: bảng bảy dòng có ô tích. Đặt cây thử `TH957` làm mặc định, tắt *Ngày tháng sinh cụ thể* + *Ảnh* → *Lưu*. Đăng nhập `khach@io.vn` (không có chân ở `TH957`) mở sơ đồ: thẻ người chỉ còn năm sinh, không ảnh. Đăng nhập lại bằng tài khoản của bạn: vẫn thấy đủ. *Nhật ký* có dòng "Đổi trường công khai cho khách". ⚠ Xong nhớ đặt lại cây mặc định như cũ |
| **b141** Tải ảnh | Ctrl+F5. Mở một người ở cây `TH957` → *Sửa* → khối Ảnh → thêm một tấm ảnh chụp điện thoại → *Lưu*. Đạt khi ảnh hiện trên ô sơ đồ, và bấm vào ảnh ở trang chi tiết thì ra bản lớn nét |
| **b140** Duyệt hàng loạt | *Quản trị → Kiểm duyệt*, tab *Đang chờ duyệt* (Ctrl+F5 trước). Cây thử `TH957`: sửa 2–3 lần bằng tài khoản thử để có dòng chờ. Tích hai dòng → thanh trên bảng ghi "Đã chọn 2 / n" → *Duyệt các dòng đã chọn* → *Duyệt chính thức* → hộp "Đã duyệt 2 / 2", hai dòng sang tab *Đã nhận chính thức*. Lặp với *Từ chối các dòng đã chọn* + một lý do → dữ liệu về như cũ, tab *Đã từ chối* hiện lý do ấy ở cả hai dòng. Đổi bộ lọc cây → các ô tích tự bỏ hết |
| **b139** Nhập GEDCOM bổ sung *(trước b151b thì CHẮC HỎNG — sổ nhập bị máy chủ từ chối; thử sau khi Ctrl+F5)* | Mở cây thử `TH957` → *Nhập GEDCOM/Excel* → chọn một file `.ged` có vài người CHƯA có trong cây → ghép đôi → *Ghi*. Đạt khi ghi xong không báo "Mã mới vừa cấp đã có bản ghi khác giữ", và người mới hiện trên sơ đồ |
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

**`45` (b142a) — ĐÃ DÁN lên THẬT 28/09**, `SaoLuu.gs` 0.5.0 thay cùng buổi. Một
trigger mới trên `trees` · bù dòng `sao_luu` cho mọi cây · hàm mới
`sao_luu_dem_that()`. Không định nghĩa lại hàm nào của file khác → không kéo
chuỗi dán lại. Bàn thử: `do-b142a.mjs` 21/21.

**`46` (b144) — ĐÃ DÁN lên THẬT 28/09**, tự kiểm 3/3. Đo bằng REST cùng ngày:
khoá `khach@io.vn` → đăng nhập trả `user_banned`; mở khoá → vào lại được.
Khoá tài khoản thì chặn luôn đăng nhập (`banned_until`). Một trigger mới trên `tai_khoan` + bù cho tài khoản đang
khoá. Không định nghĩa lại hàm nào của file khác → không kéo chuỗi dán lại.
Bàn thử: `do-b144.mjs` 20/20.

**`47` (b145) — ĐÃ DÁN lên THẬT 28/09, tự kiểm 6/6 ĐẠT** (chủ dự án báo). Thêm cột `trees.truong_cong_khai` (mặc định bật
cả sáu = y hệt hôm nay) · `la_khach_cay` · `che_nguoi` · `dat_truong_cong_khai`
· ⚠ bản ĐỨNG CUỐI của `doc_cay()` và `ds_nguoi_xem_duoc()` — dán lại
`26`/`27`/`30` thì PHẢI dán lại `47` (`so-tay/phan-quyen.md`). Bàn thử:
`do-b145a.mjs` 43/43.

**`48` (b146) — ĐÃ DÁN lên THẬT 28/09, tự kiểm 5/5 ĐẠT** (chủ dự án báo). Thêm bảng `bao_trung_nguoi` + sáu hàm gọi được
(`tim_nguoi_bao_trung` · `nop_bao_trung` · `rut_bao_trung` · `ds_bao_trung` ·
`duyet_bao_trung` · `tu_choi_bao_trung`) + sáu hàm phụ khoá kín. Chỉ `create
or replace`, không định nghĩa lại hàm nào của file khác → không kéo chuỗi dán
lại; dán lại nhiều lần được. Chưa dán thì hai màn hình báo *"Máy chủ chưa có
chức năng này"*. Bàn thử: `do-b146.mjs` 64/64.

**`49` (b147) — ĐÃ DÁN lên THẬT 28/09, tự kiểm 3/3 ĐẠT; `SaoLuu.gs` 0.6.0 đã
thay cùng buổi, sao lưu chạy thành công** (chủ dự án báo). Một hàm mới `ghi_sao_luu_dem()` — chỉ tài khoản mang vai `sao_luu`
gọi được, chỉ chèn một dòng nhật ký loại `backup`. Tự kiểm 3/3. Không kéo
chuỗi dán lại. ⚠ Đi CẶP với `SaoLuu.gs` 0.6.0 — thay mã Apps Script cùng
buổi (hướng dẫn: `sao-luu/HUONG-DAN-SAO-LUU.md` mục *Khi `SaoLuu.gs` có bản
mới*). Dán `49` mà chưa thay mã thì không ai gọi; thay mã mà chưa dán `49`
thì bản sao lưu vẫn ghi bình thường, chỉ không báo về. Bàn thử: `do-b147.mjs`
22/22 · `kiem-sao-luu.mjs` 46/46.

**`50` (b148) — ĐÃ DÁN lên THẬT 28/09** (chủ dự án báo; đo REST cùng ngày:
`doc_cay` trả `che_con_song` + `bi_che`, `doc_ho_so_nguoi` chạy). Giấu chi tiết người còn sống
với thành viên chỉ có vai `xem` — cả ngày cưới + ghi chú hôn nhân của họ.
Bảy hàm mới (`coi_con_song` · `la_chi_xem_cay` · `ds_nguoi_xem_day_du` ·
`ds_cay_chi_xem` · `che_hon_nhan` · `ds_nguoi_bi_che` · `doc_ho_so_nguoi` cho
trang Hồ sơ người) · ⚠ bản ĐỨNG CUỐI của `doc_cay()`, `ds_nguoi_xem_duoc()`,
`ds_hon_nhan_xem_duoc()` và luật đọc `doc_change_log` — dán lại `47` thì PHẢI dán
lại `50` (`so-tay/phan-quyen.md`). Dán lại nhiều lần được. Tự kiểm 6/6 phải
ĐẠT. Chưa dán thì app chạy như cũ (cờ che luôn tắt, trang hồ sơ đi đường
đọc thẳng bảng). Bàn thử: `do-b148a.mjs` 57/57; cây 681 người đọc nhanh
ngang Quản trị hệ thống (không bị che).

**`51` (b150) — ĐÃ DÁN lên THẬT 28/09** (chủ dự án báo; đo REST cùng ngày: ba
cửa `ds_/doc_/dat_cong_khai_tai_khoan` chạy, `truong_rieng_nguoi` trả 403 với
người dùng — đúng, khoá kín).
Thêm cột `tree_members.truong_cong_khai` (trống = theo cây, y hệt hôm nay) ·
`truong_rieng_nguoi` (khoá kín) · `giao_truong` · ba cửa `ds_/doc_/dat_cong_khai_
tai_khoan` · ⚠ bản ĐỨNG CUỐI của `doc_cay()` — dán lại `47`/`50` thì PHẢI dán
lại `51` (`so-tay/phan-quyen.md`). Dán lại nhiều lần được. Tự kiểm 5/5 phải
ĐẠT. Chưa dán thì cột *Thông tin công khai* ghi "Xem →", bấm vào trang báo
*"Máy chủ chưa có chức năng này"*. Bàn thử: `do-b150.mjs` 33/33.

**`52` (b150b) — ĐÃ DÁN lên THẬT 28/09** (chủ dự án báo; đo REST cùng ngày:
`persons?select=contact` trả 200 — cột đã có).
Cột `persons.contact` (CHO null — lý do ở đầu file) · mười nhóm công khai,
chuyển dữ liệu MỘT lần (mọi danh sách thêm Sống/mất + Đời, có Tiểu sử thì
thêm Quê quán; Liên hệ không tự bật) · `doc_cay()` trả Đời đã che, khách thôi
đọc thẳng `tree_persons` · ⚠ bản ĐỨNG CUỐI của `che_nguoi` · `doc_cay` ·
`doc_ho_so_nguoi` · hai cửa đặt nhóm · luật đọc `tree_persons` · ⚠ **VÁ TẠI
CHỖ** `luu_cay()` · `tu_choi_thay_doi()` · `gop_hai_nguoi()` — dán lại
`26`/`28`/`32`/`47`/`48`/`50`/`51` thì PHẢI dán lại `52` (`so-tay/phan-quyen.md`).
Dán lại nhiều lần được. Tự kiểm 6/6 phải ĐẠT. Bàn thử: `do-b150b.mjs` 32/32.

**`53` (b152) — ĐÃ DÁN lên THẬT 29/09, tự kiểm 4/4 ĐẠT** (chủ dự án báo).
Không đổi cột, không đổi tên/tham số hàm app gọi (`doc_cay` ·
`doc_ho_so_nguoi`) → không cần Ctrl+F5 cho SQL. Một hàm mới khoá kín
`an_bot_rieng` · ⚠ bản ĐỨNG CUỐI của `doc_cay()` · `ds_nguoi_xem_duoc()` ·
`ds_nguoi_bi_che()` · `doc_ho_so_nguoi()` — dán lại `47`/`50`/`51`/`52`
thì PHẢI dán lại `53` (`so-tay/phan-quyen.md`). Dán lại nhiều lần được.
Bàn thử: `do-b152.mjs` 29/29.

**`54` (b155a) — ĐÃ DÁN lên THẬT 29/09** (đo REST: `xem_truoc_khoi_phuc` có,
từ chối tài khoản không QTHT). `SaoLuu.gs` **0.9.0** đã thay, web app đã triển
khai (địa chỉ trong `cau-hinh.js`; đo thật: không vé / vé giả / vé không QTHT
đều bị từ chối, CORS mở). Nút chỉ nhận file ghi TỪ 0.8.0 trở đi. Bảng mới
`ban_sao_luu_da_ghi` + bốn hàm (`ghi_bam_sao_luu` · `xem_truoc_khoi_phuc` ·
`khoi_phuc_ban_sao` · `kiem_file_sao_luu_` khoá kín). Không định nghĩa lại hàm
nào của file khác → không kéo chuỗi dán lại. ⚠ Thân khôi phục là BẢN THỨ HAI
của `sao-luu/khoi-phuc.mjs` — sửa một thì sửa cả hai. Bàn thử: `do-b155a.mjs`
33/33 (khôi phục 0,5 s dưới trần 8 s).

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

⚠ **Sao lưu / khôi phục: `so-tay/sao-luu.md` trước tiên** — bản sao lưu trước
28/09 08:04 chỉ có cây NTB; file SQL khôi phục chứa cả gia phả, KHÔNG thả vào
`supabase/`.

**Chưa đặt bước kế tiếp** — chọn từ *Sau đó* dưới đây, hoặc bấm thử mười bảy
điểm dừng ở trên trước (b152 trước, rồi ba điểm b151). Việc Claude
tự đo được bằng REST (b152 · b148 · b145 · b150 phần khách) đã đề xuất 29/09,
chưa làm.

⚠ **b152 — ba điều Claude Code tự chốt thay (chủ dự án ngủ), xem lại khi dậy**:
① vai `xem` thấy = nhóm NGƯỜI bật, KHÔNG giao với nhóm của CÂY (tab *Cây mặc
định* chỉ cho khách) · ② người còn sống: giao luật b148 với cài đặt riêng —
chặt hơn thắng · ③ người xem có quyền sửa ở cây khác chứa người ấy thì thấy
đủ (như b148). Muốn khác thì một chỗ ở `53`.

### Trang Quản trị — đọc `so-tay/trang-quan-tri.md` trước khi đụng

⚠ Nói *"hàm máy chủ này thiếu"* thì grep `luoc-do/` trước — `export` của
`sb.js` không phải danh sách hàm máy chủ (`THIET-KE-QUAN-TRI.md` 9.5).
⚠ Khung KHÔNG đổi sang tab ngang: thanh trái, dưới 850px mới thành hàng thẻ.

### ⚠⚠ Một người một bản ghi — b121 → b124 (xong; b124b dựng ở b146)

Sổ tay: `so-tay/luu-du-lieu.md` · kéo người + báo trùng/gộp:
`so-tay/nguoi-xuyen-cay.md` · b124c: `so-tay/phan-quyen.md` *Nới hẹp tự duyệt*.
⚠ Ô gợi ý trên điện thoại thật chưa ai bấm lại — `so-tay/o-goi-y.md`.

### Sau đó — chưa đặt số, chưa chốt

**Nhóm E quantri3** *(9.5 — nhật ký hệ thống XONG ở b134; tạo tài khoản XONG
ở b143 bằng mật khẩu tạm — *gửi liên kết qua email* còn mờ, cần màn hình đặt
mật khẩu + SMTP riêng, xem `so-tay/tao-tai-khoan.md` · công khai theo từng
trường XONG ở b145 cho cây mặc định, theo từng tài khoản XONG ở b150 · sao lưu đêm báo vào
nhật ký XONG ở b147)* · **tối ưu tốc độ đọc** khi mọi
chức năng đã chạy *(681 người: ~0,4s)*. *(Số mục = `THIET-KE-QUAN-TRI.md`.)*

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — nhật ký bước đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| ⚠ **`di-doi/sinh-sql-di-doi.mjs` lạc hậu từ `26`** — SQL nó sinh còn gắn `tree_id` vào bốn bảng dùng chung. Ba cây đã di dời xong nên chưa có việc; chạy sẽ lỗi to tiếng | đầu chính file ấy |
| Hai bảng nhật ký (`42`) cố ý CHƯA sao lưu — không cần để khôi phục app, tự có thùng rác 120 ngày. Sáu bảng hệ thống đã vào ở b137. **`bao_trung_nguoi` (`48`) cũng cố ý chưa** — con trỏ gộp đã nằm ở `persons.meta.gopVao` + `change_log.truoc`; mất bảng chỉ mất đơn đang chờ. Muốn vào thì sửa `sao_luu_bang_he_thong()` + `SaoLuu.gs` cùng lúc | `kiem-thu/kiem-sao-luu.mjs` hằng `CHUA_SAO_LUU` |
| ⚠ **Bảng/cột mới mang MÃ NGƯỜI phải vào `gop_hai_nguoi()` mục 5** (`48`) — sót thì gộp để lại mã thua ở đó, im lặng | `so-tay/luu-du-lieu.md` đầu file |
| ⚠ **Hai hàm của `16` LỆCH NGHĨA với tên** (`xin_xoa_cay` ẩn cây NGAY; `huy_xin_xoa_cay` = trả lại cho chủ). Giữ tên cũ là cố ý; đổi tên là một bước riêng | `luoc-do/23-bon-luat-moi.sql` khối đầu |
| ⚠ **b106 chưa nghiệm thu bằng mắt**: gắn mã người · vai `sua` xem `pham_vi_sua()` đúng chưa *(b126 sẽ đụng cả hai)* | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **b127b chưa bấm thật**: thẻ người kéo sang `T388` phải đủ vợ/con | — |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`. Từng dán thử lên Staging nhưng Staging đã XOÁ 26/09 — nay chưa dán ở đâu cả, chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — xem ngay dưới bảng. Đường chạy tạm: `--import ./sang-supabase.mjs` (b128b) — ⚠ KHÔNG ăn vào bài chạy trong Chrome; `kiem-buoc-80` dùng bản `kiem-buoc-80-sb.mjs` | `/kiem-tra` phép 9 |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| ⚠ **Vai `xem` đọc thẳng `tree_persons.doi` qua REST** — Đời của người tắt nhóm Đời vẫn lộ theo đường ấy (app không đi đường ấy, `53` khép ba đường kia). Đóng = giấu cả dòng `tree_persons`, đụng mọi chỗ hỏi "người này ở cây nào" | `luoc-do/53` đầu file · `so-tay/phan-quyen.md` |
| **Dọn ghi chú đầu file `person-edit.js`** (212 dòng, trần 30) — chủ dự án hoãn 29/09/2026. Tám file `pages/` khác sửa ở b153a cũng còn nợ (`do-gon.mjs --tat-ca`) | `QUY-TAC-GON.md` D1 |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| ⚠ **`tree_members.person_id` vẫn là cột chết từ b126** — `duyet_thanh_vien()` (đơn xin vào cây) vẫn GHI vào đó; từ b132 không hàm đọc nào dùng nó nữa. Bỏ hẳn cột là một bước riêng | `so-tay/luu-mot-dong-quan-tri.md` |
| Repo vệ tinh `LeVanTrac` · `NguyenQuang` kẹt Pages từ 28/09 08:12 (push dồn → deploy giẫm nhau). Chủ dự án bảo **treo** — app chưa xong; lần push sau thường tự gỡ | `.github/workflows/dong-bo-sang-levantrac.yml` |
| Hai màn hình chưa mở được (bỏ chọn gia phả · quyền ảnh) | `KIEN-TRUC.md` mục 6 |
| Tháo giàn giáo `tuong-thich.js` — mốc **1 file** (b149: `chon-gia-pha`), chỉ được giảm. Nối màn ấy (hoặc bỏ hẳn nút *Bỏ chọn*) là về 0, xoá file | `KIEN-TRUC.md` mục 4 |
| Đổi tên ba vết sẹo (`driveFileId` · `driveThumbUrl` · `tuong-thich`) | `KIEN-TRUC.md` mục 4 |
| Đợt 7 của phép tách `person-edit.js` — treo từ b48 | `BAT-DAU.md` mục 5 |
| **Ảnh: kho công khai hay kho kín?** Hiện công khai — đường dẫn khó đoán, nhưng *"khó đoán"* không phải *"được bảo vệ"* | `KIEN-TRUC.md` mục 7 |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)* | `06-quyen-truc-he.sql` mục 2 |

### ⚠ Bộ bất biến bố cục đang gác nhầm nhánh

Bộ kiểm bảo vệ `domains/layout.js` `import` từ `../giapha/js/` — bản ĐÃ ĐÓNG
BĂNG — nên sửa `supabase/js/domains/` thì nó vẫn xanh vì đang đo file khác.
Lý lẽ đầy đủ và ba đường chưa chọn: **`/kiem-tra` phép 9**. Đã thành sự thật ở
`person.js` (b120, b122b — chủ dự án cho phép cả hai lần), **`layout.js`**
(b128 — khác hẳn từ 25/09) và `gedcom.js` (b139 + b151a, cho phép 28/09 —
`capMaHangLoat()` · `tronMoi()`; đo bằng `kiem-cap-ma-nhap.mjs` +
`kiem-nhap-cay-moi.mjs`, nạp thẳng `supabase/js`). ⚠ Đo `layout.js` phải qua `--import ./sang-supabase.mjs`
hoặc `kiem-buoc-80-sb.mjs`; nhóm 9b (bắt khuỷu) ở đó đã lỗi thời — chủ dự án
bác luật khuỷu 25/09. Đường chạy bằng đúng pipeline app (thêm/ẩn dâu/rể) chưa
có trong bộ kiểm — `so-tay/ve-so-do.md`.
