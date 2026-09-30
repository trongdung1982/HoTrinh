# KẾ HOẠCH — nhánh Supabase

*Cập nhật 30/09/2026 · Hai mươi bảy điểm dừng chưa bấm thử · SQL đã dán hết tới `63`.*

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
| **b162a** Thôi đọc cột gắn cũ *(`62` đã dán)* | Ctrl+F5. *Quản trị hệ thống → Tài khoản* → mở một tài khoản ĐÃ gắn người → *Mời vào gia phả* một cây họ chưa vào: mời được như cũ. Cây có đơn xin vào đang chờ → *Duyệt*: hộp KHÔNG còn ô "Mã người trong sơ đồ", duyệt xong người ấy vào cây. Khu *Tài khoản* → *Đề xuất gắn*: gõ tên một người đã có tài khoản giữ → dòng gợi ý mờ, ghi "đã gắn cho <email đúng người đang giữ>" |
| **b161a** Kho ảnh KÍN *(sau khi dán `59`)* | Ctrl+F5. Mở cây có ảnh (Nguyễn Phúc Giáo hoặc `TH957`): ảnh trên sơ đồ, thẻ chi tiết, bản lớn khi bấm ảnh vẫn hiện như cũ. Bấm phải một ảnh → *Mở ảnh trong thẻ mới* → địa chỉ có đoạn `token=` → xoá hết từ dấu `?` trở đi rồi Enter: trang báo lỗi, KHÔNG ra ảnh (đó là kho đã kín). ⚙ Cài đặt → *Xuất ảnh* PNG: ảnh người vẫn có trong file. *Quản trị hệ thống → Dữ liệu mồ côi → Quét*: cột ảnh xem trước hiện được |
| **b161e** Dọn thùng rác bởi người sửa thường | Ctrl+F5. Tài khoản thử `thu-h9@…` (vai *sửa*, không tự duyệt) mở cây thử `TH957` → xoá một người CÓ ẢNH trong trực hệ của mình → *Danh sách người* → *Thùng rác* → tích người ấy → *Xoá vĩnh viễn*: hộp báo "Đã gửi xoá vĩnh viễn…" + dòng "đang chờ người quản lý duyệt". Đăng nhập tài khoản của bạn → *Kiểm duyệt* → *Từ chối* dòng ấy → người về lại thùng rác, ảnh VẪN hiện |
| **b161d** Dọn cặp mồ côi *(sau khi dán `61`)* | Ctrl+F5 → *Quản trị hệ thống → Dữ liệu mồ côi → Quét*. Bảng *Người không thuộc cây nào*: người có vợ/chồng cũng ngoài mọi cây nay tích được (trước bị khoá); người có vợ/chồng còn trong một cây vẫn khoá, di chuột lên ô tích đọc lý do. Tích vài người → *Xoá vĩnh viễn*: hộp báo "Đã xoá n cặp không còn ai thuộc cây nào"; file thừa không còn báo "không xoá được". *Nhật ký* có dòng "… người · … cặp · … ảnh" |
| **b161c** Đổi tên hàm xoá / trả lại cây *(sau khi dán `60`)* | ⚠ Dùng cây thử, rồi trả lại. Ctrl+F5 → *Quản trị → Gia phả* → dòng cây thử `T388` → *Xoá* → gõ lý do → *Xoá ngay*: hộp báo xong, cây biến khỏi danh sách. *Quản trị hệ thống → Thùng rác* (hoặc chỗ liệt kê cây đang chờ) → dòng `T388` → *Trả lại* → cây về lại danh sách của bạn. *Nhật ký* có hai dòng tương ứng |
| **b161b** Bỏ nút *Quay về gia phả mặc định* | Ctrl+F5 → ⚙ Cài đặt → *Chọn gia phả*: danh sách cây hiện, bấm một cây khác → hộp hỏi → *Mở gia phả này* → tải lại vào cây ấy. KHÔNG có nút *Quay về gia phả mặc định*, KHÔNG có *Dữ liệu mới* |
| **b160** Bỏ ô Đời · nhập lại Bảng phẳng · Liên hệ qua GEDCOM | ⚠ Bước 3 DỰNG một gia phả thật — thử xong thì xoá. Ctrl+F5. ① Sơ đồ → mở một người → *Sửa*: KHÔNG còn ô *Đời thứ mấy*, khối ấy chỉ còn *Chi / nhánh*; sửa gì đó → *Lưu* → trang chi tiết vẫn hiện Đời như cũ. ② Cây thử `TH957` → *Danh sách người* → *Xuất Excel ▾* → *Bảng phẳng* → tải file. ③ ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn file vừa tải → bản xem trước ghi đúng số người, có dòng "Đọc theo khuôn Bảng phẳng…" → tên `Thu b160` → *Tạo gia phả mới và ghi vào đó*. Đạt khi sơ đồ `Thu b160` giống `TH957` (vợ chồng, con, thứ tự con). Xong: *Quản trị → Gia phả* → xoá `Thu b160`. ④ ⚙ Cài đặt → *Xuất GEDCOM* → bỏ dấu *Ẩn chi tiết người còn sống* → tải → mở bằng Notepad: người có số điện thoại có dòng `1 _LIENHE …` |
| **b159d Gỡ Chọn nhiều để xoá** | Ctrl+F5. Trang sơ đồ → *Danh sách người*: chân chỉ còn *Thùng rác (n)*, *Rà soát*, *Đóng* — KHÔNG còn *Chọn nhiều để xoá*. Cùng thế ở *Các gia đình* (Cài đặt). Bấm một dòng vẫn mở hồ sơ; *Thùng rác* vẫn chọn/khôi phục/xoá hẳn được như cũ |
| **Bảng tài khoản chờ xóa đã chuyển chỗ** | Ctrl+F5 → *Quản trị → Quản trị hệ thống → Sổ tài khoản*: bảng cuối trang không còn. Sang tab *Thùng rác*: bảng *Danh sách tài khoản chờ xóa (Lưu giữ 60 ngày)* nằm trên cùng, ghi "Chưa có ở máy chủ" (xoá mềm 60 ngày chưa làm — việc cũ b118b) |
| **Câu chữ Dọn thùng rác** | Ctrl+F5. Cây thử `TH957`: xoá một người có ảnh → *Danh sách người* → Thùng rác → tích người ấy → *Xoá vĩnh viễn…*: hộp nói *"… file ảnh bị xoá khỏi kho — chỉ còn ở bản sao lưu đêm"* và *"Không có bản sao lưu riêng cho lần dọn này…"* — KHÔNG còn chữ "thùng rác Drive 30 ngày" |
| **b152** Công khai theo từng người — cả vai Xem *(hàng rào máy chủ đã đo REST 29/09, 9/9 — chỉ còn phần màn hình)* | Ctrl+F5 → *Quản trị → Tài khoản* → bảng *Các gia phả tôi đang tham gia* → một dòng cây → cột *Thông tin công khai* → trang mười dòng mở ra, tắt/bật rồi *Lưu* không báo lỗi, tải lại thì còn đúng như vừa lưu |
| **Tông màu** (trang Quản trị) | Ctrl+F5 → *Quản trị* → thanh trái có nút **🎨 Tông màu** ngay trên *← Về trang sơ đồ* → bấm → bảng 10 tông mở sang phải nút → chọn *Đêm hoài cổ* → cả trang tối lại, chữ đọc được → tải lại trang (F5) → vẫn tông ấy. Chọn *Kem tối giản (mặc định)* → về y như cũ. Điện thoại: ☰ → *Tông màu* → bảng đứng giữa màn hình. **b153a — trang sơ đồ**: để tông *Đêm hoài cổ* → *← Về trang sơ đồ* → nền, nút tròn, Cài đặt, thẻ chi tiết, form Sửa, Danh sách người đều tối theo; ô người trên sơ đồ vẫn sáng (cố ý — không đổi `render.js`). Chọn lại *Kem tối giản* → trang sơ đồ y hệt trước |
| **Cột Nội dung thao tác** (Kiểm duyệt) | Ctrl+F5 → *Quản trị → Kiểm duyệt*: cột *Nội dung thao tác* đọc thành câu, không còn một chữ mỗi dòng. Tab *Đã từ chối & hoàn tác*: cột *Lý do từ chối* cũng vậy |
| **b151a** Nhập tạo gia phả mới | ⚠ Bước này DỰNG một gia phả thật trên máy chủ — thử xong thì xoá nó. Cần tài khoản được phép tạo cây. Ctrl+F5 → ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn `tai-lieu/My Family Tree.ged` → ô *Tên gia phả mới* gõ `Thu b151` → *Tạo gia phả mới và ghi vào đó*. Đạt khi: hộp báo ghi xong 6 người, KHÔNG báo "Mã mới vừa cấp đã có bản ghi khác giữ"; sơ đồ hiện đủ 6 người, 2 gia đình; *Danh sách người* cho thấy mã người là số lớn (không phải `P0001`…`P0006`). Xong: *Quản trị → Gia phả* → xoá `Thu b151` |
| **b151b** Nhập 681 người qua mạng thật | Sau b151a. Mở cây Nguyễn Phúc Giáo → ⚙ Cài đặt → *Xuất GEDCOM* → tải file về. Rồi *Nhập GEDCOM/Excel* → chọn file vừa tải → tên `Thu b151b` → *Tạo gia phả mới và ghi vào đó*. Đạt khi: báo ghi xong 681 người trong vài giây, sơ đồ mở được. Bàn thử đo 0,6–0,73 s; đây là phép duy nhất đo được đường mạng thật (gói ~624 KB). Xong: xoá `Thu b151b` |
| **b151c** Nhập Excel tạo gia phả mới | Sau b151a. ⚙ Cài đặt → *Nhập GEDCOM/Excel* → chọn file `Cay gia pha 17 doi cu Nguyen Phuc Giao (Pass VBA 12345).xlsb` (nằm trong thư mục `Claude_Code`) → bản xem trước ghi 681 người → tên `Thu b151c` → *Tạo gia phả mới và ghi vào đó*. Đạt khi báo ghi xong 681 người, sơ đồ mở được, cột Đời có số. Bàn thử đo 1,04 s. Xong: xoá `Thu b151c` |
| **b150 · b150b** Thông tin công khai của tôi + Liên hệ | Ctrl+F5. Sơ đồ → mở người của bạn → *Sửa* → khối *Cuộc đời* có ô **Liên hệ** → gõ số điện thoại → *Lưu* → trang chi tiết có hàng *Liên hệ* → *Danh sách người* → *Xuất Excel ▾* → file có cột *Liên hệ* sau *Dân tộc*. *Quản trị → Tài khoản* → bảng *Các gia phả tôi đang tham gia*: cột *Thông tin công khai* ghi "11 thông tin →" → bấm ở dòng cây thử `TH957` → trang MƯỜI MỘT dòng, giá trị của người bạn được gắn → tắt *Ảnh* + *Quê quán* → *Lưu thiết lập công khai*. *Quản trị hệ thống → Cây mặc định*: đặt `TH957` (tạm). Tab ấy nay có 10 nhóm, *Số điện thoại & Email liên hệ* mặc định TẮT. Đăng nhập tài khoản không có chân ở `TH957` (như b145 — ⚠ `khach@io.vn` CÓ chân ở đó) mở `TH957`: người của bạn không ảnh, không quê quán, không liên hệ; người khác vẫn đủ (trừ liên hệ). ⚠ Người của bạn phải CÓ trong `TH957` thì mới thấy khác. Xong: bật lại hai trường, đặt lại cây mặc định như cũ |
| **b149** Nút Sao lưu (Cài đặt sơ đồ) | Ctrl+F5. Sơ đồ → ⚙ Cài đặt: có khối *Sao lưu & khôi phục*, nút *Mở Sao lưu (trang Quản trị)* → bấm → sang trang Quản trị, đang đứng ở tab **Sao lưu**. Đăng nhập `khach@io.vn` → ⚙ Cài đặt: KHÔNG có khối ấy |
| **b148** Giấu người còn sống *(hàng rào máy chủ đã đo REST 29/09, 7/7 — chỉ còn phần màn hình)* | `khach@io.vn` sẵn có vai Xem ở cây **Nguyễn Phúc Giáo** — khỏi mời. Đăng nhập `khach@io.vn` → mở cây ấy → bấm một người còn sống: trang chi tiết có dòng *"Người này còn sống nên máy chủ đã lược bớt…"* và không vỡ bố cục. *Quản trị → Gia phả →* cây ấy → *Danh sách người* → bấm tên một người còn sống → trang hồ sơ mở được, không báo "không có quyền xem" |
| **b146** Báo trùng + gộp | Ctrl+F5 → *Quản trị → Gia phả → chip Báo trùng người*: ô 1 gõ tên một người ở cây thử `TH957`, bấm chọn một dòng; ô 2 chọn một người trùng với họ ở `T388` (hoặc cùng cây); ghi lý do → *Gửi báo trùng* → hộp báo mã nào sẽ ở lại, bảng dưới có dòng "Chờ duyệt". Sang *Quản trị hệ thống → tab Báo trùng người* → *Duyệt (gộp)* → *Duyệt và gộp* → hộp "Đã gộp …". Mở sơ đồ cây của người bị gộp: chỉ còn một người, vợ/chồng + con của cả hai bản đều về người ấy. Tab *Nhật ký* có dòng "Gộp hai bản ghi người". ⚠ Chỉ thử trên hai cây thử — gộp KHÔNG hoàn tác được bằng nút |
| **b145** Công khai theo trường *(sau khi dán `64` + dán lại `55` — lần thử 30/09 vấp "new row violates row-level security policy for table user_settings", vá ở b145c)* | Ctrl+F5 → *Quản trị hệ thống → Cây mặc định*: bảng có ô tích. Đặt cây thử `TH957` làm mặc định, tắt *Ngày tháng sinh cụ thể* + *Ảnh* → *Lưu*. Đăng nhập tài khoản chỉ có chân ở cây Nguyễn Phúc Giáo (tài khoản bạn đưa 30/09 — ⚠ KHÔNG phải `khach@io.vn` hay `thu-h9`, hai tài khoản ấy đều có chân ở `TH957`) → ⚙ Cài đặt → *Chọn gia phả* → `TH957` → *Mở gia phả này*: KHÔNG báo lỗi, tải lại vào `TH957`, không có nút Sửa. Sơ đồ: thẻ người chỉ còn năm sinh, không ảnh. Đăng nhập lại bằng tài khoản của bạn: vẫn thấy đủ. *Nhật ký* có dòng "Đổi trường công khai cho khách". Cuối cùng tài khoản ấy chọn lại cây Nguyễn Phúc Giáo → về được. ⚠ Xong nhớ đặt lại cây mặc định như cũ |

---

## SQL — đã dán gì

**Đây là chỗ DUY NHẤT ghi trạng thái dán** — hai chỗ ghi là hai chỗ để lệch nhau.
File thêm gì: đầu chính file ấy. Ngày dán: `git log`. Luật dán lại (file nào
kéo theo file nào, bản nào đứng cuối): **`so-tay/phan-quyen.md`** mục *Chuỗi
dán lại* — đọc TRƯỚC khi dán lại bất cứ file nào.

**`01` → `61` — ĐÃ DÁN lên THẬT cả** (`59` · `60` · `61` ngày 30/09/2026, chủ dự án báo).

**`62` — ĐÃ DÁN** 30/09/2026 (chủ dự án chạy câu kiểm chỉ-đọc: đủ 8/8). ⚠
Màn hình SQL Editor báo *"relation public does not exist"* dù file đã vào —
lỗi giả, `so-tay/phan-quyen.md` Luật chung.

**`63` — ĐÃ DÁN** 30/09/2026 (tự kiểm 2/2; REST: cột đã mất). ⚠ Mọi bản
sao lưu chụp trước `63` thôi khôi phục được — chủ dự án chốt bỏ.

**`64` — CHƯA DÁN** (b145c, bàn thử `do-b145c.mjs` 26/26). Dán `64` rồi
**dán lại `55`** (bản 0.2.0 — `mo_phien` mở cây mặc định cho người có chân cây
khác). Thứ tự hai file không quan trọng; thiếu một trong hai thì lỗi b145 còn.

⚠ Bản cuối mới: `xoa_cay()` · `tra_lai_cay()` ở `60` (tên cũ đã xoá); `don_mo_coi_he_thong()`
· `ds_nguoi_mo_coi()` · luật `xoa_anh` ở `61`; luật `xem_anh` + kho kín ở `59`.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

Bấm thử các điểm dừng ở trên (ba điểm b151 và b161a–e trước tiên — `59`/`60`/`61`
đã dán 30/09). Việc mã còn lại
ở *Còn treo* đều cần chủ dự án quyết trước. ⚠ Đặt cây mặc định cần cờ Quản
trị hệ thống — hai tài khoản thử không có, phải bấm tay bằng tài khoản của bạn.

⚠ **b152 — ba điều Claude Code tự chốt thay (chủ dự án ngủ), chờ chủ dự án
xem lại**: ① vai `xem` thấy = nhóm NGƯỜI bật, KHÔNG giao với nhóm của CÂY (tab
*Cây mặc định* chỉ cho khách) · ② người còn sống: giao luật b148 với cài đặt
riêng — chặt hơn thắng · ③ người xem có quyền sửa ở cây khác chứa người ấy thì
thấy đủ (như b148). Muốn khác thì một chỗ ở `53`.

### Việc mã đã chốt (30/09/2026) — theo thứ tự

1. **Sau cùng mọi việc:** đưa hai bảng nhật ký vào sao lưu (xem *Còn treo*).

*(Chủ dự án bỏ 30/09: đổi tên `driveFileId`/`driveThumbUrl` · sửa `sinh-sql-di-doi.mjs` (cất vào `luu-tru/`) · xoá `branches`/`branch_access`
— bảng trống vô hại, xoá phải sửa sao lưu + khôi phục + gộp người. Tạo tài
khoản qua email: HUỶ 29/09 — `so-tay/tao-tai-khoan.md`.)*

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — lời commit đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| **(Làm SAU CÙNG mọi việc — chủ dự án 30/09)** Bảng cố ý CHƯA sao lưu: hai bảng nhật ký (`42`, tự có thùng rác 120 ngày) · `bao_trung_nguoi` (`48`, mất chỉ mất đơn đang chờ) · `ban_sao_luu_da_ghi` (`54`, sổ dấu vân tay). Muốn vào thì sửa `sao_luu_bang_he_thong()` + `SaoLuu.gs` cùng lúc | `kiem-thu/kiem-sao-luu.mjs` hằng `CHUA_SAO_LUU` |
| ⚠ **Bảng/cột mới mang MÃ NGƯỜI phải vào `gop_hai_nguoi()` mục 5** (`48`) — sót thì gộp để lại mã thua ở đó, im lặng | `so-tay/luu-du-lieu.md` đầu file |
| ⚠ **b106 chưa nghiệm thu bằng mắt**: gắn mã người · vai `sua` xem `pham_vi_sua()` đúng chưa | `nhat-ky/b106-khu-tai-khoan.md` |
| ⚠ **b127b chưa bấm thật**: thẻ người kéo sang `T388` phải đủ vợ/con | — |
| ⚠ **Ô gợi ý trên điện thoại thật chưa ai bấm lại** | `so-tay/o-goi-y.md` |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| Nợ ghi chú đầu file còn 14 khoản (nặng nhất `export-image.js` 140 dòng · `review.js` 99) — trả khi chạm tới file ấy, không đi rà riêng | `do-gon.mjs --tat-ca` · `QUY-TAC-GON.md` D1 |
| Nút Cũ/Mới + `datMoiKhoi()` cũ: **CHỈ gỡ khi chủ dự án yêu cầu** | `so-tay/ve-so-do.md` |
| Repo vệ tinh `LeVanTrac` · `NguyenQuang` kẹt Pages từ 28/09 08:12 (push dồn → deploy giẫm nhau). Chủ dự án bảo **treo** — app chưa xong; lần push sau thường tự gỡ | `.github/workflows/dong-bo-sang-levantrac.yml` |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)*. GIỮ, không xoá (chủ dự án 30/09): trống, vô hại; sao lưu · khôi phục · `gop_hai_nguoi` còn nhắc tới | `06-quyen-truc-he.sql` mục 2 |
