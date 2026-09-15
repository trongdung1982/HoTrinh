# QUY TẮC GỌN — dọn rác và tiết kiệm token

*Nhánh Supabase · lập 15/09/2026 21:54 (b118e) · đo bằng `kiem-thu/do-gon.mjs`*

⚠ **Không đọc file này mỗi phiên.** Đọc khi: sắp dọn/cắt tài liệu, sắp viết
ghi chú đầu file, `/kiem-tra` phép 10 báo LỖI, hoặc sắp đọc trọn một file dài.

## 0. Vì sao có file này — luật trên giấy đã bị lách

Trước 15/09/2026 dự án đã có đủ luật chống phình (b112): `CHI-DAN.md` trần 80
dòng, `KE-HOACH.md` trần 250 dòng và *"xong rồi thì xoá"*, dòng `INDEX.md` tối
đa 110 ký tự. Đo lại cùng ngày:

| Luật | Con số giữ được | Nhưng |
|---|---|---|
| `CHI-DAN.md` ≤ 80 dòng | 78 dòng ✓ | một ô dài **1.488 ký tự** — số dòng đứng yên, dòng dài ra |
| `KE-HOACH.md` xong thì xoá | — | **8 dòng** gạch ngang vẫn nằm đó |
| Dòng `INDEX.md` ≤ 110 ký tự | — | **29 dòng** dài hơn 250 ký tự, dài nhất 710 |
| Ghi chú đầu file 6 dòng | — | **42 file** quá 25 dòng — `person-edit.js` 212, `khu-thanh-vien.js` 159: lịch sử phiên bản |

Luật không chết vì sai. Nó chết vì **không ai đo**: đếm dòng thì dòng dài ra;
"xoá việc xong" không có phép kiểm thì gạch ngang cho nhanh. Nên mọi luật dưới
đây có phép đo trong `kiem-thu/do-gon.mjs`, chạy ở `/kiem-tra` phép 10 —
*"không sửa lệnh thì luật mới sống được đúng một phiên"* (b112).

Đo bằng **byte**, không bằng dòng: tiếng Việt có dấu tốn token hơn tiếng Anh
cùng độ dài, và dòng thì kéo dài vô hạn được.

## 1. Rác là gì, và chỗ đúng của nó

| Rác | Chỗ đúng |
|---|---|
| Lịch sử phiên bản trong ghi chú đầu file mã | lời commit + `nhat-ky/bXX-*.md` |
| Việc đã xong còn trong `KE-HOACH.md` (kể cả gạch ngang) | `nhat-ky/INDEX.md` + nhật ký bước |
| Chuyện *"vì sao / từng vấp"* trong file đọc MỖI phiên | nhật ký bước; ở lại **một câu + `bXX`** |
| Lời giải thích dài trong một ô `CHI-DAN.md` | file mà ô ấy trỏ tới |
| Dấu `TẠM` mà bước gỡ nó đã đóng | gỡ — hoặc ghi vào *Còn treo* |
| File mã không ai `import`, khối CSS/HTML không ai dùng | xoá — **hỏi trước** (`CLAUDE.md` mục 9) |
| Tài liệu tên `_Vxx` hoặc có dấu cách trong `supabase/` | tên cố định, hoặc ra ngoài repo — **hỏi trước** |
| Ký ức sai hoặc hết hiệu lực | xoá file ký ức + dòng `MEMORY.md` |

**KHÔNG phải rác — giữ nguyên:** `nhat-ky/bXX-*.md` (viết xong không sửa) ·
bảng *Đính chính* · `BAT-DAU.md` · 10 file `domains/` chép nguyên *(phép 9 bắt
giống hệt bản Apps Script, kể cả ghi chú đầu file)* · `js/vendor/` · dòng ⚠
còn hiệu lực.

## 2. Luật ĐỌC — ít token nhất cho cùng một hiểu biết

- **Đ1. Mở phiên chỉ nạp đúng thứ `/khoi-tao` ghi.** Dòng cuối bảng *Các bước*
  của `INDEX.md` lấy bằng lệnh `awk` ở `/khoi-tao` bước 2 — không `Read` cả
  file (27 KB ≈ cả `KE-HOACH.md`), không `tail` trần (bảng không nằm cuối file).
- **Đ2. Tìm rồi mới đọc.** `Grep` tên hàm / tên mục → `Read` có `offset` +
  `limit`. Đọc trọn chỉ khi file dưới ~300 dòng hoặc sắp viết lại phần lớn nó.
- **Đ3. Tài liệu dài đọc theo MỤC** `CHI-DAN.md` chỉ — trừ lần đầu vào nhánh.
- **Đ4. Tìm bước cũ bằng `Grep` trong `nhat-ky/`**, biết đúng bước rồi mới mở.
- **Đ5. Đầu ra lệnh phải ngắn** — `wc`, `grep -c`, `head`, `cut -c1-200`. Bộ
  kiểm in phép **hỏng**, không in hàng trăm dòng ĐẠT.
- **Đ6. Không đọc lại file vừa sửa** để kiểm — kiểm bằng bộ kiểm, phép đo.
- **Đ7. Rà việc Antigravity bằng `git diff --stat`** rồi diff từng file.
- **Đ8. Ảnh chụp là thứ tốn nhất.** Nhìn đúng ảnh của khu vừa đổi; cả bộ ảnh
  chỉ khi đổi khung chung. *Vẫn phải nhìn* — bộ kiểm chữ không thấy hình xấu.

## 3. Luật VIẾT — không đẻ thêm rác

- **V1. Ghi chú đầu file trong `js/` ≤ 30 dòng.** Khuôn 6 dòng (`CLAUDE.md`
  mục 6) + điều người sửa file **hôm nay** phải biết. Dòng `Phiên bản` chỉ
  nói bản mới nhất, một câu đổi gì. Bẫy của một hàm → ghi ngay trên hàm ấy.
- **V2. File đọc mỗi phiên** (`CLAUDE.md` · `MEMORY.md` · `CHI-DAN.md` ·
  `KE-HOACH.md`) chỉ giữ **hiện trạng + luật đang sống**.
- **V3. Ô `CHI-DAN.md`** = file nào · mục nào · tối đa một ⚠ ngắn.
- **V4. Việc xong thì XOÁ dòng** trong `KE-HOACH.md`, cả bảng *Thứ tự làm*.
- **V5. Giàn giáo tạm ghi `TẠM (bXXX)`** — bXXX là bước sẽ gỡ nó.
- **V6. Dòng mới của `INDEX.md` ≤ 250 ký tự cả dòng.** Dòng cũ không sửa —
  file chỉ được thêm dòng.
- **V7. Một khu một file.** File mã quá 1.500 dòng thì ghi vào *Còn treo*,
  tách khi đợt đang làm đã xong, và hỏi trước.
- **V8. Dòng `MEMORY.md` ≤ 250 ký tự** — phần dài nằm trong file ký ức.

## 4. Trần, sổ nợ, và khi nào dọn

**Trần** nằm ở đầu `kiem-thu/do-gon.mjs` — một chỗ. `CHI-DAN.md` và
`KE-HOACH.md` nhắc trần của chính mình ở đầu file *(b112: trần phải nằm trong
file để phiên sau thấy mình đang vượt)*; lệch nhau thì script là bản đúng.

**Sổ nợ** `kiem-thu/moc-gon.json` = mọi chỗ đã vượt trần lúc lập sổ 15/09/2026.

| Kết quả | Nghĩa |
|---|---|
| **LỖI** | vượt trần ở chỗ chưa có nợ, hoặc nợ cũ **tăng** → không được báo xong |
| **NỢ CŨ** | vượt từ trước và chưa tăng → vẫn ĐẠT, trả dần |

Sổ chỉ được **hạ**: `--ha-moc` xoá khoản đã trả, hạ khoản đã giảm; không thêm,
không nâng. `--lap-moc` chỉ chạy được khi chưa có sổ. Muốn nới trần thì sửa
bảng trần trong script và ghi lý do vào nhật ký bước — **không sửa sổ bằng tay**.

**Khi nào dọn:**

- **D1. Sửa file mã nào thì trả nợ ghi chú đầu file ấy** trong cùng phiên —
  đằng nào cũng đã mở nó.
- **D2. `/ket-thuc` mỗi phiên** xoá việc xong khỏi `KE-HOACH.md`.
- **D3. Nợ ở file đọc mỗi phiên** → một **phiên dọn riêng**, không trộn việc
  tính năng. Nợ ấy nhân với mọi phiên còn lại, trả sớm thì lời nhiều nhất.
- **D4. Thấy rác giữa phiên làm việc khác** thì ghi vào *Còn treo*, đừng dọn
  giữa chừng — một phiên một việc.

**Cắt an toàn** — như b112: đo byte trước · `grep -n "⚠"` phần sắp cắt, mỗi
dòng ⚠ phải chỉ được **nơi trú còn sống** · đo lại sau. Lịch sử trong ghi chú
đầu file cũng vậy: dòng ⚠ chưa có trong nhật ký bước thì dời xuống trên hàm nó
nói, không xoá.
