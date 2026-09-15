# b118c — trang Quản trị = HTML + CSS nguyên văn của quantri3 (phần 1)

*15/09/2026 21:40 · Claude Code CLI (Opus 5)*

---

## Vì sao có bước này

Chủ dự án, 15/09/2026: *"tôi thấy quantri.html bạn đang làm có giao diện còn
lệch nhiều so với quantri3.html mà tôi đã dầy công xây dựng. tại sao bạn không
copy nguyên giao diện của quantri3.html về và gắn chức năng vào?"* — rồi:
*"hãy phát triển từ nó bằng cách xóa dữ liệu giả lập và gắn chức năng vào."*

Nguyên nhân là **lỗi đọc của b114**: câu bàn giao AGY *"Không bê dữ liệu mẫu,
mã giả hoặc các đoạn thử nghiệm vào repo chính"* bị hiểu thành "không chép
HTML/CSS", ghi vào `THIET-KE-QUAN-TRI.md` mục 9 thành *"chỉ giữ lại hành vi"*.
b115–b118 vì thế vẽ lại cả trang bằng bộ `.qt-*` của b101 (màu `#2a2622`, thanh
210px, tựa 22px, không màu nhấn) — đúng chức năng, lệch giao diện. Câu bàn
giao cấm **dữ liệu mẫu và JS giả lập**, không cấm giao diện.

## Làm được gì

- **`quan-tri.css`** = CSS của quantri3, **cắt thẳng từ file prototype bằng
  lệnh**, không gõ tay (`cmp` xác nhận khớp từng byte). Cuối file: vài dòng
  app cần mà prototype không có (câu lỗi, dòng trống, ô nhập trong hộp) và
  một khối **TẠM** giữ `.qt-*` cho các khu chưa chuyển.
- **`QuanTri.html`** = thân trang quantri3: thanh trái, đầu trang, các
  `section`, hộp `#custom-modal`. Đã bỏ: mọi dòng dữ liệu mẫu, khối *"Ghi chú
  cho Claude Code"*, nút *"mô phỏng"*, khối `<script>` giả lập. Giữ nguyên
  thẻ, class, `style=`, thứ tự cột, chữ trên nút.
- **Gắn chức năng thật:** khu **Gia phả** (bốn chip) · trang **Mời gia nhập**
  (`#gia-pha/moi/<mã>`, ba ô lọc) · **Quản trị hệ thống**: *Tổng quan* · *Cây
  mặc định* + trang chọn cây (`#quan-tri-he-thong/cay-mac-dinh/chon`) ·
  *Thùng rác* (dời từ khu Gia phả, đúng chỗ quantri3 đặt).
- **Vẽ tạm bằng mã cũ trong khung mới** (`#khu-tam`): khu Tài khoản · Kiểm
  duyệt · tab Sổ tài khoản · trang chi tiết một cây · trang một tài khoản. Vỏ
  trang chi tiết (`trang-chi-tiet.js`) đã đổi sang class quantri3.
- File mới: `hop-thoai.js` (hỏi/báo qua `#custom-modal`) · `o-bang.js` (ô bảng
  theo class quantri3, không `style=`) · `trang-moi.js`.

## Vì sao làm thế

**Vì sao HTML nằm tĩnh trong QuanTri.html, không để JS dựng.** Để giao diện
có ĐÚNG MỘT bản — chính bản chép từ prototype. JS dựng thẻ là lại có bản thứ
hai do người viết mã tự quyết, đúng thứ đã lệch ở b115–b118. Trang giả để
chụp ảnh (`../kiem-thu/trang-quan-tri-gia.html`) vì thế **nạp chính
`QuanTri.html` bằng `fetch`** rồi chép `.app` sang, không giữ bản HTML riêng.

**Vì sao lời gọi máy chủ không đổi.** Mọi hàm `sb.js`, thứ tự xét *lời mời
trước quyền xem* (vá 14/09), luật *hỏi trước khi đổi cây*, luật *đổi cây xong
nạp lại trang* — chép nguyên từ khu-gia-pha 0.8.0. Chỉ lớp vẽ thay.

**Vì sao `o-bang.js` không đặt màu hay khoảng cách nào.** Mọi thứ nhìn thấy
phải đến từ class quantri3. Thêm `style=` trong mã là bắt đầu vẽ lại.

**Vì sao liên kết trong bảng là `<button class="link">`.** Bản đầu dùng `<a>`
và ảnh chụp lộ gạch chân mà prototype không có — quantri3 dùng `button`.

**Vì sao khu chưa chuyển vẽ vào `#khu-tam` chứ không để trống.** Để trống là
mất chức năng đã nối ở b116–b118 (đổi quyền, kiểm duyệt, đề xuất gắn…) trong
lúc chờ. Chủ dự án là người duy nhất dùng nhánh này và vẫn cần bấm thử.

**Vì sao `NGAY_THUNG_RAC = 30`, không 120 như prototype.** Máy chủ đang chạy
`16` (30 ngày); 120 ngày vào máy chủ ở b118b. Màn hình đi trước máy chủ là
màn hình nói dối. Đổi hằng số cùng lúc dán SQL ấy.

## Chỗ khác prototype — có chủ ý

1. **Địa chỉ `#`** (không nhìn thấy): `#gia-pha/moi/<mã>` thay
   `#gia-pha/invite-…`; `#thanh-vien` thay `#tai-khoan`;
   `#quan-tri-he-thong/cay-mac-dinh/chon` thay `#sys-default-tree-selector`.
2. **Máy chủ chưa có — mờ kèm lý do:** cột *Thông tin công khai* ("Chưa có",
   sau b120) · menu *Xin đổi quyền* và ô *Quyền đề nghị* (b118b) · tab *Tạo
   tài khoản* (Edge Function) · *Sao lưu* (b119) · *Nhật ký* (sau b120) · ba
   thẻ Tổng quan tương ứng ghi "Chưa có".
3. **Luật cũ còn chạy:** *Xóa cây* = gửi ĐƠN, cây dùng bình thường tới khi
   QTHT duyệt; bảng *"Cây gia phả chủ cây đã xóa"* chứa đơn ấy (b118b đổi).
4. Cột *Mời gia nhập* với Quản trị gia phả không phải chủ: "Không phải chủ"
   (prototype vẫn vẽ "Mời"; `moi_vao_cay` chỉ cho chủ/QTHT).
5. Chip *Tôi là thành viên*: lời mời chưa nhận có nút **Nhận / Từ chối**.
   Chip *Có thể xin vào*: nút **Mở trên sơ đồ** cho cây QTHT xem được mà chưa
   có chân — không có nó thì QTHT mất đường mở cây ấy.
6. Form Mời bỏ ô *Mã người trong sơ đồ* của form b108 (prototype không có).
7. Ô trống vì máy chủ không trả: *Tên tài khoản* ở *Lời mời đã gửi*, *Người
   duyệt xóa* ở thùng rác. Để trống, không bịa.
8. Tên vai theo chữ prototype (*Thành viên · Khách*) trong trang Quản trị;
   sơ đồ vẫn dùng `config.vaiTroBangChu` (*Thành viên họ tộc*).
9. Chưa chép vào HTML: `#tree-detail`, `#account-detail` (vỏ do
   `trang-chi-tiet.js` dựng cùng class), `#sys-account-trees`,
   `#public-info-detail`.

## Đã thử mà hỏng

1. **`<a class="link">` gạch chân** — chỉ ảnh so cạnh nhau bắt được.
2. **12 phép bất biến bám chỗ cũ** (10 ở `kiem-trang-quan-tri.mjs`, 2 ở
   `kiem-tao-cay.mjs`): `@media` 680px của `.qt-dieu-huong` · thùng rác ở
   `JS_GP` · câu *"quyền riêng của tài khoản"* · dòng `TRANG` nay có `view:` ·
   `.qt-layout` · G6/G21 bẻ class không còn · nút *"Dựng gia phả mới"* · ô gõ
   mã. Đính chính theo đúng ĐIỀU phép canh, không bỏ phép nào.
3. **`bao()` hiện nút Hủy** — `o.nutHuy || 'Hủy bỏ'` biến `''` thành chữ. Sửa
   trước khi chạy.
4. **`/kiem-tra` phép 6:** quên nâng phiên bản `trang-chi-tiet.js`. Sửa.
5. `ls ../kiem-thu/` báo không có — lệnh chạy từ `Claude_Code/`, thư mục đúng
   là `kiem-thu/`.
6. Chữ *"thống"*, *"Bắc"* ở tựa Georgia tách dấu trong ảnh — **ảnh quantri3
   cũng y hệt**: cách Chrome headless vẽ phông, không phải lỗi mã.

## Đã kiểm

- `kiem-trang-quan-tri.mjs` **298/298** · `kiem-tao-cay.mjs` **33/33** · chín
  bộ Node còn lại đạt hết · `/kiem-tra` đạt cả 9 (sau khi sửa phép 6).
- **So ảnh quantri3 và app cạnh nhau**, 16 cảnh, 1280px + 390px:
  `node ../kiem-thu/so-quantri3.mjs [lọc]` → `../kiem-thu/sq-p-*.png` (prototype)
  và `sq-a-*.png` (app). Gia phả · Mời · Tổng quan · Cây mặc định · Chọn cây ·
  Thùng rác · Tạo gia phả khớp.

**Chưa kiểm:** chưa ai bấm trên máy chủ thật; chưa xem trên điện thoại thật.

## Còn treo — b118d

- Chuyển nốt sang HTML quantri3, **mỗi phiên một khu**: trang cây
  (`#tree-members` · `#tree-requests` · `#tree-detail`) · khu Tài khoản ·
  Kiểm duyệt · Sổ tài khoản (bảng chờ sẵn trong `data-ban-mau`) +
  `#sys-account-trees`.
- Khu cuối xong thì xoá `#khu-tam`, khối TẠM `.qt-*` trong CSS, và file mã
  cũ không còn ai `import` (xoá file = hỏi chủ dự án).

## File đã đụng

- **Mới:** `js/pages/quan-tri/hop-thoai.js` · `o-bang.js` · `trang-moi.js` · `nhat-ky/b118c-chep-nguyen-quantri3.md`
- **Viết lại:** `QuanTri.html` 1.0.0 · `quan-tri.css` 1.0.0 · `js/pages/quan-tri/khung.js` 1.0.0 · `khu-gia-pha.js` 1.0.0 · `khu-quan-tri-he-thong.js` 1.0.0
- **Sửa:** `trang-chi-tiet.js` 0.2.0 · `kiem-thu/kiem-trang-quan-tri.mjs` 0.10.0 · `kiem-thu/kiem-tao-cay.mjs` 0.2.0 · `KE-HOACH.md` · `CHI-DAN.md` · `THIET-KE-QUAN-TRI.md` · `nhat-ky/INDEX.md`
- **Ngoài repo:** `../kiem-thu/trang-quan-tri-gia.html` (nạp QuanTri.html) · **mới** `../kiem-thu/so-quantri3.mjs`

## Đính chính

`THIET-KE-QUAN-TRI.md` mục 9 (b114): *"chỉ giữ lại hành vi, không chép HTML/JS
mẫu"* — sai, đã thêm dòng đính chính ngay dưới câu ấy.
