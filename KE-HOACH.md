# KẾ HOẠCH — nhánh Supabase

*Cập nhật 03/10/2026 · Không điểm dừng nào chưa bấm thử · SQL đã dán hết tới `67` · kế tiếp: đóng gói bộ cài — b170 (SQL một file b169 đã xong).*

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

**ĐÓNG GÓI BỘ CÀI ĐẶT để bàn giao** (chủ dự án chốt 03/10/2026): file trong bộ
cài XOÁ hết ghi chú quá trình phát triển. ⚠ Bộ cài là thư mục/bản RA RIÊNG —
repo `supabase/` giữ nguyên ghi chú để tiếp tục phát triển. Sổ tay:
**`so-tay/dong-goi.md`** — SQL một file `ban-giao/cai-dat.sql` đã có (b169),
sinh bằng máy; thêm `luoc-do/68…` thì chạy lại hai công cụ ghi ở đó.

2. **b170 — lột ghi chú JS/HTML/CSS ra thư mục bàn giao** (Claude viết công
   cụ; ⚠ phải hiểu chuỗi · regex · template literal, lột hỏng là app chết im
   lặng) → chạy `chay-supabase.mjs` trỏ vào BẢN ĐÃ LỘT, phải ra như bản gốc.
   Bỏ: `kiem-thu/` · `so-tay/` · `nhat-ky/` · `luu-tru/` · tài liệu dev · CNAME
   · workflow vệ tinh · dữ liệu mẫu.
3. **b171 — hướng dẫn cài + hướng dẫn sử dụng cho người nhận** (giao AGY
   được): tạo dự án Supabase, dán `cai-dat.sql` (kho ảnh đã nằm trong file),
   sửa `cau-hinh.js`, bật Pages, tài khoản QTHT đầu tiên, máy sao lưu
   (`SaoLuu.gs`). Claude rà lại bằng cách cài thử theo đúng chữ **trên một dự
   án Supabase MỚI thật** — ba thứ bàn thử không đo được: `so-tay/dong-goi.md`
   mục cuối.

**Chốt 03/10/2026:** người nhận **TỰ CÀI** · giao bằng **file zip** kèm
**hướng dẫn cài** VÀ **hướng dẫn sử dụng** (b171 thêm phần sử dụng).

⚠ Đặt cây mặc định cần cờ Quản
trị hệ thống — hai tài khoản thử không có, phải bấm tay bằng tài khoản của bạn.
⚠ Bộ `chay-supabase.mjs` nằm ở `Claude_Code/kiem-thu/` (KHÔNG phải trong
`supabase/`): `node kiem-thu/chay-supabase.mjs`. Chạy TRỌN 03/10/2026 sau b168:
58/59 — `kiem-xuat-anh-dpi` báo "chưa chạy", chạy riêng
(`node --import ./kiem-thu/sang-supabase.mjs kiem-thu/kiem-xuat-anh-dpi.mjs`)
thì ĐẠT trọn: máy quá tải giữa chuỗi bài Chrome. Đóng bớt ứng dụng, đừng nâng
trần bộ nhớ.

*(Chủ dự án bỏ 30/09: đổi tên `driveFileId`/`driveThumbUrl` · sửa `sinh-sql-di-doi.mjs` (cất vào `luu-tru/`) · xoá `branches`/`branch_access`
— bảng trống vô hại, xoá phải sửa sao lưu + khôi phục + gộp người. Tạo tài
khoản qua email: HUỶ 29/09 — `so-tay/tao-tai-khoan.md`.)*

---

## Còn treo — không chặn gì, nhưng đừng quên

*Việc đã đóng thì **xoá khỏi bảng**, đừng gạch ngang giữ lại — lời commit đã
là chứng cứ. Đếm lại bằng số dòng mỗi lần `/ket-thuc`, đừng chép số lần trước.*

| Việc | Ghi ở đâu |
|---|---|
| **`anon` gọi được `duyet_thanh_vien`** — máy thật cũng thế (REST 03/10/2026); hàm tự từ chối, không lọt. Dòng tự kiểm cuối của `62` vì thế báo HỎNG. Vá = file `68` revoke `anon`, rồi đóng gói lại | `so-tay/dong-goi.md` |
| **`branches` / `branch_access` dựng từ `01-bang.sql` nay KHÔNG dùng** — luật đi theo trực hệ, không chia chi *(chốt 04/09/2026)*. GIỮ, không xoá (chủ dự án 30/09): trống, vô hại; sao lưu · khôi phục · `gop_hai_nguoi` còn nhắc tới | `06-quyen-truc-he.sql` mục 2 |
