# CHỈ DẪN — đọc file này đầu mỗi phiên

*Nhánh Supabase · cập nhật 22/09/2026 (b124a2)*

⚠ **TRẦN CỨNG 80 DÒNG · 8 KB · mỗi dòng ≤ 400 ký tự** — đo: `kiem-thu/do-gon.mjs`.
Vượt trần (file này hay `KE-HOACH.md`) thì **CẮT việc đã xong** — không dời
kế hoạch đang dùng sang file khác, **đừng nới trần**.

## Việc hôm nay → đọc file nào

| Sắp làm gì | Đọc |
|---|---|
| **Bất cứ việc gì** | `KE-HOACH.md` — đang ở đâu, việc kế tiếp |
| Mới vào nhánh này lần đầu | + `KIEN-TRUC.md` **cả file** |
| Đụng `services/` | `KIEN-TRUC.md` mục 1, 3 · `DU-LIEU.md` mục 1, 6 |
| Đổi lược đồ bảng, thêm/bớt trường | ⚠ `so-tay/luu-du-lieu.md` *(cột mới: BỐN chỗ)* · `DU-LIEU.md` · `luoc-do/` |
| **Mời vào cây · cờ QT hệ thống · khoá/xoá tài khoản · xoá gia phả** | ⚠⚠ **`so-tay/phan-quyen.md` trước tiên** · `THIET-KE-NHIEU-CAY.md` **11.4**+**11.8** *(vào cây cần HAI chữ ký; luật ấy ĐÃ TỪNG THỦNG ở bốn cửa, vá bằng `18`)* · **11.5** · **11.6** · **11.9** *(bốn luật mới)* · `luoc-do/14` · `16` · ⚠⚠ **`23-bon-luat-moi.sql`** *(bản ĐỨNG CUỐI: khoá mềm 60 ngày · QTHT hai chữ ký · cây ẩn NGAY khi chủ xoá · thùng rác 120 ngày · xin đổi quyền)* |
| **Ai tự duyệt đơn gắn mã** | ⚠⚠ `so-tay/phan-quyen.md` mục *Nới hẹp tự duyệt* · `luoc-do/29` ĐỨNG CUỐI 2 hàm |
| Đụng phân quyền, RLS | ⚠⚠ **`so-tay/phan-quyen.md` trước tiên** — nó nói hàm nào ĐỨNG CUỐI ở file nào, và cặp hàng rào phải đi liền nhau · `THIET-KE-NHIEU-CAY.md` **11.3** *(bảng 5 hạng)* · `DU-LIEU.md` mục 2 + **2a** + **2b** · `luoc-do/13` *(không tự đặt quyền cho mình)* · `11` ⚠ *(cờ quyền: CHỈ luật ĐỌC)* · `17` *(cờ `duoc_tao_cay`)* · `18` *(bốn cửa + `la_thanh_vien` · `ds_thanh_vien` · `ds_cho_duyet`)* · `20` *(`ds_tai_khoan_he_thong`)* · `21` *(đề xuất gắn mã người)* · ⚠⚠ **`23`** *(ĐỨNG CUỐI 13 hàm, gồm `la_quan_tri_he_thong` · `la_thanh_vien` · `co_the_xem_cay` · `co_the_sua` · `ds_gia_pha` — dán lại `11`/`14`/`16`/`18`/`20` thì PHẢI dán lại nó)* · `06` · `07` · `02-rls.sql` |
| **Ai là "quản trị"?** — trước khi gõ chữ ấy | ⚠ Ba hạng khác nhau: **Quản trị hệ thống** = cờ `tai_khoan` · **Chủ cây** = cột `trees.chu_so_huu` · **Quản trị gia phả** = `tree_members.role='quan_tri'`, **chỉ sửa + duyệt nội dung, KHÔNG đổi quyền**. Mã `quan_tri_he_thong` **không** đặt vào `tree_members` được nữa. ⚠ **Quyền DỰNG cây là hạng thứ tư** = cờ `tai_khoan.duoc_tao_cay`, **tách hẳn** khỏi ba hạng trên (b110b) |
| Đụng kiểm duyệt nội dung, hoàn tác | `luoc-do/08-kiem-duyet.sql` · `03-ham-luu-cay.sql` khối *chụp ảnh* · `kiem-thu/thu-hoan-tac.sql` · bảng TRƯỚC/SAU: `luoc-do/19-kiem-duyet-chi-tiet.sql` + `js/domains/so-sanh.js` (b111) |
| **Đụng nhiều cây · quyền cấp hệ thống · tạo cây · mã xuyên cây** | ⚠ `THIET-KE-NHIEU-CAY.md` **trước tiên** · ⚠⚠ kéo người/báo trùng/gộp giữa các cây **ĐÓNG BĂNG** — `so-tay/nguoi-xuyen-cay.md` |
| **Đụng trang `QuanTri.html` — bất cứ khu nào** | ⚠⚠ **`so-tay/trang-quan-tri.md` trước tiên** — giao diện = NGUYÊN FILE quantri3 dựng bằng máy (b118d), JS chỉ đổ dữ liệu vào section của mình, không vẽ lại; sổ tay ấy giữ mọi bẫy đã gặp (bản giả `sb-gia.mjs`, font, menu bị cắt) · `THIET-KE-QUAN-TRI.md` · `js/pages/quan-tri/` · ⚠ **nhìn bằng mắt trước khi báo xong**: `so-quantri3.mjs` *(so với prototype)* + `xem-khung-quan-tri.mjs` *(cảnh app riêng)*, cả hai ở `../kiem-thu/` · ⚠ **không màn hình nào ngầm định "cây đang mở"** — mọi chỗ gán quyền gọi tên cây (b110b); ngoại lệ duy nhất là hai cờ cấp tài khoản |
| Bàn thử SQL tại chỗ · phép ĐO hàng rào · tên/mã vai trò | `../kiem-thu/ban-thu-sql/` *(ngoài repo, CÓ trên máy này)* — `do-b102`→`do-b118b` ⚠ tiếng Việt vào psql phải đi bằng `-f`, không `-c` · tên vai: `config.js` hàm `vaiTroBangChu()` |
| Đụng **ô gợi ý** (bốn chỗ dùng chung `o-goi-y.js`) | ⚠ `so-tay/o-goi-y.md` — sáu cái bẫy, hai cái từng nuốt mất cú bấm |
| Duyệt/gắn tài khoản, hỏi "sao tôi không sửa được" | `HUONG-DAN-PHAN-QUYEN.md` |
| Đụng cách VẼ sơ đồ | `../tai-lieu/QUY-TAC-VE_V14.md` · `BAT-DAU.md` mục 6 |
| Đụng ảnh | `KIEN-TRUC.md` mục 7 ⚠ có câu chưa chốt |
| Đụng sao lưu, trigger Apps Script | `sao-luu/SaoLuu.gs` · `luoc-do/05-sao-luu.sql` · `kiem-thu/kiem-sao-luu.mjs` |
| Đụng di dời dữ liệu vào bảng | `di-doi/HUONG-DAN-DI-DOI.md` · `di-doi/sinh-sql-di-doi.mjs` |
| Thêm/nâng cấp thư viện | `js/vendor/DOC-VENDOR.md` — và **hỏi chủ dự án trước** |
| **Gặp lỗi / điều đáng chú ý** · dọn rác · ghi chú đầu file · phép 10 báo LỖI | `QUY-TAC-GON.md` mục 4–5 · `so-tay/` · đo: `node kiem-thu/do-gon.mjs` |
| Xuất/nhập GEDCOM, Excel | `../tai-lieu/CAU-TRUC-DU-LIEU_V06.md` mục *Ánh xạ GEDCOM* |
| Hướng dẫn chủ dự án bấm gì | `HUONG-DAN-DUNG-BANG.md` |
| Mở app tại chỗ, cài máy thứ hai, dùng `gh` | `../MAY-THU-HAI.md` *(ngoài repo)* |
| Muốn biết vì sao chuyển nhà | `BAT-DAU.md` (chứng cứ gốc, không sửa) |

**Đừng đọc cả thư mục.** Không mở mọi file `nhat-ky/` (lưu trữ) — tra bằng
`Grep`. Sửa file có dòng `Sổ tay:` thì đọc sổ tay ấy trước.

## Ba điều phải biết trước khi gõ dòng đầu tiên

1. **`domains/` không được sửa.** Cả mười file chép nguyên từ bản Apps Script.
   Thấy mình đang sửa `domains/` là dừng lại hỏi vì sao — `BAT-DAU.md` mục 1.
2. **Chỉ `services/sb.js` được chạm `window.supabase`.** Không file nào khác.
3. **Đã chạy thật, phân quyền đã đo bằng REST: 5/5 hàng rào đạt** (b94, b96).
   `KIEN-TRUC.md` mục 6: còn gì dở.
   ⚠ **File SQL nào đã dán, file nào chưa — hỏi `KE-HOACH.md`.** Không giữ
   bản thứ hai ở đây: nó đổi mỗi bước, và hai chỗ ghi là hai chỗ để lệch nhau.
   ⚠ **Chuỗi dán lại: `KE-HOACH.md` mục SQL giữ bản DUY NHẤT** *(bản thứ hai
   từng nằm ở đây, và nó đã lệch thật — 23/09 thêm `29` chỉ một bên)*. Quên một
   mắt xích là mở lại lỗ hổng cũ, **im lặng**.
   ⚠ **`drop function` XOÁ CẢ `grant`** — và hai luật dán lại nữa: cả ba ở
   `so-tay/phan-quyen.md`, mục *Luật chung*.

## Quy ước khung tài liệu này

- **Tên file CỐ ĐỊNH, không có `_Vxx`.** Lịch sử để git giữ. Muốn xem bản cũ
  thì `git log -p <file>`, đừng đẻ ra bản thứ hai.
- **Ghi theo CHỨC NĂNG, không theo phiên** (từ 15/09/2026): gặp lỗi thì ghi vào
  `so-tay/<chức-năng>.md` và xoá dấu vết ở các file đã thấy; việc từng phiên nằm
  ở lời commit. `nhat-ky/` là kho lưu trữ, không thêm, không sửa.

- ⚠ Mọi file thả vào `supabase/` **đều đi lên mạng**, và lịch sử git giữ lại
  cả bản đã xoá sau này. Hỏi câu ấy trước khi thêm file.
  *(Bảng so `supabase/` với `../tai-lieu/` ở `CLAUDE.md` mục 10 — mọi phiên
  đều đọc sẵn file ấy, giữ bản thứ hai ở đây là hai chỗ để lệch nhau.)*

## Lệnh

`/khoi-tao` mở phiên · `/kiem-tra` rà trước khi báo xong · `/ket-thuc` đóng phiên.
Không báo hoàn thành khi chưa chạy `/kiem-tra`.
