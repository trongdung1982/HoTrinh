# b117 — quantri3: khu Tài khoản, và chuyển khối b111c sang

*15/09/2026 12:20 · Claude Code CLI (Opus 5)*

---

## Làm được gì

- **Khu 2 (`#thanh-vien`) nay là *Tài khoản của tôi*** — đúng prototype
  `#tai-khoan`: khối *Hồ sơ* · khối *Quyền cấp hệ thống* (chỉ đọc) · bảng
  *Các gia phả tôi đang tham gia* (vai · người được gắn · trạng thái, tên cây
  bấm sang trang cây) · *Bảo mật và đổi mật khẩu* + *Đăng xuất*. Mở cho **mọi
  người**, không riêng quản trị. Quản trị hệ thống có thêm chip *Toàn hệ
  thống* (sổ đăng ký cũ, không đổi ruột).
- **Nút *Đề xuất mã người*** đứng trên dòng cây đã vào mà chưa gắn ai; bấm
  mở đúng khung một việc của b111c ngay dưới bảng.
- **Khối xét đơn đề xuất** chuyển sang mục *Đề xuất gắn người* của trang cây
  (`#gia-pha/cay/<mã>/de-xuat-gan`). Nút Duyệt trên đơn của chính mình vẫn mờ.
- **Trang chi tiết một tài khoản** `#thanh-vien/tai-khoan/<mã ngắn>` — *Tổng
  quan* và *Các gia phả liên quan*, chỉ đọc. Bảng sâu của *Toàn hệ thống* có
  liên kết sang.
- `sb.js`: `layPhien()` mang thêm `userId` · `duocTaoCay`; **`doiMatKhau()`**;
  **`chanCuaToi()`**.
- Huy hiệu *đơn chờ duyệt* dời từ nút Tài khoản sang nút Gia phả.
- `khu-thanh-vien.js` gỡ phần khu (ô chọn cây · ba tấm lọc · chỗ nạp *Toàn hệ
  thống*), còn là thư viện bảng: 2490 → 1947 dòng, mọi hàm còn lại không đổi.

File: **mới** `js/pages/quan-tri/khu-tai-khoan.js` · **mới**
`trang-tai-khoan.js` · `khu-thanh-vien.js` 0.13.0 · `trang-cay.js` 0.3.0 ·
`khung.js` 0.5.0 · `khu-tai-khoan-he-thong.js` 0.7.0 · `sb.js` 0.20.0 ·
`quan-tri.css` 0.4.0 · `kiem-thu/kiem-trang-quan-tri.mjs` 0.8.0 · ngoài repo:
`kiem-thu/sb-gia.mjs` 0.10.0 · `kiem-thu/xem-khung-quan-tri.mjs`.

## Vì sao làm thế

**Vì sao khu 2 bỏ hẳn ô chọn cây và ba tấm lọc.** b116 đã đặt đúng bảng ấy —
cùng `veBang()` — vào trang chi tiết một cây. Để nó ở khu 2 nữa là hai chỗ đổi
quyền cho cùng một cây, và bản đồ b114 (`THIET-KE-QUAN-TRI.md` 9.1) đã ghép
`#tai-khoan` với *"tài khoản của tôi"*, không với bảng một cây. Luật 5a không
mất gì: ô chọn cây tồn tại để một bảng *"của một cây"* khỏi ngầm định cây đang
mở; bảng mới liệt kê mọi cây và gọi tên cây trên từng dòng, nên câu *"cây
nào"* tự tan — đúng lý lẽ 5b② đã dùng cho cột xuyên cây. Không dòng lệnh nào
của hai file mới đọc `phien.treeId`, và bộ kiểm canh điều ấy.

**Vì sao `chanCuaToi()` đọc thẳng bảng mà không gọi `dsCayCuaTaiKhoan(toi)`.**
Hàm máy chủ ấy gác bằng `la_quan_tri_he_thong()` (`15` mục 5). Gọi cho chính
mình, một thành viên thường nhận mảng rỗng — tức cột *"Tôi được gắn với ai?"*
trống với đúng những người cần nó nhất. Luật RLS `doc_tree_members` đã cho
mỗi người đọc dòng của cây mình có chân, và `doc_persons` cho đọc tên người —
không hàm mới, không nới luật. Kèm theo một hệ quả đúng: đơn chờ và lời mời
không ra ở đây (RLS đòi `approved`), nên màn hình ghép với `ds_gia_pha()`.
Tên người ghép bằng `utils/text.fullName` — đúng hàm sơ đồ dùng.

**Vì sao `doiMatKhau()` đăng nhập lại bằng mật khẩu cũ.** `auth.updateUser()`
không hỏi mật khẩu cũ. Ai ngồi vào một máy đang mở sẵn trang Quản trị là đổi
được mật khẩu rồi khoá chủ nó ra ngoài. Đăng nhập lại là phép kiểm do máy chủ
chấm. Độ dài tối thiểu KHÔNG kiểm ở trình duyệt: Supabase có luật riêng, và
hai luật thì có ngày lệch nhau.

**Vì sao khu mới mở cho mọi người.** Nó chỉ hỏi máy chủ những câu về chính
người hỏi. Và đó là chỗ trả một món nợ b111c: khu cũ gác bằng
`co_the_kiem_duyet()`, nên một Thành viên thường không có đường nộp đơn đề
xuất mã người. Máy chủ vẫn cho họ nộp (`nop_de_xuat_gan()` chỉ đòi chân đã duyệt).

**Vì sao trang chi tiết tài khoản không có nút nào.** Mọi thứ trên đó hoặc là
cờ cấp tài khoản (đã có chỗ sửa ở bảng sâu *Toàn hệ thống*), hoặc là quyền
trong MỘT cây — mà chỗ sửa ấy là bảng của cây ấy. Chép năm việc đổi quyền sang
là dựng chỗ thứ ba để chúng lệch nhau. Mỗi dòng cây là liên kết sang đúng mục
(*Thành viên & quyền* · *Lời mời* · *Đơn xin vào*) theo trạng thái dòng.

**Vì sao địa chỉ dùng mã ngắn, không dùng uuid.** Mã ngắn `not null unique`
(`11` mục 1) và là thứ người ta đọc cho nhau qua điện thoại; một uuid trong
link thì không ai kiểm được link mình nhận có đúng người không.

**Vì sao huy hiệu đơn chờ dời sang nút Gia phả.** Đơn xin vào nay xét ở trang
cây, dưới khu Gia phả. Con số đứng cạnh một khu không có chỗ xử lý nó là dẫn
người ta đi tìm một cái nút không có ở đó.

**Vì sao bộ kiểm tự đối chiếu `sb-gia.mjs`.** Thiếu một tên ở bản giả làm
trắng cả bộ ảnh — đã xảy ra hai lần (b110b, b111), cả hai lần không phép văn
bản nào kêu, và lời nhắc trong `CHI-DAN.md` không ngăn được lần thứ hai. Phép
mới đọc mọi `import … from '…/services/sb.js'` trong `pages/quan-tri/` và
`dang-nhap.js`, rồi so với các `export` của bản giả. G22 gỡ một cửa để chứng
minh nó bắt được. Bước này thêm ba cửa mới, và phép ấy là thứ gác chúng.

## Đã thử mà hỏng

- **Chạy song song hai lệnh, một lệnh có `cd`.** Lệnh chạy mười bộ kiểm dùng
  `cd supabase/kiem-thu`, thư mục làm việc đổi luôn cho lệnh chụp ảnh chạy
  cùng lượt → `MODULE_NOT_FOUND`. Chạy lại bằng đường dẫn tuyệt đối. Đúng bài
  học đã ghi trong bộ nhớ; vấp lần thứ tư.
- **Bản đầu viết một điều kiện gác chip gượng ép** (`coHeThong = chip.length >
  1`) chỉ để khớp regex của bộ kiểm. Gỡ ngay khi đọc lại: điều kiện thật đã có
  ở `filter` phía trên, và regex khớp đúng câu ấy. Viết mã để chiều bộ kiểm là
  làm phép đo nói dối.
- **Ảnh kq-4: mã cây `NPGQ8C9` gãy thành `NPGQ8C / 9`.** `.qt-bang td` cho
  gãy chữ ở mọi chỗ (để email dài xuống dòng), và nó gãy luôn mã cây. 291 phép
  văn bản xanh. Ô mã nay `nowrap`; chụp lại để nhìn.
- Kịch bản sửa file CRLF chèn trùng một dòng `0.6.0` vào khối đầu — thấy ở bản
  in ra ngay sau khi chạy, sửa tay.

## Đã kiểm

- `kiem-trang-quan-tri.mjs` **291/291** *(258 → 291)*: PHẦN M mới (hai file ×
  8 phép · đăng ký trang · tìm theo mã · trang chỉ đọc · lời mời xét trước ·
  nút Đề xuất chỉ trên chân đã duyệt · khối xét đơn về trang cây · nút Duyệt
  mờ trên đơn của mình · hai cửa `sb.js` · mật khẩu cũ hỏi trước · chỉ đọc chân
  đã duyệt · `sb-gia.mjs` đủ tên) + G22 · G23 · G24 gieo lỗi, cả ba bị bắt.
- Mười bộ kiểm Node còn lại trong `supabase/kiem-thu/`: 47 · 40 · 19 · 112 ·
  35 · 55 · 59 · 33 · 23 · 33 — đều đạt.
- `/kiem-tra` **đạt cả 9 phép**; `domains/` 10/10 file giống bản đóng băng;
  giàn giáo `tuong-thich` giữ mốc 7 file.
- **Nhìn bằng mắt** 43 ảnh, xem kỹ: kq-4 (Tài khoản của tôi 1280) · kq-23 ·
  kq-24 (khung Đề xuất trên dòng cây họ Lê, 1280 và 390) · kq-37 (390, bảng cuộn
  ngang trong khối) · kq-38 (900, hai khối đã gập) · kq-39 · 40 · 41 (trang tài
  khoản) · kq-42 (liên kết trong bảng sâu) · kq-22 (xét đơn ở trang cây, nút
  Duyệt mờ trên đơn của mình) · kq-5 · 6 · 20 (bảng một cây ở trang cây) ·
  kq-0 (huy hiệu ở nút Gia phả).

**Chưa kiểm:** chưa mở trên máy chủ thật. Ba chỗ chỉ máy chủ thật trả lời
được: `chanCuaToi()` có đọc đúng dòng qua RLS với tài khoản **không** quản trị
không; `doiMatKhau()` với mật khẩu cũ sai và đúng; và ba cú bấm của điểm dừng
b111c. Chủ dự án đã hoãn bấm thử tới sau b118 — ghi ở `KE-HOACH.md`.

## Còn treo

- Thành viên thường nộp đề xuất phải gõ mã trần: ô gợi ý đi qua
  `tim_nguoi_trong_cay()`, gác bằng `co_the_quan_tri()`.
- Huy hiệu đơn chờ vẫn đếm theo cây đang mở (`napSoDem(phien.treeId)`) — chỗ
  duy nhất còn dính cây đang mở. Có từ b101.
- Chip *Toàn hệ thống* chuyển sang khu Quản trị hệ thống ở b118.
- Lời mời nhận vai Quản trị hệ thống (hai chữ ký) — khối *Quyền cấp hệ thống*
  nói thẳng *"chưa có ở máy chủ, làm ở b118b"*, không vẽ nút.
- `cayCuaPhien()` ở `khu-thanh-vien.js` nay không ai gọi. Để nguyên, không xoá
  ở bước này.

## ⚠ Dòng ⚠ chuyển khỏi `KE-HOACH.md` (mục b117 đã xoá)

| Dòng | Nơi trú |
|---|---|
| ① Nút Duyệt mờ sẵn kèm lý do trên đơn của chính mình — cửa thứ TÁM | Mã: `veMotDon()` giữ nguyên · bộ kiểm PHẦN M |
| ② Ô chọn cây riêng, KHÔNG dính cây đang mở | **Hết hiệu lực** cùng ô chọn — xem Đính chính. Luật gốc (5a) canh ở PHẦN M |
| ③ Cột xuyên cây không bao giờ là chỗ sửa | `KE-HOACH.md` mục b118 · trang tài khoản chỉ đọc |
| Nhớ thêm ở `sb-gia.mjs` | `KE-HOACH.md` b118 · bộ kiểm PHẦN M tự báo |

## File đã đụng

- **Mới:** `js/pages/quan-tri/khu-tai-khoan.js` · `js/pages/quan-tri/trang-tai-khoan.js` · `nhat-ky/b117-khu-tai-khoan.md`
- **Sửa:** `js/services/sb.js` · `js/pages/quan-tri/khu-thanh-vien.js` ·
  `trang-cay.js` · `khung.js` · `khu-tai-khoan-he-thong.js` · `quan-tri.css` ·
  `kiem-thu/kiem-trang-quan-tri.mjs` · `KE-HOACH.md` · `CHI-DAN.md` ·
  `THIET-KE-QUAN-TRI.md` · `nhat-ky/INDEX.md` · ngoài repo:
  `kiem-thu/sb-gia.mjs` · `kiem-thu/xem-khung-quan-tri.mjs`
- **Gỡ (không xoá file):** `mountKhuThanhVien()` · `veODoiCay()` ·
  `veThanhLoc()` · `nap()` · `napHeThong()` · `hopLoc()` · `cayChonDuoc()` ·
  `dongDanhTinh()` (chuyển sang `khu-tai-khoan.js`) khỏi `khu-thanh-vien.js`

## Đính chính

- `KE-HOACH.md` mục b117 dặn *"giữ nguyên ② ô chọn cây riêng"*. Câu ấy viết ở
  b116, khi còn hình dung khu 2 giữ bảng một cây. Bản đồ 9.1 (b114) thì đặt
  bảng ấy ở trang cây — b116 đã làm đúng thế — và khu 2 là *tài khoản của
  tôi*. Giữ ô chọn là giữ chỗ thứ hai đổi quyền cho cùng một cây. Luật mà ô
  chọn phục vụ (5a) vẫn giữ và vẫn đo.
- Bốn phép của `kiem-trang-quan-tri.mjs` trỏ vào phần khu đã gỡ (tấm lọc cây ·
  tấm lọc *Toàn hệ thống* · nạp động · con số đơn chờ đếm ở trình duyệt) —
  đổi sang đúng chỗ đứng mới, ghi lý do tại từng phép. G13 nay gieo vào
  `khu-tai-khoan.js`.
