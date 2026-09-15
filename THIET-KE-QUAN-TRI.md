# THIẾT KẾ — Trang Quản trị (`QuanTri.html`)

*Cập nhật 15/09/2026 (b114) · Mục 9 thêm bản đồ đối chiếu quantri3.html — chốt trước khi viết dòng mã đầu tiên của b115*

> **Tên file cố định, không có `_Vxx`** — lịch sử để git giữ.
>
> Nguồn: bản thiết kế của ChatGPT (05/09/2026, chủ dự án đặt hàng) + ba phép
> đo trên chính mã nguồn mà ChatGPT không có cách nào biết. Chỗ nào bản này
> **khác** bản của ChatGPT đều ghi rõ *vì sao*, ở ngay chỗ ấy.

> ⚠ **BỔ SUNG 05/09/2026 — đọc `THIET-KE-NHIEU-CAY.md` cùng file này.** Chủ dự
> án chốt ba câu về nhiều gia phả trong cùng ngày, và chúng đổi ba chỗ ở đây:
> **khu 1** to hơn hẳn *(chủ sở hữu · xin quyền · cây mặc định · công tắc cho
> người lạ thấy tên)*; **khu 2** thêm cột *Mã tài khoản*; **bảng quyền mục 5**
> thêm một hạng đứng trên tất cả — *quản trị toàn hệ thống*, đọc và sửa được
> mọi cây. Chỗ nào hai file nói khác nhau thì **`THIET-KE-NHIEU-CAY.md` đúng**,
> vì nó viết sau.

---

## 1. Ba câu hỏi tách ba màn hình

Cách chia không dựa vào *"ai được phép"* mà dựa vào *"đang trả lời câu hỏi gì"*:

| Màn hình | Trả lời câu hỏi |
|---|---|
| **Cài đặt** *(lớp phủ trên `index.html`)* | *Sơ đồ của tôi hiện ra thế nào?* + việc biên tập **trên cây đang mở** |
| **`QuanTri.html`** | *Tôi quản lý con người, kiểm duyệt và an toàn dữ liệu thế nào?* |

Ranh giới thật sự nằm ở một chỗ kỹ thuật, không phải ở quyền: **`QuanTri.html`
cố ý KHÔNG nạp cây gia phả.** Đó là lý do số 2 khiến nó là trang riêng — người
duyệt không cần một dòng nào trong 681 người ấy. Mọi quyết định dưới đây bám
theo ranh giới ấy.

---

## 2. Mười khối Cài đặt đi đâu — và ba khối KHÔNG dời được

⚠ **Đây là chỗ khác bản của ChatGPT nhiều nhất.** ChatGPT dựng một khu *"Dữ
liệu gia phả"* trong `QuanTri.html` để chứa khối 1, 6, 7. Đo lại trên mã thì
khu ấy **không dựng được** mà không phá ranh giới ở mục 1:

| Khối | Nó `import` gì | Hệ quả |
|---|---|---|
| **1 · Quản lý gia phả** | `state.tree` + `domains/person.js` | cần **cả cây trong bộ nhớ** |
| **6 · Xuất ảnh PNG · In khổ lớn** | `xuatAnhPNG(svgEl, state.tree)` | cần **chính phần tử SVG đang vẽ** — không có sơ đồ thì không có gì để chụp |
| **7 · Nhập dữ liệu** | `state` + `domains/gedcom.js` + `domains/excel.js` | có **chế độ bổ sung vào cây đang mở** |

Nên bảng chia đôi là thế này:

| # | Khối | Đi đâu | Lý do |
|---|---|---|---|
| 1 | Quản lý gia phả *(danh sách người · gia đình)* | **Ở LẠI Cài đặt** | Biên tập **trên cây đang mở**. Dời đi là buộc trang Quản trị nạp cả cây |
| 2 | Người trung tâm mặc định | **Ở LẠI Cài đặt** | Tuỳ chọn cá nhân, lưu riêng từng tài khoản |
| 3 | Hiển thị | **Ở LẠI Cài đặt** | Thuần tuý trình bày |
| 4 | Gia phả *(chọn cây khác)* | **→ Quản trị, khu 1** | Chỉ cần `services`, **không cần cây**. Và đổi cây là việc vài tháng một lần, hậu quả rộng — không nên nằm chỗ tay chạm qua |
| 5 | Sao lưu & khôi phục | **→ Quản trị, khu 4** | Chỉ cần `services`. Vận hành dữ liệu cấp hệ thống |
| 6 | Xuất dữ liệu | **Ở LẠI Cài đặt** | Xuất ảnh là *chụp cái tôi đang nhìn*. **Không dời được** |
| 7 | Nhập dữ liệu | **Ở LẠI Cài đặt** | Chế độ bổ sung cần cây đang mở |
| 8 | Duyệt nội dung | **→ Quản trị, khu 3** | Đã ở đó rồi |
| 9 | Đơn chờ duyệt | **→ Quản trị, khu 2** | Cùng bảng `tree_members` với danh sách thành viên — gộp làm một |
| 10 | Tài khoản và quyền | **TÁCH ĐÔI** | Phần *"tài khoản của tôi"* + nút **Đăng xuất** ở lại Cài đặt. Phần *quản lý quyền người khác* → Quản trị khu 2 |

**Cài đặt từ 10 khối xuống còn 6**, và sáu khối ở lại đều đúng loại: *tuỳ chọn
của tôi* và *làm việc trên cây tôi đang mở*.

⚠ **Nói thẳng: đây ít hơn chủ dự án mong.** Câu đặt hàng là *"quản lý thì nên
đưa hết vào quản trị"*. Ba khối phải ở lại vì lý do kỹ thuật, không phải vì
lười. Muốn dời chúng thật thì phải trả lời trước một câu khác hẳn: *có chấp
nhận cho `QuanTri.html` nạp cả cây không?* — và nếu có thì lý do #2 khiến nó
là trang riêng biến mất, phải xét lại cả kiến trúc hai trang.

---

## 3. Điều hướng — thanh trái trên máy tính, hàng thẻ trên điện thoại

Chủ dự án chốt 05/09/2026. ⚠ **Khác bản ChatGPT**, bản ấy chọn một trang cuộn
dài không có điều hướng.

Lý lẽ ChatGPT đưa ra để bác thanh trái — *"`QuanTri.html` vốn là tài liệu cuộn
được, đừng phá"* — **nhầm hai thứ**. Câu ấy trong `QuanTri.html` nói về việc
trang không dùng `position:fixed; inset:0` như `index.html`, tức nói về **cách
trang cuộn**, không nói về **cách đi lại giữa các khu**. Thanh trái dùng
`position: sticky` thì trang vẫn cuộn y như cũ.

```
┌──────────────────┬────────────────────────────────┐
│ QUẢN TRỊ         │                                │
│                  │   Thành viên & quyền           │
│ ▸ Gia phả        │   ─────────────────────        │
│ ▸ Thành viên  ③ │   [bảng]                       │
│ ▸ Kiểm duyệt ⑱ │                                │
│ ▸ Sao lưu        │                                │
│                  │                                │
│ ← Về sơ đồ       │                                │
└──────────────────┴────────────────────────────────┘
```

### Ba luật của khung điều hướng

**1 · Thanh điều hướng CHÍNH LÀ dashboard.** Hai con số cần nhìn — số đơn chờ
duyệt và số thay đổi chờ kiểm duyệt — nằm ngay cạnh chỗ bấm để xử lý chúng.

> ChatGPT bác *"Dashboard tổng quan"* và nó **đúng** với dãy ô số ở đầu trang:
> số nằm một chỗ, việc nằm chỗ khác, và cùng một con số hiện ở hai nơi thì có
> ngày lệch nhau — lúc ấy không biết tin chỗ nào. Nhưng nó bác hơi rộng tay.
> Đặt số vào chính mục điều hướng thì **giữ được cả hai**: không có ô trang
> trí nào, mà cũng không mất con số nào, và mỗi số chỉ tồn tại đúng một chỗ.

**2 · Mỗi lần chỉ vẽ MỘT khu, và chỉ khu ấy gọi máy chủ.** Nối tiếp đúng lý lẽ
đã dựng nên trang này: mở khu Thành viên thì không có cớ gì gọi hàng chờ kiểm
duyệt. Mở trang lần đầu chỉ tốn **hai** lời gọi đếm cho hai con số trên thanh.

**3 · Khu đang mở ghi vào `#` của địa chỉ** — `QuanTri.html#thanh-vien`. Tải
lại trang về đúng chỗ cũ, gửi link cho nhau được, nút Back của trình duyệt
chạy đúng. Khoảng 10 dòng mã, **không cần router**.

### Trên điện thoại

Thanh trái thành **hàng thẻ ngang** ở đầu trang, tên rút ngắn:
`Gia phả · Thành viên · Kiểm duyệt · Sao lưu`.

⚠ **Không phải sáng tạo mới — `quan-tri.js` đã có sẵn đúng hàng thẻ ấy.** Hàm
`veThanhLoc()` vẽ ba tấm lọc *Chờ duyệt · Đã nhận · Đã gạt*, và `toMauLoc()`
tô đậm cái đang chọn. Dùng lại đúng ngôn ngữ hình ấy.

**Một danh sách khu, hai cách vẽ đổi bằng `@media`, KHÔNG phải hai bộ mã.**

⚠ **Không dùng ngăn kéo hamburger.** Nó phải đẻ ra lớp phủ, nút đóng, bẫy phím
— mà app này chưa có chỗ nào dùng, đến `confirm()` cũng không dùng.

---

## 4. Bốn khu

### Khu 1 — Gia phả

| | |
|---|---|
| **Mục đích** | Biết đang làm việc trên cây nào, và đổi sang cây khác |
| **Ai vào được** | Mọi người đã đăng nhập và có chân trong ít nhất một cây |
| **Dữ liệu** | `layDanhSachGiaPha()` — đã có sẵn |
| **Cột** | Gia phả · Mã · Ghi chú · Phiên bản · Cập nhật. Cây đang mở đánh dấu rõ |
| **Thao tác** | **Chọn gia phả**. Không có nút xoá gia phả |
| **Rỗng** | *"Bạn chưa có chân trong gia phả nào."* |
| **Lỗi** | *"Không tải được danh sách gia phả."* + nút **Thử lại**. ⚠ Không biến lỗi thành danh sách rỗng |

*Nút **Tạo gia phả mới** để sau — cần một hàm máy chủ chưa viết, xem mục 6.*

### Khu 2 — Thành viên & quyền

Đây là khu **xoá được nhiều câu SQL tay nhất**, nên nó làm trước.

| | |
|---|---|
| **Mục đích** | Thay hẳn việc mở SQL Editor để xem và sửa `tree_members` |
| **Ai vào được** | `quan_tri_he_thong` đầy đủ · `quan_tri` **chỉ xem** · hai vai kia không. **Máy chủ quyết** |
| **Dữ liệu** | Cần hàm mới `ds_thanh_vien()` — xem mục 6 |
| **Cột** | Email · Người được gắn *(mã + tên, **bấm được** từ b111b)* · Vai trò · Đã duyệt · Tin cậy · Tham gia |
| **Cây nào** | **Ô chọn cây** ngay dưới dòng danh tính — mục 5b điều ① |
| **Rỗng** | *"Chưa có thành viên nào trong gia phả này."* |
| **Lỗi** | *"Không tải được danh sách thành viên."* + **Thử lại** |

**Ba tấm lọc, dùng lại `veThanhLoc()`:** `Đang chờ duyệt` · `Đã duyệt` · `Tất cả`.

⚠⚠ **BA TRẠNG THÁI, KHÔNG PHẢI HAI — sửa 10/09/2026 (b110c).** Một dòng chưa
duyệt có thể là **đơn xin vào** (chờ NGƯỜI QUẢN TRỊ bấm) hoặc **lời mời** (chờ
CHÍNH NGƯỜI ẤY bấm Nhận). Bản trước gộp cả hai thành chữ *"Đang chờ"* kèm nút
*Xét đơn*, và bấm nút ấy trên một lời mời là **đưa người ta vào cây khi họ chưa
đồng ý** — lỗ hổng chủ dự án bắt được, xem `THIET-KE-NHIEU-CAY.md` mục **11.8**.

Nay: dòng lời mời mang huy hiệu *Được mời — chờ họ bấm Nhận*, **không có nút
nào**, và cột Vai trò hiện vai họ **sẽ** nhận (`moi_vai`) chứ không phải `xem`.
Con số trên tấm lọc *Đang chờ* đếm **đơn xin vào**, không đếm lời mời — nó nói
*"còn bao nhiêu việc BẠN phải bấm"*, đúng luật 1 của mục 3.

⚠ **Gộp "Đơn chờ duyệt" vào đây, không làm khu riêng.** Cả hai đọc cùng một
bảng `tree_members`; khác nhau đúng một cột `approved`. Hai màn hình cho một
bảng là hai chỗ để lệch nhau.

**Bốn thao tác mỗi dòng, đều hai nhịp** *(bấm lần đầu nút đổi chữ và đổi màu,
bấm lần nữa mới chạy — không `confirm()`)*:

| Thao tác | Vì sao phải hai nhịp |
|---|---|
| Đổi vai | Đổi được cả quyền duyệt của người khác |
| Gắn / đổi mã người | **Đổi thẳng `pham_vi_sua()`** — gắn nhầm là mở quyền sửa cho cả một nhánh |
| Bật / tắt `tin_cay` | Đổi chính sách kiểm duyệt của người ấy |
| Gỡ khỏi gia phả | Không cứu lại được bằng một cú bấm |

⚠ **Máy chủ từ chối thì nói thật, đừng tự sửa màn hình cho giống thành công:**
*"Không thực hiện được. Quyền hoặc dữ liệu đã đổi trên máy chủ."* + **Tải lại**.

#### Tấm lọc thứ tư — *Toàn hệ thống* *(b109, 09/09/2026)*

Ba tấm trên hỏi **"ai có quyền gì trong CÂY ĐANG MỞ"**. Tấm thứ tư hỏi câu
ngược lại: **"phần mềm này có những tài khoản nào, và mỗi tài khoản đứng ở đâu
trong TỪNG cây"** — nên nó liệt kê cả người đăng ký rồi bỏ đấy, thứ mà
`ds_thanh_vien()` theo định nghĩa không bao giờ thấy. Chỉ **Quản trị hệ thống**
thấy tấm này, và hàng rào nằm trong chính câu truy vấn của
`ds_tai_khoan_he_thong()`.

| | |
|---|---|
| **Mã ở đâu** | `js/pages/quan-tri/khu-tai-khoan-he-thong.js` — **file riêng**, không viết thêm vào `khu-thanh-vien.js`. Hai chế độ, hai câu hỏi, hai bảng khác cột |
| **Nối bằng gì** | `khu-thanh-vien.js` nạp nó bằng `import()` **động**; nó `import` ngược lại để dùng năm việc của `13`. Tĩnh cả hai chiều là **vòng import**, và vòng import trong ES Modules gốc không ném lỗi lúc nạp — nó để một hàm thành `undefined`, chỉ vỡ lúc ai đó bấm đúng nút ấy |
| **Cột** | Tài khoản *(+ huy hiệu QTHT / Bạn)* · Mã tài khoản · Vai trò · **Người được gắn** *(xuyên cây, b111b — mục 5b điều ②)* · **Tạo gia phả** *(ô tích, b110b)* · Số cây *(kèm dòng nhỏ "n chờ · n mời")* · Xác nhận email · Đăng ký · Đăng nhập gần nhất |
| **Bảng sâu, năm việc** | ① họ tên · ② bật/tắt cờ Quản trị hệ thống · ③ **ô tích Quyền dựng gia phả** *(b110b)* · ④ bảng các cây + năm việc của `13` theo từng dòng *(hoặc Duyệt/Từ chối nếu là đơn đang chờ)* · ⑤ mời thẳng vào một cây · ⑥ xoá hẳn tài khoản, gõ lại email |
| **⚠ Hai việc KHÔNG hỏi cây** | Cờ Quản trị hệ thống và ô tích Quyền dựng gia phả là cờ ở tầng **tài khoản** — chúng đứng cạnh nhau, TRƯỚC mọi việc theo cây, và nhãn của chúng tự khai *"cả hệ thống, không chọn cây"*. Mọi việc còn lại phải gọi tên cây, xem mục 5a |
| **Khoá trên dòng của chính mình** | Ba việc: cờ QTHT · mời · xoá. Cộng nút mở năm việc trong bảng cây. **Khoá sẵn kèm lý do, không mở ra rồi mới giải thích** |
| **⚠ Lời mời không có nút** | Dòng *"được mời"* không có thao tác nào — nhận hộ người khác là bỏ mất chữ ký thứ hai |

⚠ **Khu này KHÔNG phá ranh giới mục 1** — kể cả sau b109b. Ô *mã người* ở
form Mời nay CÓ gợi ý, nhưng nó đi bằng `tim_nguoi_trong_cay()`: một hàm
`security definer` **lọc ở máy chủ, trần 10 dòng**, gác bằng
`co_the_quan_tri()`. Trang này vẫn không giữ một danh sách người nào trong bộ
nhớ. Ngày nào có ai thấy mình sắp nạp cả cây về "cho tiện lọc" thì dừng lại
đọc lại mục 1 — cây thật có 681 người.

### Khu 3 — Kiểm duyệt

Giữ nguyên bản chất và gần như nguyên giao diện hiện có (`quan-tri.js` 0.1.0).
Ba tấm lọc, mỗi dòng một **lần bấm Lưu**, hai nút *Duyệt* và *Từ chối và hoàn tác*.

**Thêm đúng một thứ: mở rộng một dòng để xem TRƯỚC/SAU.**

⚠ ChatGPT dừng lại ở đây và nói *"cần xem SQL hiện có trước khi thiết kế"*. Đã
đọc `03-ham-luu-cay.sql` khối *chụp ảnh*, nên trả lời được:

`change_log.truoc` có hình:

```
{ persons:        [ {id: 'P0012', cu: {…cả dòng cũ…} }, … ],
  unions:         [ {id, cu}, … ],
  union_children: [ {id, cu}, … ],
  media:          [ … ],  sources: [ … ],
  tree:           {name, root_person_id, note}  hoặc null,
  imports_moi:    [ … ] }
```

`cu` là **cả dòng cũ**, hoặc `null` nếu lần Lưu ấy vừa đẻ ra bản ghi.

Nên **không cần thêm cột `sau`** vào `change_log`. Giá trị *sau* chính là **dòng
hiện tại trong bảng** — và điều đó chỉ đúng khi chưa lần Lưu nào sau đó đụng
vào, mà `dung_do_sau()` đã trả lời sẵn câu ấy. Hàm chi tiết phải gọi nó và:

- **chưa ai đụng** → hiện *trước → sau* bình thường;
- **đã có người đụng** → hiện đúng câu *"Người sau đã sửa tiếp, cột SAU dưới
  đây là trạng thái hôm nay chứ không phải kết quả của lần Lưu này"*, và nút
  hoàn tác phải mờ đi kèm lý do.

⚠ **Không nhồi `truoc` vào `ds_kiem_duyet()`.** Nó nặng; chỉ lấy khi người dùng
mở một dòng. Thiết kế hiện tại đúng, đừng "sửa cho gọn".

**Rỗng:** *"Không có mục nào đang chờ kiểm duyệt."* — với hai lọc kia thì
*"Chưa có lần Lưu nào ở trạng thái này."* Không vẽ bảng trống.

### Khu 4 — Sao lưu & khôi phục

| | |
|---|---|
| **Ai vào được** | **Chỉ `quan_tri_he_thong`.** Không cho `quan_tri` |
| **Hiện gì** | Lần sao lưu gần nhất *(ngày giờ · tên file · dung lượng · đạt/hỏng)* |

**Và khối *Số đếm đối chiếu*** — đây là chỗ mấy con số ChatGPT gạt đi tìm được
việc thật để làm:

```
Hôm nay          Bản sao lưu 05/09 03:00
persons     681       681
unions      273       273
union_children  412   412
tree_members  42       42
change_log   1.284   1.281      ← lệch 3, đúng: sau khi sao lưu có 3 lần Lưu
```

⚠ **Đây không phải trang trí, nó là con chim hoàng yến trong hầm mỏ.** Cả dự
án này kiểm chứng bằng bảng đối chiếu số đếm — di dời dữ liệu 04/09 khớp *7/7
dòng*, và chính bảng ấy **là** phép kiểm; `09-doi-ma-vai.sql` cũng thế. Ngày
nào `persons` đọc ra 640 là biết ngay, chứ không đợi tới lúc ai đó mở sơ đồ
thấy thiếu ông nội mình.

Giá phải trả: **một hàm RPC rẻ** trả 5 con số. Không phá luật *"trang Quản trị
không nạp cả cây"* — nó trả năm số, không trả 681 dòng.

⚠ **KHÔNG vẽ nút "Khôi phục" khi máy chủ chưa khôi phục được.** Đây là chỗ
ChatGPT nói đúng và phải giữ nguyên: *"không giả vờ giải quyết bằng giao diện"*.
Hôm nay chưa ai thử khôi phục lần nào — có file sao lưu **không** đồng nghĩa
khôi phục được. Khu này ban đầu chỉ **hiện trạng thái**, và nói thẳng một câu:
*"Sao lưu không chép nội dung ảnh, chỉ ghi tên và dung lượng."*

---

## 5. Bảng quyền

| Thao tác | `quan_tri_he_thong` | `quan_tri` | `sua` | `xem` |
|---|:---:|:---:|:---:|:---:|
| Mở `QuanTri.html` | ✓ | ✓ | ✓ | ✓ |
| Khu 1 · xem danh sách gia phả | ✓ | ✓ | ✓ | ✓ |
| Khu 1 · chọn gia phả | ✓ | ✓ | ✓ | ✓ |
| Khu 2 · xem thành viên | ✓ | ✓ | ✗ | ✗ |
| Khu 2 · đổi vai | ✓ | ✗ | ✗ | ✗ |
| Khu 2 · gắn / đổi mã người | ✓ | ✗ | ✗ | ✗ |
| Khu 2 · bật / tắt `tin_cay` | ✓ | ✗ | ✗ | ✗ |
| Khu 2 · duyệt / từ chối đơn vào họ | ✓ | ✗ | ✗ | ✗ |
| Khu 2 · ⚠ duyệt một **LỜI MỜI** chưa ai nhận | ✗ | ✗ | ✗ | ✗ |
| Khu 2 · gỡ thành viên | ✓ | ✗ | ✗ | ✗ |
| Khu 3 · xem hàng chờ | ✓ | ✓ | ✗ | ✗ |
| Khu 3 · xem chi tiết trước/sau | ✓ | ✓ | ✗ | ✗ |
| Khu 3 · duyệt · từ chối và hoàn tác | ✓ | ✓ | ✗ | ✗ |
| Khu 4 · xem trạng thái sao lưu | ✓ | ✗ | ✗ | ✗ |
| Khu 2 · bật/tắt cờ **Quản trị hệ thống** | ✓ | ✗ | ✗ | ✗ |
| Khu 2 · tích **Quyền dựng gia phả** *(b110b)* | ✓ | ✗ | ✗ | ✗ |

Vai máy `sao_luu` **không dùng giao diện** — nó là script chạy đêm, không có
người ngồi sau để bấm nút.

## 5a. Luật gọi tên cây — chốt 09/09/2026 (b110b)

> *"khi gán quyền, không nên ngầm định gán quyền cho cây đang hoạt động mà cần
> luôn luôn xác định người nào, cây nào, quyền gì."* — chủ dự án

**Không màn hình nào của trang này được ngầm định "cây đang mở".** Một người
có thể dựng nhiều cây, nên câu *"sửa quyền của X"* mà không nói cây nào là một
câu chưa đủ nghĩa — và với nhiều cây thì nó là đổi quyền nhầm chỗ, im lặng.

Chỗ thi hành luật này **không phải câu chữ mà là chữ ký hàm**:

```
veBangViec(t, treeId, …)   →   veBangViec(t, cay, …)
veXetDon  (t, treeId, …)   →   veXetDon  (t, cay, …)
                                cay = { treeId, ten, maCay }
```

Chừng nào tham số còn là `treeId` trần thì nơi gọi còn phải tự bịa một cái
nhãn, và bản 0.7.0 đã bịa đúng như thế (`'Gia phả đang mở'`). Kèm theo:

- mỗi bảng việc mở đầu bằng `dongCay()` — *"Gia phả bị tác động: <tên> · <mã>"*;
- tiêu đề khung và câu giải thích của mỗi việc gọi đúng tên cây ấy;
- ba tấm lọc cây có một dòng *"Đang xét quyền trong: …"* dưới dòng danh tính;
- ô chọn gia phả ở form **Mời** mở ra ở mục trống, nút Gửi khoá tới khi chọn.

**Ngoại lệ, và chỉ có hai** — hai cờ ở tầng tài khoản (mục 4, khu 2). Chúng
không hỏi cây nào vì câu ấy không có câu trả lời, và nhãn của chúng phải tự
khai điều đó.

### 5b. Chốt 10/09/2026 (b111b) — chỗ CHỌN cây, và luật của cột xuyên cây

Mục 5a bắt mọi màn hình **gọi tên** cây. b111b trả lời nốt câu còn lại: người
dùng **đổi** cây ở đâu, và một cột xuyên cây thì sửa cho cây nào.

**① Khu 2 có ô chọn cây riêng, và nó KHÔNG phải cây đang mở của app.**
Dòng *"Đang xét quyền trong: …"* trước b111b khoá cứng vào `phien.treeId`,
nên muốn sửa quyền ở cây khác thì phải rời trang sang khu 1 đổi cây làm việc
rồi quay lại — tức phải đổi cả phiên của mình để đọc một cái bảng. Nay nó là
một ô chọn, và nó chỉ đổi câu hỏi của khu 2.

⚠ **Đừng gộp nó với "chọn gia phả" của khu 1.** Hai việc khác hẳn nhau: khu 1
đổi cây người ta đang *làm việc* (sơ đồ, biên tập, ảnh); ô này đổi cây người
ta đang *xét quyền*. Gộp lại là để một cú bấm tưởng như lọc một cái bảng lại
im lặng đổi cây đang mở ở tab bên cạnh. Nhãn của ô phải tự khai điều đó.

⚠ **Lọc bằng `co_the_xem` của MÁY CHỦ, không suy vai ở trình duyệt.** Cám dỗ
là chỉ liệt kê cây mình làm chủ hay quản trị — nhưng chủ cây nhận quyền qua
một CỘT (`trees.chu_so_huu`) và Quản trị hệ thống qua một CỜ, nên phép suy từ
`vaiCuaToi` khoá tay đúng hai hạng người có quyền nhất. Đúng cái bẫy mục 7
điều 5 đã cấm. Bỏ cây trong thùng rác, và **một cây thì vẽ chữ chứ đừng vẽ ô
chọn** — một danh sách thả xuống có đúng một mục nói sai một câu: rằng có thứ
để chọn.

**② Cột xuyên cây KHÔNG BAO GIỜ là chỗ sửa.** Cột *Người được gắn* ở tấm
*Toàn hệ thống* trả lời một câu xuyên cây, mà mã người là khái niệm theo TỪNG
cây — nên "sửa ở đó" là một câu chưa đủ nghĩa. Luật:

> Cột xuyên cây **hiện tóm tắt và mở ra bảng theo từng cây**; chỗ sửa nằm
> trong bảng ấy, nơi tên cây đứng ngay bên cạnh ô đang sửa.

Cột **Vai trò** đã đi đúng đường ấy từ b109c; b111b chỉ áp lại cho cột thứ
hai. Nhờ thế không phải đẻ ra hộp thoại *"bạn muốn sửa cho cây nào?"* nào cả
— câu hỏi ấy tự tan khi người ta bấm vào một dòng có tên cây.

⚠ **Tóm tắt phải nói ra phần nó cắt.** Máy chủ trả `nguoi_gan` **trần 3 phần
tử** kèm `so_cay_gan` là số đầy đủ (`luoc-do/20-nguoi-duoc-gan.sql`). Vẽ theo
`nguoi_gan.length` là nói dối ở đúng tài khoản dính nhiều cây nhất — tức đúng
tài khoản người ta mở ra để xem. Dòng *"và n cây khác"* là chỗ trả nợ ấy.

---

⚠ **Mọi ô trong bảng này là mô tả hành vi máy chủ, KHÔNG phải hàng rào.** App
hỏi máy chủ chỉ để hiện một câu giải thích tử tế thay vì một cái bảng trống.
Ai gõ thẳng địa chỉ cũng mở được trang, và cũng chỉ nhận về mảng rỗng.
**Không có `if (vaiTro === …)` nào quyết định bảo mật.**

---

## 6. Hàm máy chủ còn thiếu

### Chắc chắn cần — `luoc-do/10-quan-ly-thanh-vien.sql`

| Hàm | Tham số | Trả về | Ai gọi được |
|---|---|---|---|
| `ds_thanh_vien` | `p_tree` | `table(user_id, email, role, person_id, person_name, approved, tin_cay, xin_luc, loi_nhan, added_at)` | 2 hạng quản trị |
| `doi_vai_thanh_vien` | `p_tree, p_user_id, p_role` | `jsonb` | chỉ `quan_tri_he_thong` |
| `gan_nguoi_cho_thanh_vien` | `p_tree, p_user_id, p_person_id` | `jsonb` | chỉ `quan_tri_he_thong` |
| `dat_tin_cay_thanh_vien` | `p_tree, p_user_id, p_tin_cay` | `jsonb` | chỉ `quan_tri_he_thong` |
| `go_thanh_vien` | `p_tree, p_user_id` | `jsonb` | chỉ `quan_tri_he_thong` |

Bốn điều mỗi hàm phải tự canh trong thân hàm:

1. Người gọi đúng vai — **hỏi `co_the_quan_tri()`**, đừng viết lại phép kiểm.
2. ⚠ **`null not in (…)` cho ra `null`, không cho ra `true`.** Đúng cái bẫy đã
   mở một lỗ leo quyền thật trong `duyet_thanh_vien()` ngày 04/09 — bộ kiểm 57
   phép báo xanh trên chính cái mã thủng ấy. Mọi phép kiểm vai phải hỏi `null`
   trước.
3. Vai mới phải thuộc tập hợp lệ, và **không cho đặt `sao_luu` từ giao diện**.
4. `go_thanh_vien` **chỉ xoá dòng trong `tree_members`**, tuyệt đối không đụng
   `auth.users`.

### ✓ ĐÃ CÓ — `luoc-do/15-tim-kiem.sql` (b109b, 09/09/2026)

| Hàm | Tham số | Trả về | Ai gọi được |
|---|---|---|---|
| `tim_tai_khoan` | `p_tree, p_chuoi` | `table(user_id, email, ho_ten, ma_ngan, person_id, ten_nguoi, trang_thai)`, **trần 8 dòng** | `co_the_quan_tri()` — đúng hàng rào của `moi_vao_cay()` |
| `tim_nguoi_trong_cay` | `p_tree, p_chuoi` | `table(id, ten, nam_sinh, nam_mat, gioi, gan_cho_email)`, **trần 10 dòng** | `co_the_quan_tri()` |
| `dat_ho_ten_tai_khoan` | `p_user, p_ho_ten` | `jsonb` | chỉ Quản trị hệ thống |
| `bo_dau` · `ten_day_du` | `text` · `jsonb` | `text` | ai cũng gọi được — hàm thuần, không đọc bảng |

Ba điều file ấy canh, và cả ba đều có phép đo mượn danh nghĩa
(`kiem-thu/ban-thu-sql/do-b109b.mjs`, 36 phép):

1. **Gác bằng đúng hàng rào của nút nó phục vụ.** Quản trị gia phả *được
   phong* KHÔNG dò được danh bạ — họ cũng không mời được ai.
2. **Không `like` một chỗ nào**, chỉ `position()`. Một chữ `%` trong ô gõ mà
   đi vào mẫu `like` là lấy về tám dòng đầu của cả danh bạ.
3. **Trần số dòng nằm trong hàm**, không ở trình duyệt.

### ✓ ĐÃ CÓ — `luoc-do/17-quyen-tao-cay.sql` (b110b, 09/09/2026)

| Hàm | Tham số | Trả về | Ai gọi được |
|---|---|---|---|
| `dat_duoc_tao_cay` | `p_user, p_bat` — ⚠ **KHÔNG có `p_tree`** | `jsonb` | chỉ Quản trị hệ thống, và **không cho tự trỏ vào mình** |

Cờ này là **cửa thứ bảy** của luật *không ai tự đặt quyền cho mình*, và nó ở
tầng TÀI KHOẢN — `THIET-KE-NHIEU-CAY.md` mục **11.7** kể vì sao nó phải tách
khỏi vai Quản trị gia phả. Đo: `ban-thu-sql/do-b110b.mjs`, 29 phép, 3 kiểm
chứng ngược.

### Cần cho khu 3 và khu 4

| Hàm | Trả về | Ghi chú |
|---|---|---|
| `chi_tiet_kiem_duyet(p_tree, p_id)` | `jsonb` gồm `truoc`, `sau`, và kết quả `dung_do_sau()` | Xem cách dựng `sau` ở khu 3 |
| `dem_du_lieu(p_tree)` | `jsonb` — 5 con số đếm | Cho khối *Số đếm đối chiếu* |

### Chưa chốt, đừng viết vội

- `tao_gia_pha_moi()` — cây mới phải sinh ra **kèm người quản lý**, không được
  đẻ ra một `trees` trơ trọi không ai vào được.
- Nhập GEDCOM/Excel — file có thể lớn, RPC dạng JSON chưa chắc hợp. Và khối
  nhập đang ở lại `index.html` (mục 2), nên chưa cần.
- Khôi phục — Apps Script mới là hệ thống sao lưu thật. **Một RPC SQL không đọc
  được Google Drive**, đừng thiết kế như thể đọc được.

---

## 7. Những gì cố ý KHÔNG làm

1. **Không có dãy ô số ở đầu trang.** Số nằm cạnh việc — trên chính mục điều hướng.
2. **Không đẻ bảng "nhật ký hoạt động" riêng.** `change_log` đã là nhật ký kiểm toán.
3. **Không đẻ bảng `membership_requests`.** Hàng chờ là `tree_members.approved = false`.
4. **Không đụng `branches` / `branch_access`.** Luật trực hệ đã thay chỗ.
5. **Không dựng phân quyền bằng JavaScript.** Máy chủ là hàng rào duy nhất.
6. **Không nhồi `truoc` vào `ds_kiem_duyet()`.**
7. **Không cho sửa từng ô trong màn kiểm duyệt.** Đơn vị là **một lần bấm Lưu**.
8. **Không dựng kho chờ.** Luật đã chốt: ghi thật trước, treo cờ sau.
9. **Không giấu người còn sống trong phiên này.** Bài toán khác — RLS lọc theo
   *dòng*, việc ấy phải lọc theo *cột*. ⚠ Và tuyệt đối **không giải bằng cách
   tải hết về rồi để JavaScript che** — như thế dữ liệu đã lọt xuống trình duyệt.
10. **Không SPA, không router, không framework, không thư viện UI.**
11. **Không dời khối 1, 6, 7 khỏi Cài đặt** — mục 2 nói vì sao.

---

## 8. Hình mã

```
QuanTri.html
    └── js/app-quan-tri.js          ← điểm khởi động, giữ mỏng
            └── js/pages/quan-tri/
                    khung.js        ← thanh điều hướng · `#` địa chỉ · hai con số
                    khu-gia-pha.js
                    khu-thanh-vien.js
                    khu-kiem-duyet.js   ← `quan-tri.js` hiện nay chuyển vào
                    khu-sao-luu.js
                        └── services/sb.js
```

⚠ **Mỗi khu một file, không dồn cả trang vào một JS.** `settings.js` đã phình
tới 1429 dòng vì đi đường ngược lại, và chính điều đó đẻ ra việc xẻ đôi hôm nay.

⚠ **`quan-tri.js` hiện nay ĐỔI TÊN thành `khu-kiem-duyet.js`** — đây là **đổi
tên file mã**, việc phải hỏi chủ dự án trước (`CLAUDE.md` mục 9). Hỏi ở bước
b100, đừng tự làm.

---

## 9. Bản đồ quantri3.html → mã hiện có (b114, 15/09/2026)

> Nguồn: `../codex/dua_claude.ai/quantri3.html` (2620 dòng, NGOÀI repo),
> prototype tĩnh chủ dự án đã duyệt 13/09/2026. Dữ liệu mẫu và JavaScript
> trong đó là mô phỏng — bảng dưới đây chỉ giữ lại **hành vi**, không chép
> HTML/JS mẫu. **Không dòng mã nào trong repo đổi ở bước này.**
>
> ⚠⚠ **ĐÍNH CHÍNH b118c (15/09/2026):** *"không chép HTML/JS mẫu"* là đọc nhầm
> bàn giao AGY — câu ấy cấm dữ liệu mẫu và JS giả lập, **không cấm giao diện**.
> Từ b118c `QuanTri.html` + `quan-tri.css` là bản chép nguyên văn quantri3.
> Địa chỉ `#` vẫn theo 9.2 (khác prototype, không nhìn thấy).

### 9.1 Bốn khu cũ vẫn đúng, đổi khung điều hướng

Prototype giữ đúng bốn khu (Gia phả · Tài khoản · Kiểm duyệt · Quản trị hệ
thống) nhưng **mỗi khu nay có trang chi tiết riêng** thay vì một bảng phẳng:

| Route/section prototype | Khu cũ tương ứng | Ghi chú |
|---|---|---|
| `#gia-pha` (4 chip: manage/member/available/create) | Khu 1 | To hơn hẳn thiết kế cũ — xem 9.3 |
| `#tree-members`, `#tree-invite`, `#tree-requests`, `#tree-detail` | Khu 2 (một cây) | Trang chi tiết theo `data-tree`, mở từ dòng trong `#gia-pha` |
| `#tai-khoan`, `#account-detail` | Cài đặt *(tài khoản của tôi)* + Khu 2 (bảng *Toàn hệ thống* cột *Người được gắn*) | `#account-detail` chính là nơi cắm khối b111c — xem 9.2② |
| `#kiem-duyet`, `#kiem-duyet-chitiet` | Khu 3 | Gần như y nguyên `khu-kiem-duyet.js`, thêm bộ lọc cây/người |
| `#quan-tri-he-thong` (7 tab: tong-quan/so-tai-khoan/tao-tai-khoan/cay-mac-dinh/sao-luu/thung-rac/nhat-ky) | Khu 4 + phần *Toàn hệ thống* của Khu 2 | To hơn hẳn — gộp cả `khu-tai-khoan-he-thong.js` và Khu 4 (Sao lưu) vào một khu, thêm ba tab mới: Tạo tài khoản, Cây mặc định, Nhật ký |
| `#sys-account-trees`, `#public-info-detail`, `#sys-default-tree-selector` | *(mới)* | Trang chi tiết của `#quan-tri-he-thong` |

### 9.2 Trả lời chốt ba câu (`KE-HOACH.md` b114)

**① Khung hiện tại giữ lại gì?** Bốn khu cốt lõi giữ nguyên tên và ranh giới
`import` (mục 1: `QuanTri.html` vẫn không nạp cây). Đổi là **cách đi lại**:
thanh dọc sticky (mục 3 hiện tại) → thanh dọc **vẫn đúng cho danh sách bốn
khu chính** — và prototype cũng vẽ đúng thế: CSS của nó là thanh trái
245px, dưới 850px mới thành hàng thẻ ngang (`@media(max-width:850px)`), khớp
từng chữ mục 3. Câu *"bốn tab NGANG"* ở `KE-HOACH.md` b114 là đọc nhầm
*(đính chính 15/09)*. Cái thật sự mới là **lớp thứ hai**: mỗi khu có thêm trang
chi tiết con (`tree-detail`, `account-detail`, `sys-account-trees`…), điều
hướng bằng nút "← Quay lại", KHÔNG có trong thiết kế mục 3. `quan-tri.css`
vẫn là nơi DUY NHẤT biết bề ngang — layout `.layout` (subnav 205px + 1fr) của
trang chi tiết cũng phải khai báo ở đó, không rải sang file khác. Hai con số
cạnh mục điều hướng (luật 1 mục 3) giữ nguyên, cộng thêm huy hiệu đếm trong
subnav của trang chi tiết (ví dụ *Đơn xin vào ①* ở `#tree-detail`).

✓ **Đã làm ở b115 — và địa chỉ KHÁC prototype.** Không dùng `#tree-detail`
(tên phẳng, mất khu cha) mà `#<khu>/<trang>/<mã>[/<mục>]`, ví dụ
`#gia-pha/cay/NPG473/loi-moi`: nút trên thanh trái tô đúng khu cha, và mã cây
nằm TRONG địa chỉ theo luật 5a. Mục đầu không ghi vào địa chỉ. Trang mới =
một dòng trong `TRANG` của `khung.js`; vỏ (Quay lại · tựa · thanh mục) ở
`trang-chi-tiet.js`. Thanh mục gập thành hàng thẻ ở **1000px**, không 680px:
khoảng 681–1000px thanh trái 210px vẫn còn, thêm 205px thanh mục là nội dung
chỉ còn chừng 200px. Huy hiệu đếm trong thanh mục **chưa làm** — vẫn treo,
đẩy sang sau b116 (ba mục đã có nội dung thật, đếm là việc thêm, không chặn).

**② Khối b111c cắm vào đâu?** Xác nhận đúng gợi ý của `KE-HOACH.md`: nút
**Đề xuất mã người** đứng ở khu Tài khoản, cạnh cột *"Tôi được gắn với ai
trong sơ đồ?"* trong bảng *Các gia phả tôi đang tham gia* (`#tai-khoan`) —
prototype đã có sẵn cột này, chỉ cần thêm nút khi ô đang là "Chưa gắn người".
Khối **xét đơn** (`dsDeXuatGan`/`duyetDeXuatGan`/`tuChoiDeXuatGan`) cắm vào
`#tree-detail` (trang chi tiết một cây), là một mục con cạnh *"Đơn xin vào"*
trong thanh subnav — không phải một tab riêng ở `#quan-tri-he-thong`, vì đề
xuất gắn mã người là việc của TỪNG CÂY, đúng luật 5a *"gọi tên cây"*.

**③ Bộ ảnh `xem-khung-quan-tri.mjs` đi đường nào?** Viết lại kịch bản ở
b118 theo route mới, **giữ nguyên cấu trúc** (mở app → đăng nhập → `#route`
→ chụp) chỉ đổi danh sách route/selector cần chụp — từ 4 khu phẳng thành
4 khu + khoảng 8 trang chi tiết, ước lượng ảnh tăng từ 25 lên ~35-40. Không
sửa file `.mjs` ở b114.

### 9.3 Bảng đối chiếu — mỗi route/chip/nút → hàm `sb.js`

**Khu 1 — Gia phả (`#gia-pha`)**

| Prototype | Hàm `sb.js` | Trạng thái |
|---|---|---|
| Chip *Tôi quản lý* — bảng 9 cột | `layDanhSachGiaPha()` | ✓ đã có |
| Cột *Thành viên và quyền* → mở `#tree-members` | `dsThanhVien(treeId)` | ✓ đã có |
| Cột *Thông tin công khai* → mở `#public-info-detail` | *(mới)* | ✗ THIẾU — xem 9.4 |
| Cột *Cho thấy tên* (checkbox) | `datChoNguoiLaThayTen(treeId, cho)` | ✓ đã có |
| Cột *Cây hiển thị tại sơ đồ* (cây mở ra khi vào sơ đồ, của riêng tôi) | `chonGiaPha(treeId)` → `dat_cay_dang_mo` | ✓ đã có. ⚠ **KHÔNG phải `datCayMacDinh`** — hàm ấy là cây mặc định CẤP HỆ THỐNG cho người lạ *(đính chính 15/09, xem 9.5)* |
| Cột *Mời gia nhập* → `#tree-invite` | `moiVaoCay(treeId, email, vai, maNguoi)`, gợi ý bằng `timTaiKhoan` | ✓ đã có |
| Cột *Đơn xin gia nhập* → `#tree-requests` | `dsChoDuyet(treeId)`, `duyetThanhVien`, `tuChoiThanhVien` | ✓ đã có |
| Cột *Xóa cây* (chỉ chủ cây) | *(mới, khác hẳn `xinXoaCay` hiện có)* | ✗ THIẾU — xem 9.4, mâu thuẫn với luật thùng rác hiện hành |
| Chip *Tôi là thành viên* — *Thoát khỏi gia phả* | *(mới)* `roi_cay(p_tree)` | ✗ THIẾU, đã kiểm: `tree_members` không có luật RLS xoá, và `go_thanh_vien()` **cố ý** chặn tự gỡ *("việc khác, có tên khác, chưa ai xin")*. Hàm mới phải chặn chủ cây *(bàn giao trước)* |
| Chip *Tôi là thành viên* — *Xin đổi quyền* | *(mới)* | ✗ THIẾU, và **không chỉ là một hàm**: lá đơn phải nằm ở đâu đó để chủ cây duyệt — cần cột (vd `tree_members.xin_vai`) + hàm nộp/rút/duyệt. Ô duyệt nằm ở `#tree-requests` |
| Chip *Có thể xin vào* — *Nộp đơn*/*Rút đơn* | `xinVaoCay(loiNhan, treeId)` | ✓ nộp đã có. **Rút đơn THIẾU**, đã kiểm: `tu_choi_loi_moi()` chỉ xoá dòng có `moi_luc` *(lời mời)*, không xoá đơn. Hàm mới `rut_don_xin_vao(p_tree)`: xoá dòng của CHÍNH MÌNH, `approved = false`, `moi_luc is null` |
| Chip *Tạo gia phả mới* (Tên + Ghi chú) | `taoGiaPhaMoi(ten, maCay, note)` | ✓ đã có, kiểm tra form prototype không cho gõ `maCay` tay — đúng, vì `THIET-KE-QUAN-TRI.md` mục 6 ghi "mã cây do hệ thống sinh" |

**`#tree-members`, `#tree-invite`, `#tree-requests`, `#tree-detail`**

| Prototype | Hàm `sb.js` | Trạng thái |
|---|---|---|
| Bảng thành viên + đổi vai | `dsThanhVien`, `doiVaiThanhVien` | ✓ đã có |
| *Bàn giao chủ sở hữu* (chỉ chủ cây) | `doiChuCay(treeId, userIdMoi)` | ✓ đã có |
| *Xóa khỏi gia phả* | `goThanhVien(treeId, userId)` | ✓ đã có |
| Form Mời + ba ô lọc gộp (tên/email/mã) | `moiVaoCay`, gợi ý bằng `timTaiKhoan` — ba ô lọc đồng thời là ĐÚNG hành vi `o-goi-y.js` đã có (`ganGoiY`, `dongTaiKhoan`) | ✓ đã có, chỉ cần nối lại UI ba ô thay vì một ô tìm |
| *Thu hồi lời mời* | `goThanhVien(treeId, userId)` | ✓ **đã có** *(đính chính 15/09)*: hàm xoá dòng bất kể `approved`, gác bằng `co_the_quan_tri()`, và `18` KHÔNG thêm rào lời mời vào hàm này. ⚠ Nhãn nút phải là *Thu hồi lời mời*, không phải *Xoá khỏi gia phả* — người ta chưa từng ở trong |
| `#tree-requests` — Duyệt/Từ chối đơn | `duyetThanhVien`, `tuChoiThanhVien` | ✓ đã có |
| `#tree-detail` — subnav *Tổng quan/Thành viên/Lời mời/Đơn xin vào/Vòng đời* | Bốn mục đầu dùng lại hàm trên; **"Vòng đời"** không rõ nghĩa trong prototype (không có nội dung mẫu) | ⚠ HỎI chủ dự án nghĩa của tab *Vòng đời* trước khi viết mã |

**`#tai-khoan`, `#account-detail`**

| Prototype | Hàm `sb.js` | Trạng thái |
|---|---|---|
| Hồ sơ cá nhân (tên, email, ngày đăng ký) | `nguoiDangNhap()`, `layPhien()` | ✓ đã có |
| Ô *Quyền cấp hệ thống* — hiện cờ QTHT/duoc_tao_cay của chính mình | `layPhien().laQuanTriHeThong` · máy chủ có `duoc_tao_cay()` | ⚠ cờ QTHT **đã có**; cờ dựng cây máy chủ có hàm nhưng `sb.js` **chưa bọc** — thêm vào `layPhien()`, không đẻ lời gọi thứ năm. Lời mời QTHT đang chờ: THIẾU, theo luật 2 ở 9.5 |
| Nút *Chấp nhận*/*Từ chối* lời mời QTHT | *(mới)* | ✗ THIẾU HẲN — xem 9.4, đây là điểm cần chủ dự án chốt trước |
| Bảng *Các gia phả tôi đang tham gia* (+ *Xem thêm*) | `dsCayCuaTaiKhoan(userId)` gọi cho chính mình, hoặc hàm tương đương "cây của tôi" | ⚠ kiểm tra: `dsCayCuaTaiKhoan` hiện chỉ thấy dùng ở khu Thành viên/Quản trị hệ thống (xem cây của NGƯỜI KHÁC) — cần xác nhận nó cũng gọi được cho `userId = chính mình`, hoặc cần bọc lại |
| Nút *Đề xuất mã người* (b111c, xem 9.2②) | `nopDeXuatGan`, `rutDeXuatGan`, `deXuatGanCuaToi` | ✓ đã có — chỉ cần cắm vào UI |
| Đổi mật khẩu, Đăng xuất | `dangXuat()` (đổi mật khẩu qua Supabase Auth, không thấy hàm riêng trong 56 hàm) | ⚠ Đổi mật khẩu THIẾU hàm `sb.js` — cần bọc `supabase.auth.updateUser({password})` |
| `#account-detail` (mở từ khu 4/`#sys-account-trees`) | `dsCayCuaTaiKhoan(userId)` cho tài khoản ĐANG XEM | ✓ đã có |

**`#kiem-duyet`, `#kiem-duyet-chitiet`**

| Prototype | Hàm `sb.js` | Trạng thái |
|---|---|---|
| Ba tấm lọc + bảng | `dsKiemDuyet`, `demChoKiemDuyet`, `coTheKiemDuyet` | ✓ đã có, khớp `khu-kiem-duyet.js` hiện nay |
| Bộ lọc `kd-filter-tree`/`kd-filter-author` | *(không cần RPC riêng)* | ✓ lọc phía trình duyệt trên kết quả `dsKiemDuyet` đã tải — không gọi thêm máy chủ |
| Mở chi tiết, bảng TRƯỚC/SAU | `chiTietKiemDuyet(treeId, id)` | ✓ đã có |
| Duyệt / Từ chối và hoàn tác | `duyetThayDoi`, `tuChoiThayDoi` | ✓ đã có |

**`#quan-tri-he-thong` (7 tab)**

| Tab | Hàm `sb.js` | Trạng thái |
|---|---|---|
| *Tổng quan* — 5 thẻ số | `dsTaiKhoanHeThong()` (đếm), `dem_du_lieu` cho sao lưu | ⚠ `dem_du_lieu(p_tree)` đã ghi THIẾU ở mục 6 cũ, vẫn thiếu |
| *Sổ tài khoản* — bảng 8 cột + hành động | `dsTaiKhoanHeThong`, `datQuanTriHeThong`, `datDuocTaoCay` | ✓ ba cột đầu đã có |
| — cột *Trạng thái* (Khóa/Mở khóa tài khoản) | *(mới)* | ✗ THIẾU HẲN — không có khái niệm "khoá tài khoản" trong 56 hàm, xem 9.4 |
| — nút *Xóa tài khoản* (khóa 60 ngày rồi xoá vĩnh viễn) | `xoaTaiKhoan(userId, emailXacNhan, chuMoi)` | ✗ KHÔNG KHỚP — hàm hiện có xoá NGAY LẬP TỨC kèm chuyển chủ cây, prototype tả một luồng khoá-mềm 60 ngày hoàn toàn khác. Đây là mâu thuẫn thiết kế, không phải chỗ thiếu hàm — xem 9.4 |
| — nút *Bổ nhiệm QTHT* / *Hủy quyền* | `datQuanTriHeThong(userId, bat)` | ⚠ hàm hiện có là SET TRỰC TIẾP một chữ ký; prototype tả hai chữ ký (mời + `chap_nhan_moi_qtht`) — xem 9.4 |
| — nút *Cấp quyền*/*Thu hồi* Tạo gia phả | `datDuocTaoCay(userId, bat)` | ✓ đã có, khớp đúng |
| *+ Tạo tài khoản mới* (form) | *(mới)* | ✗ THIẾU HẲN — cần RPC/Edge Function tạo user trong `auth.users` + hồ sơ, không có trong 56 hàm |
| *Cây mặc định* — chọn cây công khai làm mặc định cho khách | `layCayMacDinh()` · `datCayMacDinh(treeId)` → `cau_hinh.cay_mac_dinh` | ✓ **đã có** *(đính chính 15/09 — bản b114 đầu ghi THIẾU là đọc ngược: chính `sb.js` ghi *"công tắc CẤP HỆ THỐNG"*)*. ⚠ Đây là cửa DUY NHẤT cho người không có chân đọc được một cây — `THIET-KE-NHIEU-CAY.md` mục 11.8 cuối |
| — bảng trường công khai của cây mặc định | *(mới)* | ✗ THIẾU — liên quan tới `#public-info-detail`, xem dưới |
| *Sao lưu & khôi phục* | *(đã có tại Apps Script)* | ⚠ Khu 4 cũ ghi rõ "chỉ hiện trạng thái, không có nút Khôi phục" — prototype khớp đúng (nút Khôi phục `disabled`). Bảng đối chiếu 5 số cần `dem_du_lieu(p_tree)` — THIẾU. Nút *Tải về* file sao lưu — cần đọc từ nơi Apps Script ghi, kiểm tra cơ chế hiện có (`sao-luu/SaoLuu.gs`) trả URL thế nào |
| *Thùng rác* (cây + đơn xin xóa của chủ cây) | `xinXoaCay`, `huyXinXoaCay`, `duyetXoaCay`, `phucHoiCay`, `donThungRac` | ⚠ Có sẵn nhưng **thời hạn lưu giữ khác nhau**: `THIET-KE-NHIEU-CAY.md` mục 11.6 nói 30 ngày, prototype nói **120 ngày** cho cả cây lẫn nhật ký — cần chủ dự án chốt lại một số, xem 9.4 |
| — *Nhật ký hệ thống trong thùng rác* | *(mới)* | ✗ THIẾU HẲN — không có khái niệm "nhật ký vào thùng rác 120 ngày" ở đâu trong thiết kế cũ |
| *Nhật ký* — lọc + xoá thủ công (chọn dòng/chọn theo >30 ngày) | *(mới)* | ✗ THIẾU HẲN — không có bảng nhật ký hệ thống nào trong 56 hàm hay trong thiết kế cũ (mục 7 điều 2 nói *"`change_log` đã là nhật ký kiểm toán"* — nhưng nhật ký ở đây rõ ràng là một khái niệm KHÁC, gồm cả đăng nhập/khoá tài khoản/sao lưu, không chỉ sửa dữ liệu cây) |

**`#sys-account-trees`, `#public-info-detail`, `#sys-default-tree-selector`**

| Prototype | Hàm `sb.js` | Trạng thái |
|---|---|---|
| `#sys-account-trees` — các cây của MỘT tài khoản, đổi vai/gỡ | `dsCayCuaTaiKhoan(userId)`, `doiVaiThanhVien`, `goThanhVien` | ✓ đã có, đúng luật 5b② *"cột xuyên cây mở ra bảng theo từng cây"* |
| `#public-info-detail` — bật/tắt từng trường công khai theo cây | *(mới)* | ✗ THIẾU HẲN — không có bảng cấu hình "trường nào công khai theo từng cây" trong lược đồ hiện có; đây là tính năng RIÊNG TƯ CẤP TRƯỜNG, khác hẳn cờ `cho_nguoi_la_thay_ten` (chỉ bật/tắt cả tên) |
| `#sys-default-tree-selector` | `datCayMacDinh(treeId)` · danh sách cây từ `layDanhSachGiaPha()` | ✓ đã có — xem dòng *Cây mặc định* ở bảng trên |

### 9.4 Tính năng prototype có mà thiết kế cũ (mục 1-8) chưa nói tới

*Bản ghi lúc đối chiếu, TRƯỚC khi hỏi chủ dự án.* ⚠ **Bốn mục ⚠⚠ đã chốt, và
mục 9 đã đính chính — đọc 9.5 trước, danh sách này chỉ còn làm chứng.**

1. **⚠⚠ "Khoá tài khoản" và "xoá tài khoản 60 ngày"** — hoàn toàn mới, và nút
   *Xóa tài khoản* của prototype (khoá mềm, giữ 60 ngày, bảo tồn `persons`)
   **khác hẳn** `xoaTaiKhoan()` hiện có (xoá cứng ngay, chuyển chủ cây bắt
   buộc). Hai luồng không ghép được — phải chọn một. Gợi ý: đổi `xoaTaiKhoan`
   thành luồng mềm theo prototype, thêm cột `tai_khoan.khoa_luc`/`xoa_luc`.
2. **⚠⚠ Bổ nhiệm QTHT hai chữ ký** — `datQuanTriHeThong()` hiện có là **một
   chữ ký** (QTHT gán thẳng). Prototype thêm bước mời + tự chấp nhận
   (`chap_nhan_moi_qtht`). `THIET-KE-NHIEU-CAY.md` mục 11 (dòng 692) mô tả
   `dat_quan_tri_he_thong()` chỉ có luật "không tắt người cuối cùng", KHÔNG
   nhắc hai chữ ký — nghĩa là tính năng này chưa từng được chốt, prototype tự
   thêm. Cần hỏi thẳng: có áp hai chữ ký cho QTHT giống hệt lời mời vào cây
   không, hay giữ nguyên một chữ ký cho gọn?
3. **⚠⚠ Thời hạn thùng rác 120 ngày** — `THIET-KE-NHIEU-CAY.md` mục 11.6 (qua
   `CHI-DAN.md`) chốt **30 ngày**; prototype ghi **120 ngày** cho cả cây và
   nhật ký. Một trong hai sai — hỏi chủ dự án số nào đúng trước khi đụng
   `16-thung-rac-cay.sql`.
4. **⚠⚠ Xóa cây tức thời bởi chủ cây** (khu Gia phả, chip *Tôi quản lý*, nút
   *Xóa cây* dòng 31 — trong prototype nút này KHÔNG có `data-*`/`id` nào,
   tức chưa được nối dây, chỉ là hình vẽ) — ghi chú dòng 585 nói thẳng
   *"cây mất luôn ngay lập tức… không phải hành động làm đơn xin xóa"*, và
   bảng *"Cây gia phả chủ cây đã xóa"* ở `#quan-tri-he-thong` (dòng 603-637)
   vẽ đúng một hàng rào KHÁC: QTHT thấy cây đã bị ẩn NGAY rồi mới chọn
   *Duyệt đưa vào thùng rác* hoặc *Khôi phục lại cho chủ cây*. Nghĩa là
   prototype đổi hẳn thứ tự: **ẩn khỏi chủ cây trước, QTHT xử lý sau** — khác
   luồng hiện có là **chủ cây XIN, QTHT duyệt rồi mới ẩn** (`xinXoaCay` →
   `duyetXoaCay`). Đây là mâu thuẫn thật với `THIET-KE-NHIEU-CAY.md` mục
   11.6, không phải lỗi ghi chú — phải hỏi chủ dự án trước khi viết mã.
5. **Nút *Xin đổi quyền* / *Thoát khỏi gia phả*** (chip *Tôi là thành viên*) —
   hai hàm mới hoàn toàn thiếu: tự thành viên xin đổi vai (khác `doiVaiThanhVien`
   là QTHT đổi cho người khác) và tự rời cây (khác `goThanhVien` là QTHT gỡ).
6. **Rút đơn xin vào cây** (chip *Có thể xin vào*) — thiếu hàm đối xứng với
   `xinVaoCay`.
7. **Thu hồi lời mời đã gửi** (`#tree-invite`) — thiếu, khác `tuChoiLoiMoi`
   (người được mời tự chối).
8. **Tạo tài khoản trực tiếp từ Quản trị hệ thống** — thiếu hẳn, cần đụng
   `auth.users`, có thể phải qua Edge Function chứ không phải RPC thường
   (`security definer` không tạo được user trong Supabase Auth).
9. ~~**Cây mặc định CẤP HỆ THỐNG** — thiếu bảng và hai hàm~~ — **SAI, đã có**
   (`datCayMacDinh` chính là nó). Xem 9.5.
10. **Thông tin công khai theo TỪNG TRƯỜNG** (`#public-info-detail`) —
    thiết kế cũ (mục 7 điều 9) chỉ nói *"giấu người còn sống"* là bài toán
    CHƯA GIẢI; prototype đã vẽ sẵn UI cho nó (8-11 trường, bật/tắt từng ô).
    Đây là tính năng lớn, cần một lược đồ riêng (`luoc-do/22-...`), không
    làm trong b115-b118 — nên tách thành bước riêng SAU b120, đừng cố nhét.
11. **Nhật ký hệ thống** (đăng nhập, khoá tài khoản, bổ nhiệm QTHT, sao lưu…)
    — khác hẳn `change_log` (chỉ ghi thay đổi dữ liệu cây). Cần bảng mới
    (`system_log` hay tương tự) + cơ chế ghi ở mọi hàm liên quan + thùng rác
    nhật ký riêng. Việc lớn, đề nghị tách khỏi b115-b118.
12. **Form Mời — ba ô lọc đồng thời** (tên/email/mã, bấm một kết quả điền cả
    ba) — không phải hàm mới, chỉ là đổi UI của `o-goi-y.js` hiện có (đã đúng
    hành vi, chỉ cần nối dây ba ô thay vì một ô).

### 9.5 ✓ CHỐT 15/09/2026 — bốn câu đã hỏi, bảng đã đính chính, việc phải viết

**Bốn câu — chủ dự án chọn bản prototype cả bốn.** Nguồn đúng là
`THIET-KE-NHIEU-CAY.md` mục **11.9**; ghi lại gọn ở đây để người làm giao diện
không phải lật sang: ① xoá tài khoản = **khoá mềm 60 ngày** · ② bổ nhiệm QTHT
= **hai chữ ký** · ③ thùng rác cây **120 ngày** · ④ chủ xoá cây thì cây **ẩn
ngay**, QTHT duyệt vào thùng rác hoặc trả lại.

**Đính chính bảng 9.3** — bản đầu do agent con dựng, rà lại từng ô "THIẾU"
bằng cách đọc thẳng `sb.js` và `luoc-do/`:

| Ô | Bản đầu ghi | Thật ra |
|---|---|---|
| Cây mặc định hệ thống | THIẾU | **Đã có** — `datCayMacDinh` |
| *Cây hiển thị tại sơ đồ* | `datCayMacDinh` | **`chonGiaPha`** — đọc ngược hai khái niệm |
| Thu hồi lời mời | THIẾU | **Đã có** — `goThanhVien` |
| Rút đơn · thoát cây · xin đổi quyền | THIẾU | Đúng thiếu, nay kèm lý do đã kiểm |

⚠ **Bài học:** danh sách 56 hàm của `sb.js` **không phải** danh sách hàm máy
chủ — `luoc-do/` định nghĩa hơn 70 hàm, nhiều hàm chưa bọc. Nói *"thiếu"* thì
grep `luoc-do/` trước.

**Việc phải viết, chia theo chỗ nó đụng:**

| Nhóm | Việc | Đụng |
|---|---|---|
| **A · chỉ giao diện** | khung + bốn khu + trang chi tiết; ba ô lọc form Mời; nút *Thu hồi lời mời*; ô cây mặc định; khối b111c *(9.2②)* | `QuanTri.html` · `pages/quan-tri/` · `quan-tri.css` |
| **B · `sb.js` không SQL** | `doiMatKhau(moi)` → `auth.updateUser`; thêm cờ *dựng cây* vào `layPhien()` | `sb.js` + ⚠⚠ `kiem-thu/sb-gia.mjs` |
| **C · SQL nhỏ, không đụng vai** | `rut_don_xin_vao` · `roi_cay` | file `luoc-do/22` mới |
| **D · SQL theo bốn quyết định** | QTHT hai chữ ký · khoá mềm tài khoản · `16` sửa ẩn-ngay + 120 ngày · xin đổi quyền *(cột + ba hàm)* | `14` · `16` · `18` — ⚠ **đụng `la_quan_tri_he_thong()` và `co_the_xem_cay()`**, nền móng quyền |
| **E · tách sau b120** | tạo tài khoản mới · công khai theo từng trường · nhật ký hệ thống | lược đồ mới mỗi việc |

⚠ **Nhóm D đứng SAU nhóm A** theo đúng luật thứ tự của `KE-HOACH.md` — *việc
đụng vai đứng sau việc không đụng*. Giao diện của bốn quyết định vẽ trước,
nút gọi hàm chưa có thì **mờ sẵn kèm lý do** *("máy chủ chưa hỗ trợ")*, không
giả vờ chạy.

⚠⚠ **Tạo tài khoản mới cần khoá `service_role`** — `auth.admin.createUser`
không gọi được bằng khoá công khai. Khoá ấy **tuyệt đối không vào repo**:
repo Public, và lịch sử git giữ cả bản đã xoá. Đường duy nhất là Edge Function
đọc khoá từ biến bí mật của Supabase — việc riêng, nhóm E.

**✓ Đã hỏi và chốt 15/09/2026 (b116):** tab *Vòng đời* = *Bàn giao chủ* +
*Xoá cây*, đúng dự đoán. Đã viết ở `trang-cay.js` mục `vong-doi`, dùng lại
`doiChuCay` · `xinXoaCay`/`huyXinXoaCay`/`duyetXoaCay` đã có, không hàm mới.

**✓ Làm ở b117 (15/09/2026) — khu 2 và `#account-detail`.** Địa chỉ khác
prototype, cùng lý do b115: `#thanh-vien` (khu, `ma` giữ nguyên) và
`#thanh-vien/tai-khoan/<mã ngắn>` thay cho `#tai-khoan` · `#account-detail`.
Ba quyết định, lý do đầy đủ ở `nhat-ky/b117-khu-tai-khoan.md`:
① khu 2 **không còn ô chọn cây và ba tấm lọc** — bảng quyền một cây đã sống ở
trang cây từ b116, giữ cả hai là hai chỗ đổi quyền; bảng *Các gia phả tôi tham
gia* gọi tên cây trên từng dòng nên luật 5a không mất gì;
② trang chi tiết tài khoản **chỉ đọc**, mỗi dòng cây là liên kết sang bảng
của đúng cây ấy (5b②);
③ cột *"Tôi được gắn với ai?"* đọc dòng `tree_members` của chính mình qua RLS
(`chanCuaToi`), vì `ds_cay_cua_tai_khoan()` chỉ Quản trị hệ thống gọi được.
Chip *Toàn hệ thống* tạm ở khu 2 tới b118.

⚠ **Khuyến nghị cũ, viết trước khi hỏi** *(9.5 thay thế)*: mục 5, 6, 7, 12 và khung điều hướng
(9.1/9.2①) là **vừa sức bốn bước đã định**, không đụng luật đã chốt ở đâu.
Mười mục còn lại (1, 2, 3, 4, 8, 9, 10, 11 và câu hỏi *"Vòng đời"* ở
`#tree-detail`) đều cần **chủ dự án chốt một câu trả lời cụ thể trước khi
viết mã**, vì bốn mục đánh dấu ⚠⚠ (1, 2, 3, 4) mâu thuẫn thẳng với luật đã
có (không phải chỗ thiếu hàm mà là chọn lại luật), và ba mục 9, 10, 11 nên
tách thành bước riêng sau b120 vì mỗi mục là một lược đồ bảng mới, không
phải một hàm lẻ.
