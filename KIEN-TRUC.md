# KIẾN TRÚC — app gia phả trên nền Supabase

*Lập 03/09/2026 · Nhánh Supabase · thay cho `DOC-KHUNG.md`*

> **Đọc file này khi**: mới vào nhánh Supabase lần đầu, hoặc sắp đụng vào
> `services/`, hoặc sắp "dọn dẹp" một chỗ trông có vẻ thừa.
>
> **Mục 6 — "Còn dở" — là mục quan trọng nhất.** Đừng đọc mục nào khác mà bỏ
> nó, và đừng mô tả những thứ trong đó như đã làm xong.

---

## 1. Nguyên tắc gốc — chỉ HAI file phải viết lại

`BAT-DAU.md` mục 1 nói thẳng:

> *"Nếu làm đúng thì `domains/` và `pages/` gần như giữ nguyên, và chỗ phải
> viết lại là `services/gas.js` + `services/repo.js`. Ngày nào thấy mình đang
> sửa `domains/` là ngày phải dừng lại hỏi vì sao."*

**Đã nghiệm thu 03/09/2026.** Đếm chính xác sau khi chuyển xong:

| Thư mục | Số file | Đã sửa |
|---|---|---|
| `js/domains/` | 10 | **0** |
| `js/utils/` | 7 | 1 — `image.js`, đổi cách dựng đường dẫn ảnh |
| `js/pages/` | 21 | 1 sửa · 1 mới · 7 file đổi **một dòng `import`** |
| `js/services/` | 4 | viết mới cả bốn |
| `js/` gốc | 4 | `state.js` sửa nhẹ · `cau-hinh.js` mới |

Mấu chốt nằm ở một câu: **`services/repo.js` giữ nguyên chữ ký hàm công khai**
(`khoiTao` · `napCay` · `luuCay(apDung, moTa)` · `suaDuoc` · `docDuoc`), và bên
trong nó **ráp các dòng Postgres trở lại đúng hình `state.tree` cũ**. Nhờ thế
`buildIndex`, `bloodline`, `layout`, `render` và hai mươi màn hình không hề
biết dữ liệu đã đổi nhà.

---

## 2. Bản đồ thư mục

Trên máy là `Claude_Code/supabase/`; trên GitHub là **gốc** repo
`trongdung1982/giapha-supabase`. Hai chỗ ấy là một — không có thư mục con nào
ở giữa, nên địa chỉ app là `https://trongdung1982.github.io/giapha-supabase/`.

```
supabase/  (= gốc repo giapha-supabase)
├── CHI-DAN.md              ← đọc đầu mỗi phiên. Trần cứng 80 dòng
├── KIEN-TRUC.md            ← file này
├── DU-LIEU.md              ← lược đồ bảng + luật dữ liệu
├── KE-HOACH.md             ← đang làm gì, còn treo gì
├── HUONG-DAN-DUNG-BANG.md  ← cho chủ dự án, không phải cho AI
├── BAT-DAU.md              ← vì sao chuyển nhà (chứng cứ gốc, không sửa)
├── KE-HOACH-HA-TANG-Supabase_V01.md   ← các bước H1–H10
├── index.html · robots.txt · .gitignore
│
├── nhat-ky/
│   ├── INDEX.md            ← một dòng một bước + bảng Đính chính
│   └── bXX-*.md            ← mỗi bước một file, không bao giờ sửa lại
│
├── luoc-do/                ← SQL, dán tay vào Supabase, chạy theo số thứ tự
├── sao-luu/                ← mã Apps Script chạy nền + hướng dẫn dựng
├── kiem-thu/               ← bài kiểm chạy bằng Node, không cần mạng
└── js/
    ├── cau-hinh.js         ← ⚠ file DUY NHẤT chủ dự án sửa tay
    ├── config.js · state.js · app.js
    ├── utils/ · domains/ · pages/
    ├── services/
    │   ├── sb.js           ← cầu nối duy nhất xuống Supabase
    │   ├── hinh-dang.js    ← dòng ⇄ cây, và so hai cây ra khác biệt
    │   └── repo.js         ← viết lại, giữ nguyên chữ ký
    └── vendor/             ← thư viện người khác, chép nguyên, KHÔNG sửa
```

---

## 3. Cửa ghi duy nhất — điều khác hẳn bản Drive

```
ĐỌC  →  cơ sở dữ liệu tự lọc theo quyền (policy trong 02-rls.sql)
GHI  →  KHÔNG một policy insert/update/delete nào. Cửa duy nhất là luu_cay()
```

Vì sao khắt khe thế, khi cấp quyền ghi từng dòng nghe đã đủ?

`BAT-DAU.md` mục 2 nêu hai điều bản Drive không làm được, và điều thứ hai là
*"chặn Editor sửa tay file JSON ngoài app"*. Nếu bảng `persons` có policy cho
insert/update, người biên tập mở `curl` ghi thẳng vào REST API — không qua app,
không kiểm tra hợp lệ, không sinh `change_log`, không tăng `revision`. Điều
thứ hai **vẫn chưa làm được**, chỉ đổi chỗ từ Drive sang REST.

Đóng hẳn đường ghi rồi mở đúng một cửa thì `change_log` và `revision` thành
thứ **không thể vòng qua**, chứ không phải thứ app tử tế thì mới ghi.

⚠ **Cái giá:** `luu_cay()` buộc phải `security definer`, tức chạy vượt RLS.
Toàn bộ phép kiểm quyền dồn vào một hàm — một lỗi trong đó là thủng toàn bộ,
và thủng im lặng, không có lớp thứ hai đứng sau đỡ. Vì thế **phép thử H9 là
bắt buộc**: hai tài khoản thật, mỗi tài khoản một nhánh, xác nhận bằng mắt.

---

## 4. Hai vết sẹo có chủ ý — đừng "sửa" lẻ

Cả hai là chỗ **tên gọi nói dối về nội dung**. Cả hai cố ý giữ, vì sửa chúng
nghĩa là chạm vào `domains/`.

| Vết | Nói dối chỗ nào | Vì sao giữ |
|---|---|---|
| Cột `drive_file_id`, trường `driveFileId` | Không còn Drive nào; giá trị nay là đường dẫn kho Supabase | `domains/media.js`, `gedcom.js`, `excel.js` và bảy màn hình đọc/ghi trường này ở hơn ba mươi chỗ |
| Hàm `driveThumbUrl()` | Tra URL có chữ ký (kho kín, mục 7), và **bỏ qua tham số `size`** | Tám chỗ gọi, một trong đó là `domains/render.js` |

**Chủ dự án chốt 30/09/2026: KHÔNG đổi tên.** Người dùng không thấy gì, còn cái
giá là `domains/` + cột CSDL + khôi phục bản sao lưu cũ. Tên cũ ở lại, bảng
này là lời giải thích.

*(Vết thứ ba — giàn giáo `services/tuong-thich.js` — đã tháo và xoá ở b161b,
30/09/2026: màn cuối cùng dựa vào nó, `chon-gia-pha`, nay gọi thẳng `sb.js`.)*

---

## 5. Thư viện nạp bằng thẻ `<script>`, không bằng `import`

Supabase **không phát hành bản ES Module một file**. Bản duy nhất chạy thẳng
trong trình duyệt không qua bước build là bản UMD, và nó đặt biến toàn cục
`window.supabase`.

Ba đường, hai đường đầu hỏng ở chỗ khác nhau:

| Đường | Hỏng ở đâu |
|---|---|
| `dist/module/index.js` | Tên gói trần, trình duyệt không tra được. Muốn chạy phải có bước build — thứ `CLAUDE.md` mục 3 cấm |
| `esm.sh` / jsdelivr `+esm` | Chạy được, nhưng là file **đã bị biến đổi** bởi máy chủ người khác. Không có bản gốc để đối chiếu MD5 |
| **`dist/umd/supabase.js`** ✓ | File Supabase tự dựng và tự phát hành. CDN chỉ chuyển phát nguyên bản |

Cái giá dồn hết vào **một chỗ**: `services/sb.js` đọc `window.supabase` thay
vì `import`. Đó cũng chính là file đã được giao làm ranh giới với thế giới bên
ngoài — nên nó không tạo ra chỗ rò rỉ mới, chỉ làm ranh giới sẵn có dày thêm
một dòng.

⚠ Thẻ `<script src="js/vendor/supabase.js">` phải đứng **trước**
`<script type="module" src="js/app.js">`. Đổi chỗ là app hỏng, và hỏng bằng một
câu lỗi không nói gì về nguyên nhân.

Chi tiết và cách nâng cấp: `js/vendor/DOC-VENDOR.md`.

---

## 6. ⚠ CÒN DỞ — đừng mô tả như đã có

**Đã chạy thật 03/09/2026** — bốn file SQL đã chạy, đăng nhập được, thêm được
người mới. *(Dòng cũ ở đây nói "chưa chạy thật lần nào"; đúng cho tới b89.)*

Nhưng **phân quyền RLS thì chưa ai kiểm chứng lần nào** — đó là phép thử H9,
và nó vẫn còn nguyên. Các bộ kiểm dưới đây chạy trong Node, **không đụng
mạng**, nên chúng **không** chứng minh RLS chặn đúng:

| Bộ kiểm | Kết quả | Chứng minh được gì |
|---|---|---|
| `kiem-thu/kiem-hinh-dang.mjs` | **19/19 đạt** trên gia phả 59 người | Logic thuần đổi hình dữ liệu |
| `kiem-thu/kiem-sao-luu.mjs` | **33/33 đạt** | Mã trigger sao lưu, với Supabase và Drive giả |
| `kiem-thu/kiem-di-doi.mjs` | **46/46 đạt** | Bộ sinh SQL di dời — bóc ngược dữ liệu ra khỏi file SQL rồi so lại với cây nguồn. **Không chạy SQL** |
| Đồ thị `import` | **47/47** nối được | App nạp được, không thiếu module |
| `/kiem-tra` | đạt cả 10 phép | Không vi phạm phân lớp · phép 10: không đẻ thêm rác (`QUY-TAC-GON.md`) |

**Giới hạn theo nhánh chưa có hiệu lực.** Bảng `branches` và `branch_access` đã
dựng, hai hàng rào trong `luu_cay()` đã đứng đúng chỗ, nhưng hàm
`co_the_sua_nguoi()` còn **bỏ qua** tham số nhánh và trả lời như bản Drive.
Chưa viết đủ được vì **chưa ai định nghĩa "chi/nhánh"**. Đoán bừa một quy tắc
rồi để RLS thi hành là cách tệ nhất: sai thì không ai thấy, người ta chỉ thấy
*"không sửa được ông nội mình"* mà không hiểu vì sao.

**Sao lưu: ĐÃ CHẠY THẬT 04/09/2026 08:33.** Bước **H8** đóng trọn.
`sao-luu/SaoLuu.gs` chép cả 12 bảng cộng danh sách tài khoản ra một file JSON
trên Drive mỗi đêm, và mỗi lần chạy cũng là một lần giữ cho gói miễn phí
Supabase khỏi tự tạm dừng sau 7 ngày. Bản đầu tiên:
`tai-lieu/tailieu-Supabase/giapha-sao-luu-2026-09-04-0833.json`.

Hai chỗ hở còn nguyên, đừng mô tả hơn thế:

1. **Chưa ai thử KHÔI PHỤC.** Có file sao lưu không đồng nghĩa khôi phục được;
   chuyện thứ hai chỉ chứng minh được bằng cách đổ ngược vào một project trống.
2. **Ảnh không được chép**, chỉ được liệt kê. Xem mục 7.

**Di dời dữ liệu (H5): mã xong, chưa ai dán.** `luu-tru/sinh-sql-di-doi.mjs` *(lưu trữ 30/09/2026 — lạc hậu từ `26`, không chạy)*
sinh một file `.sql` để chủ dự án dán vào SQL Editor — không đi qua `luu_cay()`,
và đó là **cố ý phá lệ cửa ghi duy nhất** cho đúng một việc làm một lần, ngoài
app, do chính chủ dự án bấm. Lý do đầy đủ ở `KE-HOACH.md` việc 2. Ngày nào
thấy app gọi tới `luu-tru/` là ranh giới đã vỡ.

⚠ Đây là dự án Apps Script **RIÊNG**, không phải `giapha/gas/`. Bước H8 của
`KE-HOACH-HA-TANG-Supabase_V01.md` viết *"gỡ deploy dạng web app"* — câu ấy viết
24/08/2026, trước khi có quyết định giữ bản Apps Script chạy tiếp cho người
trong họ. **Gỡ deploy hôm nay là tắt app của cả họ.** Không làm.

**Màn hình thời Drive chưa làm lại — BỎ HẲN** (chủ dự án chốt 30/09/2026,
b161b): *Bỏ chọn gia phả* (không có ích thực dụng) và *Mở quyền xem ảnh*
(kho Supabase một luật cho cả kho — mục 7). Màn Sao lưu cũ đã xoá ở b149.

✓ **Dựng gia phả mới — XONG 08/09/2026 (b104).** Hàm `security definer` ấy nay
có tên: `tao_gia_pha_moi()` trong `luoc-do/12-tao-cay.sql`, và lối vào là nút
*+ Dựng gia phả mới* ở khu Gia phả của trang Quản trị. `repo.taoGiaPhaMoi()`
thôi trả `'chualam'`. ⚠ Còn chờ chủ dự án dán hai file SQL.

**Giấu chi tiết người còn sống với người chỉ có quyền xem** — mã xong ở b148
(`luoc-do/50`, bàn thử 40/40); trạng thái dán: `KE-HOACH.md`. Máy chủ che trong
`doc_cay()` và bỏ dòng ở các bảng đọc thẳng; `state.daLocNguoiConSong` +
`state.nguoiBiChe` do máy chủ bật. Luật + hệ quả: `so-tay/phan-quyen.md`.

**Lỗi trên điện thoại đi theo.** `BAT-DAU.md` mục 5 việc 1: chọn số đời không
tự vẽ lại sơ đồ trên điện thoại. `pages/tree-view.js` chép nguyên sang, nên lỗi
ấy chép nguyên theo. Chưa đo, chưa biết gốc.

**Tên miền `nguyentrongbac.io.vn` đã gắn 03/09/2026** — DNS ở BKNS trỏ bốn bản
ghi `A` về GitHub Pages, `www` là `CNAME`, file `CNAME` nằm ở gốc repo. Cả
`www` lẫn địa chỉ cũ `trongdung1982.github.io/giapha-supabase/` đều `301` về
tên miền mới. Chứng chỉ Let's Encrypt cấp cho `CN=nguyentrongbac.io.vn`, hạn
tới 02/12/2026, GitHub tự gia hạn.

✓ **Ô *Enforce HTTPS* đã tích** cuối ngày 03/09/2026; đo lại: `http://` trả
`301` sang `https://`. *(Dòng cũ ở đây từng ghi việc này còn treo.)*

---

## 7. Ảnh: kho KÍN (chủ dự án chốt 30/09/2026, b161a)

`luoc-do/59` tắt `public` của kho `anh` và thêm luật đọc `xem_anh` →
`co_the_xem_anh(ten)`: QTHT · xem được cây mang tên thư mục đầu · xem được
một cây chứa người/cặp mà ảnh thuộc về (người xuyên cây).

Đường đi của một tấm ảnh trên màn hình:

1. `repo.napCay()` gom mọi đường dẫn ảnh của cây → `sb.kyAnh()` xin chữ ký
   một lượt (lô 300, hạn 6 giờ, 3 giờ ký lại ngầm) → `utils/image.js`
   `ghiChuKy()`.
2. `driveThumbUrl()` vẫn **đồng bộ** — tra bảng chữ ký; chưa có thì rơi về
   đường công khai cũ (hỏng sau khi dán `59` → nơi gọi giữ bóng người).
   Bảng chữ ký là trạng thái duy nhất của `utils/image.js`, chỉ `repo.js` ghi
   — cái giá để `domains/render.js` không phải chờ mạng.
3. Ảnh vừa tải lên: `repo.taiAnh()` ký luôn. Người cây khác chọn ở ô gợi ý:
   `repo.docNguoiTheoMa()` ký luôn.

⚠ Chưa kín bằng dữ liệu ở MỘT chỗ: nhóm *Ảnh* tắt cho khách/vai xem chỉ bỏ
đường dẫn khỏi `doc_cay()`; ai đã biết sẵn đường dẫn mà xem được cây thì vẫn
xin được chữ ký. Chữ ký lọt ra ngoài sống tối đa 6 giờ.

### Sao lưu ảnh — đã vá ở b154

`sao-luu/SaoLuu.gs` 0.7.0 chép ảnh sang Drive (`Anh/<mã cây>/`) mỗi đêm một
ít, và `khoiPhucAnh` tải ngược lên. Đọc qua cửa `/object/authenticated/`, nên
đổi kho sang kín ở câu hỏi trên KHÔNG làm hỏng sao lưu. Chi tiết:
`so-tay/sao-luu.md`.
