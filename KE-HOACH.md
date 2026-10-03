# KẾ HOẠCH — nhánh Supabase

*Cập nhật 30/09/2026 · Năm điểm dừng chưa bấm thử · SQL đã dán hết tới `67`.*

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

Không còn — b161a · b161e · b162a đạt 30/09/2026.

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

**`65` · `66` · `67` + `SaoLuu.gs` 0.12.0 — ĐÃ DÁN/THAY** 30/09/2026 (chủ
dự án báo tự kiểm đạt cả ba file). Bàn thử: `do-b166.mjs` 39/39.

⚠ Bản cuối mới: `xoa_cay()` · `tra_lai_cay()` ở `60` (tên cũ đã xoá); `don_mo_coi_he_thong()`
· `ds_nguoi_mo_coi()` · luật `xoa_anh` ở `61`; luật `xem_anh` + kho kín ở `59`.

---

## Việc kế tiếp — MỘT PHIÊN MỘT BƯỚC

Thứ tự theo **"đau nhất trước"**, cộng luật thứ hai: **việc nào đụng
`vai_tro()` thì đứng sau việc không đụng** — sai ở nền móng thì mọi thứ xây
bên trên sai theo, và không có gì báo lỗi. *(Định tuyến tài liệu: `CHI-DAN.md`.)*

Không còn việc mã nào đã chốt; việc
ở *Còn treo* đều cần chủ dự án quyết trước. ⚠ Đặt cây mặc định cần cờ Quản
trị hệ thống — hai tài khoản thử không có, phải bấm tay bằng tài khoản của bạn.
⚠ Bộ `chay-supabase.mjs` nằm ở `Claude_Code/kiem-thu/` (KHÔNG phải trong
`supabase/`): `node kiem-thu/chay-supabase.mjs`. Chạy TRỌN 30/09/2026 sau b165:
59/59 ĐẠT. Nếu lần sau dừng giữa chừng vì thiếu RAM: đóng bớt ứng dụng, chạy
tiền cảnh, đừng nâng trần bộ nhớ.

⚠ **b152 — ba điều Claude Code tự chốt thay (chủ dự án ngủ), chờ chủ dự án
xem lại**: ① vai `xem` thấy = nhóm NGƯỜI bật, KHÔNG giao với nhóm của CÂY (tab
*Cây mặc định* chỉ cho khách) · ② người còn sống: giao luật b148 với cài đặt
riêng — chặt hơn thắng · ③ người xem có quyền sửa ở cây khác chứa người ấy thì
thấy đủ (như b148). Muốn khác thì một chỗ ở `53`.

*(Chủ dự án bỏ 30/09: đổi tên `driveFileId`/`driveThumbUrl` · sửa `sinh-sql-di-doi.mjs` (cất vào `luu-tru/`) · xoá `branches`/`branch_access`
— bảng trống vô hại, xoá phải sửa sao lưu + khôi phục + gộp người. Tạo tài
khoản qua email: HUỶ 29/09 — `so-tay/tao-tai-khoan.md`.)*

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — lời commit đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| Bảng cố ý CHƯA sao lưu: `bao_trung_nguoi` (`48`, mất chỉ mất đơn đang chờ) · `ban_sao_luu_da_ghi` (`54`, sổ dấu vân tay — khôi phục không được xoá dấu của bản ghi sau). Nhật ký hệ thống đã vào từ b166 (`65`) nhưng khôi phục KHÔNG đổ lại — `so-tay/sao-luu.md` | `kiem-thu/kiem-sao-luu.mjs` hằng `CHUA_SAO_LUU` |
| ⚠ **Bảng/cột mới mang MÃ NGƯỜI phải vào `gop_hai_nguoi()` mục 5** (`48`) — sót thì gộp để lại mã thua ở đó, im lặng | `so-tay/luu-du-lieu.md` đầu file |
| ⚠ **b127b chưa bấm thật**: thẻ người kéo sang `T388` phải đủ vợ/con | — |
| **Cây đang mở bị xoá bằng `xoa_cay()` (`60`) ra màn lỗi chung** ("Không mở được gia phả…"), không ra màn "Gia phả này đã bị xoá" có tên cây — `tin_thung_rac()` không báo `daXoa`? Chưa đo. Không chặn: nút ⚙ ở màn khởi động (b161f) đã là lối thoát | `so-tay/mo-app.md` |
| Nợ ghi chú đầu file còn 14 khoản (nặng nhất `export-image.js` 140 dòng · `review.js` 99) — trả khi chạm tới file ấy, không đi rà riêng | `do-gon.mjs --tat-ca` · `QUY-TAC-GON.md` D1 |
| Repo vệ tinh `LeVanTrac` · `NguyenQuang` kẹt Pages từ 28/09 08:12 (push dồn → deploy giẫm nhau). Chủ dự án bảo **treo** — app chưa xong; lần push sau thường tự gỡ | `.github/workflows/dong-bo-sang-levantrac.yml` |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)*. GIỮ, không xoá (chủ dự án 30/09): trống, vô hại; sao lưu · khôi phục · `gop_hai_nguoi` còn nhắc tới | `06-quyen-truc-he.sql` mục 2 |
