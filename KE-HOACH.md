# KẾ HOẠCH — nhánh Supabase

*Cập nhật 30/09/2026 · Sáu điểm dừng chưa bấm thử · SQL đã dán hết tới `64`.*

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
| **1c** Chế độ vẽ CHỈ CHỮ | Ctrl+F5 → nút mờ **Ảnh** dưới 🔍 → bấm, nút đổi thành **Chữ**, sơ đồ vẽ lại: không ảnh, không nốt cụt, ô có khung viền mờ; hàng đông người nhất chữ dọc (đọc từ trên xuống), hàng thưa chữ ngang; chữ căn giữa. Bấm một ô vẫn mở như cũ. ⚙ bật *Ngày giỗ* → ô có giỗ thêm dòng "Giỗ: …", ô không có giỗ vẫn căn giữa. Bấm **Chữ** → về **Ảnh** như trước; tải lại trang vẫn nhớ chế độ đã chọn |
| **Cột Nội dung thao tác** (Kiểm duyệt) | Ctrl+F5 → *Quản trị → Kiểm duyệt*: cột *Nội dung thao tác* đọc thành câu, không còn một chữ mỗi dòng. Tab *Đã từ chối & hoàn tác*: cột *Lý do từ chối* cũng vậy |

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

**`64` + `55` 0.2.0 — ĐÃ DÁN** 30/09/2026 (chủ dự án báo đạt; b145 bấm thử đạt).

⚠ Bản cuối mới: `xoa_cay()` · `tra_lai_cay()` ở `60` (tên cũ đã xoá); `don_mo_coi_he_thong()`
· `ds_nguoi_mo_coi()` · luật `xoa_anh` ở `61`; luật `xem_anh` + kho kín ở `59`.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

Bấm thử sáu điểm dừng ở trên (1c · b161a · b161d · b161e · b162a — `59`/`61`/`62`
đã dán 30/09). Việc mã còn lại
ở *Còn treo* đều cần chủ dự án quyết trước. ⚠ Đặt cây mặc định cần cờ Quản
trị hệ thống — hai tài khoản thử không có, phải bấm tay bằng tài khoản của bạn.

⚠ **b152 — ba điều Claude Code tự chốt thay (chủ dự án ngủ), chờ chủ dự án
xem lại**: ① vai `xem` thấy = nhóm NGƯỜI bật, KHÔNG giao với nhóm của CÂY (tab
*Cây mặc định* chỉ cho khách) · ② người còn sống: giao luật b148 với cài đặt
riêng — chặt hơn thắng · ③ người xem có quyền sửa ở cây khác chứa người ấy thì
thấy đủ (như b148). Muốn khác thì một chỗ ở `53`.

### Việc mã đã chốt (30/09/2026) — theo thứ tự

1. **Chế độ vẽ CHỈ CHỮ** (chủ dự án yêu cầu 30/09, đồng ý chia bốn bước).
   Nút mờ dưới 🔍 (chỗ nút Cũ/Mới cũ) đổi **Ảnh ↔ Chữ**. Ô chữ chỉ có tên +
   năm sinh–năm mất, không ảnh. **Hàng đông người nhất chữ QUAY DỌC**; hàng
   khác đủ rộng thì chữ ngang, không đủ thì dọc. Cao mỗi hàng tính theo chữ
   thật để bớt khoảng trắng. Dùng lại kỹ thuật BA KHỐI, không viết cách xếp
   thứ hai. Luật đã chốt: `so-tay/ve-so-do.md` mục *Chế độ CHỈ CHỮ*. Bộ
   xếp + vẽ + nút Ảnh/Chữ đã có (1c, chờ bấm thử — bảng trên). Còn:
   - **1d** Xuất ảnh/PDF + thẻ chi tiết ở chế độ Chữ.
2. **Sau cùng mọi việc:** đưa hai bảng nhật ký vào sao lưu (xem *Còn treo*).

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
| **Cây đang mở bị xoá bằng `xoa_cay()` (`60`) ra màn lỗi chung** ("Không mở được gia phả…"), không ra màn "Gia phả này đã bị xoá" có tên cây — `tin_thung_rac()` không báo `daXoa`? Chưa đo. Không chặn: nút ⚙ ở màn khởi động (b161f) đã là lối thoát | `so-tay/mo-app.md` |
| ⚠ **Ô gợi ý trên điện thoại thật chưa ai bấm lại** | `so-tay/o-goi-y.md` |
| ⚠ **Dữ liệu cây 681 nghi ghi nhầm**: U0180 cho Hạt, Thu là con bà Hồi mà hai cô lấy con trai bà (U0108, U0109) — chờ chủ dự án xem | `so-tay/ve-so-do.md` |
| Nợ ghi chú đầu file còn 14 khoản (nặng nhất `export-image.js` 140 dòng · `review.js` 99) — trả khi chạm tới file ấy, không đi rà riêng | `do-gon.mjs --tat-ca` · `QUY-TAC-GON.md` D1 |
| Repo vệ tinh `LeVanTrac` · `NguyenQuang` kẹt Pages từ 28/09 08:12 (push dồn → deploy giẫm nhau). Chủ dự án bảo **treo** — app chưa xong; lần push sau thường tự gỡ | `.github/workflows/dong-bo-sang-levantrac.yml` |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)*. GIỮ, không xoá (chủ dự án 30/09): trống, vô hại; sao lưu · khôi phục · `gop_hai_nguoi` còn nhắc tới | `06-quyen-truc-he.sql` mục 2 |
