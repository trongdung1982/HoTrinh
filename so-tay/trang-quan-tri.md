# Sổ tay · trang Quản trị

Gồm      : `QuanTri.html` — NGUYÊN FILE prototype quantri3, dựng bằng máy · `quan-tri.css` — CSS nguyên văn quantri3 + vài dòng app · `js/pages/quan-tri/khung.js` — `#` → section · `khu-gia-pha.js` · `khu-tai-khoan.js` · `khu-kiem-duyet.js` · `khu-quan-tri-he-thong.js` · `khu-sao-luu.js` (b119, gọi từ tab Sao lưu của khu trên) · `trang-cay.js` · `trang-moi.js` · `trang-tai-khoan.js` — đổ dữ liệu vào section của mình · `hop-thoai.js` — hộp hỏi + ô nhập · `o-bang.js` — mẩu ô bảng · `o-goi-y.js` — ô gợi ý
Liên quan: `js/services/sb.js` · `kiem-thu/kiem-trang-quan-tri.mjs` · ngoài repo: `../kiem-thu/sb-gia.mjs` · `trang-quan-tri-gia.html` · `so-quantri3.mjs` · `xem-khung-quan-tri.mjs` · prototype `../codex/dua_claude.ai/quantri3.html`

## Đính chính

- **"Đổi giao diện thì sửa prototype trước rồi dựng lại" — chủ dự án bác bỏ
  18/09/2026**: *"tôi không có quy định luật nào phải sửa quantri3.html trước,
  tôi chỉ nói copy nó về để làm tiếp cho nhanh"*. Luật thật chỉ là: **bản đầu
  phải chép nguyên** (đừng vẽ lại bằng JS như b115–b118 làm), không phải "mọi
  hành vi mới sau này đều phải quay lại sửa file prototype trước". Thêm hành
  vi mới (nút, khay…) làm thẳng ở `QuanTri.html`/CSS/JS được, miễn không vẽ
  lại các mảng đã chép nguyên. Mục *Luật chung* dưới đã sửa lại theo ý này.

## Luật chung

- **Giao diện = NGUYÊN FILE prototype quantri3, cho phần ĐÃ CÓ trong đó.**
  Bản đầu (b118c–d) chép nguyên, không chép từng khu, không vẽ bằng JS — xem
  *Đính chính* trên. Muốn ĐỔI một mảng đã chép nguyên (màu, bố cục, chữ) thì
  sửa prototype trước rồi dựng lại. **Thêm hành vi mới mà prototype không có**
  (khay điều hướng điện thoại…) thì làm thẳng ở đây, ghi rõ "không có trong
  quantri3" ngay tại chỗ thêm.
- **Mỗi khu/trang vẽ vào section của nó** — `view` trong `KHU`/`TRANG` của
  `khung.js`; mục nào khác section của trang thì khai `view` trên mục
  (`MUC_TRANG_CAY`). Không có chỗ vẽ tạm.
- **JS không đặt `style` mới.** Chỉ `chepKieu()` chép nguyên `style=` đã có trong
  mẫu dòng của quantri3. Ô nhập đổi quyền mở TRONG hộp hỏi (`hoi({truong})`) —
  bảng quantri3 không có chỗ đứng cho chúng.
- **Hộp hỏi đổi quyền có MỘT bản** — `trang-cay.js` (`hoiDoiVai` · `hoiGanNguoi` ·
  `hoiTinCay` · `hoiGo` · `hoiDuyetDon` · `hoiTuChoiDon` · `hoiDeXuatGan`); trang
  một tài khoản gọi lại. Mọi hộp gọi TÊN CÂY (`cumCay`, luật 5a).
- **Máy chủ chưa làm được** thì nút mờ kèm lý do / chữ *"Chưa có"* kèm `title` —
  không vẽ số giả, không giả vờ chạy. Câu hỏi nói đúng máy chủ HÔM NAY.
- **Thêm cửa vào `sb.js` thì thêm ở `sb-gia.mjs`** — thiếu một tên là `SyntaxError`
  lúc nạp, cả bộ ảnh ra nền trơn (đã xảy ra b110b, b111). Tham số của bản giả
  phải cùng NGHĨA với máy chủ.
- **Nhìn bằng mắt trước khi báo xong**: `node ../kiem-thu/so-quantri3.mjs [lọc]`
  (cặp `sq-p-*` prototype / `sq-a-*` app). Bộ bất biến văn bản không bắt được
  lệch giao diện. ⚠ `xem-khung-quan-tri.mjs` (kq-*) còn kịch bản bấm của giao
  diện cũ (*Sửa quyền*, *Xét đơn*…) — ảnh ra sai cảnh, đừng dùng tới khi viết lại.

## Lỗi đã gặp — áp cho MỌI file trong "Gồm"

- **Chép lắt nhắt từng khu (b118c)** — trang mang khung quantri3 nhưng ruột bốn
  khu vẽ tạm bằng mã cũ trong `#khu-tam`, bốn section không được chép; chủ dự án
  thấy `#gia-pha/cay/NTB/thanh-vien` khác hẳn prototype. Cách tránh: dựng nguyên
  file bằng kịch bản mà mỗi phép thay khẳng định *khớp đúng 1 chỗ*. Phép bắt:
  PHẦN O *"đủ 13 section"* · *"không còn ô vẽ tạm"*.
- **Dữ liệu thật dài hơn chữ mẫu** — nút trong ô gãy dòng và chữ `button` căn
  giữa; bảng đặt trong `.layout` đẩy cột phải tràn mép. Vá bằng CSS phần app:
  `td .link{text-align:left}` · `.action-menu > .btn{white-space:nowrap}` ·
  `.layout > div{min-width:0}`. Chỉ ảnh chụp bắt được. ⚠ Cột *Nội dung thao tác*
  (Kiểm duyệt) và Sổ tài khoản vẫn chật — độ rộng cột nằm trong `style=` của
  prototype, và ảnh prototype gãy y hệt; muốn rộng ra thì sửa prototype.
- **`ganGoiY` bắn `input` SAU `khiChon`** — bộ nghe *"gõ tay thì bỏ lựa chọn"*
  chạy ngay sau cú chọn và xoá luôn lựa chọn (hộp Bàn giao cũ dính). Cách tránh:
  lúc bấm nút, so `ô.value === lựaChọn.email`.
- **Bản giả `dsKiemDuyet(cây, null)` trả rỗng** — máy chủ thật trả mọi trạng
  thái; trang chi tiết một lần Lưu ra *"không thấy"* trong ảnh. Vá ở `sb-gia.mjs`.
- **Phép kiểm xanh "ăn may"** — *"trang tài khoản CHỈ ĐỌC"* vẫn đạt sau khi trang
  đổi vai được, vì nó gọi hộp hỏi chứ không gọi thẳng cửa. Hình dạng mã đổi thì
  đính chính theo ĐIỀU phép canh — đọc thân phép trước, đừng chỉ đọc tên.
- **`.back` (Về sơ đồ) bị chính CSS gốc quantri3 ẩn dưới 850px** — trang con
  trên điện thoại không còn đường quay về sơ đồ hay về khu cha (chủ dự án báo
  18/09/2026). Vá bằng nút `.qt-menu` mở `aside` thành khay — `khung.js` mục
  *Khay điều hướng*, CSS ở cuối `quan-tri.css`. KHÔNG dùng cử chỉ vuốt-mép:
  trùng cử chỉ "quay lại" có sẵn của trình duyệt điện thoại.
- **`style=` inline chép từ quantri3 đè cả media query trên điện thoại** —
  hai khối `.cards` của *Tổng quan* (Quản trị hệ thống) mang
  `style="grid-template-columns:repeat(3,1fr)…"`; CSS gốc có
  `.cards{grid-template-columns:1fr}` dưới 850px nhưng inline luôn thắng, ba
  cột kẹt cứng, chữ vỡ dòng (chủ dự án chụp ảnh báo 18/09/2026). Vá: bỏ đúng
  `grid-template-columns` khỏi inline, giữ `gap`/`margin-bottom`. ⚠ **Còn hai
  chỗ y hệt CHƯA vá** — `<div style="display:grid;grid-template-columns:1fr
  1fr…">` dòng ~306/317, form *Tạo tài khoản* (khu Quản trị hệ thống, tab
  chưa nối máy chủ thật nên chưa ai thấy trên điện thoại) — sửa khi chạm tới.
- **`o-goi-y.js` chọn dòng gợi ý "không được" trên điện thoại** — nghi vấn:
  bàn phím ảo mở ra không bắn `resize` của `window`, toạ độ `position:fixed`
  đo trước đó lệch. Vá bằng nghe thêm `window.visualViewport` (bẫy 4 trong
  file). **Chưa xác nhận trên điện thoại thật** — chủ dự án mới thử điện
  thoại, chưa thử máy tính; bấm lại sau khi vá rồi báo còn lệch không.

## Vì sao làm thế này

- **HTML tĩnh, JS chỉ đổ dữ liệu**: giao diện có đúng MỘT bản — bản prototype. JS
  dựng thẻ là bản thứ hai do người viết mã tự quyết, đúng thứ đã lệch b115–b118.
- **Kiểm duyệt đọc MỌI cây kiểm duyệt được** (quantri3: *"Tất cả gia phả bạn quản
  lý"*), không cây đang mở (luật 5a). N cây tốn 1 + N + 3N vòng mạng; khi nhiều
  cây thì cần một hàm máy chủ gộp — chưa có.
- **Nút *Lời mời* của trang cây không là một mục** — đi sang `#gia-pha/moi/<mã>`,
  nơi bảng *Lời mời đã gửi* ở. Một bảng, một địa chỉ.
- **`ds_kiem_duyet()` không trả người duyệt · lúc duyệt · lý do từ chối** (cột có
  trong `change_log`, hàm chưa đọc) — hai tab lịch sử để trống ba cột, không bịa.
- **`#account-detail` · `#public-info-detail` có trong HTML mà không có lối vào** —
  prototype không nối cái đầu; cái sau cần công khai theo từng trường, máy chủ
  chưa có (sau b120). Chép cho đủ file.
- **Duyệt *xin đổi quyền* nối vào bảng Thành viên & quyền sẵn có, KHÔNG ở
  `#tree-requests`** (b118c) — mục đó là trang JOIN request TĨNH của prototype,
  cột và hình dạng dữ liệu không khớp một lá đơn xin đổi vai của người ĐÃ ở
  trong cây. Dựng thêm một tab mới cần sửa prototype trước (luật HTML tĩnh ở
  trên) — không phải việc một phiên tự quyết được, nên chọn chỗ có sẵn.
- **Tab Sao lưu: *Lịch sử sao lưu* + nút *"Sao lưu ngay"* không làm được**
  (b119) — trình duyệt không có đường gọi Google Drive/Apps Script (không
  OAuth, `CLAUDE.md` mục 3), không phải "chưa tới lượt". Chỉ bảng *Đối chiếu
  dữ liệu* làm được, vì nó chỉ cần đọc Supabase (`dem_du_lieu`). Đừng tưởng
  thêm khoá bí mật hay Edge Function là "cho gọn" — xem `sao-luu/SaoLuu.gs`
  đã đâm vào đúng bức tường ấy một lần rồi.
