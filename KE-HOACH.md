# KẾ HOẠCH — nhánh Supabase

*Cập nhật 29/09/2026 · Mười tám điểm dừng chưa bấm thử.*

⚠ **Không còn trần cứng dòng/byte** (bỏ 27/09/2026, b131 — chủ dự án chỉ ra:
trần buộc nén nội dung mỗi bước, làm phiên sau đọc thiếu chi tiết mà hiểu sai
việc đã làm). `do-gon.mjs` vẫn ĐO file này (mục XEM, không chặn báo hoàn
thành). Gọn bằng KỶ LUẬT, không bằng con số — ba luật dưới đây
(`QUY-TAC-GON.md` mục 4):

1. **Xong rồi thì xoá khỏi đây.** Việc đã làm nằm ở lời commit (`git log`) —
   đó là nhật ký bước. Muốn đọc bản cũ: `git log -p KE-HOACH.md`.
2. **File này giữ đúng bốn thứ:** đang ở đâu · trạng thái dán SQL · việc kế
   tiếp · việc còn treo. Bài học thuộc về `so-tay/` của chức năng ấy; file SQL
   thêm gì thì đọc đầu chính file ấy.
3. **Dòng ⚠ chỉ được chuyển, không được mất.** Trước khi cắt phải chỉ được nơi
   trú mới của từng dòng ⚠.

---

## Đang ở đâu

**App chạy thật tại `https://nguyentrongbac.io.vn`** từ 03/09/2026 *(chứng chỉ Let's Encrypt hạn 02/12/2026; địa chỉ cũ `301` về đây)*. Máy chủ thật nay có **BA cây** — NTB 59 người · Nguyễn Phúc Giáo 681 người · **LVT433** *(chủ dự án làm chủ)* — mã cây 3 chữ số. Trang `QuanTri.html` bốn khu đều đã nối. Phân quyền đã đo bằng REST, 5/5 hàng rào đạt (b94, b96). Sao lưu đêm + khôi phục (dữ liệu và ảnh) chạy thật, máy sao lưu làm web app — `so-tay/sao-luu.md`.

### Điểm dừng chưa bấm thử

| Điểm dừng | Bấm gì |
|---|---|
| **b157** Mở app nhanh gấp đôi | Ctrl+F5 trên trang sơ đồ. Đạt khi: sơ đồ hiện ra nhanh hơn trước thấy rõ (Claude đo bằng Chrome, máy chủ thật: cây 681 người 1,56 s → 0,78 s; cây 15 người 1,42 s → 0,62 s), đúng cây đang mở lần trước, đúng người trung tâm, nút *Sửa* vẫn có. Bấm *Quản trị*: dòng *"Cây đang hiển thị tại trang Sơ đồ"* vẫn đúng tên cây. Thêm một người mới rồi *Lưu*: không báo lỗi mã |
| **b152** Công khai theo từng người — cả vai Xem *(hàng rào máy chủ đã đo REST 29/09, 9/9 — chỉ còn phần màn hình)* | Ctrl+F5 → *Quản trị → Tài khoản* → bảng *Các gia phả tôi đang tham gia* → một dòng cây → cột *Thông tin công khai* → trang mười dòng mở ra, tắt/bật rồi *Lưu* không báo lỗi, tải lại thì còn đúng như vừa lưu |
| **Tông màu** (trang Quản trị) | Ctrl+F5 → *Quản trị* → thanh trái có nút **🎨 Tông màu** ngay trên *← Về trang sơ đồ* → bấm → bảng 10 tông mở sang phải nút → chọn *Đêm hoài cổ* → cả trang tối lại, chữ đọc được → tải lại trang (F5) → vẫn tông ấy. Chọn *Kem tối giản (mặc định)* → về y như cũ. Điện thoại: ☰ → *Tông màu* → bảng đứng giữa màn hình. **b153a — trang sơ đồ**: để tông *Đêm hoài cổ* → *← Về trang sơ đồ* → nền, nút tròn, Cài đặt, thẻ chi tiết, form Sửa, Danh sách người đều tối theo; ô người trên sơ đồ vẫn sáng (cố ý — không đổi `render.js`). Chọn lại *Kem tối giản* → trang sơ đồ y hệt trước |
| **Cột Nội dung thao tác** (Kiểm duyệt) | Ctrl+F5 → *Quản trị → Kiểm duyệt*: cột *Nội dung thao tác* đọc thành câu, không còn một chữ mỗi dòng. Tab *Đã từ chối & hoàn tác*: cột *Lý do từ chối* cũng vậy |
| **b151a** Nhập tạo gia phả mới | ⚠ Bước này DỰNG một gia phả thật trên máy chủ — thử xong thì xoá nó. Cần tài khoản được phép tạo cây. Ctrl+F5 → ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn `tai-lieu/My Family Tree.ged` → ô *Tên gia phả mới* gõ `Thu b151` → *Tạo gia phả mới và ghi vào đó*. Đạt khi: hộp báo ghi xong 6 người, KHÔNG báo "Mã mới vừa cấp đã có bản ghi khác giữ"; sơ đồ hiện đủ 6 người, 2 gia đình; *Danh sách người* cho thấy mã người là số lớn (không phải `P0001`…`P0006`). Xong: *Quản trị → Gia phả* → xoá `Thu b151` |
| **b151b** Nhập 681 người qua mạng thật | Sau b151a. Mở cây Nguyễn Phúc Giáo → ⚙ Cài đặt → *Xuất GEDCOM* → tải file về. Rồi *Nhập GEDCOM/Excel* → chọn file vừa tải → tên `Thu b151b` → *Tạo gia phả mới và ghi vào đó*. Đạt khi: báo ghi xong 681 người trong vài giây, sơ đồ mở được. Bàn thử đo 0,6–0,73 s; đây là phép duy nhất đo được đường mạng thật (gói ~624 KB). Xong: xoá `Thu b151b` |
| **b151c** Nhập Excel tạo gia phả mới | Sau b151a. ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn file `Cay gia pha 17 doi cu Nguyen Phuc Giao (Pass VBA 12345).xlsb` (nằm trong thư mục `Claude_Code`) → bản xem trước ghi 681 người → tên `Thu b151c` → *Tạo gia phả mới và ghi vào đó*. Đạt khi báo ghi xong 681 người, sơ đồ mở được, cột Đời có số. Bàn thử đo 1,04 s. Xong: xoá `Thu b151c` |
| **b150 · b150b** Thông tin công khai của tôi + Liên hệ | Ctrl+F5. Sơ đồ → mở người của bạn → *Sửa* → khối *Cuộc đời* có ô **Liên hệ** → gõ số điện thoại → *Lưu* → trang chi tiết có hàng *Liên hệ* → *Danh sách người* → *Xuất Excel ▾* → file có cột *Liên hệ* sau *Dân tộc*. *Quản trị → Tài khoản* → bảng *Các gia phả tôi đang tham gia*: cột *Thông tin công khai* ghi "11 thông tin →" → bấm ở dòng cây thử `TH957` → trang MƯỜI MỘT dòng, giá trị của người bạn được gắn → tắt *Ảnh* + *Quê quán* → *Lưu thiết lập công khai*. *Quản trị hệ thống → Cây mặc định*: đặt `TH957` (tạm). Tab ấy nay có 10 nhóm, *Số điện thoại & Email liên hệ* mặc định TẮT. Đăng nhập `khach@io.vn` (không có chân ở `TH957`) mở sơ đồ: người của bạn không ảnh, không quê quán, không liên hệ; người khác vẫn đủ (trừ liên hệ). ⚠ Người của bạn phải CÓ trong `TH957` thì mới thấy khác. Xong: bật lại hai trường, đặt lại cây mặc định như cũ |
| **b149** Nút Sao lưu (Cài đặt sơ đồ) | Ctrl+F5. Sơ đồ → ⚙ Cài đặt: có khối *Sao lưu & khôi phục*, nút *Mở Sao lưu (trang Quản trị)* → bấm → sang trang Quản trị, đang đứng ở tab **Sao lưu**. Đăng nhập `khach@io.vn` → ⚙ Cài đặt: KHÔNG có khối ấy |
| **b148** Giấu người còn sống *(hàng rào máy chủ đã đo REST 29/09, 7/7 — chỉ còn phần màn hình)* | `khach@io.vn` sẵn có vai Xem ở cây **Nguyễn Phúc Giáo** — khỏi mời. Đăng nhập `khach@io.vn` → mở cây ấy → bấm một người còn sống: trang chi tiết có dòng *"Người này còn sống nên máy chủ đã lược bớt…"* và không vỡ bố cục. *Quản trị → Gia phả →* cây ấy → *Danh sách người* → bấm tên một người còn sống → trang hồ sơ mở được, không báo "không có quyền xem" |
| **b146** Báo trùng + gộp | Ctrl+F5 → *Quản trị → Gia phả → chip Báo trùng người*: ô 1 gõ tên một người ở cây thử `TH957`, bấm chọn một dòng; ô 2 chọn một người trùng với họ ở `T388` (hoặc cùng cây); ghi lý do → *Gửi báo trùng* → hộp báo mã nào sẽ ở lại, bảng dưới có dòng "Chờ duyệt". Sang *Quản trị hệ thống → tab Báo trùng người* → *Duyệt (gộp)* → *Duyệt và gộp* → hộp "Đã gộp …". Mở sơ đồ cây của người bị gộp: chỉ còn một người, vợ/chồng + con của cả hai bản đều về người ấy. Tab *Nhật ký* có dòng "Gộp hai bản ghi người". ⚠ Chỉ thử trên hai cây thử — gộp KHÔNG hoàn tác được bằng nút |
| **b145** Công khai theo trường | Ctrl+F5 → *Quản trị hệ thống → Cây mặc định*: bảng có ô tích. Đặt cây thử `TH957` làm mặc định, tắt *Ngày tháng sinh cụ thể* + *Ảnh* → *Lưu*. Đăng nhập `khach@io.vn` (không có chân ở `TH957`) mở sơ đồ: thẻ người chỉ còn năm sinh, không ảnh. Đăng nhập lại bằng tài khoản của bạn: vẫn thấy đủ. *Nhật ký* có dòng "Đổi trường công khai cho khách". ⚠ Xong nhớ đặt lại cây mặc định như cũ |
| **b141** Tải ảnh | Ctrl+F5. Mở một người ở cây `TH957` → *Sửa* → khối Ảnh → thêm một tấm ảnh chụp điện thoại → *Lưu*. Đạt khi ảnh hiện trên ô sơ đồ, và bấm vào ảnh ở trang chi tiết thì ra bản lớn nét |
| **b140** Duyệt hàng loạt | *Quản trị → Kiểm duyệt*, tab *Đang chờ duyệt* (Ctrl+F5 trước). Cây thử `TH957`: sửa 2–3 lần bằng tài khoản thử để có dòng chờ. Tích hai dòng → thanh trên bảng ghi "Đã chọn 2 / n" → *Duyệt các dòng đã chọn* → *Duyệt chính thức* → hộp "Đã duyệt 2 / 2", hai dòng sang tab *Đã nhận chính thức*. Lặp với *Từ chối các dòng đã chọn* + một lý do → dữ liệu về như cũ, tab *Đã từ chối* hiện lý do ấy ở cả hai dòng. Đổi bộ lọc cây → các ô tích tự bỏ hết |
| **b139** Nhập GEDCOM bổ sung *(trước b151b thì CHẮC HỎNG — sổ nhập bị máy chủ từ chối; thử sau khi Ctrl+F5)* | Mở cây thử `TH957` → *Nhập GEDCOM/Excel* → chọn một file `.ged` có vài người CHƯA có trong cây → ghép đôi → *Ghi*. Đạt khi ghi xong không báo "Mã mới vừa cấp đã có bản ghi khác giữ", và người mới hiện trên sơ đồ |
| **b136** Lịch sử Kiểm duyệt | *Quản trị → Kiểm duyệt*, tab *Đã nhận chính thức*: hai cột cuối có người duyệt + lúc duyệt; tab *Đã từ chối & hoàn tác*: người từ chối + lý do. Lần Lưu tự duyệt (người tin cậy) có thể trống người duyệt — đúng, không phải lỗi |
| **b135** Huy hiệu (9.6) | *Quản trị → Gia phả*, chip *Tôi quản lý*: cây nào có nội dung chờ kiểm duyệt thì dưới tên có huy hiệu "n chờ kiểm duyệt", bấm sang Kiểm duyệt. Số trên nút *Kiểm duyệt* / *Gia phả* ở thanh trái nay CỘNG mọi cây bạn quản lý — đổi cây đang mở không làm số đổi |
| **b134** Nhật ký hệ thống | Đăng xuất → đăng nhập lại → *Quản trị hệ thống → Nhật ký*: phải thấy dòng **"Bắt đầu ghi nhật ký"** và dòng **"Đăng nhập"** của chính bạn. Bấm *Cấp quyền tạo cây* rồi *Thu hồi* cho `khach@io.vn` → hai dòng mới, người làm là bạn. Tích một dòng → *Xóa các dòng đã chọn* → sang tab *Thùng rác*, bảng cuối có một lô → *Phục hồi* → dòng về lại. Thẻ *Nhật ký hệ thống* ở *Tổng quan* ra số sự kiện 7 ngày |

---

## SQL — đã dán gì

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.
File thêm gì: đầu chính file ấy. Ngày dán: `git log`. Luật dán lại (file nào
kéo theo file nào, bản nào đứng cuối): **`so-tay/phan-quyen.md`** mục *Chuỗi
dán lại* — đọc TRƯỚC khi dán lại bất cứ file nào.

**`01` → `54` — ĐÃ DÁN lên THẬT cả, tự kiểm ĐẠT cả** (`54` ngày 29/09/2026).

⚠ **`55-mo-phien.sql` — CHỜ DÁN** (b157b). ĐƯỢC dán ngay, dán sau `53` (đã
có). Bàn thử `do-b157b.mjs` 20/20. Chưa dán thì app vẫn chạy (đường cũ) nhưng
mỗi lần mở tốn thêm một câu hỏi hụt.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

**Chưa đặt bước kế tiếp** — chọn từ *Sau đó* dưới đây, hoặc bấm thử mười tám
điểm dừng ở trên trước (ba điểm b151 trước tiên). ⚠ b145 và phần khách của
b150 Claude KHÔNG đo REST được: cần đặt cây mặc định = cờ Quản trị hệ thống,
hai tài khoản thử không có — phải bấm tay bằng tài khoản của bạn.

⚠ **b152 — ba điều Claude Code tự chốt thay (chủ dự án ngủ), chờ chủ dự án
xem lại**: ① vai `xem` thấy = nhóm NGƯỜI bật, KHÔNG giao với nhóm của CÂY (tab
*Cây mặc định* chỉ cho khách) · ② người còn sống: giao luật b148 với cài đặt
riêng — chặt hơn thắng · ③ người xem có quyền sửa ở cây khác chứa người ấy thì
thấy đủ (như b148). Muốn khác thì một chỗ ở `53`.

### Sau đó — chưa đặt số, chưa chốt

*(Trống. Tạo tài khoản qua email: chủ dự án HUỶ 29/09 — `so-tay/tao-tai-khoan.md`.)*

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — lời commit đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| ⚠ **`di-doi/sinh-sql-di-doi.mjs` lạc hậu từ `26`** — SQL nó sinh còn gắn `tree_id` vào bốn bảng dùng chung. Ba cây đã di dời xong nên chưa có việc; chạy sẽ lỗi to tiếng | đầu chính file ấy |
| Bảng cố ý CHƯA sao lưu: hai bảng nhật ký (`42`, tự có thùng rác 120 ngày) · `bao_trung_nguoi` (`48`, mất chỉ mất đơn đang chờ) · `ban_sao_luu_da_ghi` (`54`, sổ dấu vân tay). Muốn vào thì sửa `sao_luu_bang_he_thong()` + `SaoLuu.gs` cùng lúc | `kiem-thu/kiem-sao-luu.mjs` hằng `CHUA_SAO_LUU` |
| ⚠ **Bảng/cột mới mang MÃ NGƯỜI phải vào `gop_hai_nguoi()` mục 5** (`48`) — sót thì gộp để lại mã thua ở đó, im lặng | `so-tay/luu-du-lieu.md` đầu file |
| ⚠ **Hai hàm của `16` LỆCH NGHĨA với tên** (`xin_xoa_cay` ẩn cây NGAY; `huy_xin_xoa_cay` = trả lại cho chủ). Giữ tên cũ là cố ý; đổi tên là một bước riêng | `luoc-do/23-bon-luat-moi.sql` khối đầu |
| ⚠ **b106 chưa nghiệm thu bằng mắt**: gắn mã người · vai `sua` xem `pham_vi_sua()` đúng chưa | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **b127b chưa bấm thật**: thẻ người kéo sang `T388` phải đủ vợ/con | — |
| ⚠ **Ô gợi ý trên điện thoại thật chưa ai bấm lại** | `so-tay/o-goi-y.md` |
| ⚠ **b103 → b105 của Antigravity vẫn nằm NGOÀI repo**, trong `codex/`. Từng dán thử lên Staging nhưng Staging đã XOÁ 26/09 — nay chưa dán ở đâu cả, chưa rà kỹ, chưa đo | `PHOI-HOP-AI.md` |
| ⚠ **Bộ bất biến bố cục đang gác nhầm nhánh** — `import` từ `../giapha/js/` (đóng băng), nên sửa `supabase/js/domains/` nó vẫn xanh. `person.js` · `layout.js` · `gedcom.js` đã khác bản đóng băng (chủ dự án cho phép). Đo `layout.js` phải qua `--import ./sang-supabase.mjs` hoặc `kiem-buoc-80-sb.mjs` | `/kiem-tra` phép 9 · `so-tay/ve-so-do.md` |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| ⚠ **Vai `xem` đọc thẳng `tree_persons.doi` qua REST** — Đời của người tắt nhóm Đời vẫn lộ theo đường ấy (app không đi đường ấy, `53` khép ba đường kia). Đóng = giấu cả dòng `tree_persons`, đụng mọi chỗ hỏi "người này ở cây nào" | `luoc-do/53` đầu file · `so-tay/phan-quyen.md` |
| **Dọn ghi chú đầu file `person-edit.js`** (212 dòng, trần 30) — chủ dự án hoãn 29/09/2026. Tám file `pages/` khác sửa ở b153a cũng còn nợ (`do-gon.mjs --tat-ca`) | `QUY-TAC-GON.md` D1 |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| ⚠ **`tree_members.person_id` vẫn là cột chết từ b126** — `duyet_thanh_vien()` (đơn xin vào cây) vẫn GHI vào đó; không hàm đọc nào dùng nó nữa. Bỏ hẳn cột là một bước riêng | `so-tay/luu-mot-dong-quan-tri.md` |
| Repo vệ tinh `LeVanTrac` · `NguyenQuang` kẹt Pages từ 28/09 08:12 (push dồn → deploy giẫm nhau). Chủ dự án bảo **treo** — app chưa xong; lần push sau thường tự gỡ | `.github/workflows/dong-bo-sang-levantrac.yml` |
| Hai màn hình chưa mở được (bỏ chọn gia phả · quyền ảnh) | `KIEN-TRUC.md` mục 6 |
| Tháo giàn giáo `tuong-thich.js` — mốc **1 file** (`chon-gia-pha`), chỉ được giảm. Nối màn ấy (hoặc bỏ hẳn nút *Bỏ chọn*) là về 0, xoá file | `KIEN-TRUC.md` mục 4 |
| Đổi tên ba vết sẹo (`driveFileId` · `driveThumbUrl` · `tuong-thich`) | `KIEN-TRUC.md` mục 4 |
| Đợt 7 của phép tách `person-edit.js` — treo từ b48 | `BAT-DAU.md` mục 5 |
| **Ảnh: kho công khai hay kho kín?** Hiện công khai — đường dẫn khó đoán, nhưng *"khó đoán"* không phải *"được bảo vệ"*. Sao lưu ảnh không phụ thuộc câu trả lời | `KIEN-TRUC.md` mục 7 |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)* | `06-quyen-truc-he.sql` mục 2 |
