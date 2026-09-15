# b115 — quantri3: khung + lớp trang chi tiết

*15/09/2026 07:28 · Claude Code CLI (Opus 5)*

---

## Làm được gì

- Khung Quản trị có **lớp thứ hai**: dưới mỗi khu mở được trang chi tiết của
  MỘT thứ, địa chỉ `#<khu>/<trang>/<mã>[/<mục>]`. Có nút *← Quay lại <khu>*,
  tựa, và thanh mục con (205px bên trái; ≤1000px thành hàng thẻ cuộn ngang).
- Trang đầu tiên: **một gia phả** — `#gia-pha/cay/<mã cây>`. Năm mục: *Tổng
  quan* (đọc thật từ `layDanhSachGiaPha()`: chủ cây · số người · vai của tôi
  hoặc lời mời/đơn đang chờ · người lạ thấy tên · trạng thái xin xoá) và bốn
  mục nói thẳng *"Chuyển sang đây ở b116/b117. Hôm nay: …"* kèm liên kết tới
  chỗ đang làm được việc ấy.
- Bốn khu cũ **không đổi một dòng**. Thanh trái, `#gia-pha` · `#thanh-vien` ·
  `#kiem-duyet` · `#sao-luu` giữ nguyên, link cũ vẫn chạy.

File: `js/pages/quan-tri/khung.js` 0.4.0 · **mới** `trang-chi-tiet.js` (vỏ) ·
**mới** `trang-cay.js` · `quan-tri.css` 0.2.0 · `kiem-thu/kiem-trang-quan-tri.mjs`
0.7.0 (PHẦN L + G20 · G21) · ngoài repo: `kiem-thu/xem-khung-quan-tri.mjs`
thêm kq-25 → kq-30.

`QuanTri.html` — `KE-HOACH.md` có ghi tên, nhưng **không cần sửa gì**: trang
chi tiết đi chung một điểm khởi động và một file CSS.

## Vì sao làm thế

**Vì sao địa chỉ là `#gia-pha/cay/NPG473` mà không phải `#tree-detail` như
prototype.** Tên phẳng mất khu cha: khung không biết tô nút nào trên thanh
trái, và mã cây không có chỗ nằm. Luật 5a nói không màn hình nào được ngầm
định cây đang mở — nên mã phải nằm TRONG địa chỉ, tức nằm trong link người ta
gửi nhau. Đoạn `cay` ở giữa để dành chỗ cho trang chi tiết thứ hai dưới cùng
khu mà không phải đổi địa chỉ của trang thứ nhất.

**Vì sao khung kiểm HẾT các tầng rồi mới giao cho trang.** Luật cũ của khung:
`#` lạ thì sửa bằng `replaceState`, không gán lại `location.hash` (gán là vẽ
hai lần và kẹt nút Back). Có lớp thứ hai thì có ba chỗ lạ được: khu · trang ·
mục. Để mỗi trang tự sửa mục lạ của nó là mỗi trang một cách sửa, và có ngày
một trang gán `location.hash`. Nên `veKhu()` sửa cả ba tầng; trang nhận giá
trị đã sạch. Còn **mã** trong địa chỉ thì khung không kiểm: có cây ấy hay
không là câu hỏi máy chủ, và luật 2 chỉ cho trang ấy gọi máy chủ.

**Vì sao mục đầu không ghi vào địa chỉ.** `…/NPG473` và `…/NPG473/tong-quan`
là hai địa chỉ cho một màn hình — gửi link nào cũng đúng nhưng so link thì
thấy khác. `duongDan()` bỏ đoạn rỗng, `hashMuc()` cho mục đầu ra đoạn rỗng;
cảnh kq-30 (mục lạ → Tổng quan) đo chỗ ấy.

**Vì sao nút Quay lại gán `location.hash` mà không `history.back()`.** Người
mở trang bằng link được gửi cho không đi qua khu cha; `back()` đưa họ RA KHỎI
trang Quản trị. Chữ trên nút là *"Quay lại Gia phả"* thì phải về Gia phả.

**Vì sao thanh mục gập ở 1000px chứ không 680px như thanh trái.** Ở 681–1000px
thanh trái 210px của khung vẫn còn; cộng thanh mục 205px là nội dung còn chừng
200px. Tính ra trước, rồi chụp kq-27 ở 900px để nhìn: thanh mục thành hàng
thẻ, bảng thông tin đủ rộng.

**Vì sao trang cây có Tổng quan đọc thật, không phải vỏ trống.** Một trang mà
mục nào cũng *"chưa làm"* không nói được là khung chạy đúng hay chỉ vẽ ra. Tổng
quan dùng lại đúng hàm khu Gia phả đang gọi, **không mở cửa máy chủ nào mới**,
không có nút ghi — vẫn trong ranh giới *"chưa đổi ruột khu nào"*. Thứ tự ba
trạng thái (được mời → có vai → đã nộp đơn) chép theo `veOThaoTac()`: lời mời
đứng TRƯỚC, bài học 14/09.

**Vì sao câu trạng thái xoá tả luật CŨ.** `THIET-KE-NHIEU-CAY.md` 11.9 đã chốt
"xoá thì ẩn ngay", nhưng SQL vẫn chạy "xin rồi mới ẩn" tới b118b. Câu trên màn
hình phải khớp máy chủ đang chạy — màn hình đi trước máy chủ là màn hình nói
dối.

**Vì sao chưa có mục *Vòng đời*.** Nghĩa của nó chưa hỏi (9.5, hỏi ở b116).
Vẽ một mục không ai biết chứa gì là mời bấm vào chỗ trống.

**Vì sao chưa có đường bấm từ khu Gia phả sang trang cây.** Điểm dừng b115 là
*"chưa đổi ruột khu nào"*; nối dòng cây sang trang chi tiết là việc của b116.
Hôm nay tới được trang ấy bằng cách gõ địa chỉ.

**Vì sao so lại địa chỉ sau khi chờ máy chủ.** Bấm sang mục khác trong lúc
`layDanhSachGiaPha()` chưa về thì khung đã vẽ mục mới vào đúng phần tử ấy; kết
quả cũ về muộn mà vẫn vẽ là đè lên mục người ta vừa mở.

## Đã thử mà hỏng

Không có vòng hỏng. Ba lần chạy đầu (soát cú pháp · 258 phép · chụp ảnh) đều
qua ngay, và sáu ảnh mới khớp điều định vẽ.

## Đã kiểm

- `kiem-trang-quan-tri.mjs` **258/258** *(237 cũ + 21 mới)*. G20 gieo *"tìm cây
  theo `phien.treeId`"*, G21 gỡ `@media` gập thanh mục — cả hai bị bắt. Gieo
  bằng regex **có cờ `g`**, neo vào tên biến, theo bài học G19.
- Mười bộ kiểm Node còn lại trong `supabase/kiem-thu/` chạy lại, đều đạt.
- `/kiem-tra` đạt cả 9 phép; `domains/` 10/10 file giống bản đóng băng.
- **Nhìn bằng mắt** kq-25 → kq-30 (1280 · 390 · 900 · mục chưa chuyển trên
  cây có email chủ dài nhất · mã không có · mục lạ), cộng kq-0 và kq-2 để chắc
  khu cũ không xê dịch.

**Chưa kiểm:** chưa ai mở trên máy chủ thật. Ở 390px Chrome headless vẽ thanh
cuộn ngang dưới hàng thẻ mục; điện thoại thật dùng thanh cuộn nổi nên sẽ không
thấy — chưa nhìn trên điện thoại thật.

## Đính chính

`KE-HOACH.md` b115 ghi điểm dừng *"237 phép bất biến vẫn đạt"* và địa chỉ
`#tree-detail`. Con số nay là 258; địa chỉ là `#gia-pha/cay/<mã>` — lý do ở
trên.
