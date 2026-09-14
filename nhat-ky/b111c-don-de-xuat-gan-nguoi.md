# b111c — Đơn ĐỀ XUẤT gắn mã người, và cái nút không bao giờ được vẽ ra

*14/09/2026 · nhánh Supabase · Opus 5*

---

## Làm gì

1. `luoc-do/21-de-xuat-gan-nguoi.sql` (file mới, 661 dòng) — bảng
   `de_xuat_gan_nguoi` + sáu hàm. **Đo 67/67 trên bàn thử SQL**, gồm ba phép
   kiểm chứng ngược. **CHƯA DÁN** lên máy chủ thật.
2. `services/sb.js` 0.18.0 — sáu cửa. `kiem-thu/sb-gia.mjs` 0.8.0 bù đủ sáu
   tên, cộng ba dòng đơn giả là ba ca thật.
3. `pages/quan-tri/khu-thanh-vien.js` 0.11.0 — dòng của chính mình đổi từ
   **khoá câm** sang **khoá kèm nút Đề xuất**; khu mọc thêm khối xét đơn.
4. `pages/quan-tri/khu-gia-pha.js` 0.7.2 — **vá lỗi chủ dự án báo**.
5. `kiem-thu/kiem-trang-quan-tri.mjs` — vá một phép kiểm chứng ngược đã mục.
6. `domains/render.js` 1.9.1 — bỏ làm mờ ảnh vợ/chồng, commit vào **cả hai**
   repo cùng lúc.

Đẩy: `810fd50` (b111c) và `0485a2b` (render) lên `giapha-supabase`.

---

## Vì sao

### Vì sao có bước này: một luật đúng để lại một người không có đường nào

Luật *"không ai đặt quyền cho chính mình"* gác bảy cửa, và cửa thứ HAI là gắn
mã người — tự trỏ mình vào một cụ tổ mở `pham_vi_sua()` ra cả một nhánh mà
không đổi một chữ vai nào. Luật ấy đúng, và b111c **không** mở khoá nó.

Nhưng nó để lại một người — kể cả Quản trị hệ thống, kể cả chủ cây — không có
đường nào nói ra câu *"tôi chính là người này trong sơ đồ"*. Trước bước này
dòng của họ khoá câm: một cái nút xám kèm `title` giải thích, và hết.

Chủ dự án chọn đường 10/09/2026, nguyên văn: *"Đơn đề xuất, người khác duyệt"*
— **không** mở khoá cho Quản trị hệ thống tự gắn, và **không** dừng ở một câu
chỉ đường. Nên `duyet_de_xuat_gan()` thành **cửa thứ TÁM** của chính luật ấy.

### Phép đo đáng tiền nhất: gỡ hàng rào ra để chứng minh nó là hàng rào

`do-b111c.mjs` phép **KC1** không hỏi *"tự duyệt có bị chặn không"* — câu ấy
xanh được nhờ một thứ khác chặn hộ, đúng cái bẫy `18` mục HR3 đã sập (một
phép xanh trên mã thủng, vì chỉ mục `unique` chặn chứ không phải hàng rào).

Nó **gỡ từng lớp ra**:

| Đo | Kết quả |
|---|---|
| gỡ lớp 1 (cửa trong `21`) | lớp 2 vẫn giữ — hai lớp độc lập thật |
| gỡ **cả hai** lớp | tự duyệt **CHẠY ĐƯỢC**, và `person_id` **bị ghi** |
| dán lại `21`, lớp 2 vẫn gỡ | một mình lớp 1 cũng đủ chặn |
| phục hồi cả hai | chặn lại |

Cảnh nguy hiểm có thật, đo được, và hai lớp không phải một lớp viết hai lần.

### Lỗi chủ dự án báo: cái nút không bao giờ được vẽ ra

Chủ dự án báo: *"app đã có nhiều tài khoản hệ thống, đã bấm mời, nhưng tài
khoản hệ thống bấm chấp nhận không được."*

Không phải máy chủ. `ds_gia_pha()` vẫn trả `duoc_moi` + `moi_vai` đầy đủ, và
`nhan_loi_moi()` vẫn nhận. Lỗi nằm ở **thứ tự hai câu `if`** trong
`veOThaoTac()`: cột *Cây làm việc* hỏi `coTheXem` **trước** `duocMoi`.

Mà `co_the_xem_cay()` trả `true` ở **mọi** cây cho Quản trị hệ thống — nên
người có quyền cao nhất hệ thống là người **duy nhất** không nhận được một lời
mời nào. Cùng câu `if` ấy che luôn lời mời vào **cây mặc định**, với **tất cả**
mọi người.

Câu rút ra, và nó rộng hơn cái lỗi: **xem được không phải là có chân trong
cây.** Một Quản trị hệ thống đọc được mọi cây vẫn cần một dòng `tree_members`
mang `approved` — thứ `vai_tro()` đọc, thứ quyền trực hệ và ô gắn mã người neo
vào. Trộn hai khái niệm ấy lại là để một lời mời treo mãi: không ai nhận được
mà cũng không ai từ chối được.

Nay khi cả hai cờ cùng đúng thì vẽ **cả hai** thứ — dấu tích và khối Nhận/Từ
chối.

### Một phép kiểm chứng ngược đã mục từ b111b mà vẫn báo xanh

`kiem-trang-quan-tri.mjs` phép **G19** gieo lỗi bằng:

```js
JS_TK.replace(/\|\| trangThai === 'duocmoi'/, '')
```

`String.replace` với regex **không cờ `g`** chỉ thay **lần khớp đầu tiên**. Từ
b111b chuỗi ấy có **hai** chỗ trong file, và chỗ đầu là `khoa:` của
`veONguoiGan()`, đứng trước `khoaMo` chừng 60 dòng. Nên phép gieo đi cắt một
câu KHÁC, `khoaMo` còn nguyên, regex vẫn khớp — phép báo *"không bắt được"*.

Đã kiểm chứng trên bản HEAD: hỏng y nguyên **trước** b111c. Không phải bước
này làm hỏng, bước này chỉ là bước đầu tiên chạy lại bộ ấy kể từ b111b.

Bài học rộng hơn chính phép này: **một phép gieo lỗi bằng `replace` không cờ
`g` là một phép đo neo vào THỨ TỰ các dòng trong file.** Thêm một dòng ở trên
là phép đo lặng lẽ đổi chỗ nó đang đo. Neo vào tên biến, đừng neo vào *"lần
xuất hiện đầu tiên"*.

### Hai lỗi chỉ ảnh chụp mới bắt được

237 phép bất biến xanh, mô-đun nạp được, mà ảnh `kq-23.png` cho thấy:

1. Khung đề xuất tự giới thiệu là **"Sửa quyền của trongdung1982@gmail.com"**
   — `moBangViec()` chọn tiêu đề theo `t.daDuyet`, và nó không biết từ b111c
   cùng chỗ đứng ấy mở ra được hai loại khung khác hẳn nhau. Tức khung dựng ra
   để **giữ** luật lại tự xưng là đang **phá** luật ấy.
2. Dấu `**` markdown lọt thẳng ra màn hình — `textContent` không hiểu markdown.

Cả hai đều hợp lệ với mọi phép kiểm văn bản. Đây là lần thứ N ảnh chụp trả
tiền cho chính nó.

### `render.js`: nội dung giống nhau mà `md5` vẫn lệch

Phép 9 của `/kiem-tra` báo lỗi ở `render.js`. Đo ra: nội dung hai bản **giống
hệt từng chữ**, chỉ bản `supabase/` đã bị đổi sang **CRLF** (845 dòng). Trả về
LF là khớp bit-với-bit.

Đáng ghi vì phép 9 đúng khi báo lỗi — *"khác một byte"* là khác thật — nhưng
câu trả lời không phải *"ai đó sửa mã"* mà là *"một công cụ Windows đã ghi lại
file"*. Hai nguyên nhân ấy dẫn tới hai việc làm khác hẳn nhau, nên phải đo
trước khi kết luận.

---

## Còn treo

- **`21` chưa dán.** Điểm dừng thật của bước này chỉ đóng được sau khi dán.
- **Thành viên thường không có đường nộp đơn.** `ds_thanh_vien()` gác bằng
  `co_the_kiem_duyet()`, nên khu Tài khoản chỉ quản trị mở được — đúng đối
  tượng của b111c (người bị luật khoá tay là người CÓ quyền), nhưng một Thành
  viên thường muốn tự nhận mã người thì vẫn phải nhắn cho quản trị.
- **Màn hình khởi động chưa nói gì về lời mời treo với Quản trị hệ thống.**
  `layPhien()` cho họ đi thẳng vào app (`trangThai: 'daduyet'`), đúng — nhưng
  lời mời chỉ hiện ở khu Gia phả. Chấp nhận được vì họ luôn vào được trang
  Quản trị; ghi ra để không ai tưởng nó đã đủ.
- **Commit `render` của repo `giapha/` chưa đẩy** — 403 trên LapAMD.
