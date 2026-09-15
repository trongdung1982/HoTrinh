# b116 — quantri3: khu Gia phả

*15/09/2026 · Claude Code CLI (Sonnet 5)*

---

## Làm được gì

- **Bốn chip** thay bảng phẳng duy nhất của khu Gia phả: *Tôi quản lý · Tôi
  là thành viên · Có thể xin vào · Tạo gia phả mới* — đúng prototype
  quantri3. Ba chip đầu lọc CÙNG một `ds` đã đọc một lần rồi vẽ lại đúng
  `veBang()`/`veDong()` cũ — không viết bảng thứ hai, không đổi một dòng
  logic Mời/Xoá/công tắc/Nhận-Từ chối đã có. Chip *Tạo gia phả mới* thay
  nút+modal cũ bằng form ngay trong chip.
- **Tên cây trong bảng** nay là liên kết `.qt-lk` sang trang chi tiết
  `#gia-pha/cay/<mã>` (b115 đã dựng khung, chưa có đường bấm vào).
- **Trang chi tiết một cây điền thật** ba mục còn `hienNay`: *Thành viên &
  quyền · Lời mời · Đơn xin vào* — dùng lại NGUYÊN VẸN `veBang()` của
  `khu-thanh-vien.js` (xuất ra thêm), chỉ lọc `ds` theo `trangThaiDong()`
  trước khi vẽ. Mục *Đề xuất gắn người* vẫn `hienNay`, để nguyên cho b117.
- **Mục Vòng đời mới** — nghĩa chốt với chủ dự án 15/09/2026: *Bàn giao chủ*
  (dùng `doiChuCay`, gợi ý tài khoản bằng `o-goi-y.js`) + *Xoá gia phả*
  (dùng `xinXoaCay`/`huyXinXoaCay`/`duyetXoaCay` đã có, không hàm mới).
- **Nhóm C — `luoc-do/22-rut-don-roi-cay.sql`**: `rut_don_xin_vao(p_tree)` —
  rút đơn xin vào của chính mình (không đụng lời mời); `roi_cay(p_tree)` —
  rời khỏi một gia phả đã là thành viên, tự chặn chủ cây. Cả hai là hàm MỚI:
  đối xứng "giả" với `tu_choi_loi_moi()` (chỉ xoá lời mời) và `go_thanh_vien()`
  (cố ý chặn tự gỡ) — không hàm cũ nào làm được việc này.
- Cột *Cây làm việc* thêm nút **Rút đơn** (trên dòng đã nộp đơn) và **Rời
  khỏi gia phả** (thành viên đã duyệt, không phải chủ) — hỏi rồi mới làm,
  đúng luật chung của khu.

File: `js/pages/quan-tri/khu-gia-pha.js` 0.8.0 · `khu-thanh-vien.js` 0.12.0
(chỉ xuất `veBang`) · `trang-cay.js` 0.2.0 · `js/services/sb.js` 0.19.0 ·
`quan-tri.css` 0.3.0 · **mới** `luoc-do/22-rut-don-roi-cay.sql` · ngoài repo:
`kiem-thu/sb-gia.mjs` 0.9.0 · `kiem-thu/xem-khung-quan-tri.mjs` thêm
kq-31 → kq-36 · `kiem-thu/ban-thu-sql/do-b116.mjs` mới.

## Vì sao làm thế

**Vì sao bốn chip không viết bảng thứ hai.** `ds_gia_pha()` đã trả đủ bốn
câu trả lời máy chủ tính sẵn (`toiLaChu` · `vaiCuaToi` · `duocMoi` ·
`daNopDon`) cho MỌI cây trong một lần gọi. Ba chip chỉ là ba cách BỌC lại
cùng tập ấy — `veDong()`/`veOThaoTac()` đã tự thích ứng theo từng cờ trên
từng dòng từ lâu (nguyên tắc "ẩn cột không phải hàng rào" đã dùng khắp file).
Viết ba bảng riêng là chép ba lần cùng một logic Mời/Xoá/Nhận-Từ chối đã qua
nhiều lần vá lỗi thật (14/09, 10/09…) — mỗi bản chép là một chỗ để quên vá.

**Vì sao ba mục của trang cây dùng lại `veBang()` của khu Tài khoản, không
viết mới.** Cùng lý lẽ trên, ở tầng khác: `khu-thanh-vien.js` đã có sẵn một
bảng "tài khoản của MỘT cây" với đủ năm việc đổi quyền và luật khoá nút trên
dòng lời mời (`trangThaiDong()`). Ba mục của trang cây chỉ khác khu Tài
khoản đúng MỘT chỗ — chúng không có ô chọn cây hay tấm lọc *Toàn hệ thống*,
vì cây đã biết trước từ địa chỉ. Xuất `veBang()` ra rồi gọi với `ds` đã lọc
là đủ; viết bảng thứ hai là dựng chỗ thứ hai để năm việc ấy lệch nhau.

**Vì sao mục Vòng đời không gọi `xin_xoa_cay`/`doi_chu_cay` trực tiếp bằng
mã mới, mà viết vỏ mới quanh hàm cũ.** Hai việc ấy MÁY CHỦ đã có sẵn — cái
thiếu chỉ là MỘT CHỖ ĐỨNG trên màn hình. Viết hàm SQL mới là giải quyết một
vấn đề không tồn tại.

**Vì sao `rut_don_xin_vao`/`roi_cay` là hàm MỚI, không phải sửa hàm cũ.**
Kiểm lại kỹ trước khi viết (đúng bài học "danh sách 56 hàm của `sb.js`
không phải danh sách hàm máy chủ" — `THIET-KE-QUAN-TRI.md` 9.5): tưởng như
đối xứng với `tu_choi_loi_moi()`/`go_thanh_vien()` nhưng cả hai đối xứng đều
sai khi đọc lại thân hàm — `tu_choi_loi_moi()` chỉ xoá dòng `moi_luc is not
null`, và `go_thanh_vien()` **cố ý** từ chối `la_chinh_minh(p_user)`, đúng
cái mình cần làm ngược lại.

**Vì sao `roi_cay()` chỉ chặn CHỦ CÂY, không chặn `quan_tri` được phong.**
Chủ dự án chỉ dặn chặn chủ cây (bàn giao trước b116). `trees.chu_so_huu`
không rỗng được kiểu "không có ai" (một cây luôn phải có đúng một chủ);
`tree_members` thì một dòng xoá đi là hết dòng, không để lại trạng thái dở
dang nào. Quản trị gia phả muốn nghỉ thì nghỉ được ngay, không cần ai gỡ hộ.

**Vì sao chip *Tạo gia phả mới* đổi từ modal sang form ngay trong chip.**
Khớp đúng prototype (section vẽ hộp nhập thẳng, không lớp phủ) — và một khi
đã có bốn chip thì "Tạo gia phả mới" tự nhiên là MỘT trong bốn chỗ đứng,
không cần một nút nổi riêng phía trên bảng nữa.

## Đã thử mà hỏng

Không có vòng hỏng ở mã JavaScript. Ở SQL, bản đầu của `roi_cay()` định
hỏi *`la_thanh_vien()`* để xác nhận "đã là thành viên" — đổi lại thành đọc
thẳng `role`/`approved` từ `tree_members`: `la_thanh_vien()` còn trả `true`
cho `quan_tri_he_thong`/`sao_luu` qua đường tắt (`11` mục 9), tức một Quản
trị hệ thống KHÔNG có chân thật ở cây ấy vẫn "rời" được một dòng không tồn
tại — không phải lỗ hổng dữ liệu (không có dòng để xoá), nhưng câu trả lời
sẽ sai (`ok:true` cho một việc chẳng xảy ra gì). Bắt được lúc viết bàn thử
Q7/Q8, chưa kịp chạy đã thấy đường suy luận sai.

## Đã kiểm

- **SQL — bàn thử tại chỗ (cổng 5433):** `kiem-thu/ban-thu-sql/do-b116.mjs`,
  chuỗi 13→14→15→16→17→18→20→21→22 dán được kể cả dán lại lần hai; **27/27
  ĐẠT** — rút đơn (có/không có đơn/đơn là lời mời), rời cây (chủ bị chặn ·
  thành viên rời được · quản trị được phong rời được · chưa duyệt bị chặn ·
  `sao_luu` bị chặn), `anon` không gọi được cả hai hàm.
- `supabase/kiem-thu/kiem-trang-quan-tri.mjs` **258/258** — hai phép PHẦN L
  từ b115 đã lỗi thời (đòi trang cây chỉ nạp đúng một cửa `sb.js`), đính
  chính lại đúng luật 5a thật (không đọc `phien.treeId`), xem mục Đính
  chính. Mười bộ kiểm Node còn lại trong `supabase/kiem-thu/` chạy lại, đều
  đạt (tổng cộng khớp số trước b116, không phép nào bị ảnh hưởng).
- `/kiem-tra` đạt cả 9 phép; `domains/` 10/10 file giống bản đóng băng (file
  thứ 11, `so-sanh.js`, là file riêng của nhánh Supabase từ b111, không phải
  điều mới của bước này).
- **Nhìn bằng mắt** — `xem-khung-quan-tri.mjs` chụp lại toàn bộ 37 ảnh
  (kq-0 → kq-36), gồm sáu cảnh mới của b116: bốn chip (kq-0 mặc định · kq-31
  · kq-32 · kq-33) và hai mục trang cây (kq-34 Thành viên & quyền · kq-35
  Vòng đời), cộng kq-36 (mục Lời mời, đúng cảnh "khoá sẵn, không nút" đã
  chốt từ b110c). Cả sáu đúng như định vẽ; nút *Rời khỏi gia phả*/*Rút đơn*
  hiện đúng dòng, form *Tạo gia phả mới* không còn lớp phủ.

**Chưa kiểm:** chưa ai bấm thử trên máy chủ thật (Nhận/Từ chối lời mời bằng
tài khoản Quản trị hệ thống — điểm dừng của bước này — chỉ đo được là mã
KHÔNG đổi, vì `veKhoiNhanTuChoi()`/nhánh `c.duocMoi` của `veOThaoTac()`
không bị chạm một dòng nào trong cả bước; đo bằng mắt qua kq-22 cũ và bằng
đọc mã, chưa bấm thử thật). Huy hiệu đếm trong thanh mục con vẫn treo.

## Còn treo

- Mục *Đề xuất gắn người* của trang cây vẫn `hienNay` — b117.
- Huy hiệu đếm trong thanh mục con (*Đơn xin vào ①*…) — đẩy sang sau b116.
- Nhóm D (SQL bốn luật mới, đụng nền móng quyền) — b118b, đúng thứ tự đã
  định *"việc đụng vai đứng sau việc không đụng"*.
- Chưa ai bấm thử trên máy chủ thật.

## File đã đụng

- **Mới:** `luoc-do/22-rut-don-roi-cay.sql` · `nhat-ky/b116-khu-gia-pha.md` ·
  ngoài repo: `kiem-thu/ban-thu-sql/do-b116.mjs`
- **Sửa:** `js/pages/quan-tri/khu-gia-pha.js` · `js/pages/quan-tri/khu-thanh-vien.js` ·
  `js/pages/quan-tri/trang-cay.js` · `js/services/sb.js` · `quan-tri.css` ·
  `THIET-KE-QUAN-TRI.md` · `KE-HOACH.md` · `nhat-ky/INDEX.md` ·
  `kiem-thu/kiem-trang-quan-tri.mjs` (đính chính hai phép lỗi thời) ·
  ngoài repo: `kiem-thu/sb-gia.mjs` · `kiem-thu/xem-khung-quan-tri.mjs`
- **Chép nguyên / xoá:** `veHangTao()`/`veHopTaoCay()`/`veDaDung()` của
  `khu-gia-pha.js` xoá hẳn, thay bằng `veTamTaoMoi()`/`veTaoXong()`

## Đính chính

`kiem-thu/kiem-trang-quan-tri.mjs` 0.7.0 (b115) có hai phép PHẦN L đòi
"trang cây chỉ nạp đúng một cửa `layDanhSachGiaPha` từ `sb.js`" — đúng cho
lúc b115 dựng khung, sai từ b116 khi trang cây điền ruột thật và hợp lệ đụng
nhiều cửa hơn. Luật thật không phải "một cửa" mà là luật 5a: không bao giờ
chọn cây bằng `phien.treeId`. Bản 0.7.1 thu hẹp lại đúng luật ấy — không
mất phép, chỉ sửa điều kiện.
